// CORS manual (CLAUDE.md: evitamos el paquete `cors` para no rebuildear).
// Reflejamos el Origin en vez de '*' porque las cookies de sesión exigen
// Allow-Origin específico cuando se usa Allow-Credentials: true.
export function cors(req, res, next) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}

export function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
}

// requireRole(...grupos) — autoriza según el `grupo` del usuario (admin,
// gerente, vendedor, bodeguero, consulta), que se corresponde con los 5 roles
// del DBMS. Devuelve 401 si no hay sesión y 403 si el grupo no está permitido.
export function requireRole(...grupos) {
  return (req, res, next) => {
    if (!req.session?.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!grupos.includes(req.session.user.grupo)) {
      return res.status(403).json({
        error: 'No tiene permiso para realizar esta operación',
        rol: req.session.user.rol,
        requiere: grupos,
      });
    }
    next();
  };
}
