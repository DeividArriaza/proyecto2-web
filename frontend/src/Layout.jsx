import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { palette } from './api.js';
import { useAuth } from './context/AuthContext.jsx';
import { useCart } from './context/CartContext.jsx';

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { totals } = useCart();
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    setBusy(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${palette.bg} 0%, #FFE4EE 100%)`,
        fontFamily: '"Helvetica Neue", system-ui, sans-serif',
        color: palette.text,
      }}
    >
      <header className="app-header">
        <div className="app-header__brand">
          <button
            type="button"
            className="app-header__hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
          >
            ☰
          </button>
          <h1 className="app-header__title">Bubu&apos;s Bakery</h1>
          <nav
            className={`app-nav${menuOpen ? ' app-nav--open' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            <NavItem to="/" label="Catálogo" />
            <NavItem to="/productos" label="Productos" />
            <NavItem to="/clientes" label="Clientes" />
            <NavItem to="/ventas" label="Ventas" badge={totals.itemCount} />
            <NavItem to="/reportes" label="Reportes" />
          </nav>
        </div>

        <div className="app-header__user">
          <div className="app-header__user-info">
            <div className="app-header__user-role">
              {user.rol} · {user.sucursal}
            </div>
            <div className="app-header__user-name">
              {user.nombres} {user.apellidos}
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={busy}
            className="btn-ghost-primary"
          >
            {busy ? 'Cerrando…' : 'Cerrar sesión'}
          </button>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, label, badge }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
    >
      {label}
      {badge > 0 && <span className="nav-item__badge">{badge}</span>}
    </NavLink>
  );
}

// Banner de error reutilizable. Aceptamos string u objeto Error.
export function ErrorBanner({ error, onClose }) {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.message || 'Error desconocido';
  return (
    <div
      role="alert"
      style={{
        background: palette.errorBg,
        border: `1px solid ${palette.errorBd}`,
        color: palette.textSoft,
        padding: '12px 16px',
        borderRadius: 12,
        marginBottom: 18,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span>
        <strong style={{ color: palette.primary }}>Error: </strong>
        {message}
      </span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            color: palette.primary,
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '1.1rem',
            padding: '0 4px',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

// Modal/diálogo reutilizable para los formularios CRUD.
export function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(74, 16, 49, 0.45)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: palette.surface,
          borderRadius: 18,
          padding: 24,
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 12px 40px rgba(199, 21, 133, 0.2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0, color: palette.primary }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: palette.textSoft,
              cursor: 'pointer',
              fontSize: '1.4rem',
              padding: 4,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Estilos de input/label compartidos por los formularios CRUD.
export const formStyles = {
  label: {
    display: 'block',
    fontSize: '0.7rem',
    color: palette.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 600,
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    padding: '9px 12px',
    border: `1px solid ${palette.border}`,
    borderRadius: 10,
    fontSize: '0.9rem',
    outline: 'none',
    background: palette.bg,
    color: palette.text,
    fontFamily: 'inherit',
  },
  primaryBtn: {
    background: palette.primary,
    border: 'none',
    color: 'white',
    padding: '9px 18px',
    borderRadius: 999,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.9rem',
  },
  ghostBtn: {
    background: 'transparent',
    border: `1px solid ${palette.border}`,
    color: palette.textSoft,
    padding: '9px 18px',
    borderRadius: 999,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
  },
};

// Banner de éxito (para confirmaciones de acciones CRUD).
export function SuccessBanner({ message, onClose }) {
  if (!message) return null;
  return (
    <div
      role="status"
      style={{
        background: '#E8F8EE',
        border: '1px solid #BAE6CB',
        color: '#1F6B3D',
        padding: '12px 16px',
        borderRadius: 12,
        marginBottom: 18,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span>
        <strong>OK: </strong>
        {message}
      </span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#1F6B3D',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '1.1rem',
            padding: '0 4px',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
