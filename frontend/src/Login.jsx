import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { palette } from './api.js';
import { useAuth } from './context/AuthContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function validate() {
    if (username.trim().length < 3) return 'El usuario debe tener al menos 3 caracteres';
    if (password.length < 4) return 'La contraseña debe tener al menos 4 caracteres';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const localError = validate();
    if (localError) {
      setError(localError);
      return;
    }
    setBusy(true);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: `linear-gradient(180deg, ${palette.bg} 0%, #FFE4EE 100%)`,
        fontFamily: '"Helvetica Neue", system-ui, sans-serif',
        padding: 24,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: 20,
          padding: 32,
          width: '100%',
          maxWidth: 380,
          boxShadow: '0 12px 40px rgba(199, 21, 133, 0.12)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              display: 'inline-block',
              background: palette.primary,
              color: 'white',
              padding: '4px 14px',
              borderRadius: 999,
              fontSize: '0.7rem',
              letterSpacing: 2,
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Acceso interno
          </div>
          <h1
            style={{
              color: palette.primary,
              fontSize: '2.2rem',
              margin: '12px 0 4px',
              fontWeight: 800,
              letterSpacing: '-1px',
            }}
          >
            Bubu's Bakery
          </h1>
          <p style={{ color: palette.textSoft, margin: 0, fontSize: '0.9rem' }}>
            Ingresá con tu usuario de empleado
          </p>
        </div>

        <label style={labelStyle}>Usuario</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
          required
          style={inputStyle}
        />

        <label style={labelStyle}>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          style={inputStyle}
        />

        {error && (
          <div
            style={{
              color: palette.primary,
              fontSize: '0.85rem',
              marginTop: 12,
              background: palette.errorBg,
              border: `1px solid ${palette.errorBd}`,
              padding: '8px 12px',
              borderRadius: 8,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            marginTop: 18,
            width: '100%',
            background: palette.primary,
            border: 'none',
            color: 'white',
            padding: '12px 14px',
            borderRadius: 999,
            cursor: busy ? 'wait' : 'pointer',
            fontWeight: 700,
            fontSize: '0.95rem',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  color: palette.textSoft,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 600,
  marginTop: 12,
  marginBottom: 4,
};

const inputStyle = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  border: `1px solid ${palette.border}`,
  borderRadius: 10,
  fontSize: '0.95rem',
  outline: 'none',
  background: palette.bg,
  color: palette.text,
};
