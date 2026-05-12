// src/middleware/auth.js
// Middleware que protege rotas privadas verificando o token JWT

const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  // Espera o header: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido. Faça login para continuar.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // disponibiliza o ID do usuário nas rotas
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido ou expirado. Faça login novamente.' });
  }
}

module.exports = authMiddleware;
