import { describe, it, expect } from 'vitest';
import { validateProducto, validateCliente, hasErrors } from '../lib/validators.js';

describe('validateProducto', () => {
  it('acepta un producto válido', () => {
    const errs = validateProducto({
      sku: 'BRW-001',
      nombre: 'Brownie',
      precio: '25',
      stock: '10',
      stock_minimo: '2',
      id_categoria: 1,
      id_marca: 1,
    });
    expect(errs).toEqual({});
    expect(hasErrors(errs)).toBe(false);
  });

  it('rechaza precio cero o negativo', () => {
    const errs = validateProducto({
      sku: 'BRW-001', nombre: 'Brownie', precio: '0', stock: '10', id_categoria: 1, id_marca: 1,
    });
    expect(errs.precio).toBeDefined();
  });

  it('rechaza stock_minimo mayor al stock', () => {
    const errs = validateProducto({
      sku: 'BRW-001', nombre: 'Brownie', precio: '10', stock: '5', stock_minimo: '20', id_categoria: 1, id_marca: 1,
    });
    expect(errs.stock_minimo).toBeDefined();
  });

  it('rechaza SKU corto + nombre vacío + sin categoría', () => {
    const errs = validateProducto({ sku: 'AB', nombre: '', precio: '10', stock: '1' });
    expect(errs.sku).toBeDefined();
    expect(errs.nombre).toBeDefined();
    expect(errs.id_categoria).toBeDefined();
    expect(errs.id_marca).toBeDefined();
  });
});

describe('validateCliente', () => {
  it('acepta un cliente mínimo válido', () => {
    expect(validateCliente({ nombres: 'Ana', apellidos: 'López' })).toEqual({});
  });

  it('rechaza email malformado', () => {
    const errs = validateCliente({ nombres: 'Ana', apellidos: 'López', email: 'no-arroba' });
    expect(errs.email).toBeDefined();
  });

  it('rechaza teléfono con letras', () => {
    const errs = validateCliente({ nombres: 'Ana', apellidos: 'López', telefono: '555-ABC-1234' });
    expect(errs.telefono).toBeDefined();
  });
});
