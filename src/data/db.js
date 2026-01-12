import { openDB } from 'idb';

const DB_NAME = 'projectpan';
const DB_VERSION = 1;

const CATEGORY_COLORS = [
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

const DEFAULT_CATEGORIES = [
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

export async function initDB() {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Categories store
      if (!db.objectStoreNames.contains('categories')) {
        const categoryStore = db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
        categoryStore.createIndex('name', 'name');
      }

      // Products store
      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
        productStore.createIndex('categoryId', 'categoryId');
        productStore.createIndex('status', 'status');
        productStore.createIndex('createdAt', 'createdAt');
      }

      // Usage logs store
      if (!db.objectStoreNames.contains('usageLogs')) {
        const usageStore = db.createObjectStore('usageLogs', { keyPath: 'id', autoIncrement: true });
        usageStore.createIndex('productId', 'productId');
        usageStore.createIndex('date', 'date');
      }
    },
  });

  // Initialize default categories if empty
  const categoryCount = await db.count('categories');
  if (categoryCount === 0) {
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const cat = DEFAULT_CATEGORIES[i];
      await db.add('categories', {
        name: cat.name,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        subcategories: cat.subcategories,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return db;
}

let dbPromise = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = initDB();
  }
  return dbPromise;
}

// Category operations
export async function getCategories() {
  const db = await getDB();
  return db.getAll('categories');
}

export async function getCategory(id) {
  const db = await getDB();
  return db.get('categories', id);
}

export async function addCategory(category) {
  const db = await getDB();
  const categories = await getCategories();
  const color = CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length];
  return db.add('categories', {
    ...category,
    color: category.color || color,
    subcategories: category.subcategories || [],
    createdAt: new Date().toISOString(),
  });
}

export async function updateCategory(id, updates) {
  const db = await getDB();
  const category = await db.get('categories', id);
  if (!category) return null;
  const updated = { ...category, ...updates };
  await db.put('categories', updated);
  return updated;
}

export async function deleteCategory(id) {
  const db = await getDB();
  // Delete all products in this category
  const products = await db.getAllFromIndex('products', 'categoryId', id);
  for (const product of products) {
    await deleteProduct(product.id);
  }
  return db.delete('categories', id);
}

// Product operations
export async function getProducts() {
  const db = await getDB();
  return db.getAll('products');
}

export async function getProduct(id) {
  const db = await getDB();
  return db.get('products', id);
}

export async function getProductsByStatus(status) {
  const db = await getDB();
  return db.getAllFromIndex('products', 'status', status);
}

export async function getProductsByCategory(categoryId) {
  const db = await getDB();
  return db.getAllFromIndex('products', 'categoryId', categoryId);
}

export async function addProduct(product) {
  const db = await getDB();
  return db.add('products', {
    ...product,
    createdAt: new Date().toISOString(),
    lastUsed: null,
  });
}

export async function updateProduct(id, updates) {
  const db = await getDB();
  const product = await db.get('products', id);
  if (!product) return null;
  const updated = { ...product, ...updates };
  await db.put('products', updated);
  return updated;
}

export async function deleteProduct(id) {
  const db = await getDB();
  // Delete all usage logs for this product
  const logs = await db.getAllFromIndex('usageLogs', 'productId', id);
  for (const log of logs) {
    await db.delete('usageLogs', log.id);
  }
  return db.delete('products', id);
}

export async function moveProductToInUse(id) {
  return updateProduct(id, {
    status: 'in_use',
    dateOpened: new Date().toISOString(),
  });
}

export async function moveProductToFinished(id, rating = null, review = null) {
  return updateProduct(id, {
    status: 'finished',
    dateFinished: new Date().toISOString(),
    rating,
    review,
  });
}

// Usage log operations
export async function getUsageLogs(productId) {
  const db = await getDB();
  const id = Number(productId);
  const logs = await db.getAllFromIndex('usageLogs', 'productId', id);
  return logs.filter(log => log.productId === id);
}

export async function addUsageLog(productId) {
  const db = await getDB();
  const id = Number(productId);
  const now = new Date();
  await db.add('usageLogs', {
    productId: id,
    date: now.toISOString(),
  });
  // Update product's lastUsed
  await updateProduct(id, { lastUsed: now.toISOString() });
  return true;
}

export async function getUsageStats(productId) {
  const logs = await getUsageLogs(productId);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let weekCount = 0;
  let monthCount = 0;
  const totalCount = logs.length;

  for (const log of logs) {
    const logDate = new Date(log.date);
    if (logDate >= startOfWeek) weekCount++;
    if (logDate >= startOfMonth) monthCount++;
  }

  return { weekCount, monthCount, totalCount };
}

export async function getMonthlyUsage(productId) {
  const logs = await getUsageLogs(productId);
  const monthlyData = {};

  for (const log of logs) {
    const date = new Date(log.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[key]) {
      monthlyData[key] = { count: 0, days: new Set() };
    }
    monthlyData[key].count++;
    monthlyData[key].days.add(date.getDate());
  }

  // Convert Sets to arrays
  for (const key of Object.keys(monthlyData)) {
    monthlyData[key].days = Array.from(monthlyData[key].days);
  }

  return monthlyData;
}

export async function getCurrentMonthDays(productId) {
  const logs = await getUsageLogs(productId);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const daysUsed = new Set();

  for (const log of logs) {
    const date = new Date(log.date);
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      daysUsed.add(date.getDate());
    }
  }

  return Array.from(daysUsed);
}

export { CATEGORY_COLORS };
