#!/usr/bin/env node

/**
 * Seed default categories if the categories table is empty.
 * Runs automatically during build after drizzle-kit push.
 */

import { sql } from '@vercel/postgres';

const DEFAULT_CATEGORIES = [
  { name: 'Soin visage', color: '#E57373', subcategories: ['Nettoyant', 'Tonique', 'Sérum', 'Crème hydratante', 'Contour des yeux', 'Masque', 'Protection solaire', 'Huile', 'Exfoliant'] },
  { name: 'Maquillage', color: '#F06292', subcategories: ['Fond de teint', 'Correcteur', 'Poudre', 'Blush', 'Bronzer', 'Highlighter', 'Fard à paupières', 'Eyeliner', 'Mascara', 'Rouge à lèvres', 'Gloss', 'Spray fixateur'] },
  { name: 'Cheveux', color: '#BA68C8', subcategories: ['Shampooing', 'Après-shampooing', 'Masque', 'Huile', 'Coiffant', 'Soin'] },
  { name: 'Corps', color: '#64B5F6', subcategories: ['Gel douche', 'Lait corporel', 'Gommage', 'Huile', 'Déodorant', 'Crème mains'] },
  { name: 'Parfum', color: '#4DB6AC', subcategories: ['Parfum', 'Brume corporelle'] },
  { name: 'Ongles', color: '#81C784', subcategories: ['Vernis', 'Soin', 'Dissolvant'] },
];

async function seed() {
  try {
    // Check if categories exist
    const { rows } = await sql`SELECT COUNT(*) as count FROM categories`;

    if (parseInt(rows[0].count) === 0) {
      console.log('Seeding default categories...');

      for (const cat of DEFAULT_CATEGORIES) {
        await sql`
          INSERT INTO categories (name, color, subcategories)
          VALUES (${cat.name}, ${cat.color}, ${JSON.stringify(cat.subcategories)})
        `;
      }

      console.log('Default categories seeded.');
    } else {
      console.log('Categories already exist, skipping seed.');
    }
  } catch (error) {
    // Table might not exist on first run, that's ok
    if (error.message.includes('does not exist')) {
      console.log('Categories table not ready, skipping seed.');
    } else {
      console.error('Seed error:', error.message);
      // Don't fail the build for seed errors
    }
  }
}

seed();
