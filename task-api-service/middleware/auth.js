import jwt from 'jsonwebtoken';

export default function auth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.decode(token); // Use jwt.verify() in production!
    if (!decoded || !decoded.sub) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = {
      id: decoded.sub, // This is the user UUID from Supabase
      email: decoded.email
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed', details: err.message });
  }
}