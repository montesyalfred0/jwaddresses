import jwt from 'jsonwebtoken';

/** Middleware que verifica el JWT en la cookie y adjunta userId a la request */
export const authMiddleware = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.clearCookie('jwt');
    return res.status(401).json({ error: 'Invalid token' });
  }
};
