#!/usr/bin/env node

/**
 * Hash PIN Helper
 *
 * Generates a bcrypt hash for your PIN code.
 * Run: npm run hash-pin
 *
 * Usage:
 *   node scripts/hash-pin.js 1234
 *
 * Then copy the output to your Vercel environment variable AUTH_PIN_HASH
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const pin = process.argv[2];

if (!pin) {
  console.log('Usage: node scripts/hash-pin.js <pin>');
  console.log('Example: node scripts/hash-pin.js 1234');
  console.log('');
  console.log('This will generate:');
  console.log('  - AUTH_PIN_HASH: bcrypt hash of your PIN');
  console.log('  - AUTH_TOKEN: random token for sessions');
  console.log('  - CRON_SECRET: random secret for backup cron');
  process.exit(1);
}

if (pin.length < 4 || pin.length > 8 || !/^\d+$/.test(pin)) {
  console.error('Error: PIN must be 4-8 digits');
  process.exit(1);
}

const SALT_ROUNDS = 12;

async function main() {
  const hash = await bcrypt.hash(pin, SALT_ROUNDS);
  const authToken = crypto.randomBytes(32).toString('hex');
  const cronSecret = crypto.randomBytes(16).toString('hex');

  console.log('\n=== Environment Variables for Vercel ===\n');
  console.log('Copy these to your Vercel project settings:\n');
  console.log(`AUTH_PIN_HASH=${hash}`);
  console.log(`AUTH_TOKEN=${authToken}`);
  console.log(`CRON_SECRET=${cronSecret}`);
  console.log('\n=== End ===\n');
}

main();
