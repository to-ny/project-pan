import { db } from '../_db.js';
import { products } from '../../src/data/schema.js';
import { eq } from 'drizzle-orm';
import { withAuth } from '../_auth.js';

async function handler(req, res) {
  const id = req.query.id;
  const status = req.query.status;
  const categoryId = req.query.categoryId;

  // GET - List all, by status, by category, or by ID
  if (req.method === 'GET') {
    if (id) {
      const result = await db.select().from(products).where(eq(products.id, parseInt(id)));
      if (result.length === 0) {
        return res.status(404).json({ error: 'Produit non trouvé' });
      }
      return res.status(200).json(result[0]);
    }

    let result;
    if (status) {
      result = await db.select().from(products).where(eq(products.status, status));
    } else if (categoryId) {
      result = await db.select().from(products).where(eq(products.categoryId, parseInt(categoryId)));
    } else {
      result = await db.select().from(products);
    }

    return res.status(200).json(result);
  }

  // POST - Create new product
  if (req.method === 'POST') {
    const body = req.body || {};

    const result = await db.insert(products).values({
      name: body.name,
      brand: body.brand,
      categoryId: body.categoryId,
      subcategory: body.subcategory,
      status: body.status || 'in_stock',
      size: body.size,
      sizeUnit: body.sizeUnit,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      dateOpened: body.dateOpened ? new Date(body.dateOpened) : null,
    }).returning();

    return res.status(201).json(result[0]);
  }

  // PUT - Update product
  if (req.method === 'PUT') {
    if (!id) {
      return res.status(400).json({ error: 'ID requis' });
    }

    const body = req.body || {};

    // Convert date strings to Date objects
    const updates = { ...body };
    if (updates.purchaseDate) updates.purchaseDate = new Date(updates.purchaseDate);
    if (updates.dateOpened) updates.dateOpened = new Date(updates.dateOpened);
    if (updates.dateFinished) updates.dateFinished = new Date(updates.dateFinished);
    if (updates.lastUsed) updates.lastUsed = new Date(updates.lastUsed);

    const result = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    return res.status(200).json(result[0]);
  }

  // DELETE - Delete product (cascade handled by DB for usage logs)
  if (req.method === 'DELETE') {
    if (!id) {
      return res.status(400).json({ error: 'ID requis' });
    }

    await db.delete(products).where(eq(products.id, parseInt(id)));
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}

export default withAuth(handler);
