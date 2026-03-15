// ════════════════════════════════════════════════════════════
// Price Calculator — Broker commission & deal totals
// ════════════════════════════════════════════════════════════

import type { DealArticle } from '../types';

export interface CommissionResult {
  dealSubtotal: number;       // Netto Dealwert
  provisionRate: number;      // z.B. 0.06
  provisionNetto: number;     // Provision netto
  provisionMwst: number;      // 20% USt auf Provision
  provisionBrutto: number;    // Provision brutto
}

export interface DealTotals {
  positionCount: number;       // Anzahl Positionen
  totalStueck: number;         // Gesamtmenge Stück
  totalKartons: number;        // Gesamtmenge Kartons
  totalPaletten: number;       // Gesamtmenge Paletten
  subtotalNetto: number;       // Netto Gesamtsumme
  totalEkWert: number;         // EK-Warenwert
  totalMarge: number;          // Gesamtmarge (VK - EK)
  margePct: number;            // Marge in %
}

/** Calculate broker commission on a deal */
export function calculateCommission(dealSubtotal: number, provisionRate: number): CommissionResult {
  const provisionNetto = Math.round(dealSubtotal * provisionRate * 100) / 100;
  const provisionMwst = Math.round(provisionNetto * 0.20 * 100) / 100;
  const provisionBrutto = Math.round((provisionNetto + provisionMwst) * 100) / 100;

  return {
    dealSubtotal,
    provisionRate,
    provisionNetto,
    provisionMwst,
    provisionBrutto,
  };
}

/** Calculate totals for all articles in a deal */
export function calculateDealTotals(articles: DealArticle[]): DealTotals {
  let totalStueck = 0;
  let totalKartons = 0;
  let totalPaletten = 0;
  let subtotalNetto = 0;
  let totalEkWert = 0;

  for (const art of articles) {
    const stueck = art.mengeKartons * art.stueckProKarton + art.mengePaletten * art.kartonsProPalette * art.stueckProKarton;
    totalStueck += stueck;
    totalKartons += art.mengeKartons;
    totalPaletten += art.mengePaletten;
    subtotalNetto += art.vkPreis * stueck;
    totalEkWert += art.ekPreis * stueck;
  }

  subtotalNetto = Math.round(subtotalNetto * 100) / 100;
  totalEkWert = Math.round(totalEkWert * 100) / 100;
  const totalMarge = Math.round((subtotalNetto - totalEkWert) * 100) / 100;
  const margePct = subtotalNetto > 0 ? Math.round((totalMarge / subtotalNetto) * 10000) / 100 : 0;

  return {
    positionCount: articles.length,
    totalStueck,
    totalKartons,
    totalPaletten,
    subtotalNetto,
    totalEkWert,
    totalMarge,
    margePct,
  };
}

/** Calculate line total for a single article */
export function calculateArticleTotal(article: DealArticle): number {
  const stueck = article.mengeKartons * article.stueckProKarton + article.mengePaletten * article.kartonsProPalette * article.stueckProKarton;
  return Math.round(article.vkPreis * stueck * 100) / 100;
}

/** Get total pieces for an article */
export function getArticleStueck(article: DealArticle): number {
  return article.mengeKartons * article.stueckProKarton + article.mengePaletten * article.kartonsProPalette * article.stueckProKarton;
}
