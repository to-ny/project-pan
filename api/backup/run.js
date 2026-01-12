import { db } from '../_db.js';
import { categories, products, usageLogs } from '../../src/data/schema.js';
import { put } from '@vercel/blob';

const BACKUP_FILENAME = 'projectpan-backup.json';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Verify cron secret (for scheduled calls)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Non autorisé' });
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

    return res.status(200).json({
      success: true,
      url: blob.url,
      createdAt: backup.createdAt,
      counts: {
        categories: allCategories.length,
        products: allProducts.length,
        usageLogs: allUsageLogs.length,
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
  }
}
