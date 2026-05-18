import { describe, it, expect } from 'vitest';
import { cartReducer, initialState } from '../context/CartContext.jsx';

const brownie = {
  id_producto: 1,
  nombre: 'Brownie clásico',
  sku: 'BRW-001',
  precio: 25,
  stock: 10,
};

describe('cartReducer', () => {
  it('ADD_ITEM agrega un producto nuevo con cantidad 1', () => {
    const state = cartReducer(initialState, { type: 'ADD_ITEM', producto: brownie });
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toMatchObject({
      id_producto: 1,
      nombre: 'Brownie clásico',
      cantidad: 1,
      precio: 25,
    });
  });

  it('ADD_ITEM duplicado incrementa cantidad en vez de agregar fila', () => {
    let state = cartReducer(initialState, { type: 'ADD_ITEM', producto: brownie });
    state = cartReducer(state, { type: 'ADD_ITEM', producto: brownie });
    state = cartReducer(state, { type: 'ADD_ITEM', producto: brownie });
    expect(state.items).toHaveLength(1);
    expect(state.items[0].cantidad).toBe(3);
  });

  it('SET_CANTIDAD a 0 quita el item del carrito', () => {
    let state = cartReducer(initialState, { type: 'ADD_ITEM', producto: brownie });
    state = cartReducer(state, { type: 'SET_CANTIDAD', id_producto: 1, cantidad: 0 });
    expect(state.items).toHaveLength(0);
  });

  it('REMOVE_ITEM quita solo el producto indicado', () => {
    const otro = { ...brownie, id_producto: 2, nombre: 'Cheesecake' };
    let state = cartReducer(initialState, { type: 'ADD_ITEM', producto: brownie });
    state = cartReducer(state, { type: 'ADD_ITEM', producto: otro });
    state = cartReducer(state, { type: 'REMOVE_ITEM', id_producto: 1 });
    expect(state.items).toHaveLength(1);
    expect(state.items[0].id_producto).toBe(2);
  });

  it('CLEAR vuelve al estado inicial', () => {
    let state = cartReducer(initialState, { type: 'ADD_ITEM', producto: brownie });
    state = cartReducer(state, { type: 'SET_METODO_PAGO', value: '2' });
    state = cartReducer(state, { type: 'CLEAR' });
    expect(state).toEqual(initialState);
  });
});
