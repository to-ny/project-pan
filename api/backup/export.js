import { db } from '../_db.js';
import { categories, products, usageLogs } from '../../src/data/schema.js';
import { withAuth } from '../_auth.js';

async function handler(request) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405,
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

    return new Response(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="projectpan-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({ error: 'Erreur lors de l\'export' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export default withAuth(handler);
