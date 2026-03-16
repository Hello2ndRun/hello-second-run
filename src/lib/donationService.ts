// ════════════════════════════════════════════════════════════
// Donation Service — Spenden-Logik, Impact-Berechnung
// "Erst vermitteln, dann spenden — nie entsorgen."
// ════════════════════════════════════════════════════════════

import type { DonationRecord, DonationPartner, Deal, DealArticle, ArticleCategory } from '../types';
import {
  donationPartnersCollection,
  donationRecordsCollection,
  dealsCollection,
  dealArticlesCollection,
  logActivity,
} from './demoStore';

// ──────────────────────────────────────────────
// IMPACT CALCULATIONS
// ──────────────────────────────────────────────

export interface ImpactStats {
  totalDonations: number;           // Anzahl Spenden
  totalGewichtKg: number;           // Gesamtgewicht gespendet
  totalWert: number;                // Gesamtwert der gespendeten Ware
  totalMahlzeiten: number;          // Geschätzte Mahlzeiten (1 kg ≈ 2 Mahlzeiten)
  totalPaletten: number;            // Gesamtpaletten gespendet
  partnerCount: number;             // Anzahl belieferter Spendenpartner
  kategorieVerteilung: Record<ArticleCategory, number>;
  letzteSpenden: DonationRecord[];  // Die letzten 5 Spenden
}

const MAHLZEITEN_PRO_KG = 2; // Durchschnitt: 1 kg Lebensmittel ≈ 2 Mahlzeiten

export function getImpactStats(): ImpactStats {
  const allDonations = donationRecordsCollection.getAll();
  const confirmed = allDonations.filter(d => d.status === 'bestaetigt');

  const kategorieVerteilung: Record<ArticleCategory, number> = {
    food: 0, beverages: 0, dairy: 0, frozen: 0,
    'non-food': 0, household: 0, other: 0,
  };

  let totalGewichtKg = 0;
  let totalWert = 0;
  let totalPaletten = 0;
  const partnerIds = new Set<string>();

  confirmed.forEach(d => {
    totalGewichtKg += d.gewichtKg;
    totalWert += d.geschaetzterWert;
    totalPaletten += d.mengePaletten;
    partnerIds.add(d.donationPartnerId);
    if (kategorieVerteilung[d.kategorie] !== undefined) {
      kategorieVerteilung[d.kategorie] += d.gewichtKg;
    }
  });

  // Sortiere nach Datum (neueste zuerst) für letzte Spenden
  const sorted = [...allDonations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    totalDonations: confirmed.length,
    totalGewichtKg,
    totalWert,
    totalMahlzeiten: Math.round(totalGewichtKg * MAHLZEITEN_PRO_KG),
    totalPaletten,
    partnerCount: partnerIds.size,
    kategorieVerteilung,
    letzteSpenden: sorted.slice(0, 5),
  };
}

// ──────────────────────────────────────────────
// FIND MATCHING DONATION PARTNER
// ──────────────────────────────────────────────

export function findMatchingDonationPartners(
  kategorie: ArticleCategory,
  needsKuehlung: boolean = false,
): DonationPartner[] {
  const all = donationPartnersCollection.getAll();
  return all.filter(p =>
    p.aktiv &&
    p.kategorien.includes(kategorie) &&
    (!needsKuehlung || p.kuehlung)
  );
}

// ──────────────────────────────────────────────
// CREATE DONATION FROM DEAL
// ──────────────────────────────────────────────

export function createDonationFromDeal(
  deal: Deal,
  donationPartnerId: string,
  notizen: string = '',
): string {
  // Gather deal articles
  const articles = deal.articleIds
    .map(id => dealArticlesCollection.getById(id))
    .filter(Boolean) as DealArticle[];

  const beschreibung = articles
    .map(a => `${a.artikelname} (${a.marke}) — ${a.mengePaletten} Pal.`)
    .join(', ');

  const totalGewicht = articles.reduce((sum, a) => {
    const gewichtNum = parseFloat(a.gewicht.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
    const totalStk = a.mengePaletten > 0
      ? a.mengePaletten * a.kartonsProPalette * a.stueckProKarton
      : a.mengeKartons * a.stueckProKarton;
    return sum + (gewichtNum * totalStk) / 1000; // in kg
  }, 0);

  const totalPaletten = articles.reduce((sum, a) => sum + a.mengePaletten, 0);
  const totalKartons = articles.reduce((sum, a) => sum + a.mengeKartons, 0);

  // Hauptkategorie = häufigste Kategorie
  const katCounts: Record<string, number> = {};
  articles.forEach(a => {
    katCounts[a.category] = (katCounts[a.category] || 0) + 1;
  });
  const hauptkategorie = (Object.entries(katCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'food') as ArticleCategory;

  // Generate Spendennummer
  const count = donationRecordsCollection.count();
  const nr = `SPD-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  const donationId = donationRecordsCollection.add({
    dealId: deal.id,
    donationPartnerId,
    artikelBeschreibung: beschreibung,
    kategorie: hauptkategorie,
    mengeKartons: totalKartons,
    mengePaletten: totalPaletten,
    gewichtKg: Math.round(totalGewicht),
    geschaetzterWert: deal.subtotalNetto,
    status: 'vorgeschlagen',
    spendenbestaetigungNr: nr,
    notizen,
    createdAt: new Date().toISOString(),
  } as Omit<DonationRecord, 'id'>);

  // Update deal status
  dealsCollection.update(deal.id, {
    status: 'gespendet',
    donationId: donationId,
    endAction: 'gespendet',
  } as any);

  // Log activity
  const partner = donationPartnersCollection.getById(donationPartnerId);
  logActivity(
    'donation_created',
    'Spende erstellt',
    `Deal ${deal.id} → ${partner?.name || 'Unbekannt'} (${nr})`,
    { dealId: deal.id }
  );

  return donationId;
}

// ──────────────────────────────────────────────
// CREATE STANDALONE DONATION (ohne Deal)
// ──────────────────────────────────────────────

export function createStandaloneDonation(
  data: Omit<DonationRecord, 'id' | 'spendenbestaetigungNr' | 'createdAt'>
): string {
  const count = donationRecordsCollection.count();
  const nr = `SPD-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

  const donationId = donationRecordsCollection.add({
    ...data,
    spendenbestaetigungNr: nr,
    createdAt: new Date().toISOString(),
  } as Omit<DonationRecord, 'id'>);

  const partner = donationPartnersCollection.getById(data.donationPartnerId);
  logActivity(
    'donation_created',
    'Spende erstellt',
    `${data.artikelBeschreibung.slice(0, 60)}... → ${partner?.name || 'Unbekannt'} (${nr})`,
  );

  return donationId;
}

// ──────────────────────────────────────────────
// UPDATE DONATION STATUS
// ──────────────────────────────────────────────

export function confirmDonation(donationId: string): void {
  donationRecordsCollection.update(donationId, {
    status: 'bestaetigt',
    bestaetigtDatum: new Date().toISOString(),
  });

  const donation = donationRecordsCollection.getById(donationId);
  if (donation) {
    const partner = donationPartnersCollection.getById(donation.donationPartnerId);
    logActivity(
      'donation_completed',
      'Spende bestätigt ❤️',
      `${donation.gewichtKg} kg an ${partner?.name || 'Unbekannt'} — ca. ${donation.gewichtKg * MAHLZEITEN_PRO_KG} Mahlzeiten gerettet`,
      { dealId: donation.dealId || undefined }
    );
  }
}

export function updateDonationStatus(
  donationId: string,
  status: DonationRecord['status'],
  extras?: Partial<DonationRecord>
): void {
  donationRecordsCollection.update(donationId, { status, ...extras });
}

// ──────────────────────────────────────────────
// SHOULD SUGGEST DONATION? (MHD-basiert)
// ──────────────────────────────────────────────

export function shouldSuggestDonation(deal: Deal): boolean {
  // Vorschlag bei: storniert, oder wenn viele Artikel rotes MHD haben
  if (deal.status === 'storniert') return true;

  const articles = deal.articleIds
    .map(id => dealArticlesCollection.getById(id))
    .filter(Boolean) as DealArticle[];

  const redCount = articles.filter(a => a.mhdStatus === 'red').length;
  return redCount >= articles.length * 0.5; // >50% rotes MHD
}

// ──────────────────────────────────────────────
// DONATION STATUS LABELS
// ──────────────────────────────────────────────

export const DONATION_STATUS_LABELS: Record<DonationRecord['status'], string> = {
  vorgeschlagen: 'Vorgeschlagen',
  geplant: 'Geplant',
  abgeholt: 'Abgeholt',
  bestaetigt: 'Bestätigt ✓',
};

export const DONATION_STATUS_COLORS: Record<DonationRecord['status'], string> = {
  vorgeschlagen: 'bg-yellow-100 text-yellow-800',
  geplant: 'bg-blue-100 text-blue-800',
  abgeholt: 'bg-purple-100 text-purple-800',
  bestaetigt: 'bg-green-100 text-green-800',
};
