import { db } from '../_db.js';
import { products } from '../../src/data/schema.js';
import { eq } from 'drizzle-orm';
import { withAuth } from '../_auth.js';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ error: 'ID requis' });
  }

  const body = req.body || {};
  const { status, rating, review } = body;

  if (!['in_stock', 'in_use', 'finished'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }

  const updates = { status };

  if (status === 'in_use') {
    updates.dateOpened = new Date();
  } else if (status === 'finished') {
    updates.dateFinished = new Date();
    if (rating !== undefined) updates.rating = rating;
    if (review !== undefined) updates.review = review;
  }

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

export default withAuth(handler);
