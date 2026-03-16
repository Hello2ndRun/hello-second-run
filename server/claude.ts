// ════════════════════════════════════════════════════════════
// Claude AI Client — Anthropic SDK for document extraction & UVP lookup
// ════════════════════════════════════════════════════════════

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config();

export const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// ─── Types ───

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

export interface UvpResult {
  uvp: number | null;
  quelle: string;
}

// ─── Document Extraction ───

export async function extractDocument(
  base64Data: string,
  mimeType: string,
): Promise<ExtractionResult> {
  const mediaType = mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' | 'application/pdf';

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

Antworte NUR mit validem JSON im folgenden Format:
{
  "lieferant": "string",
  "lieferantKontakt": "string",
  "datum": "string",
  "articles": [...]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Data,
            },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Claude sometimes wraps JSON in markdown code blocks
    const cleaned = text.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleaned);
  }

  return {
    lieferant: parsed.lieferant || '',
    lieferantKontakt: parsed.lieferantKontakt || '',
    datum: parsed.datum || '',
    articles: Array.isArray(parsed.articles) ? parsed.articles : [],
  };
}

// ─── UVP Lookup ───

export async function lookupUvp(
  produktname: string,
  marke: string,
  gewicht: string,
  ean: string,
): Promise<UvpResult> {
  const prompt = `Du bist ein Preisrecherche-Assistent für den österreichischen und deutschen Lebensmittelhandel.

Finde den aktuellen UVP (Unverbindliche Preisempfehlung) bzw. den üblichen Verkaufspreis für dieses Produkt:

- Produkt: ${produktname}
- Marke: ${marke}
- Gewicht/Menge: ${gewicht}
- EAN: ${ean}

Suche den typischen Supermarktpreis in Österreich oder Deutschland (Billa, Spar, REWE, Edeka, Amazon.de).

WICHTIG: Antworte NUR mit validem JSON in diesem Format:
{
  "uvp": 2.49,
  "quelle": "Billa.at"
}

Wenn du den Preis nicht sicher findest, antworte mit:
{
  "uvp": null,
  "quelle": "nicht gefunden"
}

Antworte NUR mit dem JSON, keine Erklärungen.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return {
      uvp: typeof parsed.uvp === 'number' ? parsed.uvp : null,
      quelle: parsed.quelle || 'unbekannt',
    };
  } catch (error) {
    console.error('UVP lookup error:', error);
    return { uvp: null, quelle: 'fehler' };
  }
}
