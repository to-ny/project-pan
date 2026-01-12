import { pgTable, serial, varchar, text, integer, decimal, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

// Categories table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 7 }),
  subcategories: jsonb('subcategories').default([]),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('idx_categories_name').on(table.name),
]);

// Products table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  brand: varchar('brand', { length: 255 }),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'cascade' }),
  subcategory: varchar('subcategory', { length: 255 }),
  status: varchar('status', { length: 20 }).default('in_stock').notNull(),
  size: decimal('size'),
  sizeUnit: varchar('size_unit', { length: 20 }),
  purchaseDate: timestamp('purchase_date'),
  dateOpened: timestamp('date_opened'),
  dateFinished: timestamp('date_finished'),
  rating: integer('rating'),
  review: text('review'),
  createdAt: timestamp('created_at').defaultNow(),
  lastUsed: timestamp('last_used'),
}, (table) => [
  index('idx_products_status').on(table.status),
  index('idx_products_category').on(table.categoryId),
  index('idx_products_created').on(table.createdAt),
]);

// Usage logs table
export const usageLogs = pgTable('usage_logs', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp('date').defaultNow().notNull(),
}, (table) => [
  index('idx_usage_logs_product').on(table.productId),
  index('idx_usage_logs_date').on(table.date),
]);

// Auth rate limiting table
export const authAttempts = pgTable('auth_attempts', {
  id: serial('id').primaryKey(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  attemptedAt: timestamp('attempted_at').defaultNow().notNull(),
}, (table) => [
  index('idx_auth_attempts_ip').on(table.ipAddress),
  index('idx_auth_attempts_time').on(table.attemptedAt),
]);

// Default category colors
export const CATEGORY_COLORS = [
  '#E57373', // Rouge doux
  '#F06292', // Rose
  '#BA68C8', // Violet
  '#64B5F6', // Bleu
  '#4DB6AC', // Sarcelle
  '#81C784', // Vert
  '#FFD54F', // Jaune
  '#FFB74D', // Orange
  '#A1887F', // Marron
  '#90A4AE', // Gris-bleu
];

// Default categories to seed
export const DEFAULT_CATEGORIES = [
  {
    name: 'Soin visage',
    subcategories: ['Nettoyant', 'Tonique', 'Sérum', 'Crème hydratante', 'Contour des yeux', 'Masque', 'Protection solaire', 'Huile', 'Exfoliant'],
  },
  {
    name: 'Maquillage',
    subcategories: ['Fond de teint', 'Correcteur', 'Poudre', 'Blush', 'Bronzer', 'Highlighter', 'Fard à paupières', 'Eyeliner', 'Mascara', 'Rouge à lèvres', 'Gloss', 'Spray fixateur'],
  },
  {
    name: 'Cheveux',
    subcategories: ['Shampooing', 'Après-shampooing', 'Masque', 'Huile', 'Coiffant', 'Soin'],
  },
  {
    name: 'Corps',
    subcategories: ['Gel douche', 'Lait corporel', 'Gommage', 'Huile', 'Déodorant', 'Crème mains'],
  },
  {
    name: 'Parfum',
    subcategories: ['Parfum', 'Brume corporelle'],
  },
  {
    name: 'Ongles',
    subcategories: ['Vernis', 'Soin', 'Dissolvant'],
  },
];
