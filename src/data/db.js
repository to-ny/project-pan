// Client-side data layer using fetch to API routes
// Replaces IndexedDB with Vercel Postgres via API

const API_BASE = '/api';

// Helper for API calls
async function api(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include auth cookies
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
    if (response.status === 401) {
      // Redirect to auth on 401
      window.location.reload();
    }
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Category colors (kept for client-side use)
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

// No-op init functions for compatibility
export async function initDB() {
  return true;
}

export async function getDB() {
  return true;
}

// Category operations
export async function getCategories() {
  return api('/categories');
}

export async function getCategory(id) {
  return api(`/categories?id=${id}`);
}

export async function addCategory(category) {
  const result = await api('/categories', {
    method: 'POST',
    body: JSON.stringify(category),
  });
  return result.id;
}

export async function updateCategory(id, updates) {
  return api(`/categories?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteCategory(id) {
  return api(`/categories?id=${id}`, {
    method: 'DELETE',
  });
}

// Product operations
export async function getProducts() {
  return api('/products');
}

export async function getProduct(id) {
  return api(`/products?id=${id}`);
}

export async function getProductsByStatus(status) {
  return api(`/products?status=${status}`);
}

export async function getProductsByCategory(categoryId) {
  return api(`/products?categoryId=${categoryId}`);
}

export async function addProduct(product) {
  const result = await api('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
  return result.id;
}

export async function updateProduct(id, updates) {
  return api(`/products?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteProduct(id) {
  return api(`/products?id=${id}`, {
    method: 'DELETE',
  });
}

export async function moveProductToInUse(id) {
  return api(`/products/status?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'in_use' }),
  });
}

export async function moveProductToFinished(id, rating = null, review = null) {
  return api(`/products/status?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'finished', rating, review }),
  });
}

// Usage log operations
export async function getUsageLogs(productId) {
  const data = await api(`/products/usage?productId=${productId}`);
  return data.logs;
}

export async function addUsageLog(productId) {
  await api(`/products/usage?productId=${productId}`, {
    method: 'POST',
  });
  return true;
}

export async function getUsageStats(productId) {
  const data = await api(`/products/usage?productId=${productId}`);
  return data.stats;
}

export async function getMonthlyUsage(productId) {
  const data = await api(`/products/usage?productId=${productId}`);
  return data.monthlyData;
}

export async function getCurrentMonthDays(productId) {
  const data = await api(`/products/usage?productId=${productId}`);
  return data.currentMonthDays;
}

// Auth operations
export async function checkAuth() {
  try {
    const result = await fetch(`${API_BASE}/auth/check`, {
      credentials: 'include',
    });
    const data = await result.json();
    return data.authenticated;
  } catch {
    return false;
  }
}

export async function verifyPin(pin) {
  const response = await fetch(`${API_BASE}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erreur de vérification');
  }

  return data.success;
}
