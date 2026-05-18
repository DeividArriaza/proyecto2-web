import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db.js';

export const authRouter = Router();

// POST /auth/login — verifica credenciales y abre sesión.
// Query: JOIN Empleado + Rol + Sucursal para devolver el contexto del usuario.
authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username y password son requeridos' });
  }
  try {
    const { rows } = await pool.query(
      `
      SELECT e.id_empleado, e.username, e.password_hash,
             e.nombres, e.apellidos, e.email,
             r.id_rol,      r.nombre AS rol,
             s.id_sucursal, s.nombre AS sucursal
      FROM Empleado e
      JOIN Rol      r ON r.id_rol      = e.id_rol
      JOIN Sucursal s ON s.id_sucursal = e.id_sucursal
      WHERE e.username = $1 AND e.activo = TRUE
      LIMIT 1
      `,
      [username]
    );
    const row = rows[0];
    if (!row) return res.status(401).json({ error: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    req.session.user = {
      id: row.id_empleado,
      username: row.username,
      nombres: row.nombres,
      apellidos: row.apellidos,
      email: row.email,
      rol: row.rol,
      id_rol: row.id_rol,
      sucursal: row.sucursal,
      id_sucursal: row.id_sucursal,
    };
    res.json({ user: req.session.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/register — crea un empleado nuevo y abre sesión.
// Rol siempre "Vendedor Mostrador" (no se permite elegir el rol desde signup
// público para evitar escalación a admin). Sucursal sí es elegible.
authRouter.post('/register', async (req, res) => {
  const { nombres, apellidos, email, telefono, username, password, id_sucursal } = req.body ?? {};

  if (!nombres?.trim() || !apellidos?.trim()) {
    return res.status(400).json({ error: 'nombres y apellidos son requeridos' });
  }
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'email inválido' });
  }
  if (!username?.trim() || username.trim().length < 3) {
    return res.status(400).json({ error: 'username mínimo 3 caracteres' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'password mínimo 6 caracteres' });
  }
  if (!id_sucursal) {
    return res.status(400).json({ error: 'id_sucursal es requerido' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Rol fijo: "Vendedor Mostrador". Si no existe, fallar — está en el seed.
    const { rows: roles } = await client.query(
      `SELECT id_rol FROM Rol WHERE nombre = $1 LIMIT 1`,
      ['Vendedor Mostrador']
    );
    if (!roles[0]) {
      throw new Error('Rol por defecto "Vendedor Mostrador" no existe en la base');
    }
    const id_rol = roles[0].id_rol;

    const password_hash = await bcrypt.hash(password, 10);

    const { rows: nuevos } = await client.query(
      `
      INSERT INTO Empleado
        (nombres, apellidos, email, telefono, username, password_hash, id_rol, id_sucursal)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id_empleado
      `,
      [
        nombres.trim(),
        apellidos.trim(),
        email.trim().toLowerCase(),
        telefono?.trim() || null,
        username.trim(),
        password_hash,
        id_rol,
        Number(id_sucursal),
      ]
    );
    const id_empleado = nuevos[0].id_empleado;

    // Re-leer con JOIN para devolver el shape canónico (igual que /auth/login).
    const { rows } = await client.query(
      `
      SELECT e.id_empleado, e.username, e.nombres, e.apellidos, e.email,
             r.id_rol,      r.nombre AS rol,
             s.id_sucursal, s.nombre AS sucursal
      FROM Empleado e
      JOIN Rol      r ON r.id_rol      = e.id_rol
      JOIN Sucursal s ON s.id_sucursal = e.id_sucursal
      WHERE e.id_empleado = $1
      `,
      [id_empleado]
    );

    await client.query('COMMIT');

    const row = rows[0];
    req.session.user = {
      id: row.id_empleado,
      username: row.username,
      nombres: row.nombres,
      apellidos: row.apellidos,
      email: row.email,
      rol: row.rol,
      id_rol: row.id_rol,
      sucursal: row.sucursal,
      id_sucursal: row.id_sucursal,
    };
    res.status(201).json({ user: req.session.user });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      // Duplicate key. Detectar cuál columna chocó por el nombre del constraint.
      const detail = err.detail || '';
      if (detail.includes('username')) {
        return res.status(409).json({ error: 'El username ya está en uso' });
      }
      if (detail.includes('email')) {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }
      return res.status(409).json({ error: 'Usuario o email duplicado' });
    }
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Sucursal inválida' });
    }
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// POST /auth/logout — cierra la sesión.
authRouter.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('bubus.sid');
    res.json({ ok: true });
  });
});

// GET /auth/me — devuelve el usuario actual (o null si no hay sesión).
authRouter.get('/me', (req, res) => {
  res.json({ user: req.session?.user ?? null });
});
