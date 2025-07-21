export default async function auth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
    // For testing: set a dummy user object
    req.user = {
      issuer: 'test-issuer',
      email: 'test@example.com',
      publicAddress: '0x1234'
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed', details: err.message });
  }
}