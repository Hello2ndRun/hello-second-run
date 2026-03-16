// ════════════════════════════════════════════════════════════
// UVP Lookup — Auto-search retail prices via Claude API
// Uses Express backend proxy → Claude AI
// Results cached in localStorage (30 days)
// ════════════════════════════════════════════════════════════

const CACHE_KEY = 'hsr_uvp_cache';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const CACHE_MAX_ENTRIES = 500; // Prevent localStorage bloat

interface CacheEntry {
  uvp: number | null;
  quelle: string;
  timestamp: number;
}

interface UvpCache {
  [key: string]: CacheEntry;
}

function getCacheKey(produktname: string, marke: string, ean: string): string {
  if (ean) return ean;
  return `${marke}_${produktname}`.toLowerCase().replace(/\s+/g, '_');
}

function getCache(): UvpCache {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function setCache(key: string, entry: CacheEntry): void {
  const cache = getCache();
  cache[key] = entry;
  // Clean old entries + enforce size limit
  const now = Date.now();
  const entries = Object.entries(cache);
  for (const [k, v] of entries) {
    if (now - v.timestamp > CACHE_TTL) {
      delete cache[k];
    }
  }
  // If still over limit, remove oldest entries
  const remaining = Object.entries(cache);
  if (remaining.length > CACHE_MAX_ENTRIES) {
    remaining
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, remaining.length - CACHE_MAX_ENTRIES)
      .forEach(([k]) => delete cache[k]);
  }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full — clear cache and retry
    localStorage.removeItem(CACHE_KEY);
    localStorage.setItem(CACHE_KEY, JSON.stringify({ [key]: entry }));
  }
}

/**
 * Lookup UVP (retail price) via Claude API.
 * Checks localStorage cache first, then calls /api/lookup-uvp.
 */
export async function lookupUvp(
  produktname: string,
  marke: string,
  gewicht: string,
  ean: string,
): Promise<{ uvp: number | null; quelle: string }> {
  if (!produktname && !ean) {
    return { uvp: null, quelle: 'keine Daten' };
  }

  const key = getCacheKey(produktname, marke, ean);
  const cache = getCache();
  const cached = cache[key];

  // Return cached if fresh
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { uvp: cached.uvp, quelle: `${cached.quelle} (cached)` };
  }

  // Call Express backend → Claude API
  try {
    const response = await fetch('/api/lookup-uvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ produktname, marke, gewicht, ean }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    const entry: CacheEntry = {
      uvp: typeof result.uvp === 'number' ? result.uvp : null,
      quelle: result.quelle || 'unbekannt',
      timestamp: Date.now(),
    };

    // Cache result
    setCache(key, entry);

    return { uvp: entry.uvp, quelle: entry.quelle };
  } catch (error) {
    console.error('UVP lookup failed:', error);
    return { uvp: null, quelle: 'fehler' };
  }
}

/**
 * Batch lookup UVPs for multiple articles in parallel.
 * Returns a Map of index → { uvp, quelle }.
 */
export async function batchLookupUvp(
  articles: Array<{ produktname: string; marke: string; gewicht: string; ean: string }>,
): Promise<Map<number, { uvp: number | null; quelle: string }>> {
  const results = new Map<number, { uvp: number | null; quelle: string }>();

  const promises = articles.map(async (article, index) => {
    const result = await lookupUvp(
      article.produktname,
      article.marke,
      article.gewicht,
      article.ean,
    );
    results.set(index, result);
  });

  await Promise.allSettled(promises);
  return results;
}
