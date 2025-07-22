//import jwt from 'jsonwebtoken';

//export default async function auth(req, res, next) {
//  try {
 //   const authHeader = req.headers['authorization'];
 //   if (!authHeader || !authHeader.startsWith('Bearer ')) {
 //     return res.status(401).json({ error: 'Authorization token required' });
   // }
//
 //   const token = authHeader.split(' ')[1];
  //  const decoded = jwt.verify(token, process.env.JWT_SECRET); // Ensure you have this secret set
//
   // req.user = { id: decoded.user_id }; // Adjust based on how your JWT is structured
 //   next();
  //} catch (err) {
 //   return res.status(401).json({ error: 'Authentication failed', details: err.message });
//  }
//}