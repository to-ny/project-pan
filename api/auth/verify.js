import {
  getClientIP,
  checkRateLimit,
  recordAttempt,
  verifyPin,
  createAuthCookie,
} from '../_auth.js';

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ip = getClientIP(request);

  // Check rate limit
  const allowed = await checkRateLimit(ip);
  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: 'Trop de tentatives. Réessayez dans 15 minutes.',
        rateLimited: true,
      }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Corps de requête invalide' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { pin } = body;

  // Validate input
  if (!pin || typeof pin !== 'string' || pin.length < 4 || pin.length > 8) {
    await recordAttempt(ip);
    return new Response(JSON.stringify({ error: 'Code PIN invalide' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify PIN
  try {
    const valid = await verifyPin(pin);

    if (!valid) {
      await recordAttempt(ip);
      return new Response(JSON.stringify({ error: 'Code PIN incorrect' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Success - set auth cookie with the pre-generated token
    const token = process.env.AUTH_TOKEN;
    if (!token) {
      throw new Error('AUTH_TOKEN not configured');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': createAuthCookie(token),
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
