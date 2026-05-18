import express from 'express';
import session from 'express-session';
import { pool } from './db.js';
import { cors } from './middleware.js';
import { authRouter } from './routes/auth.js';
import { productosRouter } from './routes/productos.js';
import { clientesRouter } from './routes/clientes.js';
import { catalogosRouter } from './routes/catalogos.js';
import { reportesRouter } from './routes/reportes.js';
import { ventasRouter } from './routes/ventas.js';

const app = express();
const port = Number(process.env.PORT) || 58080;

app.use(cors);
app.use(express.json());
app.use(
  session({
    name: 'bubus.sid',
    secret: process.env.SESSION_SECRET || 'cambiame',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

app.get('/health', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT 1 AS ok');
    res.json({ status: 'ok', db: rows[0].ok === 1 });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.use('/auth', authRouter);
app.use('/productos', productosRouter);
app.use('/clientes', clientesRouter);
app.use('/reportes', reportesRouter);
app.use('/ventas', ventasRouter);
app.use('/', catalogosRouter); // expone /categorias y /marcas

app.listen(port, '0.0.0.0', () => {
  console.log(`backend listening on :${port}`);
});
