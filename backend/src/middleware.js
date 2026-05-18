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
