// =============================================================================
// Proyecto 3 — Configuración del ORM (Sequelize).
//
// Sequelize convive con el `pg.Pool` de db.js: el ORM maneja el CRUD de varias
// entidades (Cliente, Categoria, Marca), mientras que las operaciones críticas
// (ventas, compras, ajustes de stock) van por stored procedures y los reportes
// por SQL avanzado. Ambos clientes apuntan a la misma base.
//
// Las tablas se crearon en 01_schema.sql con identificadores sin comillas, así
// que PostgreSQL las guarda en minúsculas (cliente, categoria, marca). Por eso
// cada modelo fija `tableName` explícito y `timestamps: false` (no hay columnas
// createdAt/updatedAt en el esquema).
// =============================================================================
import { Sequelize, DataTypes } from 'sequelize';

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: 'postgres',
    logging: false,
    define: { freezeTableName: true, timestamps: false },
  }
);

export const Cliente = sequelize.define(
  'Cliente',
  {
    id_cliente: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombres: { type: DataTypes.STRING(80), allowNull: false },
    apellidos: { type: DataTypes.STRING(80), allowNull: false },
    nit: { type: DataTypes.STRING(40), allowNull: true },
    telefono: { type: DataTypes.STRING(30), allowNull: true },
    email: { type: DataTypes.STRING(120), allowNull: true },
    direccion: { type: DataTypes.TEXT, allowNull: true },
    fecha_registro: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { tableName: 'cliente' }
);

export const Categoria = sequelize.define(
  'Categoria',
  {
    id_categoria: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'categoria' }
);

export const Marca = sequelize.define(
  'Marca',
  {
    id_marca: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    descripcion: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'marca' }
);
