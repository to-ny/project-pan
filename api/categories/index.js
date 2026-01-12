import { db } from '../_db.js';
import { categories, CATEGORY_COLORS } from '../../src/data/schema.js';
import { eq } from 'drizzle-orm';
import { withAuth } from '../_auth.js';

async function handler(req, res) {
  const id = req.query.id;

  // GET - List all or get by ID
  if (req.method === 'GET') {
    if (id) {
      const result = await db.select().from(categories).where(eq(categories.id, parseInt(id)));
      if (result.length === 0) {
        return res.status(404).json({ error: 'Catégorie non trouvée' });
      }
      return res.status(200).json(result[0]);
    }

    const result = await db.select().from(categories);
    return res.status(200).json(result);
  }

  // POST - Create new category
  if (req.method === 'POST') {
    const body = req.body || {};
    const allCategories = await db.select().from(categories);
    const color = body.color || CATEGORY_COLORS[allCategories.length % CATEGORY_COLORS.length];

    const result = await db.insert(categories).values({
      name: body.name,
      color,
      subcategories: body.subcategories || [],
    }).returning();

    return res.status(201).json(result[0]);
  }

  // PUT - Update category
  if (req.method === 'PUT') {
    if (!id) {
      return res.status(400).json({ error: 'ID requis' });
    }

    const body = req.body || {};
    const result = await db
      .update(categories)
      .set(body)
      .where(eq(categories.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    return res.status(200).json(result[0]);
  }

  // DELETE - Delete category (cascade handled by DB)
  if (req.method === 'DELETE') {
    if (!id) {
      return res.status(400).json({ error: 'ID requis' });
    }

    await db.delete(categories).where(eq(categories.id, parseInt(id)));
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}

export default withAuth(handler);
