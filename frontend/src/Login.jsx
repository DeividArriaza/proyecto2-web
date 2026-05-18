import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, palette } from './api.js';
import { useAuth } from './context/AuthContext.jsx';
import { validateSignup, hasErrors } from './lib/validators.js';

const emptySignup = {
  nombres: '',
  apellidos: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  id_sucursal: '',
};

export default function Login() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'

  // login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // signup fields
  const [signup, setSignup] = useState(emptySignup);
  const [sucursales, setSucursales] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Carga las sucursales una sola vez cuando se cambia a signup.
  useEffect(() => {
    if (mode === 'signup' && sucursales.length === 0) {
      api('/sucursales').then(setSucursales).catch(() => {/* opcional */});
    }
  }, [mode, sucursales.length]);

  function switchMode(next) {
    setMode(next);
    setError(null);
    setFieldErrors({});
  }

  function setSignupField(name, value) {
    setSignup((s) => ({ ...s, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((fe) => {
        const next = { ...fe };
        delete next[name];
        return next;
      });
    }
  }

  function validateLogin() {
    if (username.trim().length < 3) return 'El usuario debe tener al menos 3 caracteres';
    if (password.length < 4) return 'La contraseña debe tener al menos 4 caracteres';
    return null;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    const localError = validateLogin();
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

  async function handleSignup(e) {
    e.preventDefault();
    setError(null);

    const errs = validateSignup(signup);
    if (hasErrors(errs)) {
      setFieldErrors(errs);
      return;
    }
    setBusy(true);
    try {
      await register({
        nombres: signup.nombres.trim(),
        apellidos: signup.apellidos.trim(),
        email: signup.email.trim(),
        username: signup.username.trim(),
        password: signup.password,
        id_sucursal: Number(signup.id_sucursal),
      });
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
      <div
        style={{
          background: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: 20,
          padding: 32,
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 12px 40px rgba(199, 21, 133, 0.12)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
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
            {mode === 'login' ? 'Acceso interno' : 'Registro de empleado'}
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
            Bubu&apos;s Bakery
          </h1>
          <p style={{ color: palette.textSoft, margin: 0, fontSize: '0.9rem' }}>
            {mode === 'login'
              ? 'Ingresá con tu usuario de empleado'
              : 'Creá tu cuenta para empezar a usar el sistema'}
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            background: palette.bg,
            borderRadius: 999,
            padding: 4,
            marginBottom: 18,
          }}
        >
          <TabBtn active={mode === 'login'} onClick={() => switchMode('login')}>
            Iniciar sesión
          </TabBtn>
          <TabBtn active={mode === 'signup'} onClick={() => switchMode('signup')}>
            Crear cuenta
          </TabBtn>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} noValidate>
            <label style={labelStyle}>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              style={inputStyle}
            />

            <label style={labelStyle}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              style={inputStyle}
            />

            {error && <ErrorBox>{error}</ErrorBox>}

            <SubmitBtn busy={busy}>{busy ? 'Entrando…' : 'Entrar'}</SubmitBtn>
          </form>
        ) : (
          <form onSubmit={handleSignup} noValidate>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <SignupField
                label="Nombres" autoFocus
                value={signup.nombres}
                error={fieldErrors.nombres}
                onChange={(v) => setSignupField('nombres', v)}
              />
              <SignupField
                label="Apellidos"
                value={signup.apellidos}
                error={fieldErrors.apellidos}
                onChange={(v) => setSignupField('apellidos', v)}
              />
            </div>
            <SignupField
              label="Email" type="email" autoComplete="email"
              value={signup.email}
              error={fieldErrors.email}
              onChange={(v) => setSignupField('email', v)}
            />
            <SignupField
              label="Usuario" autoComplete="username"
              value={signup.username}
              error={fieldErrors.username}
              onChange={(v) => setSignupField('username', v)}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <SignupField
                label="Contraseña" type="password" autoComplete="new-password"
                value={signup.password}
                error={fieldErrors.password}
                onChange={(v) => setSignupField('password', v)}
              />
              <SignupField
                label="Repetir" type="password" autoComplete="new-password"
                value={signup.confirmPassword}
                error={fieldErrors.confirmPassword}
                onChange={(v) => setSignupField('confirmPassword', v)}
              />
            </div>

            <label style={labelStyle}>Sucursal</label>
            <select
              value={signup.id_sucursal}
              onChange={(e) => setSignupField('id_sucursal', e.target.value)}
              style={{ ...inputStyle, borderColor: fieldErrors.id_sucursal ? '#D4574A' : inputStyle.border }}
              aria-invalid={!!fieldErrors.id_sucursal}
            >
              <option value="">— elegir sucursal —</option>
              {sucursales.map((s) => (
                <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>
              ))}
            </select>
            {fieldErrors.id_sucursal && <FieldError>{fieldErrors.id_sucursal}</FieldError>}

            {error && <ErrorBox>{error}</ErrorBox>}

            <SubmitBtn busy={busy}>{busy ? 'Creando…' : 'Crear cuenta'}</SubmitBtn>

            <p style={{ fontSize: '0.75rem', color: palette.textSoft, marginTop: 12, textAlign: 'center' }}>
              Tu cuenta se creará con rol <strong>Vendedor Mostrador</strong>. Un administrador puede cambiarlo después.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        border: 'none',
        background: active ? palette.primary : 'transparent',
        color: active ? 'white' : palette.textSoft,
        padding: '8px 12px',
        borderRadius: 999,
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: '0.85rem',
      }}
    >
      {children}
    </button>
  );
}

function SignupField({ label, value, onChange, error, type = 'text', autoFocus, autoComplete }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        style={{ ...inputStyle, borderColor: error ? '#D4574A' : inputStyle.border, background: error ? '#FFF5F5' : inputStyle.background }}
        aria-invalid={!!error}
      />
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

function FieldError({ children }) {
  return (
    <div role="alert" style={{ color: '#B22222', fontSize: '0.75rem', marginTop: 4, fontWeight: 500 }}>
      {children}
    </div>
  );
}

function ErrorBox({ children }) {
  return (
    <div
      role="alert"
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
      {children}
    </div>
  );
}

function SubmitBtn({ busy, children }) {
  return (
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
      {children}
    </button>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '0.7rem',
  color: palette.textSoft,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: 600,
  marginTop: 10,
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
