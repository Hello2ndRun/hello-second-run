import type { Partner } from '../types';

interface CsvPartnerRow {
  firmenname: string;
  kontaktperson: string;
  email: string;
  telefon?: string;
  adresse?: string;
  plz?: string;
  ort?: string;
  land?: string;
  rolle?: string;
  uidNummer?: string;
  sprache?: string;
}

/**
 * Parse a CSV file into Partner objects (without id).
 * Supports both comma and semicolon delimiters.
 * Expects a header row.
 */
export function parsePartnersCsv(csvText: string): { partners: Omit<Partner, 'id'>[]; errors: string[] } {
  const errors: string[] = [];
  const lines = csvText.trim().split('\n').map(l => l.trim()).filter(Boolean);

  if (lines.length < 2) {
    return { partners: [], errors: ['CSV muss mindestens eine Kopfzeile und eine Datenzeile enthalten.'] };
  }

  // Detect delimiter
  const delimiter = lines[0].includes(';') ? ';' : ',';

  // Parse header
  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/["\u00ef\u00bb\u00bf]/g, ''));

  // Required fields
  const firmennameIdx = headers.findIndex(h => h === 'firmenname' || h === 'firma' || h === 'company');
  const kontaktIdx = headers.findIndex(h => h === 'kontaktperson' || h === 'kontakt' || h === 'contact' || h === 'ansprechpartner');
  const emailIdx = headers.findIndex(h => h === 'email' || h === 'e-mail' || h === 'mail');

  if (firmennameIdx < 0) {
    errors.push('Spalte "Firmenname" nicht gefunden. Erwartete Überschrift: Firmenname, Firma oder Company.');
    return { partners: [], errors };
  }
  if (emailIdx < 0) {
    errors.push('Spalte "Email" nicht gefunden. Erwartete Überschrift: Email, E-Mail oder Mail.');
    return { partners: [], errors };
  }

  // Optional fields
  const telefonIdx = headers.findIndex(h => h === 'telefon' || h === 'phone' || h === 'tel');
  const adresseIdx = headers.findIndex(h => h === 'adresse' || h === 'address' || h === 'straße' || h === 'strasse');
  const plzIdx = headers.findIndex(h => h === 'plz' || h === 'zip' || h === 'postleitzahl');
  const ortIdx = headers.findIndex(h => h === 'ort' || h === 'city' || h === 'stadt');
  const landIdx = headers.findIndex(h => h === 'land' || h === 'country' || h === 'ländercode');
  const rolleIdx = headers.findIndex(h => h === 'rolle' || h === 'role' || h === 'typ');
  const uidIdx = headers.findIndex(h => h === 'uid' || h === 'uidnummer' || h === 'uid-nummer' || h === 'vat');
  const spracheIdx = headers.findIndex(h => h === 'sprache' || h === 'language' || h === 'lang');

  const partners: Omit<Partner, 'id'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i], delimiter);

    const firmenname = cols[firmennameIdx]?.trim();
    const email = cols[emailIdx]?.trim();

    if (!firmenname) {
      errors.push(`Zeile ${i + 1}: Firmenname fehlt — übersprungen.`);
      continue;
    }
    if (!email) {
      errors.push(`Zeile ${i + 1}: E-Mail fehlt für "${firmenname}" — übersprungen.`);
      continue;
    }

    const rolleRaw = rolleIdx >= 0 ? cols[rolleIdx]?.trim().toLowerCase() : '';
    let rolle: Partner['rolle'] = 'kaeufer';
    if (rolleRaw === 'verkaeufer' || rolleRaw === 'verkäufer' || rolleRaw === 'seller' || rolleRaw === 'vk') {
      rolle = 'verkaeufer';
    } else if (rolleRaw === 'beides' || rolleRaw === 'both' || rolleRaw === 'vk+kf') {
      rolle = 'beides';
    }

    const spracheRaw = spracheIdx >= 0 ? cols[spracheIdx]?.trim().toLowerCase() : '';
    let sprache: Partner['sprache'] = 'de';
    if (spracheRaw === 'en' || spracheRaw === 'english' || spracheRaw === 'englisch') sprache = 'en';
    if (spracheRaw === 'bhs') sprache = 'bhs';

    partners.push({
      firmenname,
      kontaktperson: kontaktIdx >= 0 ? cols[kontaktIdx]?.trim() || firmenname : firmenname,
      email,
      telefon: telefonIdx >= 0 ? cols[telefonIdx]?.trim() || '' : '',
      adresse: adresseIdx >= 0 ? cols[adresseIdx]?.trim() || '' : '',
      plz: plzIdx >= 0 ? cols[plzIdx]?.trim() || '' : '',
      ort: ortIdx >= 0 ? cols[ortIdx]?.trim() || '' : '',
      land: landIdx >= 0 ? cols[landIdx]?.trim() || 'AT' : 'AT',
      rolle,
      uidNummer: uidIdx >= 0 ? cols[uidIdx]?.trim() || '' : '',
      sprache,
      kategorien: [],
      notizen: '',
      createdAt: new Date().toISOString(),
    });
  }

  return { partners, errors };
}

/** Parse a single CSV line, handling quoted fields */
function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}
