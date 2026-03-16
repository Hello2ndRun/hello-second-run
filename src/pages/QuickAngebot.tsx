// ════════════════════════════════════════════════════════════
// QUICK ANGEBOT — Sonderposten-Angebot in 30 Sekunden
// Kein Login. Kein Account. Sofort loslegen.
// ════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Plus, Trash2, ChevronDown, ChevronUp, Download,
  Mail, MessageCircle, FileText, Loader2, Package, AlertTriangle,
  Heart, Camera, X, User, Building2, MapPin, Send, Eye, ArrowRight,
  Upload, CheckCircle, Globe, Zap, Clock, Shield,
} from 'lucide-react';
import { lookupEan } from '../lib/eanLookup';
import { getMhdStatus, getDaysRemaining, calculateMhdPrice, getMhdColorClasses } from '../lib/mhdCalculator';
import { formatCurrency, formatRestlaufzeit } from '../lib/formatters';
import {
  generateQuickAngebotPdf,
  type QuickArticle,
  type QuickSender,
  type QuickRecipient,
  type QuickKonditionen,
} from '../lib/quickPdfGenerator';
import { extractFromDocument, fileToBase64 } from '../lib/pdfExtractor';
import { parseExcelFile } from '../lib/excelParser';
import { lookupUvp } from '../lib/uvpLookup';
import { generateDocument } from '../lib/documentGenerator';
import { generateDealId, dealIdToDocNr } from '../lib/dealNumbering';
import type { Deal, DealArticle, Partner, DocumentType } from '../types';

// ─── localStorage keys ───
const LS_SENDER = 'hsr_sender';
const LS_RECIPIENTS = 'hsr_recipients';
const LS_PRODUCTS = 'hsr_products';
const LS_DOC_COUNT = 'hsr_doc_count';

// ─── Shared input class (brand style) ───
const INPUT_CLASS = 'w-full px-3 py-2.5 border border-gray-200 text-sm focus:ring-2 focus:ring-[#8cc63f] focus:border-transparent outline-none bg-white';

// ─── Helpers ───
function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveJson(key: string, data: any): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function getArticleStueck(art: QuickArticle): number {
  const fromKartons = art.mengeKartons * art.stueckProKarton;
  const fromPaletten = art.mengePaletten * art.kartonsProPalette * art.stueckProKarton;
  return fromKartons + fromPaletten;
}

// ─── Default empty article ───
function createEmptyArticle(): QuickArticle {
  return {
    id: generateId(),
    artikelname: '', marke: '', ean: '', imageUrl: '', imageData: '',
    mhd: '', gewicht: '', category: 'food',
    mengeKartons: 0, stueckProKarton: 1,
    mengePaletten: 0, kartonsProPalette: 0,
    ekPreis: 0, uvpPreis: 0, vkPreis: 0,
  };
}

// ═══════════════════════════════════════════════
// ARTICLE ROW COMPONENT
// ═══════════════════════════════════════════════

interface ArticleRowProps {
  article: QuickArticle;
  index: number;
  onChange: (id: string, updates: Partial<QuickArticle>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

const ArticleRow = React.memo(function ArticleRow({ article, index, onChange, onRemove, canRemove }: ArticleRowProps) {
  const [eanLoading, setEanLoading] = useState(false);
  const [eanNotFound, setEanNotFound] = useState(false);
  const [uvpLoading, setUvpLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const eanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // EAN auto-lookup with debounce
  const handleEanChange = useCallback((value: string) => {
    onChange(article.id, { ean: value });
    setEanNotFound(false);

    if (eanTimeoutRef.current) clearTimeout(eanTimeoutRef.current);

    const clean = value.replace(/[\s-]/g, '');
    if (clean.length >= 8) {
      setEanLoading(true);
      eanTimeoutRef.current = setTimeout(async () => {
        const result = await lookupEan(clean);
        setEanLoading(false);
        if (result) {
          onChange(article.id, {
            artikelname: result.produktname,
            marke: result.marke,
            gewicht: result.gewicht,
            category: result.kategorie,
            imageUrl: result.imageUrl,
          });
          setEanNotFound(false);
          // Auto-lookup UVP
          setUvpLoading(true);
          lookupUvp(result.produktname, result.marke, result.gewicht, clean).then(uvpResult => {
            setUvpLoading(false);
            if (uvpResult.uvp !== null) {
              onChange(article.id, { uvpPreis: uvpResult.uvp });
            }
          }).catch(() => setUvpLoading(false));
          // Cache product
          const cached = loadJson<any[]>(LS_PRODUCTS, []);
          const exists = cached.find((p: any) => p.ean === clean);
          if (!exists) {
            cached.unshift({ ean: clean, ...result });
            saveJson(LS_PRODUCTS, cached.slice(0, 20));
          }
        } else {
          setEanNotFound(true);
        }
      }, 600);
    }
  }, [article.id, onChange]);

  // Auto-calculate VK when EK, UVP and MHD are set
  useEffect(() => {
    if (article.ekPreis > 0 && article.uvpPreis > 0 && article.mhd) {
      const result = calculateMhdPrice(article.ekPreis, article.uvpPreis, article.mhd);
      // Only auto-set if VK is 0 (not manually edited)
      if (article.vkPreis === 0) {
        onChange(article.id, { vkPreis: result.suggestedVkMid });
      }
    }
  }, [article.ekPreis, article.uvpPreis, article.mhd]);

  const mhdStatus = article.mhd ? getMhdStatus(article.mhd) : null;
  const mhdColors = mhdStatus ? getMhdColorClasses(mhdStatus) : null;
  const daysRemaining = article.mhd ? getDaysRemaining(article.mhd) : null;
  const stueck = getArticleStueck(article);
  const lineTotal = article.vkPreis * stueck;
  const margin = article.vkPreis > 0 && article.ekPreis > 0
    ? { eur: article.vkPreis - article.ekPreis, pct: ((article.vkPreis - article.ekPreis) / article.vkPreis * 100) }
    : null;

  return (
    <div className="bg-white border border-gray-200 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5 bg-gray-50/80 cursor-pointer hover:bg-gray-100/80 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 bg-[#1a472a] text-white flex items-center justify-center text-[10px] font-black">
            {index + 1}
          </span>
          <span className="font-black text-[13px] uppercase tracking-[0.05em] text-gray-900">
            {article.artikelname || 'Neuer Artikel'}
          </span>
          {article.marke && <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{article.marke}</span>}
          {mhdStatus && mhdColors && (
            <span className={`text-[10px] px-2 py-0.5 font-bold ${mhdColors.bg} ${mhdColors.text}`}>
              {daysRemaining !== null && daysRemaining > 0 ? formatRestlaufzeit(article.mhd) : 'ABGELAUFEN'}
            </span>
          )}
          {lineTotal > 0 && (
            <span className="text-[11px] font-black text-[#1a472a] ml-2">{formatCurrency(lineTotal)}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canRemove && (
            <button
              onClick={e => { e.stopPropagation(); onRemove(article.id); }}
              className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
          {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="p-5 space-y-5">
          {/* EAN Row */}
          <div className="flex gap-4 items-start">
            {/* Product Image */}
            <div className="w-16 h-16 bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
              {article.imageUrl ? (
                <img src={article.imageUrl} alt={article.artikelname} loading="lazy" className="w-full h-full object-contain" />
              ) : (
                <Package size={24} className="text-gray-300" />
              )}
            </div>

            <div className="flex-1 space-y-3">
              {/* EAN */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">EAN / Barcode</label>
                <div className="relative">
                  <input
                    type="text"
                    value={article.ean}
                    onChange={e => handleEanChange(e.target.value)}
                    placeholder="z.B. 8076800195057"
                    className={`${INPUT_CLASS} pr-10`}
                  />
                  {eanLoading && (
                    <Loader2 size={16} className="absolute right-3 top-3 text-[#8cc63f] animate-spin" />
                  )}
                  {!eanLoading && article.ean.length >= 8 && !eanNotFound && article.artikelname && (
                    <span className="absolute right-3 top-2.5 text-green-500 text-sm">✓</span>
                  )}
                </div>
                {eanNotFound && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mt-1">Nicht gefunden — bitte manuell eingeben</p>
                )}
              </div>

              {/* Name + Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Produktname *</label>
                  <input
                    type="text"
                    value={article.artikelname}
                    onChange={e => onChange(article.id, { artikelname: e.target.value })}
                    placeholder="z.B. Barilla Spaghetti No.5"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Marke</label>
                  <input
                    type="text"
                    value={article.marke}
                    onChange={e => onChange(article.id, { marke: e.target.value })}
                    placeholder="z.B. Barilla"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MHD */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">MHD (Mindesthaltbarkeitsdatum)</label>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={article.mhd}
                onChange={e => onChange(article.id, { mhd: e.target.value })}
                className={`${INPUT_CLASS} w-auto`}
              />
              {mhdStatus && mhdColors && (
                <div className={`flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${mhdColors.bg} ${mhdColors.text}`}>
                  <span className={`w-2 h-2 rounded-full ${mhdColors.dot}`} />
                  {daysRemaining !== null && daysRemaining > 0
                    ? `${daysRemaining} Tage · ${formatRestlaufzeit(article.mhd)}`
                    : 'Abgelaufen'}
                </div>
              )}
            </div>
            {/* Donation hint for red/expired */}
            {mhdStatus && (mhdStatus === 'red' || mhdStatus === 'expired') && (
              <div className="mt-2 flex items-start gap-2 text-[10px] font-bold text-red-600 bg-red-50 px-3 py-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>
                  Kurzes MHD. Nicht verkäuflich? →{' '}
                  <a href="https://www.tafel.at" target="_blank" rel="noopener noreferrer" className="underline font-black hover:text-red-700">
                    Spende an eine Tafel vorschlagen
                  </a>
                </span>
              </div>
            )}
          </div>

          {/* Mengen */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Menge</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Kartons</label>
                <input
                  type="number" min="0"
                  value={article.mengeKartons || ''}
                  onChange={e => onChange(article.id, { mengeKartons: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Stk/Karton</label>
                <input
                  type="number" min="1"
                  value={article.stueckProKarton || ''}
                  onChange={e => onChange(article.id, { stueckProKarton: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Paletten</label>
                <input
                  type="number" min="0"
                  value={article.mengePaletten || ''}
                  onChange={e => onChange(article.id, { mengePaletten: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Krt/Palette</label>
                <input
                  type="number" min="0"
                  value={article.kartonsProPalette || ''}
                  onChange={e => onChange(article.id, { kartonsProPalette: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            {stueck > 0 && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-1.5">
                = <span className="font-black text-[#1a472a]">{stueck.toLocaleString('de-AT')}</span> Stück gesamt
              </p>
            )}
          </div>

          {/* Preise */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Preise (pro Stück)</label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">EK (€) *</label>
                <input
                  type="number" min="0" step="0.01"
                  value={article.ekPreis || ''}
                  onChange={e => onChange(article.id, { ekPreis: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  className={INPUT_CLASS}
                />
              </div>
              <div className="relative">
                <label className="block text-[10px] text-gray-400 mb-0.5">UVP (€)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={article.uvpPreis || ''}
                  onChange={e => onChange(article.id, { uvpPreis: parseFloat(e.target.value) || 0 })}
                  placeholder="optional"
                  className={INPUT_CLASS}
                />
                {uvpLoading && <Loader2 size={14} className="absolute right-2 top-7 text-[#8cc63f] animate-spin" />}
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">VK (€) *</label>
                <input
                  type="number" min="0" step="0.01"
                  value={article.vkPreis || ''}
                  onChange={e => onChange(article.id, { vkPreis: parseFloat(e.target.value) || 0 })}
                  placeholder="0,00"
                  className={`${INPUT_CLASS} font-bold text-[#1a472a]`}
                />
              </div>
            </div>
            {/* Margin display */}
            {margin && margin.eur > 0 && (
              <div className="mt-2 flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                <span className="text-green-700 bg-green-50 px-2.5 py-1">
                  Marge: {formatCurrency(margin.eur)} ({margin.pct.toFixed(1)}%)
                </span>
                {stueck > 0 && (
                  <span className="text-gray-500">
                    Gesamt: <span className="font-black text-[#1a472a]">{formatCurrency(lineTotal)}</span>
                  </span>
                )}
              </div>
            )}
            {margin && margin.eur <= 0 && article.vkPreis > 0 && (
              <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-red-500">⚠ VK unter EK — kein Gewinn</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════
// MAIN QUICK ANGEBOT PAGE
// ═══════════════════════════════════════════════

export default function QuickAngebot() {
  // ─── State ───
  const [articles, setArticles] = useState<QuickArticle[]>([createEmptyArticle()]);
  const [sender, setSender] = useState<QuickSender>(() =>
    loadJson<QuickSender>(LS_SENDER, {
      firma: '', kontaktperson: '', adresse: '', plz: '', ort: '', land: 'AT', email: '', telefon: '', uid: '',
    })
  );
  const [recipient, setRecipient] = useState<QuickRecipient>({
    firma: '', kontaktperson: '', adresse: '', email: '',
  });
  const [konditionen, setKonditionen] = useState<QuickKonditionen>({
    zahlungsbedingung: 'Vorkasse',
    lieferbedingung: 'Ab Lager',
    gueltigkeitsTage: 7,
  });
  const [showSender, setShowSender] = useState(false);
  const [showRecipient, setShowRecipient] = useState(false);
  const [showKonditionen, setShowKonditionen] = useState(false);
  const [pdfDataUri, setPdfDataUri] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [uploadDragging, setUploadDragging] = useState(false);
  const [uploadProcessing, setUploadProcessing] = useState(false);
  const [uploadError, setUploadError] = useState('');
  // Document chain
  const [generatedDocs, setGeneratedDocs] = useState<Map<string, string>>(new Map());
  const [dealId] = useState(() => generateDealId());

  // ─── Save sender to localStorage on change ───
  useEffect(() => {
    if (sender.firma || sender.email) {
      saveJson(LS_SENDER, sender);
    }
  }, [sender]);

  // ─── Article handlers ───
  const handleArticleChange = useCallback((id: string, updates: Partial<QuickArticle>) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }, []);

  const handleRemoveArticle = useCallback((id: string) => {
    setArticles(prev => prev.length > 1 ? prev.filter(a => a.id !== id) : prev);
  }, []);

  const handleAddArticle = useCallback(() => {
    setArticles(prev => [...prev, createEmptyArticle()]);
  }, []);

  // ─── File Upload Handler ───
  const handleFileUpload = useCallback(async (file: File) => {
    setUploadProcessing(true);
    setUploadError('');
    try {
      const ext = file.name.toLowerCase().split('.').pop();
      let extractedArticles: any[] = [];

      if (ext === 'pdf' || file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file);
        const result = await extractFromDocument(base64, file.type, file.name);
        extractedArticles = result.articles;
      } else if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
        const result = await parseExcelFile(file);
        extractedArticles = result.articles;
      } else {
        throw new Error('Nicht unterstütztes Format. Bitte PDF, Excel oder CSV hochladen.');
      }

      if (extractedArticles.length === 0) {
        throw new Error('Keine Artikel im Dokument gefunden.');
      }

      // Convert extracted articles to QuickArticle format
      const newArticles: QuickArticle[] = extractedArticles.map((ea: any) => ({
        id: generateId(),
        artikelname: ea.artikelname || '',
        marke: ea.marke || '',
        ean: ea.ean || '',
        imageUrl: '',
        imageData: '',
        mhd: ea.mhd || '',
        gewicht: ea.gewicht ? String(ea.gewicht) : '',
        category: ea.category || 'food',
        mengeKartons: ea.menge || 0,
        stueckProKarton: ea.stueckProKarton || 1,
        mengePaletten: 0,
        kartonsProPalette: ea.kartonsProPalette || 0,
        ekPreis: ea.ekPreis || 0,
        uvpPreis: 0,
        vkPreis: 0,
      }));

      setArticles(newArticles);

      // Auto-lookup EAN + UVP for each article in parallel
      newArticles.forEach((art, idx) => {
        if (art.ean) {
          lookupEan(art.ean).then(eanResult => {
            if (eanResult) {
              handleArticleChange(art.id, {
                artikelname: art.artikelname || eanResult.produktname,
                marke: art.marke || eanResult.marke,
                imageUrl: eanResult.imageUrl,
              });
            }
          });
        }
        // UVP Lookup
        if (art.artikelname) {
          lookupUvp(art.artikelname, art.marke, art.gewicht, art.ean).then(uvpResult => {
            if (uvpResult.uvp !== null) {
              handleArticleChange(art.id, { uvpPreis: uvpResult.uvp });
            }
          });
        }
      });
    } catch (err: any) {
      setUploadError(err.message || 'Fehler beim Verarbeiten der Datei.');
    } finally {
      setUploadProcessing(false);
    }
  }, [handleArticleChange]);

  // ─── Totals ───
  const subtotal = articles.reduce((sum, art) => sum + art.vkPreis * getArticleStueck(art), 0);
  const totalStueck = articles.reduce((sum, art) => sum + getArticleStueck(art), 0);

  // ─── Generate PDF ───
  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      try {
        const dataUri = generateQuickAngebotPdf(articles, sender, recipient, konditionen);
        setPdfDataUri(dataUri);
        // Increment doc count
        const count = parseInt(localStorage.getItem(LS_DOC_COUNT) || '0') + 1;
        localStorage.setItem(LS_DOC_COUNT, String(count));
        // Save recipient to history
        if (recipient.firma || recipient.email) {
          const recipients = loadJson<QuickRecipient[]>(LS_RECIPIENTS, []);
          const exists = recipients.find(r => r.email === recipient.email && r.firma === recipient.firma);
          if (!exists) {
            recipients.unshift(recipient);
            saveJson(LS_RECIPIENTS, recipients.slice(0, 10));
          }
        }
      } catch (err) {
        console.error('PDF generation failed:', err);
        alert('Fehler bei der PDF-Erstellung. Bitte prüfe die Eingaben.');
      }
      setGenerating(false);
    }, 100);
  }, [articles, sender, recipient, konditionen]);

  // ─── Download PDF ───
  const handleDownload = useCallback(() => {
    if (!pdfDataUri) return;
    const link = document.createElement('a');
    link.href = pdfDataUri;
    const produktName = articles[0]?.artikelname || 'Angebot';
    link.download = `Angebot_${produktName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    link.click();
  }, [pdfDataUri, articles]);

  // ─── WhatsApp share ───
  const handleWhatsApp = useCallback(() => {
    const produktName = articles[0]?.artikelname || 'Sonderposten';
    const text = encodeURIComponent(`Hallo! Hier ist ein Angebot für ${produktName} — ${formatCurrency(subtotal)} netto. PDF im Anhang. Erstellt mit HELLO SECOND/RUN.`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, [articles, subtotal]);

  // ─── Email share ───
  const handleEmail = useCallback(() => {
    const produktName = articles[0]?.artikelname || 'Sonderposten';
    const subject = encodeURIComponent(`Angebot ${produktName} — ${sender.firma || 'HELLO SECOND/RUN'}`);
    const body = encodeURIComponent(
      `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie unser Angebot für ${produktName}.\n\nNettobetrag: ${formatCurrency(subtotal)}\n\nBei Fragen stehen wir gerne zur Verfügung.\n\nMit freundlichen Grüßen\n${sender.kontaktperson || ''}\n${sender.firma || ''}\n${sender.telefon || ''}`
    );
    const mailto = `mailto:${recipient.email || ''}?subject=${subject}&body=${body}`;
    window.location.href = mailto;
  }, [articles, subtotal, sender, recipient]);

  // ─── Document Chain Generator ───
  const quickToDocumentData = useCallback((): { deal: Deal; articles: DealArticle[]; verkaeufer: Partner; kaeufer: Partner } => {
    const totalNetto = articles.reduce((sum, art) => sum + art.vkPreis * getArticleStueck(art), 0);
    const mwstRate = 0.20;
    const mwstAmount = Math.round(totalNetto * mwstRate * 100) / 100;

    const deal: Deal = {
      id: dealId,
      verkaeuferId: 'quick-sender',
      kaeuferId: 'quick-recipient',
      articleIds: articles.map(a => a.id),
      status: 'angebot_erstellt',
      subtotalNetto: totalNetto,
      mwstType: 'standard',
      mwstRate,
      mwstAmount,
      totalBrutto: Math.round((totalNetto + mwstAmount) * 100) / 100,
      provisionRate: 0,
      provisionAmount: 0,
      zahlungsbedingung: konditionen.zahlungsbedingung,
      lieferbedingung: konditionen.lieferbedingung,
      angebotNr: dealIdToDocNr(dealId, 'angebot'),
      bestellbestaetigungNr: dealIdToDocNr(dealId, 'bestellbestaetigung'),
      auftragsbestaetigungNr: dealIdToDocNr(dealId, 'auftragsbestaetigung'),
      rechnungNr: dealIdToDocNr(dealId, 'rechnung'),
      provisionsrechnungNr: dealIdToDocNr(dealId, 'provisionsrechnung'),
      notizen: '',
      createdAt: new Date().toISOString(),
    };

    const dealArticles: DealArticle[] = articles.map(a => ({
      id: a.id,
      dealId: dealId,
      artikelname: a.artikelname,
      marke: a.marke,
      beschreibung: '',
      ean: a.ean,
      mhd: a.mhd,
      mhdStatus: a.mhd ? (getMhdStatus(a.mhd) === 'expired' ? 'red' : getMhdStatus(a.mhd)) as 'green' | 'yellow' | 'red' : 'green',
      imageUrl: a.imageUrl,
      imageData: a.imageData,
      stueckProKarton: a.stueckProKarton,
      kartonsProPalette: a.kartonsProPalette,
      gewicht: a.gewicht,
      category: a.category as any,
      mengeKartons: a.mengeKartons,
      mengePaletten: a.mengePaletten,
      ekPreis: a.ekPreis,
      uvp: a.uvpPreis,
      vkPreis: a.vkPreis,
      status: 'available',
    }));

    const verkaeufer: Partner = {
      id: 'quick-sender',
      firmenname: sender.firma || 'Verkäufer',
      adresse: sender.adresse || '',
      plz: sender.plz || '',
      ort: sender.ort || '',
      land: sender.land || 'AT',
      uidNummer: sender.uid || '',
      kontaktperson: sender.kontaktperson || '',
      telefon: sender.telefon || '',
      email: sender.email || '',
      rolle: 'verkaeufer',
      kategorien: [],
      sprache: 'de',
      notizen: '',
      createdAt: new Date().toISOString(),
    };

    const kaeufer: Partner = {
      id: 'quick-recipient',
      firmenname: recipient.firma || 'Käufer',
      adresse: recipient.adresse || '',
      plz: '',
      ort: '',
      land: 'AT',
      uidNummer: '',
      kontaktperson: recipient.kontaktperson || '',
      telefon: '',
      email: recipient.email || '',
      rolle: 'kaeufer',
      kategorien: [],
      sprache: 'de',
      notizen: '',
      createdAt: new Date().toISOString(),
    };

    return { deal, articles: dealArticles, verkaeufer, kaeufer };
  }, [articles, sender, recipient, konditionen, dealId]);

  const handleGenerateChainDoc = useCallback((docType: DocumentType) => {
    try {
      const { deal, articles: dealArticles, verkaeufer, kaeufer } = quickToDocumentData();
      const platform = {
        firmenname: 'HELLO SECOND/RUN', adresse: '', plz: '5020', ort: 'Salzburg',
        land: 'AT', uid: '', email: 'info@hello2ndrun.com', telefon: '', website: 'hello2ndrun.com',
        bankName: '', iban: '', bic: '', logoUrl: '', defaultProvisionRate: 0,
        defaultZahlungsbedingung: 'Vorkasse', defaultLieferbedingung: 'Ab Lager', defaultMwstRate: 0.20,
        emailjsPublicKey: '', emailjsServiceId: '', emailjsTemplateAngebot: '', emailjsTemplateStatus: '', emailjsTemplateKontakt: '',
      };
      const dataUri = generateDocument(docType, deal, dealArticles, verkaeufer, kaeufer, platform);
      setGeneratedDocs(prev => new Map(prev).set(docType, dataUri));
    } catch (err) {
      console.error('Document generation failed:', err);
    }
  }, [quickToDocumentData]);

  const handleDownloadChainDoc = useCallback((docType: DocumentType) => {
    const dataUri = generatedDocs.get(docType);
    if (!dataUri) return;
    const link = document.createElement('a');
    link.href = dataUri;
    const prefixMap: Record<string, string> = {
      auftragsbestaetigung: 'AB', bestellbestaetigung: 'BE', lieferschein: 'LS', rechnung: 'RE',
    };
    link.download = `${prefixMap[docType] || docType}_${dealId}_${new Date().toISOString().slice(0, 10)}.pdf`;
    link.click();
  }, [generatedDocs, dealId]);

  // ─── Validate before generate ───
  const canGenerate = articles.some(a => a.artikelname && a.vkPreis > 0 && getArticleStueck(a) > 0);

  return (
    <div className="bg-white">
      {/* ═══ Hero — Landing Page Style ═══ */}
      <section className="py-16 md:py-24 px-5 md:px-8 relative" style={{
        backgroundImage: 'linear-gradient(to right, #eef2ee 1px, transparent 1px), linear-gradient(to bottom, #eef2ee 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }}>
        <div className="absolute top-12 right-12 w-72 h-72 bg-[#8cc63f]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-12 left-12 w-96 h-96 bg-[#1a472a]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="flex items-center gap-4 justify-center mb-6">
            <div className="h-[2px] w-8 bg-[#1a472a]"></div>
            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-[#1a472a]">Sonderposten-Vermittlung aus Salzburg</span>
            <div className="h-[2px] w-8 bg-[#1a472a]"></div>
          </div>
          <h1 className="font-black text-[clamp(2rem,6vw,4.5rem)] leading-[1.05] uppercase tracking-[-0.03em] mb-6">
            <span className="block">Sonderposten-Angebot</span>
            <span className="block text-[#8cc63f]">in 30 Sekunden.</span>
          </h1>
          <p className="text-lg md:text-xl font-light text-gray-500 max-w-xl mx-auto">
            EAN eingeben. Preis berechnen. PDF verschicken.
          </p>
        </div>
      </section>

      {/* ═══ Main Form ═══ */}
      <main className="max-w-5xl mx-auto px-5 md:px-8 pb-20 pt-8">

        {/* ── TRUST BAR ── */}
        <div className="bg-[#1a472a] p-5 mb-8 flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {[
            { icon: Clock, value: '48h', label: 'Bis zum Angebot' },
            { icon: Globe, value: '500+', label: 'Käufer im Netzwerk' },
            { icon: Shield, value: '0 €', label: 'Keine Kosten' },
            { icon: Zap, value: '100%', label: 'Diskret & schnell' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <item.icon size={16} className="text-[#8cc63f]" />
              <span className="text-sm font-black text-white">{item.value}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">{item.label}</span>
            </div>
          ))}
        </div>

        {/* ── UPLOAD ZONE ── */}
        <div className="mb-8">
          <div
            onDragOver={e => { e.preventDefault(); setUploadDragging(true); }}
            onDragLeave={() => setUploadDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setUploadDragging(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFileUpload(file);
            }}
            className={`border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
              uploadDragging
                ? 'border-[#8cc63f] bg-[#8cc63f]/5'
                : 'border-gray-300 hover:border-[#8cc63f] hover:bg-gray-50'
            }`}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf,.xlsx,.xls,.csv,image/*';
              input.onchange = (e: any) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              };
              input.click();
            }}
          >
            {uploadProcessing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="text-[#8cc63f] animate-spin" />
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#1a472a]">Dokument wird analysiert...</p>
                <p className="text-[10px] font-bold text-gray-400">Claude AI extrahiert Artikeldaten</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload size={32} className="text-gray-400" />
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-700">Preisliste hochladen</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider hidden md:block">PDF, Excel, CSV oder Bild hierher ziehen</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider md:hidden">Tippen um Datei auszuwählen</p>
                <p className="text-[10px] text-gray-400 hidden md:block">oder klicken zum Auswählen</p>
              </div>
            )}
          </div>
          {uploadError && (
            <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-red-600 bg-red-50 px-3 py-2">
              <AlertTriangle size={14} />
              <span>{uploadError}</span>
            </div>
          )}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">oder manuell eingeben</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </div>

        {/* ── ARTIKEL ── */}
        <div className="space-y-4 mb-6">
          {articles.map((art, i) => (
            <ArticleRow
              key={art.id}
              article={art}
              index={i}
              onChange={handleArticleChange}
              onRemove={handleRemoveArticle}
              canRemove={articles.length > 1}
            />
          ))}
        </div>

        <button
          onClick={handleAddArticle}
          className="w-full py-3.5 border-2 border-dashed border-gray-300 text-[11px] font-black uppercase tracking-[0.1em] text-gray-500 hover:border-[#8cc63f] hover:text-[#1a472a] transition-all flex items-center justify-center gap-2 mb-8"
        >
          <Plus size={16} /> Weiteres Produkt hinzufügen
        </button>

        {/* ── ABSENDER ── */}
        <div className="mb-4">
          <button
            onClick={() => setShowSender(!showSender)}
            className="w-full bg-white border border-gray-200 px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-[#1a472a]" />
              <span className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-900">Absender (Deine Firma)</span>
              {sender.firma && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{sender.firma}</span>}
            </div>
            {showSender ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </button>
          {showSender && (
            <div className="bg-white border border-t-0 border-gray-200 p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Firma *" value={sender.firma} onChange={v => setSender(s => ({ ...s, firma: v }))} placeholder="Deine Firma GmbH" />
                <Input label="Kontaktperson" value={sender.kontaktperson} onChange={v => setSender(s => ({ ...s, kontaktperson: v }))} placeholder="Max Mustermann" />
                <Input label="Adresse" value={sender.adresse} onChange={v => setSender(s => ({ ...s, adresse: v }))} placeholder="Musterstraße 1" />
                <div className="grid grid-cols-3 gap-2">
                  <Input label="PLZ" value={sender.plz} onChange={v => setSender(s => ({ ...s, plz: v }))} placeholder="5020" />
                  <div className="col-span-2">
                    <Input label="Ort" value={sender.ort} onChange={v => setSender(s => ({ ...s, ort: v }))} placeholder="Salzburg" />
                  </div>
                </div>
                <Input label="E-Mail" value={sender.email} onChange={v => setSender(s => ({ ...s, email: v }))} placeholder="office@firma.at" type="email" />
                <Input label="Telefon" value={sender.telefon} onChange={v => setSender(s => ({ ...s, telefon: v }))} placeholder="+43 660 ..." />
                <Input label="UID-Nummer" value={sender.uid} onChange={v => setSender(s => ({ ...s, uid: v }))} placeholder="ATU12345678" />
              </div>
            </div>
          )}
        </div>

        {/* ── EMPFÄNGER ── */}
        <div className="mb-4">
          <button
            onClick={() => setShowRecipient(!showRecipient)}
            className="w-full bg-white border border-gray-200 px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <User size={18} className="text-[#1a472a]" />
              <span className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-900">Empfänger</span>
              {recipient.firma && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{recipient.firma}</span>}
            </div>
            {showRecipient ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </button>
          {showRecipient && (
            <div className="bg-white border border-t-0 border-gray-200 p-5 space-y-3">
              {/* Quick select from history */}
              {(() => {
                const savedRecipients = loadJson<QuickRecipient[]>(LS_RECIPIENTS, []);
                if (savedRecipients.length === 0) return null;
                return (
                  <div className="mb-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Letzte Empfänger:</label>
                    <div className="flex flex-wrap gap-2">
                      {savedRecipients.slice(0, 5).map((r, i) => (
                        <button
                          key={i}
                          onClick={() => setRecipient(r)}
                          className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 hover:bg-[#8cc63f]/20 hover:text-[#1a472a] px-2.5 py-1 transition-colors"
                        >
                          {r.firma || r.email}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Firma" value={recipient.firma} onChange={v => setRecipient(r => ({ ...r, firma: v }))} placeholder="Empfänger-Firma" />
                <Input label="Kontaktperson" value={recipient.kontaktperson} onChange={v => setRecipient(r => ({ ...r, kontaktperson: v }))} placeholder="Name" />
                <Input label="E-Mail" value={recipient.email} onChange={v => setRecipient(r => ({ ...r, email: v }))} placeholder="empfaenger@firma.at" type="email" />
                <Input label="Adresse" value={recipient.adresse} onChange={v => setRecipient(r => ({ ...r, adresse: v }))} placeholder="Optional" />
              </div>
            </div>
          )}
        </div>

        {/* ── KONDITIONEN ── */}
        <div className="mb-8">
          <button
            onClick={() => setShowKonditionen(!showKonditionen)}
            className="w-full bg-white border border-gray-200 px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-[#1a472a]" />
              <span className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-900">Konditionen</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{konditionen.zahlungsbedingung} · {konditionen.lieferbedingung}</span>
            </div>
            {showKonditionen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </button>
          {showKonditionen && (
            <div className="bg-white border border-t-0 border-gray-200 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Zahlungsbedingung</label>
                  <select
                    value={konditionen.zahlungsbedingung}
                    onChange={e => setKonditionen(k => ({ ...k, zahlungsbedingung: e.target.value }))}
                    className={INPUT_CLASS}
                  >
                    <option>Vorkasse</option>
                    <option>14 Tage netto</option>
                    <option>30 Tage netto</option>
                    <option>Sofort bei Abholung</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Lieferbedingung</label>
                  <select
                    value={konditionen.lieferbedingung}
                    onChange={e => setKonditionen(k => ({ ...k, lieferbedingung: e.target.value }))}
                    className={INPUT_CLASS}
                  >
                    <option>Ab Lager</option>
                    <option>Frei Haus</option>
                    <option>EXW</option>
                    <option>FCA</option>
                    <option>DAP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">Gültigkeit (Tage)</label>
                  <input
                    type="number" min="1" max="90"
                    value={konditionen.gueltigkeitsTage}
                    onChange={e => setKonditionen(k => ({ ...k, gueltigkeitsTage: parseInt(e.target.value) || 7 }))}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── SUMMARY BAR ── */}
        {subtotal > 0 && (
          <div className="bg-white border border-gray-200 px-5 py-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">{articles.length} Artikel · {totalStueck.toLocaleString('de-AT')} Stk</span>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">Netto Gesamtwert</div>
              <div className="text-2xl font-black text-[#1a472a]">{formatCurrency(subtotal)}</div>
            </div>
          </div>
        )}

        {/* ── GENERATE BUTTON ── */}
        {!pdfDataUri ? (
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            className={`w-full py-4.5 font-black uppercase tracking-[0.1em] text-[12px] flex items-center justify-center gap-3 transition-all duration-300 ${
              canGenerate
                ? 'bg-[#1a472a] hover:bg-[#8cc63f] text-white hover:text-[#1a472a] border-2 border-[#1a472a] hover:border-[#8cc63f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2'
                : 'bg-gray-200 text-gray-400 border-2 border-gray-200 cursor-not-allowed focus-visible:outline-none'
            }`}
          >
            {generating ? (
              <><Loader2 size={18} className="animate-spin" /> Generiere PDF...</>
            ) : (
              <><FileText size={18} /> Angebot erstellen</>
            )}
          </button>
        ) : (
          /* ── PDF PREVIEW + ACTIONS ── */
          <div className="space-y-4">
            {/* PDF Preview */}
            <div className="bg-white border border-gray-200 overflow-hidden">
              <div className="bg-[#1a472a] text-white px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={16} />
                  <span className="text-[11px] font-black uppercase tracking-[0.15em]">PDF-Vorschau</span>
                </div>
                <button
                  onClick={() => setPdfDataUri(null)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <iframe
                src={pdfDataUri}
                className="w-full h-[500px] sm:h-[600px] border-0"
                title="Angebot PDF Vorschau"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleWhatsApp}
                className="py-3.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black uppercase tracking-[0.1em] text-[11px] flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle size={16} /> WhatsApp
              </button>
              <button
                onClick={handleEmail}
                className="py-3.5 px-4 bg-[#1a472a] hover:bg-[#8cc63f] text-white hover:text-[#1a472a] font-black uppercase tracking-[0.1em] text-[11px] flex items-center justify-center gap-2 transition-all"
              >
                <Mail size={16} /> Per E-Mail
              </button>
              <button
                onClick={handleDownload}
                className="py-3.5 px-4 bg-white border-2 border-[#1a472a] hover:bg-[#1a472a] text-[#1a472a] hover:text-white font-black uppercase tracking-[0.1em] text-[11px] flex items-center justify-center gap-2 transition-all"
              >
                <Download size={16} /> PDF Download
              </button>
            </div>

            {/* Email Capture */}
            <div className="bg-[#f7f9f7] border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#1a472a] mb-0.5">Angebot per E-Mail erhalten?</p>
                  <p className="text-[10px] text-gray-500">Wir senden dir eine Kopie — und informieren dich über neue Käufer-Anfragen.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <input
                    type="email"
                    placeholder="deine@email.at"
                    className="flex-1 sm:w-48 px-3 py-2.5 border border-gray-200 text-sm focus:ring-2 focus:ring-[#8cc63f] focus:border-transparent outline-none bg-white"
                  />
                  <button className="px-4 py-2.5 bg-[#8cc63f] text-[#1a472a] text-[10px] font-black uppercase tracking-wider hover:bg-[#1a472a] hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f]">
                    Senden
                  </button>
                </div>
              </div>
            </div>

            {/* New Angebot */}
            <button
              onClick={() => setPdfDataUri(null)}
              className="w-full py-3 text-[11px] font-black uppercase tracking-[0.1em] text-gray-400 hover:text-[#1a472a] transition-colors"
            >
              ← Zurück zum Formular / Neues Angebot
            </button>

            {/* ── DOKUMENTENKETTE ── */}
            <div className="bg-white border border-gray-200 mt-6">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#1a472a]">Dokumentenkette</span>
              </div>
              <div className="p-5 space-y-3">
                {([
                  { type: 'auftragsbestaetigung' as DocumentType, label: 'Auftragsbestätigung (AB)', prefix: 'AB' },
                  { type: 'bestellbestaetigung' as DocumentType, label: 'Bestellbestätigung (BE)', prefix: 'BE' },
                  { type: 'lieferschein' as DocumentType, label: 'Lieferschein (LS)', prefix: 'LS' },
                  { type: 'rechnung' as DocumentType, label: 'Rechnung (RE)', prefix: 'RE' },
                ]).map(doc => {
                  const isGenerated = generatedDocs.has(doc.type);
                  return (
                    <div key={doc.type} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        {isGenerated ? (
                          <CheckCircle size={16} className="text-[#8cc63f]" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300" />
                        )}
                        <span className={`text-[11px] font-black uppercase tracking-[0.1em] ${isGenerated ? 'text-[#1a472a]' : 'text-gray-500'}`}>
                          {doc.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isGenerated ? (
                          <>
                            <button
                              onClick={() => handleDownloadChainDoc(doc.type)}
                              className="text-[10px] font-black uppercase tracking-wider text-[#1a472a] hover:text-[#8cc63f] px-3 py-1.5 border border-gray-200 hover:border-[#8cc63f] transition-all"
                            >
                              PDF
                            </button>
                            <button
                              onClick={() => {
                                const text = encodeURIComponent(`Hier ist die ${doc.label} — erstellt mit HELLO SECOND/RUN.`);
                                window.open(`https://wa.me/?text=${text}`, '_blank');
                              }}
                              className="text-[10px] font-black uppercase tracking-wider text-[#25D366] hover:bg-[#25D366] hover:text-white px-3 py-1.5 border border-[#25D366]/30 hover:border-[#25D366] transition-all"
                            >
                              WhatsApp
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleGenerateChainDoc(doc.type)}
                            className="text-[10px] font-black uppercase tracking-wider bg-[#1a472a] text-white hover:bg-[#8cc63f] hover:text-[#1a472a] px-4 py-1.5 transition-all"
                          >
                            Generieren
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// ─── Reusable Input Component ───
function Input({
  label, value, onChange, placeholder, type = 'text'
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
    </div>
  );
}
