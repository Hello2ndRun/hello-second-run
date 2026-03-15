// ════════════════════════════════════════════════════════════
// PDF Extractor — Gemini AI extraction from PDF/Image
// ════════════════════════════════════════════════════════════

import { ai } from './gemini';
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
 * Extract supplier offer data from a PDF or image using Gemini AI.
 * Accepts a base64-encoded file and its MIME type.
 */
export async function extractFromDocument(
  base64Data: string,
  mimeType: string,
  fileName: string,
): Promise<ExtractionResult> {
  const prompt = `Du bist ein Assistent für Sonderposten-Handel. Analysiere dieses Dokument und extrahiere alle Artikel-Informationen.

Das Dokument ist ein Lieferantenangebot (Sonderposten/Restposten). Extrahiere folgende Informationen:

1. LIEFERANT: Name des Lieferanten, Kontaktdaten
2. DATUM: Datum des Angebots
3. ARTIKEL: Für jeden Artikel extrahiere:
   - artikelname: Vollständiger Produktname
   - beschreibung: Kurze Beschreibung
   - ean: EAN/Barcode falls vorhanden (sonst leer)
   - mhd: Mindesthaltbarkeitsdatum im Format YYYY-MM-DD (falls vorhanden)
   - ekPreis: Einkaufspreis pro Stück/Einheit (Zahl)
   - menge: Verfügbare Menge (Zahl)
   - einheit: Einheit (Stück, kg, Karton, Palette)
   - stueckProKarton: Stück pro Karton (falls angegeben, sonst 0)
   - kartonsProPalette: Kartons pro Palette (falls angegeben, sonst 0)
   - gewicht: Gewicht in kg pro Stück (falls angegeben, sonst 0)
   - category: Eine der folgenden: food, beverages, dairy, frozen, non-food, household, other

Antworte NUR mit validem JSON. Keine Erklärungen.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object' as any,
          properties: {
            lieferant: { type: 'string' as any },
            lieferantKontakt: { type: 'string' as any },
            datum: { type: 'string' as any },
            articles: {
              type: 'array' as any,
              items: {
                type: 'object' as any,
                properties: {
                  artikelname: { type: 'string' as any },
                  beschreibung: { type: 'string' as any },
                  ean: { type: 'string' as any },
                  mhd: { type: 'string' as any },
                  ekPreis: { type: 'number' as any },
                  menge: { type: 'number' as any },
                  einheit: { type: 'string' as any },
                  stueckProKarton: { type: 'number' as any },
                  kartonsProPalette: { type: 'number' as any },
                  gewicht: { type: 'number' as any },
                  category: { type: 'string' as any },
                },
              },
            },
          },
        },
      },
    });

    const text = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Gemini sometimes wraps JSON in markdown code blocks
      const cleaned = text.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }
    return {
      lieferant: parsed.lieferant || '',
      lieferantKontakt: parsed.lieferantKontakt || '',
      datum: parsed.datum || '',
      articles: Array.isArray(parsed.articles) ? parsed.articles : [],
    };
  } catch (error) {
    console.error('Gemini extraction error:', error);
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
