import { db, sql } from '../_db.js';
import { categories, products, usageLogs } from '../../src/data/schema.js';
import { withAuth } from '../_auth.js';

async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const backup = await request.json();

    // Validate backup structure
    if (!backup.version || !backup.data) {
      return new Response(JSON.stringify({ error: 'Format de sauvegarde invalide' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data } = backup;

    // Clear existing data (order matters due to foreign keys)
    await db.delete(usageLogs);
    await db.delete(products);
    await db.delete(categories);

    // Restore categories
    if (data.categories && data.categories.length > 0) {
      for (const cat of data.categories) {
        await db.insert(categories).values({
          id: cat.id,
          name: cat.name,
          color: cat.color,
          subcategories: cat.subcategories,
          createdAt: cat.createdAt ? new Date(cat.createdAt) : new Date(),
        });
      }
      // Reset sequence
      const maxCatId = Math.max(...data.categories.map(c => c.id));
      await sql`SELECT setval('categories_id_seq', ${maxCatId}, true)`;
    }

    // Restore products
    if (data.products && data.products.length > 0) {
      for (const prod of data.products) {
        await db.insert(products).values({
          id: prod.id,
          name: prod.name,
          brand: prod.brand,
          categoryId: prod.categoryId,
          subcategory: prod.subcategory,
          status: prod.status,
          size: prod.size,
          sizeUnit: prod.sizeUnit,
          purchaseDate: prod.purchaseDate ? new Date(prod.purchaseDate) : null,
          dateOpened: prod.dateOpened ? new Date(prod.dateOpened) : null,
          dateFinished: prod.dateFinished ? new Date(prod.dateFinished) : null,
          rating: prod.rating,
          review: prod.review,
          createdAt: prod.createdAt ? new Date(prod.createdAt) : new Date(),
          lastUsed: prod.lastUsed ? new Date(prod.lastUsed) : null,
        });
      }
      // Reset sequence
      const maxProdId = Math.max(...data.products.map(p => p.id));
      await sql`SELECT setval('products_id_seq', ${maxProdId}, true)`;
    }

    // Restore usage logs
    if (data.usageLogs && data.usageLogs.length > 0) {
      for (const log of data.usageLogs) {
        await db.insert(usageLogs).values({
          id: log.id,
          productId: log.productId,
          date: log.date ? new Date(log.date) : new Date(),
        });
      }
      // Reset sequence
      const maxLogId = Math.max(...data.usageLogs.map(l => l.id));
      await sql`SELECT setval('usage_logs_id_seq', ${maxLogId}, true)`;
    }

    return new Response(JSON.stringify({
      success: true,
      restored: {
        categories: data.categories?.length || 0,
        products: data.products?.length || 0,
        usageLogs: data.usageLogs?.length || 0,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Restore error:', error);
    return new Response(JSON.stringify({ error: 'Erreur lors de la restauration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export default withAuth(handler);
