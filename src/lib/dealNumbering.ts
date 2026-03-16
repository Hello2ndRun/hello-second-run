// ════════════════════════════════════════════════════════════
// Deal Numbering — Linked document number system
// ════════════════════════════════════════════════════════════
//
// Deal: HSR-2026-00142
//   → ANG-2026-00142  (Angebot)
//   → BE-2026-00142   (Bestellbestätigung)
//   → AB-2026-00142   (Auftragsbestätigung)
//   → RE-2026-00142   (Rechnung)
//   → PROV-2026-00142 (Provisionsrechnung)

import type { DocumentType } from '../types';

let _counter = 142; // Start with a realistic number

const DOC_PREFIXES: Record<DocumentType, string> = {
  angebot: 'ANG',
  bestellbestaetigung: 'BE',
  auftragsbestaetigung: 'AB',
  lieferschein: 'LS',
  rechnung: 'RE',
  provisionsrechnung: 'PROV',
};

/** Generate a new Deal ID with format HSR-YYYY-NNNNN */
export function generateDealId(): string {
  _counter++;
  const year = new Date().getFullYear();
  const num = String(_counter).padStart(5, '0');
  return `HSR-${year}-${num}`;
}

/** Convert a Deal ID to a Document Number with the correct prefix */
export function dealIdToDocNr(dealId: string, docType: DocumentType): string {
  // HSR-2026-00142 → extract suffix "2026-00142"
  const suffix = dealId.replace('HSR-', '');
  const prefix = DOC_PREFIXES[docType];
  return `${prefix}-${suffix}`;
}

/** Extract the sequence number from a Deal ID */
export function getDealSequence(dealId: string): number {
  const parts = dealId.split('-');
  return parseInt(parts[2] || '0', 10);
}

/** Format Deal ID for display (monospace-style) */
export function formatDealId(dealId: string): string {
  return dealId; // Already formatted: HSR-2026-00142
}
