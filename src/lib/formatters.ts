// ════════════════════════════════════════════════════════════
// Formatting Helpers — de-AT Locale
// ════════════════════════════════════════════════════════════

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR' }).format(value);

export const formatCurrencyShort = (value: number): string =>
  `\u20AC${value.toFixed(2).replace('.', ',')}`;

export const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return dateStr; }
};

export const formatDateLong = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString('de-AT', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return dateStr; }
};

export const formatNumber = (value: number, decimals = 2): string =>
  new Intl.NumberFormat('de-AT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);

export const formatMhd = (dateStr: string): { text: string; isExpiringSoon: boolean; isExpired: boolean } => {
  try {
    const mhd = new Date(dateStr);
    const now = new Date();
    const daysUntil = Math.floor((mhd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      text: formatDate(dateStr),
      isExpiringSoon: daysUntil <= 30 && daysUntil > 0,
      isExpired: daysUntil <= 0,
    };
  } catch {
    return { text: dateStr, isExpiringSoon: false, isExpired: false };
  }
};

export const formatPaletten = (
  menge: number,
  stueckProKarton: number,
  kartonsProPalette: number
): string => {
  if (!stueckProKarton || !kartonsProPalette) return `${menge} Stk`;
  const stueckProPalette = stueckProKarton * kartonsProPalette;
  const paletten = Math.floor(menge / stueckProPalette);
  const rest = menge % stueckProPalette;
  const restKartons = stueckProKarton > 0 ? Math.floor(rest / stueckProKarton) : 0;
  const parts: string[] = [];
  if (paletten > 0) parts.push(`${paletten} Pal`);
  if (restKartons > 0) parts.push(`${restKartons} Kt`);
  return parts.length > 0 ? parts.join(' + ') : `${menge} Stk`;
};

// ═══ NEW: Broker-specific formatters ═══

/** Format Restlaufzeit in human-readable form */
export const formatRestlaufzeit = (mhd: string): string => {
  try {
    const mhdDate = new Date(mhd);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    mhdDate.setHours(0, 0, 0, 0);
    const days = Math.floor((mhdDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (days <= 0) return 'ABGELAUFEN';
    if (days === 1) return '1 Tag';
    if (days < 30) return `${days} Tage`;
    const months = Math.floor(days / 30);
    if (months === 1) return '1 Monat';
    if (months < 12) return `${months} Monate`;
    const years = Math.floor(months / 12);
    const restMonths = months % 12;
    if (restMonths === 0) return `${years} Jahr${years > 1 ? 'e' : ''}`;
    return `${years}J ${restMonths}M`;
  } catch {
    return '—';
  }
};

/** Format percentage with de-AT locale */
export const formatPercent = (value: number): string =>
  `${value.toFixed(1).replace('.', ',')} %`;

/** Get Tailwind classes for MHD color display */
export const getMhdColorClass = (mhd: string): string => {
  try {
    const mhdDate = new Date(mhd);
    const now = new Date();
    const days = Math.floor((mhdDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'text-gray-500';
    if (days < 60) return 'text-red-600';
    if (days < 180) return 'text-yellow-600';
    return 'text-green-600';
  } catch {
    return 'text-gray-500';
  }
};
