import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Handshake, FileText, Download, Building, Eye, ChevronDown, ChevronUp, Package, Calendar, Truck, CreditCard, CheckCircle } from 'lucide-react';
import { dealsCollection, dealArticlesCollection, partnersCollection, documentsCollection, getPlatformSettings } from '../lib/demoStore';
import { DEAL_STATUS_LABELS } from '../types';
import { formatCurrency, formatDate } from '../lib/formatters';
import type { Deal, DealArticle, Partner, GeneratedDocument, DealStatus } from '../types';
import MhdBadge from '../components/shared/MhdBadge';

// ── Status badge colors ──
const STATUS_BADGE_COLORS: Record<DealStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  angebot_erstellt: 'bg-blue-50 text-blue-700',
  angebot_gesendet: 'bg-blue-50 text-blue-700',
  bestellt: 'bg-yellow-50 text-yellow-700',
  bestaetigt: 'bg-yellow-50 text-yellow-700',
  bezahlt: 'bg-green-50 text-green-700',
  rechnung_erstellt: 'bg-green-50 text-green-700',
  abgeholt: 'bg-emerald-50 text-emerald-700',
  abgeschlossen: 'bg-emerald-50 text-emerald-700',
  storniert: 'bg-red-50 text-red-700',
  gespendet: 'bg-pink-50 text-pink-700',
};

// ── Visible statuses for partner (no draft) ──
const PORTAL_STATUS_FLOW: DealStatus[] = [
  'angebot_erstellt', 'angebot_gesendet', 'bestellt',
  'bestaetigt', 'bezahlt', 'rechnung_erstellt', 'abgeholt', 'abgeschlossen',
];

// ── Document download helper ──
function downloadDocBlob(fileData: string, fileName: string) {
  try {
    let base64 = fileData;
    let mimeType = 'application/pdf';
    if (fileData.startsWith('data:')) {
      const [header, data] = fileData.split(',');
      base64 = data;
      const match = header.match(/data:([^;]+)/);
      if (match) mimeType = match[1];
    }
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    // Fallback: direct data URI
    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileName;
    link.click();
  }
}

// ── Status Flow Mini Component ──
function StatusFlow({ currentStatus }: { currentStatus: DealStatus }) {
  if (currentStatus === 'storniert') {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-red-500">Storniert</span>
      </div>
    );
  }

  const currentIndex = PORTAL_STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {PORTAL_STATUS_FLOW.map((status, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isFuture = i > currentIndex;

        return (
          <div key={status} className="flex items-center gap-0.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                isCompleted ? 'w-6 bg-[#8cc63f]' :
                isCurrent ? 'w-8 bg-[#111113]' :
                'w-4 bg-gray-200'
              }`}
              title={DEAL_STATUS_LABELS[status]}
            />
          </div>
        );
      })}
      <span className="ml-2 text-[9px] font-bold text-gray-400">
        {Math.round(((currentIndex + 1) / PORTAL_STATUS_FLOW.length) * 100)}%
      </span>
    </div>
  );
}

// ════════════════════════════════════════════════
// PARTNER PORTAL
// ════════════════════════════════════════════════

export default function PartnerPortal() {
  const { partnerId } = useParams<{ partnerId: string }>();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedDeal, setExpandedDeal] = useState<string | null>(null);
  const [articles, setArticles] = useState<DealArticle[]>([]);
  const settings = getPlatformSettings();

  useEffect(() => {
    const unsub1 = partnersCollection.subscribe(null, (all) => {
      setPartners(all);
      const found = all.find(p => p.id === partnerId);
      setPartner(found ?? null);
      setLoaded(true);
    });
    const unsub2 = dealsCollection.subscribe(null, setDeals);
    const unsub3 = documentsCollection.subscribe(null, setDocuments);
    const unsub4 = dealArticlesCollection.subscribe(null, setArticles);
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, [partnerId]);

  // Deals where this partner is buyer or seller (hide drafts)
  const myDeals = useMemo(() => {
    if (!partner) return [];
    return deals
      .filter(d => d.verkaeuferId === partner.id || d.kaeuferId === partner.id)
      .filter(d => d.status !== 'draft')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [deals, partner]);

  const getCounterpartName = (deal: Deal) => {
    if (deal.verkaeuferId === partner?.id) {
      return partners.find(p => p.id === deal.kaeuferId)?.firmenname ?? '—';
    }
    return partners.find(p => p.id === deal.verkaeuferId)?.firmenname ?? '—';
  };

  const getRoleInDeal = (deal: Deal): 'Verkäufer' | 'Käufer' => {
    return deal.verkaeuferId === partner?.id ? 'Verkäufer' : 'Käufer';
  };

  const getDealDocs = (dealId: string) => {
    // Filter out provisionsrechnung — partners should never see commission docs
    return documents.filter(d => d.dealId === dealId && d.type !== 'provisionsrechnung');
  };
  const getDealArticles = (dealId: string) => articles.filter(a => a.dealId === dealId);

  // Stats
  const activeDeals = myDeals.filter(d => d.status !== 'abgeschlossen' && d.status !== 'storniert').length;
  const completedDeals = myDeals.filter(d => d.status === 'abgeschlossen').length;
  const totalVolume = myDeals.reduce((sum, d) => sum + d.subtotalNetto, 0);

  // ── Loading ──
  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#111113] border-t-transparent rounded-full" />
      </div>
    );
  }

  // ── Not found ──
  if (!partner) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Building size={28} className="text-gray-300" />
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-2">Partner nicht gefunden</h1>
          <p className="text-sm text-gray-500">Dieses Partner-Portal existiert nicht oder der Link ist ungültig.</p>
          <Link to="/" className="inline-block mt-6 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#111113] hover:text-[#8cc63f] transition-colors">
            ← Zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* ── Branded Header ── */}
      <header className="bg-[#111113] text-white">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8cc63f] mb-1">
              {settings.firmenname}
            </p>
            <h1 className="text-2xl font-black">{partner.firmenname}</h1>
            <p className="text-xs text-white/60 mt-1">{partner.kontaktperson} · {partner.email}</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Partner-Portal</p>
            <p className="text-[9px] text-white/30 mt-1">
              {partner.adresse}, {partner.plz} {partner.ort}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#ffffff] border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-[#111113]/10 flex items-center justify-center">
                <Handshake size={16} className="text-[#111113]" />
              </div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-gray-400">Aktive Deals</p>
            </div>
            <p className="text-3xl font-black font-mono text-[#111113]">{activeDeals}</p>
          </div>
          <div className="bg-[#ffffff] border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-emerald-50 flex items-center justify-center">
                <CheckCircle size={16} className="text-emerald-600" />
              </div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-gray-400">Abgeschlossen</p>
            </div>
            <p className="text-3xl font-black font-mono text-emerald-600">{completedDeals}</p>
          </div>
          <div className="bg-[#ffffff] border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-50 flex items-center justify-center">
                <Package size={16} className="text-blue-600" />
              </div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-gray-400">Gesamtvolumen</p>
            </div>
            <p className="text-3xl font-black font-mono">{formatCurrency(totalVolume)}</p>
          </div>
        </div>

        {/* ── Deal List ── */}
        <div className="space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.08em] text-[#111113] mb-3">
            Meine Deals ({myDeals.length})
          </h2>

          {myDeals.length === 0 ? (
            <div className="bg-[#ffffff] border border-gray-200 p-12 text-center">
              <Handshake size={40} className="mx-auto text-gray-200 mb-4" />
              <p className="text-sm text-gray-400 mb-1">Noch keine Deals vorhanden.</p>
              <p className="text-xs text-gray-300">Sobald ein Deal angelegt wird, erscheint er hier.</p>
            </div>
          ) : (
            myDeals.map(deal => {
              const isExpanded = expandedDeal === deal.id;
              const dealDocs = getDealDocs(deal.id);
              const dealArts = getDealArticles(deal.id);
              const role = getRoleInDeal(deal);

              return (
                <div key={deal.id} className="bg-[#ffffff] border border-gray-200 overflow-hidden">
                  {/* Deal Header Row */}
                  <button
                    onClick={() => setExpandedDeal(isExpanded ? null : deal.id)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-all text-left"
                  >
                    <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
                      <span className="font-mono text-xs font-bold text-[#111113]">{deal.angebotNr || deal.id}</span>
                      <span className={`px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${STATUS_BADGE_COLORS[deal.status]}`}>
                        {DEAL_STATUS_LABELS[deal.status]}
                      </span>
                      <span className="text-xs text-gray-400 hidden md:inline">
                        {role === 'Verkäufer' ? '→ Käufer:' : '← Verkäufer:'} {getCounterpartName(deal)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="font-mono text-sm font-bold">{formatCurrency(deal.subtotalNetto)}</span>
                      <span className="text-xs text-gray-400 hidden sm:inline">{formatDate(deal.createdAt)}</span>
                      {isExpanded ? (
                        <ChevronUp size={14} className="text-[#111113]" />
                      ) : (
                        <ChevronDown size={14} className="text-gray-300" />
                      )}
                    </div>
                  </button>

                  {/* ── Expanded Detail ── */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {/* Status Flow */}
                      <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Fortschritt</p>
                        <StatusFlow currentStatus={deal.status} />
                      </div>

                      <div className="px-5 py-4">
                        {/* Deal Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Deine Rolle</p>
                            <p className="text-sm font-bold">{role}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                              <CreditCard size={10} className="inline mr-1" />
                              Betrag brutto
                            </p>
                            <p className="text-sm font-mono font-bold">{formatCurrency(deal.totalBrutto)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                              <CreditCard size={10} className="inline mr-1" />
                              Zahlung
                            </p>
                            <p className="text-sm">{deal.zahlungsbedingung}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                              <Truck size={10} className="inline mr-1" />
                              Lieferung
                            </p>
                            <p className="text-sm">{deal.lieferbedingung}</p>
                          </div>
                        </div>

                        {/* Abholtermin */}
                        {deal.abholtermin && (
                          <div className="flex items-center gap-2 mb-5 bg-amber-50 border border-amber-200 px-3 py-2">
                            <Calendar size={14} className="text-amber-600" />
                            <span className="text-xs font-bold text-amber-700">
                              Abholtermin: {formatDate(deal.abholtermin)}
                            </span>
                          </div>
                        )}

                        {/* Articles */}
                        {dealArts.length > 0 && (
                          <div className="mb-5">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                              Artikel ({dealArts.length})
                            </p>
                            <div className="space-y-1">
                              {dealArts.map(art => (
                                <div key={art.id} className="flex items-center justify-between text-sm bg-[#ffffff] px-3 py-2.5 border border-gray-100">
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {(art.imageData || art.imageUrl) && (
                                      <img src={art.imageData || art.imageUrl} alt="" className="w-8 h-8 object-cover rounded flex-shrink-0" />
                                    )}
                                    <div className="min-w-0">
                                      <span className="font-bold">{art.artikelname}</span>
                                      <span className="text-gray-400 text-xs ml-2">{art.marke}</span>
                                      {art.mhd && (
                                        <span className="ml-2">
                                          <MhdBadge mhd={art.mhd} />
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <span className="font-mono font-bold">{formatCurrency(art.vkPreis)}/Stk</span>
                                    <p className="text-[10px] text-gray-400">
                                      {art.mengePaletten > 0 ? `${art.mengePaletten} Pal.` : `${art.mengeKartons} Krt.`}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Documents */}
                        {dealDocs.length > 0 && (
                          <div className="mb-4">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Dokumente</p>
                            <div className="flex flex-wrap gap-2">
                              {dealDocs.map(doc => (
                                <button
                                  key={doc.id}
                                  onClick={() => downloadDocBlob(doc.fileData, doc.fileName)}
                                  className="inline-flex items-center gap-2 bg-[#ffffff] border border-gray-200 px-3 py-2 text-xs font-bold hover:border-[#111113] hover:text-[#111113] transition-all cursor-pointer"
                                >
                                  <FileText size={12} />
                                  {doc.nr}
                                  <Download size={12} className="text-gray-400" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Angebot Link */}
                        {['angebot_erstellt', 'angebot_gesendet'].includes(deal.status) && (
                          <div className="pt-3 border-t border-gray-100">
                            <Link
                              to={`/angebot/${deal.id}`}
                              className="inline-flex items-center gap-2 text-[#111113] text-xs font-bold hover:text-[#8cc63f] transition-colors"
                            >
                              <Eye size={12} />
                              Angebot online ansehen →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Branded Footer ── */}
      <footer className="bg-[#111113] text-white/30 py-8 mt-12">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8cc63f]/60">
              {settings.firmenname}
            </p>
            <p className="text-[9px] mt-1">Partner-Portal</p>
          </div>
          <div className="text-right text-[9px]">
            <p>{settings.email}</p>
            <p>{settings.telefon}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
