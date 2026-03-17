// ════════════════════════════════════════════════════════════
// HELLO SECOND/RUN — Das Angebots-Tool für Sonderposten
// ════════════════════════════════════════════════════════════

// === ARTICLE CATEGORY ===
export type ArticleCategory = 'food' | 'beverages' | 'dairy' | 'frozen' | 'non-food' | 'household' | 'other';

// === PARTNER (Verkäufer + Käufer unified) ===
export interface Partner {
  id: string;
  firmenname: string;
  adresse: string;
  plz: string;
  ort: string;
  land: string;                       // 'AT', 'DE', 'IT', etc.
  uidNummer: string;                   // VAT ID
  steuernummer?: string;
  kontaktperson: string;
  telefon: string;
  email: string;
  // Bankdaten (nur für Verkäufer relevant)
  iban?: string;
  bic?: string;
  bankName?: string;
  rolle: 'verkaeufer' | 'kaeufer' | 'beides';
  kategorien: ArticleCategory[];
  sprache: 'de' | 'en' | 'bhs';
  notizen: string;
  createdAt: string;
}

// === DEAL ARTICLE (Produkt innerhalb eines Deals) ===
export interface DealArticle {
  id: string;
  dealId: string;
  artikelname: string;
  marke: string;
  beschreibung: string;
  ean: string;
  eanKarton?: string;
  mhd: string;                        // ISO date
  mhdStatus: 'green' | 'yellow' | 'red';
  imageUrl: string;
  imageData?: string;                   // Base64 encoded product image
  stueckProKarton: number;
  kartonsProPalette: number;
  gewicht: string;
  category: ArticleCategory;
  mengeKartons: number;
  mengePaletten: number;
  ekPreis: number;                     // Einkaufspreis pro Stück
  uvp: number;                         // UVP pro Stück
  vkPreis: number;                     // Verkaufspreis pro Stück
  staffelPreise?: StaffelPreis[];
  status: 'available' | 'reserved' | 'sold';
}

export interface StaffelPreis {
  abPaletten: number;
  preisProStueck: number;
}

// === DEAL (zentrale Entität) ===
export interface Deal {
  id: string;                          // Format: HSR-2026-00142
  verkaeuferId: string;
  kaeuferId: string;
  articleIds: string[];
  status: DealStatus;
  // Finanzen
  subtotalNetto: number;
  mwstType: MwstType;
  mwstRate: number;
  mwstAmount: number;
  totalBrutto: number;
  // Provision
  provisionRate: number;               // z.B. 0.06 = 6%
  provisionAmount: number;
  // Konditionen
  zahlungsbedingung: string;
  lieferbedingung: string;
  abholtermin?: string;
  // Verknüpfte Dokument-Nummern
  angebotNr: string;
  bestellbestaetigungNr: string;
  auftragsbestaetigungNr: string;
  rechnungNr: string;
  provisionsrechnungNr: string;
  // Spende
  donationId?: string;                   // Verknüpfte Spende (wenn gespendet)
  endAction?: DealEndAction;             // Was ist mit der Ware passiert
  // Meta
  notizen: string;
  createdAt: string;
}

export type DealStatus =
  | 'draft'
  | 'angebot_erstellt'
  | 'angebot_gesendet'
  | 'bestellt'
  | 'bestaetigt'
  | 'bezahlt'
  | 'rechnung_erstellt'
  | 'abgeholt'
  | 'abgeschlossen'
  | 'storniert'
  | 'gespendet';

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  draft: 'Entwurf',
  angebot_erstellt: 'Angebot erstellt',
  angebot_gesendet: 'Angebot gesendet',
  bestellt: 'Bestellt',
  bestaetigt: 'Bestätigt',
  bezahlt: 'Bezahlt',
  rechnung_erstellt: 'Rechnung erstellt',
  abgeholt: 'Abgeholt',
  abgeschlossen: 'Abgeschlossen',
  storniert: 'Storniert',
  gespendet: 'Gespendet ❤️',
};

export const DEAL_STATUS_ORDER: DealStatus[] = [
  'draft', 'angebot_erstellt', 'angebot_gesendet', 'bestellt',
  'bestaetigt', 'bezahlt', 'rechnung_erstellt', 'abgeholt', 'abgeschlossen',
];

// === MwSt TYPES ===
export type MwstType = 'standard' | 'reduced' | 'innergemeinschaftlich' | 'ausfuhr';

// === EAN PRODUCT (Cache für erkannte Produkte) ===
export interface EanProduct {
  ean: string;
  produktname: string;
  marke: string;
  gewicht: string;
  kategorie: ArticleCategory;
  imageUrl: string;
  quelle: 'openfoodfacts' | 'manual' | 'cache';
}

// === GENERATED DOCUMENT ===
export type DocumentType = 'angebot' | 'bestellbestaetigung' | 'auftragsbestaetigung' | 'lieferschein' | 'rechnung' | 'provisionsrechnung';

export interface GeneratedDocument {
  id: string;
  type: DocumentType;
  dealId: string;
  nr: string;                          // z.B. ANG-2026-00142
  ausstellerName: string;              // Wer hat ausgestellt
  empfaengerName: string;              // An wen
  fileName: string;
  fileData: string;                    // Base64 PDF data
  createdAt: string;
}

// === PLATFORM SETTINGS ===
export interface PlatformSettings {
  firmenname: string;
  adresse: string;
  plz: string;
  ort: string;
  land: string;
  uid: string;
  bankName: string;
  iban: string;
  bic: string;
  email: string;
  telefon: string;
  website: string;
  logoUrl: string;
  defaultProvisionRate: number;        // z.B. 0.06 = 6%
  defaultZahlungsbedingung: string;
  defaultLieferbedingung: string;
  defaultMwstRate: number;
  // EmailJS Integration
  emailjsPublicKey: string;
  emailjsServiceId: string;
  emailjsTemplateAngebot: string;
  emailjsTemplateKontakt: string;
  emailjsTemplateStatus: string;
}

// === BROKER USER ===
export type UserRole = 'admin' | 'broker';

export interface BrokerUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedPartnerIds: string[];         // Broker sieht nur diese Partner/Deals
  createdAt: string;
}

// === ACTIVITY EVENT === (defined below with donation types)

// === DONATION PARTNER (Tafel, Caritas, Foodbank etc.) ===
export interface DonationPartner {
  id: string;
  name: string;                          // z.B. "Tafel Salzburg", "Caritas Wien"
  organisation: string;                   // z.B. "Tafel Österreich", "Caritas"
  kontaktperson: string;
  email: string;
  telefon: string;
  adresse: string;
  plz: string;
  ort: string;
  land: string;
  kategorien: ArticleCategory[];          // Welche Warengruppen nehmen sie an
  maxKapazitaet: string;                  // z.B. "5 Paletten/Woche"
  kuehlung: boolean;                      // Können sie Kühlware annehmen?
  abholung: boolean;                      // Holen sie selbst ab?
  notizen: string;
  aktiv: boolean;
  createdAt: string;
}

// === DONATION RECORD (Eine durchgeführte Spende) ===
export type DonationStatus = 'vorgeschlagen' | 'geplant' | 'abgeholt' | 'bestaetigt';

export interface DonationRecord {
  id: string;
  dealId?: string;                        // Optional: verknüpfter Deal
  donationPartnerId: string;              // An wen gespendet
  artikelBeschreibung: string;            // Was wurde gespendet
  kategorie: ArticleCategory;
  mengeKartons: number;
  mengePaletten: number;
  gewichtKg: number;                      // Geschätztes Gesamtgewicht in kg
  geschaetzterWert: number;               // Warenwert für Spendenbescheinigung
  status: DonationStatus;
  spendenbestaetigungNr: string;          // z.B. SPD-2026-00001
  abholDatum?: string;
  bestaetigtDatum?: string;
  notizen: string;
  createdAt: string;
}

// === DEAL EXTENSION — Spenden-Felder ===
// Deal bekommt neue optionale Felder (über Partial bei Update)
export type DealEndAction = 'verkauft' | 'gespendet' | 'teilgespendet';

// === ACTIVITY EXTENSION ===
export type ActivityType =
  | 'deal_created'
  | 'deal_status_changed'
  | 'deal_cloned'
  | 'partner_created'
  | 'document_generated'
  | 'partner_updated'
  | 'donation_created'
  | 'donation_completed';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  dealId?: string;
  partnerId?: string;
  createdAt: string;
  read: boolean;
}

// === Keep existing Window declaration ===
export {};
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
