import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Plus, Trash2, Upload, Save, CheckCircle, Loader2, AlertCircle, Camera, X } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import FileUploadZone from '../../components/shared/FileUploadZone';
import MhdBadge from '../../components/shared/MhdBadge';
import EanLookup from '../../components/shared/EanLookup';
import { partnersCollection, dealArticlesCollection, dealsCollection, getPlatformSettings, logActivity } from '../../lib/demoStore';
import { useBrokerFilter } from '../../hooks/useBrokerFilter';
import { calculateMhdPrice, getMhdStatus } from '../../lib/mhdCalculator';
import { calculateDealTotals, calculateCommission } from '../../lib/priceCalculator';
import { generateDealId, dealIdToDocNr } from '../../lib/dealNumbering';
import { determineVatType, calculateVat } from '../../lib/vatCalculator';
import { formatCurrency, formatPercent } from '../../lib/formatters';
import { extractFromDocument, fileToBase64 } from '../../lib/pdfExtractor';
import { compressImage } from '../../lib/imageCompress';
import { parseExcelFile } from '../../lib/excelParser';
import type { ExtractedArticle } from '../../lib/pdfExtractor';
import type { Partner, Deal, DealArticle, ArticleCategory, EanProduct } from '../../types';

interface LocalArticle {
  artikelname: string;
  marke: string;
  ean: string;
  mhd: string;
  ekPreis: number;
  uvp: number;
  vkPreis: number;
  stueckProKarton: number;
  kartonsProPalette: number;
  mengeKartons: number;
  mengePaletten: number;
  gewicht: string;
  category: ArticleCategory;
  beschreibung: string;
  imageUrl: string;
  imageData: string;
  mhdStatus: 'green' | 'yellow' | 'red';
  status: 'available' | 'reserved' | 'sold';
}

const EMPTY_ARTICLE: LocalArticle = {
  artikelname: '',
  marke: '',
  ean: '',
  mhd: '',
  ekPreis: 0,
  uvp: 0,
  vkPreis: 0,
  stueckProKarton: 1,
  kartonsProPalette: 1,
  mengeKartons: 0,
  mengePaletten: 1,
  gewicht: '',
  category: 'food',
  beschreibung: '',
  imageUrl: '',
  imageData: '',
  mhdStatus: 'green',
  status: 'available',
};

const STEPS = [
  { nr: 1, label: 'Verkäufer + Upload' },
  { nr: 2, label: 'Artikel bearbeiten' },
  { nr: 3, label: 'Käufer + Konditionen' },
  { nr: 4, label: 'Vorschau + Speichern' },
];

export default function DealNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const settings = getPlatformSettings();
  const cloneFromId = (location.state as any)?.cloneFrom as string | undefined;
  const { filterPartners } = useBrokerFilter();

  // Step state
  const [step, setStep] = useState(1);

  // Partner data (broker-filtered)
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  useEffect(() => {
    return partnersCollection.subscribe(null, setAllPartners);
  }, []);
  const partners = filterPartners(allPartners);

  // Step 1
  const [verkaeuferId, setVerkaeuferId] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const [extractionSuccess, setExtractionSuccess] = useState('');

  // Step 2
  const [articles, setArticles] = useState<LocalArticle[]>([]);

  // Step 3
  const [kaeuferId, setKaeuferId] = useState('');
  const [provisionRate, setProvisionRate] = useState(settings.defaultProvisionRate * 100);
  const [zahlungsbedingung, setZahlungsbedingung] = useState(settings.defaultZahlungsbedingung);
  const [lieferbedingung, setLieferbedingung] = useState(settings.defaultLieferbedingung);
  const [abholtermin, setAbholtermin] = useState('');

  // Clone-Logik: Deal duplizieren
  const [cloneLoaded, setCloneLoaded] = useState(false);
  useEffect(() => {
    if (!cloneFromId || cloneLoaded) return;

    const sourceDeal = dealsCollection.getById(cloneFromId);
    if (!sourceDeal) return;

    // Load source articles
    const allArticles = dealArticlesCollection.getAll();
    const sourceArticles = allArticles.filter(a => a.dealId === cloneFromId);

    // Prefill states
    setVerkaeuferId(sourceDeal.verkaeuferId);
    setKaeuferId(sourceDeal.kaeuferId);
    setProvisionRate(sourceDeal.provisionRate * 100);
    setZahlungsbedingung(sourceDeal.zahlungsbedingung);
    setLieferbedingung(sourceDeal.lieferbedingung);

    // Map articles to LocalArticle format
    const clonedArticles: LocalArticle[] = sourceArticles.map(art => ({
      artikelname: art.artikelname,
      marke: art.marke,
      ean: art.ean,
      mhd: art.mhd,
      ekPreis: art.ekPreis,
      uvp: art.uvp,
      vkPreis: art.vkPreis,
      stueckProKarton: art.stueckProKarton,
      kartonsProPalette: art.kartonsProPalette,
      mengeKartons: art.mengeKartons,
      mengePaletten: art.mengePaletten,
      gewicht: art.gewicht,
      category: art.category,
      beschreibung: art.beschreibung || '',
      imageUrl: art.imageUrl || '',
      imageData: art.imageData || '',
      mhdStatus: (art.mhdStatus || 'green') as 'green' | 'yellow' | 'red',
      status: 'available',
    }));

    setArticles(clonedArticles);
    setStep(2); // Jump to article editing
    setCloneLoaded(true);
  }, [cloneFromId, cloneLoaded]);

  // Filtered partners
  const verkaeuferList = partners.filter(p => p.rolle === 'verkaeufer' || p.rolle === 'beides');
  const kaeuferList = partners.filter(p => p.rolle === 'kaeufer' || p.rolle === 'beides');

  // Article helpers
  const updateArticle = (index: number, updates: Partial<LocalArticle>) => {
    setArticles(prev => prev.map((a, i) => {
      if (i !== index) return a;
      const updated = { ...a, ...updates };
      // Auto-calculate mhdStatus when MHD changes
      if (updates.mhd !== undefined) {
        updated.mhdStatus = updates.mhd ? getMhdStatus(updates.mhd) as 'green' | 'yellow' | 'red' : 'green';
      }
      // Auto-suggest VK when EK/UVP/MHD change
      if ((updates.ekPreis !== undefined || updates.uvp !== undefined || updates.mhd !== undefined) && updated.mhd && updated.ekPreis > 0 && updated.uvp > 0) {
        const mhdResult = calculateMhdPrice(updated.ekPreis, updated.uvp, updated.mhd);
        updated.vkPreis = mhdResult.suggestedVkMid;
      }
      return updated;
    }));
  };

  const addArticle = () => {
    setArticles(prev => [...prev, { ...EMPTY_ARTICLE }]);
  };

  const removeArticle = (index: number) => {
    setArticles(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = (index: number, file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return; // max 5MB
    compressImage(file, 800, 800, 0.8).then(dataUrl => {
      updateArticle(index, { imageData: dataUrl });
    });
  };

  const handleEanFound = (index: number, product: EanProduct) => {
    updateArticle(index, {
      artikelname: product.produktname,
      marke: product.marke,
      ean: product.ean,
      gewicht: product.gewicht,
      category: product.kategorie,
      imageUrl: product.imageUrl,
    });
  };

  // Map extracted article to local format
  const mapExtractedToLocal = (ext: ExtractedArticle): LocalArticle => {
    const mhdStatus = ext.mhd ? getMhdStatus(ext.mhd) as 'green' | 'yellow' | 'red' : 'green';
    let vkPreis = 0;
    if (ext.ekPreis > 0) {
      vkPreis = ext.ekPreis; // At least EK, adjusted in Step 2
    }
    return {
      artikelname: ext.artikelname || '',
      marke: '',
      ean: ext.ean || '',
      mhd: ext.mhd || '',
      ekPreis: ext.ekPreis || 0,
      uvp: 0,
      vkPreis,
      stueckProKarton: ext.stueckProKarton || 1,
      kartonsProPalette: ext.kartonsProPalette || 1,
      mengeKartons: ext.einheit?.toLowerCase().includes('karton') ? ext.menge : 0,
      mengePaletten: ext.einheit?.toLowerCase().includes('palet') ? ext.menge : 1,
      gewicht: ext.gewicht ? String(ext.gewicht) : '',
      category: (ext.category || 'other') as ArticleCategory,
      beschreibung: ext.beschreibung || '',
      imageUrl: '',
      imageData: '',
      mhdStatus,
      status: 'available',
    };
  };

  // Handle file upload with KI extraction
  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setIsExtracting(true);
    setExtractionError('');
    setExtractionSuccess('');

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let extracted: LocalArticle[] = [];

      if (['xlsx', 'xls', 'csv'].includes(ext)) {
        // Excel: client-side parsing, no API key needed
        const result = await parseExcelFile(file);
        extracted = result.articles.map(mapExtractedToLocal);
      } else if (ext === 'pdf') {
        // PDF: Gemini AI extraction (needs API key)
        const base64 = await fileToBase64(file);
        const mimeType = file.type || 'application/pdf';
        const result = await extractFromDocument(base64, mimeType, file.name);
        extracted = result.articles.map(mapExtractedToLocal);
      }

      if (extracted.length > 0) {
        setArticles(extracted);
        setExtractionSuccess(`${extracted.length} Artikel extrahiert`);
        setStep(2); // Auto-advance to article editing
      } else {
        setExtractionError('Keine Artikel gefunden. Bitte manuell eingeben.');
      }
    } catch (err: any) {
      console.error('Extraction error:', err);
      setExtractionError(err.message || 'Extraktion fehlgeschlagen. Bitte manuell eingeben.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Calculations for Step 3/4
  const dealArticlesForCalc: DealArticle[] = useMemo(() => {
    return articles.map((a, i) => ({
      id: `temp-${i}`,
      dealId: '',
      ...a,
      eanKarton: '',
      staffelPreise: [],
    }));
  }, [articles]);

  const totals = useMemo(() => calculateDealTotals(dealArticlesForCalc), [dealArticlesForCalc]);
  const kaeufer = partners.find(p => p.id === kaeuferId);
  const verkaeufer = partners.find(p => p.id === verkaeuferId);
  const rateDecimal = provisionRate / 100;

  const vatType = kaeufer ? determineVatType(kaeufer.land, kaeufer.uidNummer) : 'standard';
  const vat = calculateVat(totals.subtotalNetto, vatType);
  const commission = calculateCommission(totals.subtotalNetto, rateDecimal);

  // Step validation
  const canProceed = (s: number): boolean => {
    switch (s) {
      case 1: return !!verkaeuferId;
      case 2: return articles.length > 0 && articles.every(a => a.artikelname.trim() !== '' && a.ekPreis > 0);
      case 3: return !!kaeuferId;
      default: return true;
    }
  };

  // Save deal
  const handleSave = () => {
    const dealId = generateDealId();

    // Save articles
    const articleIds: string[] = [];
    for (const art of articles) {
      const id = dealArticlesCollection.add({
        dealId,
        artikelname: art.artikelname,
        marke: art.marke,
        beschreibung: art.beschreibung,
        ean: art.ean,
        eanKarton: '',
        mhd: art.mhd,
        mhdStatus: art.mhdStatus,
        imageUrl: art.imageUrl,
        imageData: art.imageData || undefined,
        stueckProKarton: art.stueckProKarton,
        kartonsProPalette: art.kartonsProPalette,
        gewicht: art.gewicht,
        category: art.category,
        mengeKartons: art.mengeKartons,
        mengePaletten: art.mengePaletten,
        ekPreis: art.ekPreis,
        uvp: art.uvp,
        vkPreis: art.vkPreis,
        staffelPreise: [],
        status: art.status,
      } as Omit<DealArticle, 'id'>);
      articleIds.push(id);
    }

    // Save deal
    const newDeal: Omit<Deal, 'id'> & { id: string } = {
      id: dealId,
      verkaeuferId,
      kaeuferId,
      articleIds,
      status: 'draft' as const,
      subtotalNetto: totals.subtotalNetto,
      mwstType: vatType,
      mwstRate: vat.rate,
      mwstAmount: vat.amount,
      totalBrutto: vat.total,
      provisionRate: rateDecimal,
      provisionAmount: commission.provisionNetto,
      zahlungsbedingung,
      lieferbedingung,
      abholtermin: abholtermin || undefined,
      angebotNr: dealIdToDocNr(dealId, 'angebot'),
      bestellbestaetigungNr: '',
      auftragsbestaetigungNr: '',
      rechnungNr: '',
      provisionsrechnungNr: '',
      notizen: '',
      createdAt: new Date().toISOString(),
    };
    dealsCollection.add(newDeal as Omit<Deal, 'id'>);

    const vkName = partners.find(p => p.id === verkaeuferId)?.firmenname ?? '';
    const kfName = partners.find(p => p.id === kaeuferId)?.firmenname ?? '';
    logActivity('deal_created', 'Neuer Deal erstellt', `${dealId} — ${vkName} → ${kfName}`, { dealId });

    navigate(`/admin/deals/${dealId}`);
  };

  return (
    <div>
      <PageHeader
        title="Neuer Deal"
        subtitle="Deal in 4 Schritten erstellen"
        backTo="/admin/deals"
        breadcrumbs={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Deals', to: '/admin/deals' },
          { label: 'Neuer Deal' },
        ]}
      />

      {/* Step Indicator */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.nr} className="flex items-center flex-1">
            <div
              className={`flex items-center gap-2 px-3 py-2 w-full transition-all ${
                step === s.nr
                  ? 'bg-[#111113] text-[#ffffff]'
                  : step > s.nr
                    ? 'bg-[#8cc63f] text-[#111113]'
                    : 'bg-gray-100 text-gray-400'
              } ${i === 0 ? 'rounded-l' : ''} ${i === STEPS.length - 1 ? 'rounded-r' : ''}`}
            >
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">
                {step > s.nr ? <CheckCircle size={14} /> : s.nr}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] hidden md:block">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* STEP 1: Verkäufer + Upload */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-[#ffffff] border border-gray-200 p-6">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#111113] mb-2">
              Verkäufer auswählen
            </label>
            <select
              value={verkaeuferId}
              onChange={e => setVerkaeuferId(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 py-2.5 px-3 text-sm focus:border-[#111113] focus:outline-none"
            >
              <option value="">— Verkäufer wählen —</option>
              {verkaeuferList.map(p => (
                <option key={p.id} value={p.id}>{p.firmenname} ({p.ort})</option>
              ))}
            </select>
          </div>

          <div className="bg-[#ffffff] border border-gray-200 p-6">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#111113] mb-2">
              Artikelliste hochladen
            </label>
            <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
              <Upload size={12} /> KI-Extraktion verfügbar (Excel sofort, PDF via Gemini AI)
            </p>
            <FileUploadZone
              accept=".pdf,.xlsx,.xls,.csv"
              onFile={handleFileUpload}
              label="PDF oder Excel hochladen"
              hint="Artikelliste als PDF oder Excel — wird automatisch extrahiert"
              currentFile={uploadedFile ? { name: uploadedFile.name } : null}
              onRemove={() => { setUploadedFile(null); setExtractionError(''); setExtractionSuccess(''); }}
            />

            {/* Extraction Loading */}
            {isExtracting && (
              <div className="mt-3 flex items-center gap-2 text-[#111113] bg-[#ffffff] px-4 py-3 border border-[#8cc63f]/20">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Extrahiere Artikel...</span>
              </div>
            )}

            {/* Extraction Error */}
            {extractionError && (
              <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 border border-red-200">
                <AlertCircle size={14} />
                <span className="text-xs">{extractionError}</span>
              </div>
            )}

            {/* Extraction Success */}
            {extractionSuccess && (
              <div className="mt-3 flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-3 border border-emerald-200">
                <CheckCircle size={14} />
                <span className="text-xs font-bold">{extractionSuccess}</span>
              </div>
            )}

            <div className="mt-4 text-center">
              <span className="text-xs text-gray-400">oder</span>
            </div>

            <button
              onClick={() => { addArticle(); setStep(2); }}
              disabled={isExtracting}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-600 px-5 py-3 text-[11px] font-black uppercase tracking-[0.1em] hover:border-[#111113] hover:text-[#111113] transition-all disabled:opacity-30"
            >
              <Plus size={14} />
              Manuell eingeben
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Artikel bearbeiten */}
      {step === 2 && (
        <div className="space-y-4">
          {articles.map((art, index) => (
            <div key={index} className="bg-[#ffffff] border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                  Position {index + 1}
                </span>
                <button
                  onClick={() => removeArticle(index)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Row 1: Name, Brand, EAN */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <div className="md:col-span-1">
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Artikelname</label>
                  <input
                    type="text"
                    value={art.artikelname}
                    onChange={e => updateArticle(index, { artikelname: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 py-2 px-3 text-sm focus:border-[#111113] focus:outline-none"
                    placeholder="z.B. Barilla Spaghetti"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Marke</label>
                  <input
                    type="text"
                    value={art.marke}
                    onChange={e => updateArticle(index, { marke: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 py-2 px-3 text-sm focus:border-[#111113] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">EAN</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={art.ean}
                      onChange={e => updateArticle(index, { ean: e.target.value })}
                      className="flex-1 bg-gray-50 border border-gray-200 py-2 px-3 text-sm font-mono focus:border-[#111113] focus:outline-none"
                      placeholder="EAN-13"
                    />
                  </div>
                  <div className="mt-1">
                    <EanLookup onProductFound={(product) => handleEanFound(index, product)} />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">MHD</label>
                  <input
                    type="date"
                    value={art.mhd}
                    onChange={e => updateArticle(index, { mhd: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 py-2 px-3 text-sm focus:border-[#111113] focus:outline-none"
                  />
                  {art.mhd && <div className="mt-1"><MhdBadge mhd={art.mhd} /></div>}
                </div>
              </div>

              {/* Row 2: Prices */}
              <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">EK</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={art.ekPreis}
                    onChange={e => updateArticle(index, { ekPreis: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border border-gray-200 py-2 px-3 text-sm font-mono focus:border-[#111113] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">UVP</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={art.uvp}
                    onChange={e => updateArticle(index, { uvp: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border border-gray-200 py-2 px-3 text-sm font-mono focus:border-[#111113] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">VK</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={art.vkPreis}
                    onChange={e => updateArticle(index, { vkPreis: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-gray-50 border border-gray-200 py-2 px-3 text-sm font-mono font-bold text-[#111113] focus:border-[#111113] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Marge</label>
                  <p className={`py-2 px-3 text-sm font-mono font-bold ${art.vkPreis - art.ekPreis >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(art.vkPreis - art.ekPreis)} ({art.vkPreis > 0 ? formatPercent(((art.vkPreis - art.ekPreis) / art.vkPreis) * 100) : '0,0 %'})
                  </p>
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Stk/Kt</label>
                  <input
                    type="number"
                    min="1"
                    value={art.stueckProKarton}
                    onChange={e => updateArticle(index, { stueckProKarton: parseInt(e.target.value) || 1 })}
                    className="w-full bg-gray-50 border border-gray-200 py-2 px-3 text-sm font-mono focus:border-[#111113] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Kt/Pal</label>
                  <input
                    type="number"
                    min="1"
                    value={art.kartonsProPalette}
                    onChange={e => updateArticle(index, { kartonsProPalette: parseInt(e.target.value) || 1 })}
                    className="w-full bg-gray-50 border border-gray-200 py-2 px-3 text-sm font-mono focus:border-[#111113] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Kartons</label>
                    <input
                      type="number"
                      min="0"
                      value={art.mengeKartons}
                      onChange={e => updateArticle(index, { mengeKartons: parseInt(e.target.value) || 0 })}
                      className="w-full bg-gray-50 border border-gray-200 py-2 px-3 text-sm font-mono focus:border-[#111113] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Paletten</label>
                    <input
                      type="number"
                      min="0"
                      value={art.mengePaletten}
                      onChange={e => updateArticle(index, { mengePaletten: parseInt(e.target.value) || 0 })}
                      className="w-full bg-gray-50 border border-gray-200 py-2 px-3 text-sm font-mono focus:border-[#111113] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Image Upload */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Produktfoto</label>
                <div className="flex items-center gap-3">
                  {art.imageData ? (
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <img src={art.imageData} alt={art.artikelname} className="w-16 h-16 object-contain border border-gray-200 rounded bg-[#ffffff]" />
                      <button
                        onClick={() => updateArticle(index, { imageData: '' })}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : art.imageUrl ? (
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <img src={art.imageUrl} alt={art.artikelname} className="w-16 h-16 object-contain border border-gray-200 rounded bg-[#ffffff]" />
                    </div>
                  ) : null}
                  <label className="inline-flex items-center gap-2 border border-dashed border-gray-300 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:border-[#111113] hover:text-[#111113] transition-all cursor-pointer">
                    <Camera size={14} />
                    {art.imageData ? 'Foto ändern' : 'Foto hochladen'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(index, file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  <span className="text-[10px] text-gray-300">max. 5 MB</span>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addArticle}
            className="w-full inline-flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 text-gray-400 px-5 py-4 text-[11px] font-black uppercase tracking-[0.1em] hover:border-[#111113] hover:text-[#111113] transition-all"
          >
            <Plus size={14} />
            Artikel hinzufügen
          </button>
        </div>
      )}

      {/* STEP 3: Käufer + Konditionen */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-[#ffffff] border border-gray-200 p-6">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#111113] mb-2">
              Käufer auswählen
            </label>
            <select
              value={kaeuferId}
              onChange={e => setKaeuferId(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 py-2.5 px-3 text-sm focus:border-[#111113] focus:outline-none"
            >
              <option value="">— Käufer wählen —</option>
              {kaeuferList.map(p => (
                <option key={p.id} value={p.id}>{p.firmenname} ({p.ort}, {p.land})</option>
              ))}
            </select>
          </div>

          <div className="bg-[#ffffff] border border-gray-200 p-6">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#111113] mb-4">Konditionen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  Provisions-Rate (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={provisionRate}
                  onChange={e => setProvisionRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-50 border border-gray-200 py-2.5 px-3 text-sm font-mono focus:border-[#111113] focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Standard: {formatPercent(settings.defaultProvisionRate * 100)}</p>
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  Zahlungsbedingung
                </label>
                <input
                  type="text"
                  value={zahlungsbedingung}
                  onChange={e => setZahlungsbedingung(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 py-2.5 px-3 text-sm focus:border-[#111113] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  Lieferbedingung
                </label>
                <input
                  type="text"
                  value={lieferbedingung}
                  onChange={e => setLieferbedingung(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 py-2.5 px-3 text-sm focus:border-[#111113] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  Abholtermin (optional)
                </label>
                <input
                  type="date"
                  value={abholtermin}
                  onChange={e => setAbholtermin(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 py-2.5 px-3 text-sm focus:border-[#111113] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-[#ffffff] border border-[#8cc63f]/30 p-6">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#111113] mb-4">Zusammenfassung</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Netto</p>
                <p className="text-lg font-black font-mono">{formatCurrency(totals.subtotalNetto)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">MwSt ({formatPercent(vat.rate * 100)})</p>
                <p className="text-lg font-black font-mono">{formatCurrency(vat.amount)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Brutto</p>
                <p className="text-lg font-black font-mono text-[#111113]">{formatCurrency(vat.total)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Provision ({formatPercent(provisionRate)})</p>
                <p className="text-lg font-black font-mono text-emerald-600">{formatCurrency(commission.provisionNetto)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Vorschau + Speichern */}
      {step === 4 && (
        <div className="space-y-6">
          {/* Deal Summary */}
          <div className="bg-[#ffffff] border border-gray-200 p-6">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#111113] mb-4">Deal-Zusammenfassung</h3>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Verkäufer</p>
                <p className="text-sm font-bold">{verkaeufer?.firmenname ?? '—'}</p>
                <p className="text-xs text-gray-400">{verkaeufer?.ort}, {verkaeufer?.land}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Käufer</p>
                <p className="text-sm font-bold">{kaeufer?.firmenname ?? '—'}</p>
                <p className="text-xs text-gray-400">{kaeufer?.ort}, {kaeufer?.land}</p>
              </div>
            </div>

            {/* Articles summary table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-[0.08em] text-gray-400">Pos</th>
                    <th className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-[0.08em] text-gray-400">Artikel</th>
                    <th className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-[0.08em] text-gray-400">MHD</th>
                    <th className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-[0.08em] text-gray-400">Menge</th>
                    <th className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-[0.08em] text-gray-400">EK</th>
                    <th className="px-3 py-2 text-left text-[9px] font-semibold uppercase tracking-[0.08em] text-gray-400">VK</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((art, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2 text-sm font-bold">
                        <div className="flex items-center gap-2">
                          {(art.imageData || art.imageUrl) && (
                            <img src={art.imageData || art.imageUrl} alt="" className="w-8 h-8 object-contain rounded border border-gray-100" />
                          )}
                          <span>{art.artikelname} <span className="text-gray-400 font-normal">{art.marke}</span></span>
                        </div>
                      </td>
                      <td className="px-3 py-2">{art.mhd ? <MhdBadge mhd={art.mhd} /> : '—'}</td>
                      <td className="px-3 py-2 text-sm font-mono">{art.mengePaletten} Pal + {art.mengeKartons} Kt</td>
                      <td className="px-3 py-2 text-sm font-mono">{formatCurrency(art.ekPreis)}</td>
                      <td className="px-3 py-2 text-sm font-mono font-bold">{formatCurrency(art.vkPreis)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Netto</p>
                <p className="text-lg font-black font-mono">{formatCurrency(totals.subtotalNetto)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">MwSt</p>
                <p className="text-lg font-black font-mono">{formatCurrency(vat.amount)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Brutto</p>
                <p className="text-lg font-black font-mono text-[#111113]">{formatCurrency(vat.total)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Provision</p>
                <p className="text-lg font-black font-mono text-emerald-600">{formatCurrency(commission.provisionNetto)}</p>
              </div>
            </div>

            {/* Conditions */}
            <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Zahlung</p>
                <p>{zahlungsbedingung}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Lieferung</p>
                <p>{lieferbedingung}</p>
              </div>
              {abholtermin && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Abholung</p>
                  <p>{abholtermin}</p>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#111113] text-[#ffffff] px-6 py-4 text-[11px] font-black uppercase tracking-[0.1em] hover:bg-[#8cc63f] hover:text-[#111113] transition-all"
          >
            <Save size={16} />
            Deal erstellen
          </button>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        {step > 1 ? (
          <button
            onClick={() => setStep(s => s - 1)}
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] hover:border-[#111113] hover:text-[#111113] transition-all"
          >
            <ArrowLeft size={14} />
            Zurück
          </button>
        ) : (
          <div />
        )}

        {step < 4 && (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed(step)}
            className="inline-flex items-center gap-2 bg-[#111113] text-[#ffffff] px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] hover:bg-[#8cc63f] hover:text-[#111113] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Weiter
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
