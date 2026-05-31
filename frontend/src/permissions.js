// =============================================================================
// Proyecto 3 — Permisos de UI por rol (grupo).
//
// El `grupo` del usuario autenticado (admin, gerente, vendedor, bodeguero,
// consulta) se corresponde 1:1 con los 5 roles del DBMS. Esta tabla decide qué
// rutas/vistas ve cada rol; el backend valida lo mismo con requireRole().
// =============================================================================

export const TODOS = ['admin', 'gerente', 'vendedor', 'bodeguero', 'consulta'];

// Rutas de la app y los grupos que pueden acceder a cada una.
export const ROUTES = [
  { path: '/',          label: 'Catálogo',  grupos: TODOS },
  { path: '/productos', label: 'Productos', grupos: ['admin', 'gerente', 'bodeguero'] },
  { path: '/clientes',  label: 'Clientes',  grupos: ['admin', 'gerente', 'vendedor'] },
  { path: '/ventas',    label: 'Ventas',    grupos: ['admin', 'gerente', 'vendedor'] },
  { path: '/reportes',  label: 'Reportes',  grupos: ['admin', 'gerente', 'consulta'] },
];

// ¿El grupo puede acceder a la ruta?
export function puedeAcceder(grupo, path) {
  const ruta = ROUTES.find((r) => r.path === path);
  return ruta ? ruta.grupos.includes(grupo) : false;
}

// Rutas visibles para un grupo (alimenta el menú).
export function rutasVisibles(grupo) {
  return ROUTES.filter((r) => r.grupos.includes(grupo));
}

// Primera ruta permitida (destino tras login / fallback de redirección).
export function rutaInicial(grupo) {
  const visibles = rutasVisibles(grupo);
  return visibles[0]?.path ?? '/';
}

// Permisos de acción fina, reutilizados por los componentes para mostrar u
// ocultar botones (alineados con requireRole del backend).
export const ACCIONES = {
  gestionarProductos: ['admin', 'gerente', 'bodeguero'],
  ajustarStock:       ['admin', 'bodeguero'],
  eliminarProducto:   ['admin', 'gerente'],
  crearCliente:       ['admin', 'gerente', 'vendedor'],
  editarCliente:      ['admin', 'gerente'],
  registrarVenta:     ['admin', 'vendedor'],
  anularVenta:        ['admin', 'gerente'],
  registrarCompra:    ['admin', 'gerente', 'bodeguero'],
};

export function puedeHacer(grupo, accion) {
  return (ACCIONES[accion] ?? []).includes(grupo);
}
