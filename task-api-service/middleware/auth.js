export default async function auth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
    // Temporarily set a mock req.user for testing (postponing full Magic integration)
    // This prevents the 'req.user undefined' error; replace with actual validation later
    req.user = { issuer: 'test-issuer-uuid' };  // Use a fixed test UUID or make it dynamic if needed
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed', details: err.message });
  }
}