import { db } from '../_db.js';
import { categories, products, usageLogs } from '../../src/data/schema.js';
import { withAuth } from '../_auth.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
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

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="projectpan-backup-${new Date().toISOString().split('T')[0]}.json"`);
    return res.status(200).send(JSON.stringify(backup, null, 2));
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'export' });
  }
}

export default withAuth(handler);
