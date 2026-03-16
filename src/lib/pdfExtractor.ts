// ════════════════════════════════════════════════════════════
// PDF Extractor — Claude AI extraction via Express backend
// Sends documents to /api/extract-document → Claude Vision
// ════════════════════════════════════════════════════════════

export interface ExtractedArticle {
  artikelname: string;
  beschreibung: string;
  ean: string;
  mhd: string;
  ekPreis: number;
  menge: number;
  einheit: string;
  stueckProKarton: number;
  kartonsProPalette: number;
  gewicht: number;
  category: string;
}

export interface ExtractionResult {
  lieferant: string;
  lieferantKontakt: string;
  datum: string;
  articles: ExtractedArticle[];
}

/**
 * Extract supplier offer data from a PDF or image using Claude AI.
 * Sends base64 data to Express backend which proxies to Anthropic API.
 */
export async function extractFromDocument(
  base64Data: string,
  mimeType: string,
  _fileName: string,
): Promise<ExtractionResult> {
  try {
    const response = await fetch('/api/extract-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data, mimeType }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return {
      lieferant: result.lieferant || '',
      lieferantKontakt: result.lieferantKontakt || '',
      datum: result.datum || '',
      articles: Array.isArray(result.articles) ? result.articles : [],
    };
  } catch (error) {
    console.error('Document extraction error:', error);
    throw new Error('Fehler bei der KI-Extraktion. Bitte versuche es erneut.');
  }
}

/**
 * Read a File as base64 data URL.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (data:...;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
