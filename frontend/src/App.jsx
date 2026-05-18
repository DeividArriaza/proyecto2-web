import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { palette } from './api.js';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
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
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      {user ? (
        <Route element={<Layout />}>
          <Route path="/" element={<Catalog />} />
          <Route path="/productos" element={<ProductosAdmin />} />
          <Route path="/clientes" element={<ClientesAdmin />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}
