import { getDB, getCategories, addProduct, moveProductToInUse, moveProductToFinished } from './db';

export async function seedTestData() {
  const db = await getDB();
  const existingProducts = await db.getAll('products');

  // Only seed if no products exist
  if (existingProducts.length > 0) {
    return false;
  }

  const categories = await getCategories();
  const soinVisage = categories.find(c => c.name === 'Soin visage');
  const maquillage = categories.find(c => c.name === 'Maquillage');
  const cheveux = categories.find(c => c.name === 'Cheveux');

  if (!soinVisage || !maquillage || !cheveux) {
    console.error('Categories not found');
    return false;
  }

  // Product 1: In Stock
  await addProduct({
    name: 'Sérum Vitamine C',
    brand: 'La Roche-Posay',
    categoryId: soinVisage.id,
    subcategory: 'Sérum',
    status: 'in_stock',
    size: 30,
    sizeUnit: 'ml',
    purchaseDate: '2024-12-15',
  });

  // Product 2: In Use (with usage history)
  const inUseProductId = await addProduct({
    name: 'Crème Hydratante',
    brand: 'CeraVe',
    categoryId: soinVisage.id,
    subcategory: 'Crème hydratante',
    status: 'in_stock',
    size: 50,
    sizeUnit: 'ml',
    purchaseDate: '2024-11-01',
  });
  await moveProductToInUse(inUseProductId);

  // Add some usage logs for the in-use product
  const today = new Date();
  const usageDates = [
    new Date(today.getFullYear(), today.getMonth(), 1),
    new Date(today.getFullYear(), today.getMonth(), 3),
    new Date(today.getFullYear(), today.getMonth(), 5),
    new Date(today.getFullYear(), today.getMonth(), 7),
    new Date(today.getFullYear(), today.getMonth(), 8),
    new Date(today.getFullYear(), today.getMonth(), 10),
    new Date(today.getFullYear(), today.getMonth() - 1, 15),
    new Date(today.getFullYear(), today.getMonth() - 1, 20),
    new Date(today.getFullYear(), today.getMonth() - 1, 25),
  ];

  for (const date of usageDates) {
    if (date <= today) {
      await addUsageLogWithDate(inUseProductId, date);
    }
  }

  // Product 3: Finished (with rating and review)
  const finishedProductId = await addProduct({
    name: 'Mascara Volume',
    brand: 'Maybelline',
    categoryId: maquillage.id,
    subcategory: 'Mascara',
    status: 'in_stock',
    size: 10,
    sizeUnit: 'ml',
    purchaseDate: '2024-06-01',
  });
  await moveProductToInUse(finishedProductId);

  // Add usage logs for finished product
  const finishedUsageDates = [];
  for (let month = 6; month <= 10; month++) {
    for (let day = 1; day <= 25; day += 3) {
      finishedUsageDates.push(new Date(2024, month, day));
    }
  }

  for (const date of finishedUsageDates) {
    await addUsageLogWithDate(finishedProductId, date);
  }

  await moveProductToFinished(
    finishedProductId,
    4,
    'Excellent mascara, bonne tenue toute la journée. Le résultat est naturel et ne fait pas de paquets. Je le rachèterai !'
  );

  return true;
}

async function addUsageLogWithDate(productId, date) {
  const db = await getDB();
  await db.add('usageLogs', {
    productId,
    date: date.toISOString(),
  });
}
