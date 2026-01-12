import { db } from './_db.js';
import { authAttempts } from '../src/data/schema.js';
import { gt, and, eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const TOKEN_COOKIE_NAME = 'pan_auth';
const TOKEN_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

// Get client IP from request
export function getClientIP(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

// Check rate limit
export async function checkRateLimit(ip) {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

  const attempts = await db
    .select()
    .from(authAttempts)
    .where(
      and(
        eq(authAttempts.ipAddress, ip),
        gt(authAttempts.attemptedAt, windowStart)
      )
    );

  return attempts.length < MAX_ATTEMPTS;
}

// Record failed attempt
export async function recordAttempt(ip) {
  await db.insert(authAttempts).values({ ipAddress: ip });
}

// Clean old attempts (called periodically)
export async function cleanOldAttempts() {
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
  await db
    .delete(authAttempts)
    .where(gt(authAttempts.attemptedAt, windowStart));
}

// Verify PIN against hash
export async function verifyPin(pin) {
  const pinHash = process.env.AUTH_PIN_HASH;
  if (!pinHash) {
    throw new Error('AUTH_PIN_HASH not configured');
  }
  return bcrypt.compare(pin, pinHash);
}

// Generate secure session token
export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Create auth cookie header
export function createAuthCookie(token) {
  const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
  return `${TOKEN_COOKIE_NAME}=${token}; HttpOnly; ${secure}SameSite=Strict; Path=/; Max-Age=${TOKEN_MAX_AGE}`;
}

// Parse cookies from request
export function parseCookies(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) {
      cookies[name] = rest.join('=');
    }
  });
  return cookies;
}

// Validate auth token
export function validateToken(request) {
  const cookies = parseCookies(request);
  const token = cookies[TOKEN_COOKIE_NAME];
  const validToken = process.env.AUTH_TOKEN;

  if (!token || !validToken) {
    return false;
  }

  // Timing-safe comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(validToken)
    );
  } catch {
    return false;
  }
}

// Auth middleware wrapper for API routes
export function withAuth(handler) {
  return async (request) => {
    if (!validateToken(request)) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return handler(request);
  };
}
