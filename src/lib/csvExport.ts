// ════════════════════════════════════════════════════════════
// CSV Export — Deals & Partner
// ════════════════════════════════════════════════════════════

import type { Deal, Partner, DealArticle } from '../types';
import { DEAL_STATUS_LABELS } from '../types';

// ═══ Generic CSV builder ═══

function escapeCsv(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(headers: string[], rows: string[][]): string {
  const bom = '\uFEFF'; // Excel UTF-8 BOM
  const headerLine = headers.map(escapeCsv).join(';');
  const dataLines = rows.map(row => row.map(escapeCsv).join(';'));
  return bom + [headerLine, ...dataLines].join('\r\n');
}

function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ═══ Deals Export ═══

export function exportDealsAsCsv(
  deals: Deal[],
  getPartnerName: (id: string) => string
): void {
  const headers = [
    'Deal-ID', 'Status', 'Verkäufer', 'Käufer',
    'Netto (€)', 'MwSt (€)', 'Brutto (€)',
    'Provision (%)', 'Provision (€)',
    'Zahlungsbedingung', 'Lieferbedingung',
    'Angebot-Nr', 'Rechnung-Nr',
    'Erstellt am',
  ];

  const rows = deals.map(d => [
    d.id,
    DEAL_STATUS_LABELS[d.status] || d.status,
    getPartnerName(d.verkaeuferId),
    getPartnerName(d.kaeuferId),
    d.subtotalNetto.toFixed(2).replace('.', ','),
    d.mwstAmount.toFixed(2).replace('.', ','),
    d.totalBrutto.toFixed(2).replace('.', ','),
    (d.provisionRate * 100).toFixed(1).replace('.', ','),
    d.provisionAmount.toFixed(2).replace('.', ','),
    d.zahlungsbedingung,
    d.lieferbedingung,
    d.angebotNr || '',
    d.rechnungNr || '',
    new Date(d.createdAt).toLocaleDateString('de-AT'),
  ]);

  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(buildCsv(headers, rows), `deals_export_${date}.csv`);
}

// ═══ Deals + Artikel Detail Export ═══

export function exportDealsDetailAsCsv(
  deals: Deal[],
  articles: DealArticle[],
  getPartnerName: (id: string) => string
): void {
  const headers = [
    'Deal-ID', 'Status', 'Verkäufer', 'Käufer',
    'Artikel', 'Marke', 'EAN', 'MHD',
    'Menge (Kartons)', 'Menge (Paletten)',
    'EK-Preis (€)', 'VK-Preis (€)', 'UVP (€)',
    'Deal Netto (€)', 'Provision (€)',
  ];

  const rows: string[][] = [];
  for (const d of deals) {
    const dealArticles = articles.filter(a => a.dealId === d.id);
    if (dealArticles.length === 0) {
      rows.push([
        d.id, DEAL_STATUS_LABELS[d.status], getPartnerName(d.verkaeuferId), getPartnerName(d.kaeuferId),
        '', '', '', '', '', '', '', '', '',
        d.subtotalNetto.toFixed(2).replace('.', ','),
        d.provisionAmount.toFixed(2).replace('.', ','),
      ]);
    } else {
      for (const art of dealArticles) {
        rows.push([
          d.id, DEAL_STATUS_LABELS[d.status], getPartnerName(d.verkaeuferId), getPartnerName(d.kaeuferId),
          art.artikelname, art.marke, art.ean, art.mhd ? new Date(art.mhd).toLocaleDateString('de-AT') : '',
          String(art.mengeKartons), String(art.mengePaletten),
          art.ekPreis.toFixed(2).replace('.', ','),
          art.vkPreis.toFixed(2).replace('.', ','),
          art.uvp.toFixed(2).replace('.', ','),
          d.subtotalNetto.toFixed(2).replace('.', ','),
          d.provisionAmount.toFixed(2).replace('.', ','),
        ]);
      }
    }
  }

  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(buildCsv(headers, rows), `deals_detail_export_${date}.csv`);
}

// ═══ Partners Export ═══

export function exportPartnersAsCsv(partners: Partner[]): void {
  const ROLE_MAP: Record<string, string> = {
    verkaeufer: 'Verkäufer',
    kaeufer: 'Käufer',
    beides: 'Beides',
  };

  const headers = [
    'Firmenname', 'Rolle', 'Kontaktperson', 'E-Mail', 'Telefon',
    'Adresse', 'PLZ', 'Ort', 'Land',
    'UID-Nummer', 'Steuernummer',
    'IBAN', 'BIC', 'Bank',
    'Kategorien', 'Sprache',
    'Erstellt am',
  ];

  const rows = partners.map(p => [
    p.firmenname,
    ROLE_MAP[p.rolle] || p.rolle,
    p.kontaktperson,
    p.email,
    p.telefon,
    p.adresse,
    p.plz,
    p.ort,
    p.land,
    p.uidNummer,
    p.steuernummer || '',
    p.iban || '',
    p.bic || '',
    p.bankName || '',
    p.kategorien.join(', '),
    p.sprache === 'de' ? 'Deutsch' : p.sprache === 'en' ? 'English' : 'BHS',
    new Date(p.createdAt).toLocaleDateString('de-AT'),
  ]);

  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(buildCsv(headers, rows), `partner_export_${date}.csv`);
}
