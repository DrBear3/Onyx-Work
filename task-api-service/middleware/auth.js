// Need to update this code snippet to use Magic.link for authentication
// Magic.link authentication middleware
export default async function auth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }
    const DIDToken = authHeader.split(' ')[1];
    // Decodes and validates the token, returns the metadata (e.g., user ID/email)
    const metadata = await magic.users.getMetadataByToken(DIDToken);
    if (!metadata || !metadata.issuer) {
      return res.status(401).json({ error: 'Invalid or expired Magic token' });
    }
    // Attach user info to the request (customize as needed)
    req.user = {
      issuer: metadata.issuer,
      email: metadata.email,
      publicAddress: metadata.publicAddress,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed', details: err.message });
  }
}