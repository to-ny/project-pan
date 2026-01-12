import { db, sql } from '../_db.js';
import { categories, products, usageLogs } from '../../src/data/schema.js';
import { withAuth } from '../_auth.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const backup = req.body;

    // Validate backup structure
    if (!backup || !backup.version || !backup.data) {
      return res.status(400).json({ error: 'Format de sauvegarde invalide' });
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

    return res.status(200).json({
      success: true,
      restored: {
        categories: data.categories?.length || 0,
        products: data.products?.length || 0,
        usageLogs: data.usageLogs?.length || 0,
      },
    });
  } catch (error) {
    console.error('Restore error:', error);
    return res.status(500).json({ error: 'Erreur lors de la restauration' });
  }
}

export default withAuth(handler);
