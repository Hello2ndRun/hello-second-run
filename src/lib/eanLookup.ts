// ════════════════════════════════════════════════════════════
// EAN Lookup — Open Food Facts API Client
// ════════════════════════════════════════════════════════════

import type { EanProduct, ArticleCategory } from '../types';

// In-memory cache for session
const eanCache = new Map<string, EanProduct | null>();

/** Map Open Food Facts categories to our ArticleCategory */
function mapCategory(categories: string[] = []): ArticleCategory {
  const joined = categories.join(' ').toLowerCase();
  if (joined.includes('beverage') || joined.includes('drink') || joined.includes('getränk')) return 'beverages';
  if (joined.includes('dairy') || joined.includes('milch') || joined.includes('cheese') || joined.includes('käse')) return 'dairy';
  if (joined.includes('frozen') || joined.includes('tiefkühl') || joined.includes('glacé')) return 'frozen';
  if (joined.includes('food') || joined.includes('snack') || joined.includes('pasta') || joined.includes('sauce') || joined.includes('chocolate') || joined.includes('süß')) return 'food';
  if (joined.includes('household') || joined.includes('haushalt') || joined.includes('cleaning')) return 'household';
  if (joined.includes('non-food') || joined.includes('pflege') || joined.includes('hygiene')) return 'non-food';
  return 'food'; // Default for food products DB
}

/** Look up a product by EAN using Open Food Facts API */
export async function lookupEan(ean: string): Promise<EanProduct | null> {
  // Normalize EAN (remove spaces/dashes)
  const cleanEan = ean.replace(/[\s-]/g, '');

  // Check cache first
  if (eanCache.has(cleanEan)) {
    const cached = eanCache.get(cleanEan);
    return cached ? { ...cached, quelle: 'cache' } : null;
  }

  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${cleanEan}.json`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) {
      eanCache.set(cleanEan, null);
      return null;
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      eanCache.set(cleanEan, null);
      return null;
    }

    const p = data.product;
    const product: EanProduct = {
      ean: cleanEan,
      produktname: p.product_name || p.product_name_de || p.product_name_en || 'Unbekanntes Produkt',
      marke: p.brands || '',
      gewicht: p.quantity || p.net_weight || '',
      kategorie: mapCategory(p.categories_tags || []),
      imageUrl: p.image_front_url || p.image_front_small_url || '',
      quelle: 'openfoodfacts',
    };

    eanCache.set(cleanEan, product);
    return product;
  } catch (error) {
    console.warn('EAN lookup failed:', error);
    eanCache.set(cleanEan, null);
    return null;
  }
}

/** Clear the EAN cache */
export function clearEanCache(): void {
  eanCache.clear();
}

/** Add a manual product to cache */
export function cacheManualProduct(product: EanProduct): void {
  eanCache.set(product.ean, { ...product, quelle: 'manual' });
}
