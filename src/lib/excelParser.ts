// ════════════════════════════════════════════════════════════
// Excel Parser — Client-side Excel parsing using SheetJS
// ════════════════════════════════════════════════════════════

import * as XLSX from 'xlsx';
import type { ExtractedArticle } from './pdfExtractor';

interface RawRow {
  [key: string]: any;
}

/**
 * Parse an Excel file and attempt to extract article data.
 * Returns extracted articles with best-effort field mapping.
 */
export async function parseExcelFile(file: File): Promise<{
  lieferant: string;
  articles: ExtractedArticle[];
  rawHeaders: string[];
  rawData: RawRow[];
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData: RawRow[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const rawHeaders = rawData.length > 0 ? Object.keys(rawData[0]) : [];

  // Attempt smart field mapping
  const articles: ExtractedArticle[] = rawData.map(row => ({
    artikelname: findValue(row, ['artikelname', 'artikel', 'name', 'produktname', 'bezeichnung', 'product', 'item']),
    beschreibung: findValue(row, ['beschreibung', 'description', 'desc', 'bezeichnung detail']),
    ean: findValue(row, ['ean', 'barcode', 'gtin', 'ean13', 'ean-code']),
    mhd: formatDateValue(findValue(row, ['mhd', 'mindesthaltbarkeit', 'best before', 'bbdate', 'ablaufdatum', 'expiry'])),
    ekPreis: parseNum(findValue(row, ['ek', 'ekpreis', 'einkaufspreis', 'preis', 'price', 'unit price', 'stückpreis'])),
    menge: parseNum(findValue(row, ['menge', 'quantity', 'qty', 'anzahl', 'stück', 'bestand'])),
    einheit: findValue(row, ['einheit', 'unit', 've', 'verpackungseinheit']) || 'Stück',
    stueckProKarton: parseNum(findValue(row, ['stk/kt', 'stk/karton', 'stückprokarton', 'per carton', 'kartoninhalt'])),
    kartonsProPalette: parseNum(findValue(row, ['kt/pal', 'kartons/palette', 'kartonspropalette', 'per pallet'])),
    gewicht: parseNum(findValue(row, ['gewicht', 'weight', 'kg', 'netto'])),
    category: guessCategory(findValue(row, ['kategorie', 'category', 'warengruppe', 'group'])),
  })).filter(a => a.artikelname); // Only keep rows with a name

  // Try to extract supplier name from filename
  const lieferant = file.name.replace(/\.(xlsx?|csv)$/i, '').replace(/[_-]/g, ' ');

  return { lieferant, articles, rawHeaders, rawData };
}

/** Find a value in a row by trying multiple possible header names */
function findValue(row: RawRow, possibleKeys: string[]): string {
  for (const key of possibleKeys) {
    // Exact match (case-insensitive)
    const found = Object.keys(row).find(k => k.toLowerCase().trim() === key.toLowerCase());
    if (found && row[found] !== '' && row[found] != null) return String(row[found]);
  }
  // Partial match
  for (const key of possibleKeys) {
    const found = Object.keys(row).find(k => k.toLowerCase().includes(key.toLowerCase()));
    if (found && row[found] !== '' && row[found] != null) return String(row[found]);
  }
  return '';
}

/** Parse a number from a string (handles comma as decimal separator) */
function parseNum(val: string): number {
  if (!val) return 0;
  const clean = val.replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}

/** Try to format a date value to YYYY-MM-DD */
function formatDateValue(val: string): string {
  if (!val) return '';
  try {
    // If it's already a date string
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch { /* ignore */ }
  // Try DD.MM.YYYY format (common in German)
  const parts = val.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
  if (parts) {
    const year = parts[3].length === 2 ? `20${parts[3]}` : parts[3];
    return `${year}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  }
  return val;
}

/** Guess article category from a string */
function guessCategory(val: string): string {
  const lower = val.toLowerCase();
  if (['getränk', 'drink', 'beverage', 'saft', 'wasser', 'bier', 'wein'].some(k => lower.includes(k))) return 'beverages';
  if (['milch', 'käse', 'joghurt', 'butter', 'dairy', 'sahne'].some(k => lower.includes(k))) return 'dairy';
  if (['tiefkühl', 'frozen', 'tk', 'eis'].some(k => lower.includes(k))) return 'frozen';
  if (['non-food', 'nonfood', 'reinig', 'putzmittel', 'waschmittel'].some(k => lower.includes(k))) return 'non-food';
  if (['haushalt', 'household', 'küche'].some(k => lower.includes(k))) return 'household';
  if (['lebensmittel', 'food', 'nahrungs', 'konserv', 'nudel', 'reis', 'suppe'].some(k => lower.includes(k))) return 'food';
  return 'other';
}
