import { db } from '../_db.js';
import { products } from '../../src/data/schema.js';
import { eq } from 'drizzle-orm';
import { withAuth } from '../_auth.js';

async function handler(request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const status = url.searchParams.get('status');
  const categoryId = url.searchParams.get('categoryId');

  // GET - List all, by status, by category, or by ID
  if (request.method === 'GET') {
    if (id) {
      const result = await db.select().from(products).where(eq(products.id, parseInt(id)));
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

    let result;
    if (status) {
      result = await db.select().from(products).where(eq(products.status, status));
    } else if (categoryId) {
      result = await db.select().from(products).where(eq(products.categoryId, parseInt(categoryId)));
    } else {
      result = await db.select().from(products);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST - Create new product
  if (request.method === 'POST') {
    const body = await request.json();

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

    return new Response(JSON.stringify(result[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // PUT - Update product
  if (request.method === 'PUT') {
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();

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

  // DELETE - Delete product (cascade handled by DB for usage logs)
  if (request.method === 'DELETE') {
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.delete(products).where(eq(products.id, parseInt(id)));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default withAuth(handler);
