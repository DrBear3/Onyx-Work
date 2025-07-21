export default async function auth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
    // For testing: set a dummy user object
    req.user = {
    issuer: '7e8f7b1c-4c37-4b8d-8f44-12b5e468a8c8', // <-- valid UUID!
    email: 'test@example.com',
    publicAddress: '0x1234'
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed', details: err.message });
  }
}