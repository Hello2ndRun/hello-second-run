// ════════════════════════════════════════════════════════════
// MHD Calculator — MHD-based pricing tiers for Sonderposten
// ════════════════════════════════════════════════════════════

export type MhdStatus = 'green' | 'yellow' | 'red' | 'expired';

export interface MhdPriceResult {
  status: MhdStatus;
  daysRemaining: number;
  suggestedVkMin: number;
  suggestedVkMax: number;
  suggestedVkMid: number;
  discountMinPct: number;     // Min discount from UVP
  discountMaxPct: number;     // Max discount from UVP
  marginEur: number;          // Based on mid VK
  marginPct: number;          // Margin percentage
}

/** Get MHD status based on remaining days */
export function getMhdStatus(mhd: string): MhdStatus {
  const days = getDaysRemaining(mhd);
  if (days <= 0) return 'expired';
  if (days < 60) return 'red';
  if (days < 180) return 'yellow';
  return 'green';
}

/** Get days remaining until MHD */
export function getDaysRemaining(mhd: string): number {
  try {
    const mhdDate = new Date(mhd);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    mhdDate.setHours(0, 0, 0, 0);
    return Math.floor((mhdDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/** Get color hex for MHD status */
export function getMhdColor(status: MhdStatus): string {
  switch (status) {
    case 'green': return '#2E8B57';
    case 'yellow': return '#E8A317';
    case 'red': return '#DC3545';
    case 'expired': return '#6c757d';
  }
}

/** Get Tailwind CSS classes for MHD status */
export function getMhdColorClasses(status: MhdStatus): { bg: string; text: string; dot: string } {
  switch (status) {
    case 'green':
      return { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' };
    case 'yellow':
      return { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' };
    case 'red':
      return { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' };
    case 'expired':
      return { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' };
  }
}

/**
 * Calculate MHD-based VK price recommendation
 *
 * Tiers:
 * GREEN  (≥180 Tage): 40-50% vom UVP → höchster Abschlag, noch lang haltbar
 * YELLOW (60-179 Tage): 25-40% vom UVP → mittlerer Abschlag
 * RED    (<60 Tage): 15-25% vom UVP → niedrigster Preis, schnell verkaufen
 */
export function calculateMhdPrice(ek: number, uvp: number, mhd: string): MhdPriceResult {
  const status = getMhdStatus(mhd);
  const daysRemaining = getDaysRemaining(mhd);

  let minPct: number; // Min % of UVP
  let maxPct: number; // Max % of UVP

  switch (status) {
    case 'green':
      minPct = 0.40;
      maxPct = 0.50;
      break;
    case 'yellow':
      minPct = 0.25;
      maxPct = 0.40;
      break;
    case 'red':
    case 'expired':
      minPct = 0.15;
      maxPct = 0.25;
      break;
  }

  const suggestedVkMin = Math.round(uvp * minPct * 100) / 100;
  const suggestedVkMax = Math.round(uvp * maxPct * 100) / 100;
  const suggestedVkMid = Math.round(((suggestedVkMin + suggestedVkMax) / 2) * 100) / 100;

  // Ensure VK is at least EK (no loss)
  const effectiveVkMid = Math.max(suggestedVkMid, ek);
  const marginEur = Math.round((effectiveVkMid - ek) * 100) / 100;
  const marginPct = effectiveVkMid > 0 ? Math.round((marginEur / effectiveVkMid) * 10000) / 100 : 0;

  return {
    status,
    daysRemaining,
    suggestedVkMin: Math.max(suggestedVkMin, ek),
    suggestedVkMax,
    suggestedVkMid: effectiveVkMid,
    discountMinPct: uvp > 0 ? Math.round((1 - maxPct) * 100) : 0,
    discountMaxPct: uvp > 0 ? Math.round((1 - minPct) * 100) : 0,
    marginEur,
    marginPct,
  };
}
