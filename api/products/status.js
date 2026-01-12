import { db } from '../_db.js';
import { products } from '../../src/data/schema.js';
import { eq } from 'drizzle-orm';
import { withAuth } from '../_auth.js';

async function handler(request) {
  if (request.method !== 'PUT') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ error: 'ID requis' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json();
  const { status, rating, review } = body;

  if (!['in_stock', 'in_use', 'finished'].includes(status)) {
    return new Response(JSON.stringify({ error: 'Statut invalide' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
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
    return new Response(JSON.stringify({ error: 'Produit non trouvé' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(result[0]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default withAuth(handler);
