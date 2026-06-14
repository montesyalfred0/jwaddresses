import jwt from 'jsonwebtoken';

/** Middleware que verifica el JWT en la cookie y adjunta userId y userRole a la request */
export const authMiddleware = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.clearCookie('jwt');
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/** Middleware que requiere rol de administrador */
export const adminMiddleware = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
};
