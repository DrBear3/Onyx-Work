import dotenv from 'dotenv';
dotenv.config({ debug: true }); // Enable dotenv debug mode

import { Magic } from '@magic-sdk/admin';
import { createClient } from '@supabase/supabase-js';

// Log environment variables for debugging
console.log('Environment variables loaded:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY);
console.log('MAGIC_SECRET_KEY:', process.env.MAGIC_SECRET_KEY);
console.log('DATABASE_URL (for pg):', process.env.DATABASE_URL);

// Validate environment variables
if (!process.env.SUPABASE_URL) {
  console.error('SUPABASE_URL is undefined or empty');
  throw new Error('Supabase configuration incomplete: SUPABASE_URL must be defined');
}
if (!process.env.SUPABASE_KEY) {
  console.error('SUPABASE_KEY is undefined or empty');
  throw new Error('Supabase configuration incomplete: SUPABASE_KEY must be defined');
}
if (!process.env.MAGIC_SECRET_KEY) {
  console.error('MAGIC_SECRET_KEY is undefined or empty');
  throw new Error('Magic configuration incomplete');
}

// Initialize Magic Admin SDK
const magic = new Magic(process.env.MAGIC_SECRET_KEY);

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function auth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '');

    // Validate token with Magic
    const { issuer, publicAddress, email } = await magic.users.getMetadataByToken(token);

    // Attach user data
    req.user = { issuer, publicAddress, email };

    // Store/update user in Supabase
    const { data, error } = await supabase
      .from('users')
      .upsert({ issuer: req.user.issuer, email: req.user.email }, { onConflict: 'issuer' });

    if (error) {
      console.error('Supabase upsert error:', error.message);
      // Optional: return res.status(500).json({ error: 'User storage failed' });
    }

    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    return res.status(401).json({ error: 'Authentication failed', details: err.message });
  }
}