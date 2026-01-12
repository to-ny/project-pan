import {
  getClientIP,
  checkRateLimit,
  recordAttempt,
  verifyPin,
  createAuthCookie,
} from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const ip = getClientIP(req);

  // Check rate limit
  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return res.status(429).json({
      error: 'Trop de tentatives. Réessayez dans 15 minutes.',
      rateLimited: true,
    });
  }

  const { pin } = req.body || {};

  // Validate input
  if (!pin || typeof pin !== 'string' || pin.length < 4 || pin.length > 8) {
    await recordAttempt(ip);
    return res.status(400).json({ error: 'Code PIN invalide' });
  }

  // Verify PIN
  try {
    const valid = await verifyPin(pin);

    if (!valid) {
      await recordAttempt(ip);
      return res.status(401).json({ error: 'Code PIN incorrect' });
    }

    // Success - set auth cookie with the pre-generated token
    const token = process.env.AUTH_TOKEN;
    if (!token) {
      throw new Error('AUTH_TOKEN not configured');
    }

    res.setHeader('Set-Cookie', createAuthCookie(token));
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
