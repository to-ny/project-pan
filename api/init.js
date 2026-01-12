import { sql } from './_db.js';

// One-time database initialization endpoint
// Call this once after first deploy to create tables
// DELETE THIS FILE after successful initialization

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST required' });
  }

  // Require the cron secret for security
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Authorization required. Use: Authorization: Bearer <CRON_SECRET>' });
  }

  try {
    // Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(7),
        subcategories JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)`;

    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255),
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        subcategory VARCHAR(255),
        status VARCHAR(20) DEFAULT 'in_stock' NOT NULL,
        size DECIMAL,
        size_unit VARCHAR(20),
        purchase_date TIMESTAMP,
        date_opened TIMESTAMP,
        date_finished TIMESTAMP,
        rating INTEGER,
        review TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        last_used TIMESTAMP
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at)`;

    await sql`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE NOT NULL,
        date TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_usage_logs_product ON usage_logs(product_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_usage_logs_date ON usage_logs(date)`;

    await sql`
      CREATE TABLE IF NOT EXISTS auth_attempts (
        id SERIAL PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        attempted_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip ON auth_attempts(ip_address)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_auth_attempts_time ON auth_attempts(attempted_at)`;

    // Seed default categories if empty
    const { rows } = await sql`SELECT COUNT(*) as count FROM categories`;

    if (parseInt(rows[0].count) === 0) {
      await sql`
        INSERT INTO categories (name, color, subcategories) VALUES
        ('Soin visage', '#E57373', '["Nettoyant", "Tonique", "Sérum", "Crème hydratante", "Contour des yeux", "Masque", "Protection solaire", "Huile", "Exfoliant"]'),
        ('Maquillage', '#F06292', '["Fond de teint", "Correcteur", "Poudre", "Blush", "Bronzer", "Highlighter", "Fard à paupières", "Eyeliner", "Mascara", "Rouge à lèvres", "Gloss", "Spray fixateur"]'),
        ('Cheveux', '#BA68C8', '["Shampooing", "Après-shampooing", "Masque", "Huile", "Coiffant", "Soin"]'),
        ('Corps', '#64B5F6', '["Gel douche", "Lait corporel", "Gommage", "Huile", "Déodorant", "Crème mains"]'),
        ('Parfum', '#4DB6AC', '["Parfum", "Brume corporelle"]'),
        ('Ongles', '#81C784', '["Vernis", "Soin", "Dissolvant"]')
      `;
    }

    return res.status(200).json({
      success: true,
      message: 'Database initialized. You can delete api/init.js now.'
    });
  } catch (error) {
    console.error('Init error:', error);
    return res.status(500).json({ error: error.message });
  }
}
