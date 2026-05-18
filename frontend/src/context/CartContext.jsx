import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

export const IVA = 0.12;

const initialState = {
  id_cliente: '',
  id_metodo_pago: '',
  items: [],
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'SET_CLIENTE':
      return { ...state, id_cliente: action.value };

    case 'SET_METODO_PAGO':
      return { ...state, id_metodo_pago: action.value };

    case 'ADD_ITEM': {
      const { producto } = action;
      const existing = state.items.find((it) => it.id_producto === producto.id_producto);
      if (existing) {
        return {
          ...state,
          items: state.items.map((it) =>
            it.id_producto === producto.id_producto
              ? { ...it, cantidad: it.cantidad + 1 }
              : it
          ),
        };
      }
      return {
        ...state,
        items: [
          ...state.items,
          {
            id_producto: producto.id_producto,
            nombre: producto.nombre,
            sku: producto.sku,
            precio: Number(producto.precio),
            stock: producto.stock,
            cantidad: 1,
          },
        ],
      };
    }

    case 'SET_CANTIDAD': {
      const cantidad = Math.max(0, Number(action.cantidad) || 0);
      if (cantidad === 0) {
        return {
          ...state,
          items: state.items.filter((it) => it.id_producto !== action.id_producto),
        };
      }
      return {
        ...state,
        items: state.items.map((it) =>
          it.id_producto === action.id_producto ? { ...it, cantidad } : it
        ),
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((it) => it.id_producto !== action.id_producto),
      };

    case 'CLEAR':
      return initialState;

    default:
      return state;
  }
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const totals = useMemo(() => {
    const subtotal = state.items.reduce(
      (sum, it) => sum + it.precio * it.cantidad,
      0
    );
    const impuesto = +(subtotal * IVA).toFixed(2);
    return {
      subtotal: +subtotal.toFixed(2),
      impuesto,
      total: +(subtotal + impuesto).toFixed(2),
      itemCount: state.items.reduce((n, it) => n + it.cantidad, 0),
    };
  }, [state.items]);

  const addItem = useCallback((producto) => dispatch({ type: 'ADD_ITEM', producto }), []);
  const setCantidad = useCallback(
    (id_producto, cantidad) => dispatch({ type: 'SET_CANTIDAD', id_producto, cantidad }),
    []
  );
  const removeItem = useCallback(
    (id_producto) => dispatch({ type: 'REMOVE_ITEM', id_producto }),
    []
  );
  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), []);
  const setCliente = useCallback(
    (value) => dispatch({ type: 'SET_CLIENTE', value }),
    []
  );
  const setMetodoPago = useCallback(
    (value) => dispatch({ type: 'SET_METODO_PAGO', value }),
    []
  );

  const value = useMemo(
    () => ({
      ...state,
      totals,
      addItem,
      setCantidad,
      removeItem,
      clear,
      setCliente,
      setMetodoPago,
    }),
    [state, totals, addItem, setCantidad, removeItem, clear, setCliente, setMetodoPago]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}

export { cartReducer, initialState };
