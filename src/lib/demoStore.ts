// ════════════════════════════════════════════════════════════
// Demo Store — Persistent reactive store for Vermittler-Plattform
// Uses localStorage for persistence, falls back to seed data
// ════════════════════════════════════════════════════════════

import type {
  Partner, Deal, DealArticle, EanProduct,
  PlatformSettings, GeneratedDocument, BrokerUser, ActivityEvent,
  DonationPartner, DonationRecord
} from '../types';

// ──────────────────────────────────────────────
// DEMO USER
// ──────────────────────────────────────────────

export interface DemoUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  role: string;
}

export const DEMO_ADMIN: DemoUser = {
  uid: 'demo-admin-001',
  displayName: 'Maximilian Gruber',
  email: 'max@secondrun.at',
  photoURL: null,
  role: 'admin',
};

export const DEMO_BROKER_SARAH: DemoUser = {
  uid: 'demo-broker-sarah',
  displayName: 'Sarah Berger',
  email: 'sarah@secondrun.at',
  photoURL: null,
  role: 'broker',
};

export const DEMO_BROKER_THOMAS: DemoUser = {
  uid: 'demo-broker-thomas',
  displayName: 'Thomas Winkler',
  email: 'thomas@secondrun.at',
  photoURL: null,
  role: 'broker',
};

export const DEMO_USERS: DemoUser[] = [DEMO_ADMIN, DEMO_BROKER_SARAH, DEMO_BROKER_THOMAS];

// ──────────────────────────────────────────────
// STORAGE PREFIX
// ──────────────────────────────────────────────

const STORAGE_PREFIX = 'hsr_';

function loadFromStorage<T>(key: string): T[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) return JSON.parse(raw) as T[];
  } catch { /* ignore parse errors */ }
  return null;
}

function saveToStorage<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(items));
  } catch { /* quota exceeded — silently fail */ }
}

// ──────────────────────────────────────────────
// GENERIC COLLECTION FACTORY (with persistence)
// ──────────────────────────────────────────────

type CollectionListener<T> = (items: T[]) => void;
type FilterSpec = { field: string; value: string } | null;

function createDemoCollection<T extends { id: string }>(seedData: T[] = [], storageKey?: string) {
  // Load from localStorage if available, otherwise use seed data
  const stored = storageKey ? loadFromStorage<T>(storageKey) : null;
  let _items: T[] = stored ?? [...seedData];
  const _listeners = new Set<CollectionListener<T>>();

  function _persist() {
    if (storageKey) saveToStorage(storageKey, _items);
  }

  function _notify() {
    const snapshot = [..._items];
    _listeners.forEach(fn => fn(snapshot));
  }

  return {
    subscribe(filter: FilterSpec, callback: CollectionListener<T>): () => void {
      const wrapped: CollectionListener<T> = (all) => {
        if (filter) {
          callback(all.filter((item: any) => item[filter.field] === filter.value));
        } else {
          callback(all);
        }
      };
      wrapped(_items);
      _listeners.add(wrapped);
      return () => { _listeners.delete(wrapped); };
    },

    getById(id: string): T | null {
      return _items.find(item => item.id === id) || null;
    },

    getAll(): T[] {
      return [..._items];
    },

    add(data: Omit<T, 'id'>): string {
      const id = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newItem = { id, ...data } as T;
      _items = [newItem, ..._items];
      _persist();
      _notify();
      return id;
    },

    update(id: string, updates: Partial<T>): void {
      _items = _items.map(item => item.id === id ? { ...item, ...updates } : item);
      _persist();
      _notify();
    },

    remove(id: string): void {
      _items = _items.filter(item => item.id !== id);
      _persist();
      _notify();
    },

    reset(data?: T[]): void {
      _items = [...(data ?? seedData)];
      _persist();
      _notify();
    },

    count(): number {
      return _items.length;
    },
  };
}

// ──────────────────────────────────────────────
// SEED DATA — Partners (5 partners)
// ──────────────────────────────────────────────

const SEED_PARTNERS: Partner[] = [
  {
    id: 'partner-001',
    firmenname: 'Großhandel Weber GmbH',
    adresse: 'Industriestraße 45',
    plz: '5020',
    ort: 'Salzburg',
    land: 'AT',
    uidNummer: 'ATU11223344',
    kontaktperson: 'Franz Weber',
    telefon: '+43 662 445566',
    email: 'franz@weber-gmbh.at',
    iban: 'AT61 1904 3002 3457 3201',
    bic: 'BKAUATWW',
    bankName: 'Bank Austria',
    rolle: 'verkaeufer',
    kategorien: ['food', 'beverages'],
    sprache: 'de',
    notizen: 'Zuverlässiger Lieferant, regelmäßige Angebote. Mengenrabatt ab 10 Paletten.',
    createdAt: '2024-06-15T08:00:00Z',
  },
  {
    id: 'partner-002',
    firmenname: 'Rainer Getränkehandel KG',
    adresse: 'Brixentaler Straße 88',
    plz: '6361',
    ort: 'Hopfgarten',
    land: 'AT',
    uidNummer: 'ATU55667788',
    kontaktperson: 'Helga Rainer',
    telefon: '+43 5335 998877',
    email: 'helga@rainer-getraenke.at',
    iban: 'AT48 3200 0000 0123 4567',
    bic: 'RLNWATWW',
    bankName: 'Raiffeisenbank',
    rolle: 'verkaeufer',
    kategorien: ['beverages', 'food', 'dairy'],
    sprache: 'de',
    notizen: 'Großer Getränkelieferant. Auch TK-Ware und Molkereiprodukte.',
    createdAt: '2024-09-01T10:00:00Z',
  },
  {
    id: 'partner-003',
    firmenname: 'Handelshaus Hofer GmbH',
    adresse: 'Mariahilfer Straße 45',
    plz: '1060',
    ort: 'Wien',
    land: 'AT',
    uidNummer: 'ATU12345678',
    kontaktperson: 'Stefan Hofer',
    telefon: '+43 1 2345678',
    email: 'stefan@handelshaus-hofer.at',
    rolle: 'kaeufer',
    kategorien: ['food', 'beverages', 'dairy'],
    sprache: 'de',
    notizen: 'Stammkäufer seit 2023. Nimmt große Mengen ab. Schnelle Zahlung.',
    createdAt: '2024-06-15T08:00:00Z',
  },
  {
    id: 'partner-004',
    firmenname: 'Discount-Markt Müller OHG',
    adresse: 'Leopoldstraße 120',
    plz: '80802',
    ort: 'München',
    land: 'DE',
    uidNummer: 'DE987654321',
    kontaktperson: 'Andreas Müller',
    telefon: '+49 89 7654321',
    email: 'einkauf@discount-mueller.de',
    rolle: 'kaeufer',
    kategorien: ['food', 'non-food', 'household'],
    sprache: 'de',
    notizen: 'EU-Käufer, innergemeinschaftliche Lieferung. Große Mengen, 14 Tage Zahlung.',
    createdAt: '2024-09-01T10:00:00Z',
  },
  {
    id: 'partner-005',
    firmenname: 'Balkan Trade d.o.o.',
    adresse: 'Maršala Tita 55',
    plz: '71000',
    ort: 'Sarajevo',
    land: 'BA',
    uidNummer: '',
    kontaktperson: 'Emir Hadžić',
    telefon: '+387 33 123456',
    email: 'emir@balkantrade.ba',
    rolle: 'kaeufer',
    kategorien: ['food', 'beverages', 'non-food'],
    sprache: 'bhs',
    notizen: 'Export-Käufer, Ausfuhrlieferung. Container-Abnahme. Bar bei Abholung.',
    createdAt: '2024-11-20T14:00:00Z',
  },
];

// ──────────────────────────────────────────────
// SEED DATA — Deal Articles (10 Artikel auf 2 Deals)
// ──────────────────────────────────────────────

const SEED_DEAL_ARTICLES: DealArticle[] = [
  // Deal 1 Artikel (5 Positionen)
  {
    id: 'da-001',
    dealId: 'HSR-2026-00141',
    artikelname: 'Barilla Spaghetti No.5',
    marke: 'Barilla',
    beschreibung: 'Spaghetti 500g Packung, kurzes MHD. Originalverpackt.',
    ean: '8076800195057',
    mhd: '2026-08-15',
    mhdStatus: 'yellow',
    imageUrl: '',
    stueckProKarton: 24,
    kartonsProPalette: 80,
    gewicht: '500g',
    category: 'food',
    mengeKartons: 0,
    mengePaletten: 3,
    ekPreis: 0.59,
    uvp: 1.49,
    vkPreis: 0.55,
    status: 'available',
  },
  {
    id: 'da-002',
    dealId: 'HSR-2026-00141',
    artikelname: 'Knorr Tomatensuppe',
    marke: 'Knorr',
    beschreibung: 'Feinschmecker Tomatensuppe, 2 Teller. Verpackungsänderung.',
    ean: '8712100769535',
    mhd: '2026-11-30',
    mhdStatus: 'green',
    imageUrl: '',
    stueckProKarton: 40,
    kartonsProPalette: 60,
    gewicht: '65g',
    category: 'food',
    mengeKartons: 10,
    mengePaletten: 2,
    ekPreis: 0.35,
    uvp: 0.99,
    vkPreis: 0.45,
    status: 'available',
  },
  {
    id: 'da-003',
    dealId: 'HSR-2026-00141',
    artikelname: 'Milka Alpenmilch 100g',
    marke: 'Milka',
    beschreibung: 'Alpenmilchschokolade 100g. MHD-Ware.',
    ean: '7622210007803',
    mhd: '2026-06-20',
    mhdStatus: 'yellow',
    imageUrl: '',
    stueckProKarton: 20,
    kartonsProPalette: 90,
    gewicht: '100g',
    category: 'food',
    mengeKartons: 0,
    mengePaletten: 1,
    ekPreis: 0.45,
    uvp: 1.29,
    vkPreis: 0.48,
    status: 'available',
  },
  {
    id: 'da-004',
    dealId: 'HSR-2026-00141',
    artikelname: 'Manner Schnitten Original',
    marke: 'Manner',
    beschreibung: 'Original Neapolitaner 75g. Überproduktion.',
    ean: '9000331607214',
    mhd: '2026-10-15',
    mhdStatus: 'green',
    imageUrl: '',
    stueckProKarton: 30,
    kartonsProPalette: 72,
    gewicht: '75g',
    category: 'food',
    mengeKartons: 15,
    mengePaletten: 1,
    ekPreis: 0.38,
    uvp: 1.19,
    vkPreis: 0.44,
    status: 'available',
  },
  {
    id: 'da-005',
    dealId: 'HSR-2026-00141',
    artikelname: 'Pril Spülmittel 500ml',
    marke: 'Pril',
    beschreibung: 'Original Handspülmittel. Verpackungsrelaunch.',
    ean: '4015000961554',
    mhd: '2028-06-01',
    mhdStatus: 'green',
    imageUrl: '',
    stueckProKarton: 20,
    kartonsProPalette: 72,
    gewicht: '540g',
    category: 'non-food',
    mengeKartons: 0,
    mengePaletten: 2,
    ekPreis: 0.55,
    uvp: 1.99,
    vkPreis: 0.85,
    status: 'available',
  },

  // Deal 2 Artikel (5 Positionen)
  {
    id: 'da-006',
    dealId: 'HSR-2026-00142',
    artikelname: 'Red Bull Energy 250ml',
    marke: 'Red Bull',
    beschreibung: 'Energy Drink Dose 250ml. Überproduktion.',
    ean: '9002490100070',
    mhd: '2027-01-15',
    mhdStatus: 'green',
    imageUrl: '',
    stueckProKarton: 24,
    kartonsProPalette: 100,
    gewicht: '280g',
    category: 'beverages',
    mengeKartons: 0,
    mengePaletten: 3,
    ekPreis: 0.65,
    uvp: 1.49,
    vkPreis: 0.72,
    status: 'available',
  },
  {
    id: 'da-007',
    dealId: 'HSR-2026-00142',
    artikelname: 'Almdudler Original 1,5L',
    marke: 'Almdudler',
    beschreibung: 'Alpenkräuterlimonade 1,5L PET. Überbestand.',
    ean: '9002490205027',
    mhd: '2026-09-20',
    mhdStatus: 'green',
    imageUrl: '',
    stueckProKarton: 6,
    kartonsProPalette: 100,
    gewicht: '1,55kg',
    category: 'beverages',
    mengeKartons: 20,
    mengePaletten: 2,
    ekPreis: 0.48,
    uvp: 1.69,
    vkPreis: 0.62,
    status: 'available',
  },
  {
    id: 'da-008',
    dealId: 'HSR-2026-00142',
    artikelname: 'Bergbauern Vollmilch 1L',
    marke: 'Bergbauern',
    beschreibung: 'Frischmilch 3,5% 1L. Kurzes MHD.',
    ean: '9001368200013',
    mhd: '2026-04-28',
    mhdStatus: 'red',
    imageUrl: '',
    stueckProKarton: 12,
    kartonsProPalette: 80,
    gewicht: '1,03kg',
    category: 'dairy',
    mengeKartons: 0,
    mengePaletten: 2,
    ekPreis: 0.42,
    uvp: 1.39,
    vkPreis: 0.35,
    status: 'available',
  },
  {
    id: 'da-009',
    dealId: 'HSR-2026-00142',
    artikelname: 'Philadelphia Frischkäse 200g',
    marke: 'Philadelphia',
    beschreibung: 'Original Frischkäse 200g. MHD-Ware.',
    ean: '7622300315092',
    mhd: '2026-05-10',
    mhdStatus: 'red',
    imageUrl: '',
    stueckProKarton: 8,
    kartonsProPalette: 80,
    gewicht: '200g',
    category: 'dairy',
    mengeKartons: 10,
    mengePaletten: 1,
    ekPreis: 0.72,
    uvp: 2.49,
    vkPreis: 0.55,
    status: 'available',
  },
  {
    id: 'da-010',
    dealId: 'HSR-2026-00142',
    artikelname: 'Iglo Rahmspinat 450g',
    marke: 'Iglo',
    beschreibung: 'Tiefgekühlt 450g. Listungsänderung.',
    ean: '4250548900041',
    mhd: '2027-03-31',
    mhdStatus: 'green',
    imageUrl: '',
    stueckProKarton: 12,
    kartonsProPalette: 60,
    gewicht: '450g',
    category: 'frozen',
    mengeKartons: 0,
    mengePaletten: 1,
    ekPreis: 0.89,
    uvp: 2.99,
    vkPreis: 1.15,
    status: 'available',
  },
];

// ──────────────────────────────────────────────
// SEED DATA — Deals (2 Deals in verschiedenen Status)
// ──────────────────────────────────────────────

const SEED_DEALS: Deal[] = [
  {
    id: 'HSR-2026-00141',
    verkaeuferId: 'partner-001',
    kaeuferId: 'partner-003',
    articleIds: ['da-001', 'da-002', 'da-003', 'da-004', 'da-005'],
    status: 'angebot_gesendet',
    subtotalNetto: 5847.60,
    mwstType: 'standard',
    mwstRate: 0.20,
    mwstAmount: 1169.52,
    totalBrutto: 7017.12,
    provisionRate: 0.06,
    provisionAmount: 350.86,
    zahlungsbedingung: 'Vorauskasse',
    lieferbedingung: 'Ab Werk Salzburg',
    abholtermin: '2026-04-15',
    angebotNr: 'ANG-2026-00141',
    bestellbestaetigungNr: '',
    auftragsbestaetigungNr: '',
    rechnungNr: '',
    provisionsrechnungNr: '',
    notizen: 'Stammkunde, bevorzugt Lebensmittel. Deal läuft gut.',
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'HSR-2026-00142',
    verkaeuferId: 'partner-002',
    kaeuferId: 'partner-004',
    articleIds: ['da-006', 'da-007', 'da-008', 'da-009', 'da-010'],
    status: 'bestaetigt',
    subtotalNetto: 8234.40,
    mwstType: 'innergemeinschaftlich',
    mwstRate: 0,
    mwstAmount: 0,
    totalBrutto: 8234.40,
    provisionRate: 0.05,
    provisionAmount: 411.72,
    zahlungsbedingung: '14 Tage netto',
    lieferbedingung: 'Frei Haus München',
    abholtermin: '2026-04-10',
    angebotNr: 'ANG-2026-00142',
    bestellbestaetigungNr: 'BE-2026-00142',
    auftragsbestaetigungNr: 'AB-2026-00142',
    rechnungNr: '',
    provisionsrechnungNr: '',
    notizen: 'EU-Lieferung nach München. UID geprüft. Große Getränke-Bestellung.',
    createdAt: '2026-03-07T11:30:00Z',
  },
];

// ──────────────────────────────────────────────
// SEED DATA — Platform Settings
// ──────────────────────────────────────────────

const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  firmenname: 'HELLO SECOND/RUN',
  adresse: 'Gewerbepark Süd 12',
  plz: '5020',
  ort: 'Salzburg',
  land: 'AT',
  uid: 'ATU99887766',
  bankName: 'Raiffeisenbank Salzburg',
  iban: 'AT12 3456 7890 1234 5678',
  bic: 'RVSAAT2S',
  email: 'office@secondrun.at',
  telefon: '+43 662 123456',
  website: 'www.secondrun.at',
  logoUrl: '',
  defaultProvisionRate: 0.06,
  defaultZahlungsbedingung: 'Vorauskasse',
  defaultLieferbedingung: 'Ab Werk',
  defaultMwstRate: 0.20,
  // EmailJS — User fills in from emailjs.com dashboard
  emailjsPublicKey: '',
  emailjsServiceId: '',
  emailjsTemplateAngebot: '',
  emailjsTemplateKontakt: '',
  emailjsTemplateStatus: '',
};

// ──────────────────────────────────────────────
// COLLECTION INSTANCES (with localStorage keys)
// ──────────────────────────────────────────────

export const partnersCollection = createDemoCollection<Partner>(SEED_PARTNERS, 'partners');
export const dealsCollection = createDemoCollection<Deal>(SEED_DEALS, 'deals');
export const dealArticlesCollection = createDemoCollection<DealArticle>(SEED_DEAL_ARTICLES, 'dealArticles');
export const eanProductsCollection = createDemoCollection<EanProduct & { id: string }>([], 'eanProducts');
export const documentsCollection = createDemoCollection<GeneratedDocument>([], 'documents');

// Broker Users
const SEED_USERS: BrokerUser[] = [
  {
    id: 'user-admin',
    name: 'Maximilian Gruber',
    email: 'max@secondrun.at',
    role: 'admin',
    assignedPartnerIds: [],
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-broker-01',
    name: 'Sarah Berger',
    email: 'sarah@secondrun.at',
    role: 'broker',
    assignedPartnerIds: ['partner-001', 'partner-003'],
    createdAt: '2024-06-01T00:00:00Z',
  },
  {
    id: 'user-broker-02',
    name: 'Thomas Winkler',
    email: 'thomas@secondrun.at',
    role: 'broker',
    assignedPartnerIds: ['partner-002', 'partner-004', 'partner-005'],
    createdAt: '2024-09-01T00:00:00Z',
  },
];
export const usersCollection = createDemoCollection<BrokerUser>(SEED_USERS, 'users');

// Activity Feed
export const activitiesCollection = createDemoCollection<ActivityEvent>([], 'activities');

/** Helper: log a new activity event */
export function logActivity(
  type: ActivityEvent['type'],
  title: string,
  detail: string,
  opts?: { dealId?: string; partnerId?: string }
): void {
  activitiesCollection.add({
    type,
    title,
    detail,
    dealId: opts?.dealId ?? '',
    partnerId: opts?.partnerId ?? '',
    createdAt: new Date().toISOString(),
    read: false,
  } as Omit<ActivityEvent, 'id'> as any);
}

/** Mark all activities as read */
export function markAllActivitiesRead(): void {
  const all = activitiesCollection.getAll();
  all.filter(a => !a.read).forEach(a => {
    activitiesCollection.update(a.id, { read: true });
  });
}

// Platform settings (singleton, persistent)
function loadSettings(): PlatformSettings {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + 'platformSettings');
    if (raw) return JSON.parse(raw) as PlatformSettings;
  } catch { /* ignore */ }
  return { ...DEFAULT_PLATFORM_SETTINGS };
}

let _platformSettings: PlatformSettings = loadSettings();

export function getPlatformSettings(): PlatformSettings { return { ..._platformSettings }; }
export function updatePlatformSettings(updates: Partial<PlatformSettings>): void {
  _platformSettings = { ..._platformSettings, ...updates };
  try {
    localStorage.setItem(STORAGE_PREFIX + 'platformSettings', JSON.stringify(_platformSettings));
  } catch { /* ignore */ }
}

// ──────────────────────────────────────────────
// SEED DATA — Donation Partners (Tafeln, Caritas etc.)
// ──────────────────────────────────────────────

const SEED_DONATION_PARTNERS: DonationPartner[] = [
  {
    id: 'dp-001',
    name: 'Tafel Salzburg',
    organisation: 'Tafel Österreich',
    kontaktperson: 'Maria Huber',
    email: 'salzburg@tafel.at',
    telefon: '+43 662 876543',
    adresse: 'Schallmooser Hauptstraße 12',
    plz: '5020',
    ort: 'Salzburg',
    land: 'AT',
    kategorien: ['food', 'beverages', 'dairy'],
    maxKapazitaet: '10 Paletten/Woche',
    kuehlung: true,
    abholung: true,
    notizen: 'Versorgt 2.500 Menschen wöchentlich. Abholdienst Mo–Fr 8–16 Uhr.',
    aktiv: true,
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'dp-002',
    name: 'Caritas Sozialmarkt Wien',
    organisation: 'Caritas Österreich',
    kontaktperson: 'Thomas Lehner',
    email: 'sozialmarkt@caritas-wien.at',
    telefon: '+43 1 8787878',
    adresse: 'Albrechtskreithgasse 19-21',
    plz: '1160',
    ort: 'Wien',
    land: 'AT',
    kategorien: ['food', 'beverages', 'dairy', 'non-food', 'household'],
    maxKapazitaet: '20 Paletten/Woche',
    kuehlung: true,
    abholung: true,
    notizen: '3 Sozialmarkt-Filialen in Wien. Nimmt auch Non-Food und Haushaltswaren.',
    aktiv: true,
    createdAt: '2025-02-10T10:00:00Z',
  },
  {
    id: 'dp-003',
    name: 'Münchner Tafel e.V.',
    organisation: 'Tafel Deutschland',
    kontaktperson: 'Klaus Maier',
    email: 'info@muenchner-tafel.de',
    telefon: '+49 89 5432100',
    adresse: 'Großmarktstraße 1',
    plz: '81107',
    ort: 'München',
    land: 'DE',
    kategorien: ['food', 'beverages', 'dairy', 'frozen'],
    maxKapazitaet: '30 Paletten/Woche',
    kuehlung: true,
    abholung: true,
    notizen: 'Versorgt 22.000 Bedürftige pro Woche. Eigene LKW-Flotte für Abholung.',
    aktiv: true,
    createdAt: '2025-03-01T10:00:00Z',
  },
  {
    id: 'dp-004',
    name: 'Pomozi.ba Sarajevo',
    organisation: 'Pomozi.ba Foundation',
    kontaktperson: 'Amra Delić',
    email: 'info@pomozi.ba',
    telefon: '+387 33 987654',
    adresse: 'Safeta Hadžića 10',
    plz: '71000',
    ort: 'Sarajevo',
    land: 'BA',
    kategorien: ['food', 'beverages', 'non-food'],
    maxKapazitaet: '5 Paletten/Woche',
    kuehlung: false,
    abholung: false,
    notizen: 'Größte Hilfsorganisation in Bosnien. Lieferung nötig — keine eigenen LKW.',
    aktiv: true,
    createdAt: '2025-03-15T10:00:00Z',
  },
];

// ──────────────────────────────────────────────
// SEED DATA — Donation Records (Beispiel-Spenden)
// ──────────────────────────────────────────────

const SEED_DONATION_RECORDS: DonationRecord[] = [
  {
    id: 'don-001',
    dealId: '',
    donationPartnerId: 'dp-001',
    artikelBeschreibung: 'Verschiedene Molkereiprodukte — kurzes MHD, 3 Paletten Joghurt & Käse',
    kategorie: 'dairy',
    mengeKartons: 120,
    mengePaletten: 3,
    gewichtKg: 1440,
    geschaetzterWert: 2160,
    status: 'bestaetigt',
    spendenbestaetigungNr: 'SPD-2026-00001',
    abholDatum: '2026-02-20T10:00:00Z',
    bestaetigtDatum: '2026-02-20T14:00:00Z',
    notizen: 'MHD in 5 Tagen. Tafel hat am selben Tag verteilt.',
    createdAt: '2026-02-18T09:00:00Z',
  },
  {
    id: 'don-002',
    dealId: '',
    donationPartnerId: 'dp-002',
    artikelBeschreibung: 'Konserven-Mix — 5 Paletten Tomatensuppen, Bohnen, Mais. Verpackungsänderung.',
    kategorie: 'food',
    mengeKartons: 200,
    mengePaletten: 5,
    gewichtKg: 2400,
    geschaetzterWert: 3200,
    status: 'bestaetigt',
    spendenbestaetigungNr: 'SPD-2026-00002',
    abholDatum: '2026-03-05T08:00:00Z',
    bestaetigtDatum: '2026-03-05T12:00:00Z',
    notizen: 'Altes Verpackungsdesign, Ware einwandfrei. Auf 3 Sozialmärkte verteilt.',
    createdAt: '2026-03-03T11:00:00Z',
  },
];

// ──────────────────────────────────────────────
// COLLECTION INSTANCES — Donations
// ──────────────────────────────────────────────

export const donationPartnersCollection = createDemoCollection<DonationPartner>(SEED_DONATION_PARTNERS, 'donationPartners');
export const donationRecordsCollection = createDemoCollection<DonationRecord>(SEED_DONATION_RECORDS, 'donationRecords');

// ──────────────────────────────────────────────
// DEMO MODE MANAGEMENT
// ──────────────────────────────────────────────

let _isDemoMode = false;
let _demoUser: DemoUser | null = null;

// Restore demo mode from sessionStorage on page reload
try {
  const savedDemo = sessionStorage.getItem(STORAGE_PREFIX + 'demoMode');
  if (savedDemo) {
    const parsed = JSON.parse(savedDemo) as DemoUser;
    _isDemoMode = true;
    _demoUser = parsed;
  }
} catch { /* ignore */ }

export function isDemoMode(): boolean {
  return _isDemoMode;
}

export function getDemoUser(): DemoUser | null {
  return _demoUser;
}

export function enterDemoMode(user: DemoUser): void {
  _isDemoMode = true;
  _demoUser = user;
  try {
    sessionStorage.setItem(STORAGE_PREFIX + 'demoMode', JSON.stringify(user));
  } catch { /* ignore */ }
}

export function exitDemoMode(): void {
  _isDemoMode = false;
  _demoUser = null;
  try {
    sessionStorage.removeItem(STORAGE_PREFIX + 'demoMode');
  } catch { /* ignore */ }
  // Reset all collections to seed data
  partnersCollection.reset();
  dealsCollection.reset();
  dealArticlesCollection.reset();
  eanProductsCollection.reset();
  documentsCollection.reset();
  usersCollection.reset();
  activitiesCollection.reset();
  donationPartnersCollection.reset();
  donationRecordsCollection.reset();
  _platformSettings = { ...DEFAULT_PLATFORM_SETTINGS };
  try {
    localStorage.setItem(STORAGE_PREFIX + 'platformSettings', JSON.stringify(_platformSettings));
  } catch { /* ignore */ }
}

// ──────────────────────────────────────────────
// UTILITY: Reset all persisted data to seed
// ──────────────────────────────────────────────

export function resetAllData(): void {
  partnersCollection.reset();
  dealsCollection.reset();
  dealArticlesCollection.reset();
  eanProductsCollection.reset();
  documentsCollection.reset();
  usersCollection.reset();
  activitiesCollection.reset();
  donationPartnersCollection.reset();
  donationRecordsCollection.reset();
  _platformSettings = { ...DEFAULT_PLATFORM_SETTINGS };
  try {
    localStorage.setItem(STORAGE_PREFIX + 'platformSettings', JSON.stringify(_platformSettings));
  } catch { /* ignore */ }
}
