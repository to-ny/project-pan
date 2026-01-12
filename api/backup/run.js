import { db } from '../_db.js';
import { categories, products, usageLogs } from '../../src/data/schema.js';
import { put } from '@vercel/blob';

const BACKUP_FILENAME = 'projectpan-backup.json';

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify cron secret (for scheduled calls) or auth header
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Export all data
    const allCategories = await db.select().from(categories);
    const allProducts = await db.select().from(products);
    const allUsageLogs = await db.select().from(usageLogs);

    const backup = {
      version: 1,
      createdAt: new Date().toISOString(),
      data: {
        categories: allCategories,
        products: allProducts,
        usageLogs: allUsageLogs,
      },
    };

    // Upload to Vercel Blob (overwrites existing)
    const blob = await put(BACKUP_FILENAME, JSON.stringify(backup, null, 2), {
      access: 'public',
      addRandomSuffix: false,
    });

    return new Response(JSON.stringify({
      success: true,
      url: blob.url,
      createdAt: backup.createdAt,
      counts: {
        categories: allCategories.length,
        products: allProducts.length,
        usageLogs: allUsageLogs.length,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return new Response(JSON.stringify({ error: 'Erreur lors de la sauvegarde' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
