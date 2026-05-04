function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Не авторизован' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Не авторизован' });
  if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Запрещено' });
  next();
}

module.exports = { requireAuth, requireAdmin };