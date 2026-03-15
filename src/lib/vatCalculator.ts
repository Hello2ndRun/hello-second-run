// ════════════════════════════════════════════════════════════
// VAT Calculator — Austrian MwSt rules (with Ausfuhr)
// ════════════════════════════════════════════════════════════

import type { MwstType } from '../types';

export const VAT_RATES: Record<MwstType, number> = {
  standard: 0.20,
  reduced: 0.10,
  innergemeinschaftlich: 0,
  ausfuhr: 0,
};

export const VAT_LABELS: Record<MwstType, string> = {
  standard: '20% MwSt.',
  reduced: '10% MwSt.',
  innergemeinschaftlich: 'Innergemeinsch. Lieferung (steuerfrei)',
  ausfuhr: 'Ausfuhrlieferung (steuerfrei)',
};

const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
];

export function isEuCountry(countryCode: string): boolean {
  return EU_COUNTRIES.includes(countryCode.toUpperCase());
}

/** Determine VAT type based on customer/buyer location */
export function determineVatType(
  customerCountry: string,
  customerUid: string,
  _articleCategory?: string,
): MwstType {
  const country = customerCountry.toUpperCase();

  // Same country (AT → AT): standard rate
  if (country === 'AT') {
    return 'standard';
  }

  // EU country with valid UID → intra-community (0%)
  if (isEuCountry(country) && customerUid) {
    return 'innergemeinschaftlich';
  }

  // Non-EU → export delivery (0%)
  if (!isEuCountry(country)) {
    return 'ausfuhr';
  }

  // EU without UID: standard rate
  return 'standard';
}

/** Calculate VAT amounts */
export function calculateVat(subtotal: number, vatType: MwstType): {
  rate: number;
  amount: number;
  total: number;
  label: string;
} {
  const rate = VAT_RATES[vatType];
  const amount = Math.round(subtotal * rate * 100) / 100;
  return {
    rate,
    amount,
    total: Math.round((subtotal + amount) * 100) / 100,
    label: VAT_LABELS[vatType],
  };
}
