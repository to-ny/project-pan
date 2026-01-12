import { db } from '../_db.js';
import { categories, CATEGORY_COLORS } from '../../src/data/schema.js';
import { eq } from 'drizzle-orm';
import { withAuth } from '../_auth.js';

async function handler(request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  // GET - List all or get by ID
  if (request.method === 'GET') {
    if (id) {
      const result = await db.select().from(categories).where(eq(categories.id, parseInt(id)));
      if (result.length === 0) {
        return new Response(JSON.stringify({ error: 'Catégorie non trouvée' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(result[0]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await db.select().from(categories);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST - Create new category
  if (request.method === 'POST') {
    const body = await request.json();
    const allCategories = await db.select().from(categories);
    const color = body.color || CATEGORY_COLORS[allCategories.length % CATEGORY_COLORS.length];

    const result = await db.insert(categories).values({
      name: body.name,
      color,
      subcategories: body.subcategories || [],
    }).returning();

    return new Response(JSON.stringify(result[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // PUT - Update category
  if (request.method === 'PUT') {
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const result = await db
      .update(categories)
      .set(body)
      .where(eq(categories.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return new Response(JSON.stringify({ error: 'Catégorie non trouvée' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // DELETE - Delete category (cascade handled by DB)
  if (request.method === 'DELETE') {
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.delete(categories).where(eq(categories.id, parseInt(id)));

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
