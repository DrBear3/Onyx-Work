import { Magic } from '@magic-sdk/admin';
import { createClient } from '@supabase/supabase-js';

// Initialize Magic Admin SDK with the secret key from environment variables
const magic = new Magic(process.env.MAGIC_SECRET_KEY);

// Initialize Supabase client (do this outside the middleware for reuse)
const supabase = createClient(process.env.DATABASE_URL, process.env.DB_PASSWORD);

console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);

export default async function auth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Extract the token from the Authorization header
    const token = authHeader.replace('Bearer ', '');

    // Validate the token using Magic Admin SDK
    const { issuer, publicAddress, email } = await magic.users.getMetadataByToken(token);

    // Attach user data to the request object
    req.user = { issuer, publicAddress, email };

    // After authentication, store/update user in Supabase
    const { data, error } = await supabase
      .from('users')
      .upsert({ issuer: req.user.issuer, email: req.user.email }, { onConflict: 'issuer' });

    if (error) {
      console.error('Supabase upsert error:', error.message); // Log error but proceed
      // Optional: return res.status(500).json({ error: 'User storage failed' }); // If you want to halt on error
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed', details: err.message });
  }

  // Commented out original mock code for testing reversion:
  // // Temporarily set a mock req.user for testing (postponing full Magic integration)
  // // This prevents the 'req.user undefined' error; replace with actual validation later
  // req.user = { issuer: 'a4e222d4-73b9-4760-9dfd-1dc84b6dc982' };  // Use a fixed test UUID or make it dynamic if needed
}