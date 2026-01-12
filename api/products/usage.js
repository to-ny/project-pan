import { db } from '../_db.js';
import { products, usageLogs } from '../../src/data/schema.js';
import { eq } from 'drizzle-orm';
import { withAuth } from '../_auth.js';

async function handler(req, res) {
  const productId = req.query.productId;

  if (!productId) {
    return res.status(400).json({ error: 'productId requis' });
  }

  const id = parseInt(productId);

  // GET - Get usage logs and stats
  if (req.method === 'GET') {
    const logs = await db
      .select()
      .from(usageLogs)
      .where(eq(usageLogs.productId, id));

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let weekCount = 0;
    let monthCount = 0;
    const currentMonthDays = new Set();
    const monthlyData = {};

    for (const log of logs) {
      const logDate = new Date(log.date);

      if (logDate >= startOfWeek) weekCount++;
      if (logDate >= startOfMonth) {
        monthCount++;
        currentMonthDays.add(logDate.getDate());
      }

      // Monthly aggregation
      const key = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { count: 0, days: new Set() };
      }
      monthlyData[key].count++;
      monthlyData[key].days.add(logDate.getDate());
    }

    // Convert Sets to arrays
    for (const key of Object.keys(monthlyData)) {
      monthlyData[key].days = Array.from(monthlyData[key].days);
    }

    return res.status(200).json({
      logs,
      stats: {
        weekCount,
        monthCount,
        totalCount: logs.length,
      },
      currentMonthDays: Array.from(currentMonthDays),
      monthlyData,
    });
  }

  // POST - Log usage
  if (req.method === 'POST') {
    const now = new Date();

    await db.insert(usageLogs).values({
      productId: id,
      date: now,
    });

    // Update product's lastUsed
    await db
      .update(products)
      .set({ lastUsed: now })
      .where(eq(products.id, id));

    return res.status(201).json({ success: true });
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}

export default withAuth(handler);
