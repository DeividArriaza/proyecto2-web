import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartProvider, useCart } from '../context/CartContext.jsx';

function CartSpy() {
  const cart = useCart();
  return (
    <div>
      <span data-testid="count">{cart.totals.itemCount}</span>
      <span data-testid="total">{cart.totals.total.toFixed(2)}</span>
      <button
        onClick={() =>
          cart.addItem({ id_producto: 1, nombre: 'Brownie', sku: 'BRW-001', precio: 50, stock: 5 })
        }
      >
        add
      </button>
      <button onClick={() => cart.clear()}>clear</button>
    </div>
  );
}

describe('CartContext + CartProvider', () => {
  it('expone totales reactivos cuando se agregan items', () => {
    render(
      <CartProvider>
        <CartSpy />
      </CartProvider>
    );

    expect(screen.getByTestId('count').textContent).toBe('0');
    expect(screen.getByTestId('total').textContent).toBe('0.00');

    fireEvent.click(screen.getByText('add'));
    fireEvent.click(screen.getByText('add'));

    expect(screen.getByTestId('count').textContent).toBe('2');
    // 2 x 50 = 100 subtotal + 12% iva = 112
    expect(screen.getByTestId('total').textContent).toBe('112.00');

    fireEvent.click(screen.getByText('clear'));
    expect(screen.getByTestId('count').textContent).toBe('0');
  });
});
