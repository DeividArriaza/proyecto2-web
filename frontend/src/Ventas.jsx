import { useCallback, useEffect, useState } from 'react';
import { api, palette } from './api.js';
import { ErrorBanner, SuccessBanner, formStyles } from './Layout.jsx';
import { PageHeader } from './ProductosAdmin.jsx';
import { useCart } from './context/CartContext.jsx';

export default function Ventas() {
  const cart = useCart();
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [metodos, setMetodos] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filtroProducto, setFiltroProducto] = useState('');

  const load = useCallback(async () => {
    try {
      const [vs, ps, cs, ms] = await Promise.all([
        api('/ventas'),
        api('/productos'),
        api('/clientes'),
        api('/metodos-pago'),
      ]);
      setVentas(vs);
      setProductos(ps);
      setClientes(cs);
      setMetodos(ms);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const productosFiltrados = productos.filter((p) => {
    if (!filtroProducto) return true;
    const q = filtroProducto.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  });

  function validarCarrito() {
    if (cart.items.length === 0) return 'Agregá al menos un producto al carrito';
    if (!cart.id_metodo_pago) return 'Seleccioná un método de pago';
    for (const it of cart.items) {
      if (it.cantidad <= 0) return `Cantidad inválida para ${it.nombre}`;
      if (it.cantidad > it.stock) return `Stock insuficiente para ${it.nombre} (disponible: ${it.stock})`;
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const localError = validarCarrito();
    if (localError) {
      setError(localError);
      return;
    }

    setSubmitting(true);
    try {
      const result = await api('/ventas', {
        method: 'POST',
        body: JSON.stringify({
          id_cliente: cart.id_cliente ? Number(cart.id_cliente) : null,
          id_metodo_pago: Number(cart.id_metodo_pago),
          items: cart.items.map((it) => ({
            id_producto: it.id_producto,
            cantidad: it.cantidad,
          })),
        }),
      });
      setSuccess(`Venta ${result.numero_factura} registrada — total Q${Number(result.total).toFixed(2)}`);
      cart.clear();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Ventas"
        subtitle="Registrar nueva venta y consultar historial reciente"
      />

      <ErrorBanner error={error} onClose={() => setError(null)} />
      <SuccessBanner message={success} onClose={() => setSuccess(null)} />

      <div
        style={{
          background: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: 16,
          padding: 22,
          marginBottom: 28,
          boxShadow: '0 4px 18px rgba(199, 21, 133, 0.06)',
        }}
      >
        <h3 style={{ margin: '0 0 4px', color: palette.primary }}>Nueva venta</h3>
        <p style={{ margin: '0 0 18px', color: palette.textSoft, fontSize: '0.9rem' }}>
          El carrito se maneja con un <code>useReducer</code> en el CartContext.
          La operación corre dentro de una transacción explícita en el backend
          (BEGIN/COMMIT/ROLLBACK).
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid-2">
            <Field label="Cliente">
              <select
                value={cart.id_cliente}
                onChange={(e) => cart.setCliente(e.target.value)}
                style={formStyles.input}
              >
                <option value="">Consumidor Final</option>
                {clientes.map((c) => (
                  <option key={c.id_cliente} value={c.id_cliente}>
                    {c.nombres} {c.apellidos} {c.nit ? `· ${c.nit}` : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Método de pago" required>
              <select
                required
                value={cart.id_metodo_pago}
                onChange={(e) => cart.setMetodoPago(e.target.value)}
                style={formStyles.input}
              >
                <option value="">— elegir —</option>
                {metodos.map((m) => (
                  <option key={m.id_metodo_pago} value={m.id_metodo_pago}>{m.nombre}</option>
                ))}
              </select>
            </Field>
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={formStyles.label}>Agregar productos al carrito</label>
            <input
              type="text"
              placeholder="Buscar por nombre o SKU…"
              value={filtroProducto}
              onChange={(e) => setFiltroProducto(e.target.value)}
              style={{ ...formStyles.input, marginBottom: 10 }}
            />
            <div
              style={{
                background: palette.bg,
                border: `1px solid ${palette.border}`,
                borderRadius: 12,
                maxHeight: 220,
                overflowY: 'auto',
              }}
            >
              {productosFiltrados.length === 0 && (
                <div style={{ padding: 12, color: palette.textSoft, fontSize: '0.85rem' }}>
                  Sin coincidencias
                </div>
              )}
              {productosFiltrados.map((p) => (
                <button
                  key={p.id_producto}
                  type="button"
                  onClick={() => cart.addItem(p)}
                  disabled={p.stock <= 0}
                  style={{
                    display: 'flex',
                    width: '100%',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${palette.border}`,
                    cursor: p.stock <= 0 ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    color: p.stock <= 0 ? '#B89DAB' : palette.text,
                    fontSize: '0.85rem',
                  }}
                >
                  <span>
                    <strong>{p.sku}</strong> · {p.nombre}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: palette.textSoft }}>
                    Q{Number(p.precio).toFixed(2)} · stock {p.stock}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={formStyles.label}>
              Carrito ({cart.totals.itemCount} unidad{cart.totals.itemCount === 1 ? '' : 'es'})
            </label>
            {cart.items.length === 0 ? (
              <div
                style={{
                  background: palette.bg,
                  border: `1px dashed ${palette.border}`,
                  borderRadius: 12,
                  padding: 18,
                  textAlign: 'center',
                  color: palette.textSoft,
                  fontSize: '0.85rem',
                }}
              >
                Carrito vacío — agregá productos arriba.
              </div>
            ) : (
              <div className="table-wrap" style={{ borderRadius: 12, border: `1px solid ${palette.border}`, background: palette.bg }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#FFE0EC' }}>
                      <th style={cellHeader}>Producto</th>
                      <th style={{ ...cellHeader, textAlign: 'right' }}>Cantidad</th>
                      <th style={{ ...cellHeader, textAlign: 'right' }}>Precio</th>
                      <th style={{ ...cellHeader, textAlign: 'right' }}>Subtotal</th>
                      <th style={cellHeader}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.items.map((it) => (
                      <tr key={it.id_producto} style={{ borderTop: `1px solid ${palette.border}` }}>
                        <td style={cell}>
                          <div style={{ fontWeight: 600 }}>{it.nombre}</div>
                          <div style={{ fontSize: '0.72rem', color: palette.textSoft }}>{it.sku}</div>
                        </td>
                        <td style={{ ...cell, textAlign: 'right' }}>
                          <input
                            type="number"
                            min="1"
                            max={it.stock}
                            value={it.cantidad}
                            onChange={(e) => cart.setCantidad(it.id_producto, e.target.value)}
                            style={{ ...formStyles.input, width: 80, padding: '4px 8px', textAlign: 'right' }}
                          />
                        </td>
                        <td style={{ ...cell, textAlign: 'right' }}>Q{it.precio.toFixed(2)}</td>
                        <td style={{ ...cell, textAlign: 'right', fontWeight: 700 }}>
                          Q{(it.precio * it.cantidad).toFixed(2)}
                        </td>
                        <td style={{ ...cell, textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => cart.removeItem(it.id_producto)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#B22222',
                              cursor: 'pointer',
                              fontSize: '1.1rem',
                            }}
                            aria-label={`Quitar ${it.nombre}`}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 22,
              display: 'flex',
              gap: 18,
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={cart.clear} style={formStyles.ghostBtn} disabled={cart.items.length === 0}>
                Limpiar carrito
              </button>
              <button type="submit" disabled={submitting || cart.items.length === 0} style={formStyles.primaryBtn}>
                {submitting ? 'Procesando…' : 'Registrar venta'}
              </button>
            </div>
            <div style={{ textAlign: 'right', minWidth: 220 }}>
              <Linea label="Subtotal" value={`Q${cart.totals.subtotal.toFixed(2)}`} />
              <Linea label="IVA (12%)" value={`Q${cart.totals.impuesto.toFixed(2)}`} />
              <Linea label="Total" value={`Q${cart.totals.total.toFixed(2)}`} strong />
            </div>
          </div>
        </form>
      </div>

      <h3 style={{ color: palette.primary, marginBottom: 12 }}>Ventas recientes</h3>
      <div
        style={{
          background: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 4px 18px rgba(199, 21, 133, 0.06)',
        }}
      >
        <div className="table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <Th>Factura</Th>
                <Th>Fecha</Th>
                <Th>Cliente</Th>
                <Th>Sucursal</Th>
                <Th>Método</Th>
                <Th align="right">Total</Th>
                <Th>Estado</Th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <tr key={v.id_venta} style={{ borderTop: `1px solid ${palette.border}` }}>
                  <Td mono>{v.numero_factura}</Td>
                  <Td>{new Date(v.fecha).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })}</Td>
                  <Td>{v.cliente}</Td>
                  <Td>{v.sucursal}</Td>
                  <Td>{v.metodo_pago}</Td>
                  <Td align="right">Q{Number(v.total).toFixed(2)}</Td>
                  <Td>
                    <span
                      style={{
                        background: v.estado === 'COMPLETADA' ? '#E8F8EE' : palette.errorBg,
                        color: v.estado === 'COMPLETADA' ? '#1F6B3D' : palette.primary,
                        padding: '2px 10px',
                        borderRadius: 999,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      {v.estado}
                    </span>
                  </Td>
                </tr>
              ))}
              {ventas.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: palette.textSoft }}>
                    Aún no hay ventas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const cell = { padding: '8px 12px', verticalAlign: 'middle' };
const cellHeader = {
  ...cell,
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  color: palette.textSoft,
  fontWeight: 600,
  letterSpacing: 0.5,
  textAlign: 'left',
};

function Field({ label, required, children }) {
  return (
    <div>
      <label style={formStyles.label}>
        {label}{required && <span style={{ color: palette.primary }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function Linea({ label, value, strong }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 24,
        fontSize: strong ? '1.1rem' : '0.85rem',
        fontWeight: strong ? 800 : 500,
        color: strong ? palette.primary : palette.textSoft,
        padding: '2px 0',
      }}
    >
      <span>{label}</span>
      <span style={{ color: strong ? palette.primary : palette.text }}>{value}</span>
    </div>
  );
}

function Th({ children, align }) {
  return (
    <th
      style={{
        textAlign: align ?? 'left',
        padding: '12px 14px',
        background: palette.bg,
        color: palette.textSoft,
        fontWeight: 600,
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}
    >{children}</th>
  );
}

function Td({ children, align, mono }) {
  return (
    <td
      style={{
        padding: '12px 14px',
        textAlign: align ?? 'left',
        fontFamily: mono ? 'ui-monospace, SFMono-Regular, monospace' : 'inherit',
        verticalAlign: 'middle',
      }}
    >{children}</td>
  );
}
