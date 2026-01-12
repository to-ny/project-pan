-- Migration: Initial schema for ProjectPan
-- Creates tables for categories, products, usage_logs, and auth_attempts

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7),
  subcategories JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Products table
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
);

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at);

-- Usage logs table
CREATE TABLE IF NOT EXISTS usage_logs (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_product ON usage_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_date ON usage_logs(date);

-- Auth rate limiting table
CREATE TABLE IF NOT EXISTS auth_attempts (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  attempted_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_attempts_ip ON auth_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_time ON auth_attempts(attempted_at);

-- Seed default categories
INSERT INTO categories (name, color, subcategories, created_at)
SELECT * FROM (VALUES
  ('Soin visage', '#E57373', '["Nettoyant", "Tonique", "Sérum", "Crème hydratante", "Contour des yeux", "Masque", "Protection solaire", "Huile", "Exfoliant"]'::jsonb, NOW()),
  ('Maquillage', '#F06292', '["Fond de teint", "Correcteur", "Poudre", "Blush", "Bronzer", "Highlighter", "Fard à paupières", "Eyeliner", "Mascara", "Rouge à lèvres", "Gloss", "Spray fixateur"]'::jsonb, NOW()),
  ('Cheveux', '#BA68C8', '["Shampooing", "Après-shampooing", "Masque", "Huile", "Coiffant", "Soin"]'::jsonb, NOW()),
  ('Corps', '#64B5F6', '["Gel douche", "Lait corporel", "Gommage", "Huile", "Déodorant", "Crème mains"]'::jsonb, NOW()),
  ('Parfum', '#4DB6AC', '["Parfum", "Brume corporelle"]'::jsonb, NOW()),
  ('Ongles', '#81C784', '["Vernis", "Soin", "Dissolvant"]'::jsonb, NOW())
) AS v(name, color, subcategories, created_at)
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);
