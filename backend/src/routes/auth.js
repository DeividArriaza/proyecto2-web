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
