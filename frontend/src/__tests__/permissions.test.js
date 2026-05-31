import { describe, it, expect } from 'vitest';
import { puedeAcceder, rutasVisibles, rutaInicial, puedeHacer } from '../permissions.js';

// Proyecto 3 — pruebas de la autorización por rol (grupo) en el frontend.
describe('permisos por rol (grupo)', () => {
  it('todos los grupos ven el catálogo', () => {
    for (const g of ['admin', 'gerente', 'vendedor', 'bodeguero', 'consulta']) {
      expect(puedeAcceder(g, '/')).toBe(true);
    }
  });

  it('solo admin/gerente/bodeguero acceden a /productos', () => {
    expect(puedeAcceder('admin', '/productos')).toBe(true);
    expect(puedeAcceder('bodeguero', '/productos')).toBe(true);
    expect(puedeAcceder('vendedor', '/productos')).toBe(false);
    expect(puedeAcceder('consulta', '/productos')).toBe(false);
  });

  it('el vendedor no ve reportes pero sí ventas', () => {
    expect(puedeAcceder('vendedor', '/ventas')).toBe(true);
    expect(puedeAcceder('vendedor', '/reportes')).toBe(false);
  });

  it('rutasVisibles refleja los permisos del grupo', () => {
    const consulta = rutasVisibles('consulta').map((r) => r.path);
    expect(consulta).toContain('/');
    expect(consulta).toContain('/reportes');
    expect(consulta).not.toContain('/ventas');

    expect(rutasVisibles('admin')).toHaveLength(5);
  });

  it('rutaInicial devuelve la primera ruta permitida', () => {
    expect(rutaInicial('admin')).toBe('/');
    expect(rutaInicial('consulta')).toBe('/'); // catálogo es común a todos
  });

  it('acciones finas: solo admin/gerente anulan ventas', () => {
    expect(puedeHacer('admin', 'anularVenta')).toBe(true);
    expect(puedeHacer('gerente', 'anularVenta')).toBe(true);
    expect(puedeHacer('vendedor', 'anularVenta')).toBe(false);
  });

  it('un grupo desconocido no accede a nada', () => {
    expect(puedeAcceder('fantasma', '/')).toBe(false);
    expect(rutasVisibles('fantasma')).toHaveLength(0);
  });
});
