import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { palette } from './api.js';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { puedeAcceder, rutaInicial } from './permissions.js';
import Login from './Login.jsx';
import Layout from './Layout.jsx';
import Catalog from './Catalog.jsx';
import ProductosAdmin from './ProductosAdmin.jsx';
import ClientesAdmin from './ClientesAdmin.jsx';
import Reportes from './Reportes.jsx';
import Ventas from './Ventas.jsx';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

function AppRoutes() {
  const { user, bootstrapped } = useAuth();

  if (!bootstrapped) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: palette.bg,
          color: palette.textSoft,
          fontFamily: '"Helvetica Neue", system-ui, sans-serif',
        }}
      >
        Cargando…
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={rutaInicial(user.grupo)} replace /> : <Login />}
      />
      {user ? (
        <Route element={<Layout />}>
          <Route path="/"          element={<RequireRole path="/"><Catalog /></RequireRole>} />
          <Route path="/productos" element={<RequireRole path="/productos"><ProductosAdmin /></RequireRole>} />
          <Route path="/clientes"  element={<RequireRole path="/clientes"><ClientesAdmin /></RequireRole>} />
          <Route path="/ventas"    element={<RequireRole path="/ventas"><Ventas /></RequireRole>} />
          <Route path="/reportes"  element={<RequireRole path="/reportes"><Reportes /></RequireRole>} />
          <Route path="*" element={<Navigate to={rutaInicial(user.grupo)} replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}

// Guard de ruta por rol: si el grupo del usuario no puede acceder a `path`,
// lo redirige a su primera ruta permitida. Protege las vistas a nivel de router
// (no basta con ocultar el menú).
function RequireRole({ path, children }) {
  const { user } = useAuth();
  if (!puedeAcceder(user.grupo, path)) {
    return <Navigate to={rutaInicial(user.grupo)} replace />;
  }
  return children;
}
