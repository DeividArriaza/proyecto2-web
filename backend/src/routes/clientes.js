import { Router } from 'express';
import { UniqueConstraintError } from 'sequelize';
import { Cliente } from '../sequelize.js';
import { requireAuth, requireRole } from '../middleware.js';

// =============================================================================
// CRUD de Cliente — implementado con el ORM (Sequelize). Rúbrica Cat II:
// "ORM configurado y utilizado en al menos 3 operaciones CRUD".
// Aquí se usan findAll, findByPk, create, update y (soft) delete del modelo.
// =============================================================================
export const clientesRouter = Router();

const camposCliente = (body = {}) => ({
  nombres: body.nombres?.trim(),
  apellidos: body.apellidos?.trim(),
  nit: body.nit?.trim() || null,
  telefono: body.telefono?.trim() || null,
  email: body.email?.trim()?.toLowerCase() || null,
  direccion: body.direccion?.trim() || null,
});

// READ (list) — Cliente.findAll
clientesRouter.get('/', async (_req, res) => {
  try {
    const clientes = await Cliente.findAll({
      where: { activo: true },
      order: [['id_cliente', 'DESC']],
    });
    res.json(clientes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ (one) — Cliente.findByPk
clientesRouter.get('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(cliente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE — Cliente.create (vendedor o superior)
clientesRouter.post('/', requireAuth, requireRole('admin', 'gerente', 'vendedor'), async (req, res) => {
  const datos = camposCliente(req.body);
  if (!datos.nombres || !datos.apellidos) {
    return res.status(400).json({ error: 'nombres y apellidos son requeridos' });
  }
  try {
    const cliente = await Cliente.create(datos);
    res.status(201).json(cliente);
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      return res.status(409).json({ error: 'Ya existe un cliente con ese NIT' });
    }
    res.status(500).json({ error: err.message });
  }
});

// UPDATE — Cliente.update (gerente o superior)
clientesRouter.put('/:id', requireAuth, requireRole('admin', 'gerente'), async (req, res) => {
  const datos = camposCliente(req.body);
  if (!datos.nombres || !datos.apellidos) {
    return res.status(400).json({ error: 'nombres y apellidos son requeridos' });
  }
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    await cliente.update(datos);
    res.json(cliente);
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      return res.status(409).json({ error: 'Ya existe un cliente con ese NIT' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE (soft) — marca activo=FALSE para preservar las FKs de Venta.
clientesRouter.delete('/:id', requireAuth, requireRole('admin', 'gerente'), async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    await cliente.update({ activo: false });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
