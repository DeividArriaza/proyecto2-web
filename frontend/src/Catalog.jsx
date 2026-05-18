import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, palette } from './api.js';
import { ErrorBanner, SuccessBanner, formStyles } from './Layout.jsx';
import { PageHeader } from './ProductosAdmin.jsx';
import { useCart } from './context/CartContext.jsx';

export default function Catalog() {
  const navigate = useNavigate();
  const cart = useCart();
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [addedMessage, setAddedMessage] = useState(null);

  useEffect(() => {
    api('/productos')
      .then(setProductos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const productosFiltrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    return productos.filter((p) => {
      if (soloDisponibles && p.stock <= 0) return false;
      if (!q) return true;
      return (
        p.nombre.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.categoria || '').toLowerCase().includes(q) ||
        (p.marca || '').toLowerCase().includes(q)
      );
    });
  }, [productos, query, soloDisponibles]);

  const handleAdd = useCallback(
    (producto) => {
      cart.addItem(producto);
      setAddedMessage(`${producto.nombre} agregado al carrito`);
    },
    [cart]
  );

  return (
    <div>
      <PageHeader
        title="Catálogo de productos"
        subtitle={loading ? 'Cargando…' : `${productosFiltrados.length} de ${productos.length} productos`}
        action={
          cart.totals.itemCount > 0 && (
            <button
              type="button"
              onClick={() => navigate('/ventas')}
              style={formStyles.primaryBtn}
            >
              Ver carrito ({cart.totals.itemCount})
            </button>
          )
        }
      />

      <ErrorBanner error={error} onClose={() => setError(null)} />
      <SuccessBanner message={addedMessage} onClose={() => setAddedMessage(null)} />

      <div className="form-grid-2" style={{ marginBottom: 18 }}>
        <input
          type="search"
          placeholder="Buscar por nombre, SKU, categoría o marca…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={formStyles.input}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: palette.textSoft, fontSize: '0.9rem' }}>
          <input
            type="checkbox"
            checked={soloDisponibles}
            onChange={(e) => setSoloDisponibles(e.target.checked)}
          />
          Solo con stock disponible
        </label>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 18,
        }}
      >
        {productosFiltrados.map((p) => (
          <article
            key={p.id_producto}
            style={{
              background: palette.surface,
              borderRadius: 18,
              padding: 18,
              border: `1px solid ${palette.border}`,
              boxShadow: '0 4px 18px rgba(199, 21, 133, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              position: 'relative',
            }}
          >
            {p.stock_bajo && (
              <span
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: palette.accent,
                  color: 'white',
                  fontSize: '0.65rem',
                  padding: '2px 8px',
                  borderRadius: 999,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontWeight: 700,
                }}
              >
                Bajo stock
              </span>
            )}
            <div
              style={{
                fontSize: '0.7rem',
                color: palette.accent,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                fontWeight: 600,
              }}
            >
              {p.categoria} · {p.marca}
            </div>
            <h3 style={{ margin: 0, color: palette.text, fontSize: '1.1rem' }}>{p.nombre}</h3>
            <p
              style={{
                margin: 0,
                color: palette.textSoft,
                fontSize: '0.85rem',
                flex: 1,
                minHeight: 38,
              }}
            >
              {p.descripcion}
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginTop: 6,
              }}
            >
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: palette.primary }}>
                Q{Number(p.precio).toFixed(2)}
              </span>
              <span style={{ fontSize: '0.8rem', color: palette.textSoft }}>
                Stock: {p.stock}
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#B89DAB' }}>{p.sku}</div>
            <button
              type="button"
              onClick={() => handleAdd(p)}
              disabled={p.stock <= 0}
              style={{
                marginTop: 8,
                background: p.stock <= 0 ? palette.border : palette.primary,
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: 999,
                cursor: p.stock <= 0 ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              {p.stock <= 0 ? 'Sin stock' : 'Agregar al carrito'}
            </button>
          </article>
        ))}
        {!loading && productosFiltrados.length === 0 && (
          <div style={{ color: palette.textSoft, padding: 18 }}>
            No se encontraron productos con esos criterios.
          </div>
        )}
      </div>
    </div>
  );
}
