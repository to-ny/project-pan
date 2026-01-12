# ProjectPan — Reference Document

## Overview

**ProjectPan** is a French-language personal inventory app for beauty, skincare, and makeup products. Tracks usage, prevents duplicate purchases, and motivates mindful consumption through visual progress. Mobile-first React application.

---

## Product Data

**Required fields:** Product name, Brand, Category, Subcategory, Status (In Stock / In Use / Finished).

**Optional fields:** Size/volume with unit (ml, g, or units), Purchase date, Date first opened (auto-set when transitioning to In Use), Date finished (auto-set when transitioning to Finished).

**Finish-only fields (both optional):** Rating (1-5 stars), Review text. These can only be added when marking a product as Finished and edited afterward.

---

## Categories

Predefined starter categories (all deletable):

- **Soin visage:** Nettoyant, Tonique, Sérum, Crème hydratante, Contour des yeux, Masque, Protection solaire, Huile, Exfoliant
- **Maquillage:** Fond de teint, Correcteur, Poudre, Blush, Bronzer, Highlighter, Fard à paupières, Eyeliner, Mascara, Rouge à lèvres, Gloss, Spray fixateur
- **Cheveux:** Shampooing, Après-shampooing, Masque, Huile, Coiffant, Soin
- **Corps:** Gel douche, Lait corporel, Gommage, Huile, Déodorant, Crème mains
- **Parfum:** Parfum, Brume corporelle
- **Ongles:** Vernis, Soin, Dissolvant

Users can add, rename, and delete categories and subcategories. Deleting a category deletes all products within it (with confirmation warning). Each category has an auto-assigned color from the palette, customizable by the user.

---

## Product Lifecycle

Three states with forward-only transitions: **In Stock → In Use → Finished**

When moving to In Use: date first opened is automatically recorded.

When moving to Finished: user is prompted to add optional rating and review; date finished is automatically recorded.

---

## Usage Tracking

Users log usage for In Use products. Each tap increments the count. Multiple taps on the same day result in multiple counts.

**Tracked metrics per product:** Usage count this week, usage count this month, total usage count since opened.

**Visual representation:** A row of squares representing days of the current month. A day with one or more uses fills that day's square.

---

## Screens

### Home — Currently Using

All In Use products in a vertical list, sorted by most recently used. Each product has a subtle category indicator (colored dot or left border).

Each product row displays: product name, brand (smaller), category color indicator, usage count this week, usage count this month, current month visual squares (only), button to log usage.

Tapping a product opens its detail view. Floating "+" button to add new product.

Empty state: friendly message encouraging the user to start using a product from inventory.

### Inventory — My Stock

All In Stock products, sorted by most recently added. Each row shows product name, brand, category indicator, purchase date if available.

Quick action to move product to In Use. Tapping opens detail view. Floating "+" button available.

Empty state: friendly message about inventory being clear.

### Finished — Completed Products

All Finished products, organized by category, sorted by most recently finished within each category. Each row shows product name, brand, rating (stars), review snippet, usage summary (total uses over number of days).

Filterable by category and by minimum rating. Tapping opens full detail with complete review.

Empty state: friendly message encouraging the user to finish their first product.

### Categories — Management

Lists all categories with their assigned colors. Each category expands to show subcategories. Add, rename, delete categories and subcategories. Color picker for customization. Delete action requires confirmation and warns that products will be deleted.

### Add / Edit Product

Single-screen form with all applicable fields. Status selector determines initial state. For Finished products, rating and review fields are visible and editable.

Non-invasive delete option available (e.g., bottom of form, text link style, or within a secondary menu).

### Product Detail

**In Stock:** All base fields, purchase date, button to start using.

**In Use:** All base fields, date opened, weekly count, monthly count, current month visual squares, button to log usage, button to mark as finished. Additionally displays usage history: previous months' usage displayed as monthly summaries (total uses per month), scrollable or paginated.

**Finished:** All base fields, date opened, date finished, total uses, days active, rating, full review, plus full usage history by month.

Edit button available on all detail views.

---

## Navigation

Bottom navigation bar: Home, Inventory, Finished, Categories.

Floating action button for adding products on Home and Inventory screens.

Maximum two taps to any action.

---

## Design

### Aesthetic

Modern, soft, feminine without being childish. Clean and uncluttered.

### Colors

**Backgrounds:** Soft muted tones — warm white, light blush, pale sage.

**Text:** Rich readable darks — deep plum, charcoal, espresso.

**Accents and interactive elements:** Vibrant but harmonious — coral, dusty rose, teal, warm gold.

**Category palette:** 8-10 visually distinct hues (not lightness variations of the same color). Auto-assigned to categories.

### Typography

Rounded, friendly sans-serif (Nunito, Quicksand, or Poppins). Clear visual hierarchy: product names prominent, metadata secondary.

### Animations

Checkmark animation when logging usage. Confetti celebration when finishing a product. Smooth screen transitions.

---

## Technical Requirements

**Framework:** React (single page application).

**Platform:** Mobile-first responsive, deployed on Vercel.

**Language:** French only. All UI text, labels, messages, dates, and category names in French.

**Data Storage:** Browser localStorage or IndexedDB. All data local to device. Usage logs stored indefinitely for history.
