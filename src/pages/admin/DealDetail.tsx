import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Download, User, Building, Percent,
  Calendar, Truck, CreditCard, Loader2, Eye, EyeOff,
  Link2, Mail, Copy, Check, Heart,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DealStatusFlow from '../../components/admin/DealStatusFlow';
import VisualAngebotPreview from '../../components/admin/VisualAngebotPreview';
import MhdBadge from '../../components/shared/MhdBadge';
import DataTable from '../../components/shared/DataTable';
import { dealsCollection, dealArticlesCollection, partnersCollection, documentsCollection, getPlatformSettings, logActivity } from '../../lib/demoStore';
import { generateDocument } from '../../lib/documentGenerator';
import { dealIdToDocNr } from '../../lib/dealNumbering';
import { formatCurrency, formatDate, formatPercent } from '../../lib/formatters';
import { DEAL_STATUS_LABELS } from '../../types';
import type { Deal, DealArticle, DealStatus, Partner, GeneratedDocument, DocumentType } from '../../types';
import { calculateDealTotals, calculateCommission, getArticleStueck } from '../../lib/priceCalculator';
import { useToast } from '../../components/shared/Toast';
import { sendAngebotEmail, sendStatusEmail, isEmailConfigured } from '../../lib/emailService';
import { shouldSuggestDonation, findMatchingDonationPartners, createDonationFromDeal } from '../../lib/donationService';
import { donationPartnersCollection } from '../../lib/demoStore';
import type { DonationPartner } from '../../types';

const STATUS_ACTION_MAP: Partial<Record<DealStatus, { label: string; next: DealStatus }>> = {
  draft: { label: 'Angebot erstellen', next: 'angebot_erstellt' },
  angebot_erstellt: { label: 'Angebot senden', next: 'angebot_gesendet' },
  angebot_gesendet: { label: 'Bestellung eingegangen', next: 'bestellt' },
  bestellt: { label: 'Auftrag bestätigen', next: 'bestaetigt' },
  bestaetigt: { label: 'Zahlung eingegangen', next: 'bezahlt' },
  bezahlt: { label: 'Rechnung erstellen', next: 'rechnung_erstellt' },
  rechnung_erstellt: { label: 'Abholung bestätigen', next: 'abgeholt' },
  abgeholt: { label: 'Deal abschließen', next: 'abgeschlossen' },
};

const FINAL_STATUSES: DealStatus[] = ['abgeschlossen', 'storniert', 'gespendet'];

export default function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [articles, setArticles] = useState<DealArticle[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [notizen, setNotizen] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailPrompt, setEmailPrompt] = useState<{ recipient: Partner; subject: string; body: string; newStatus?: string } | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationPartners, setDonationPartners] = useState<DonationPartner[]>([]);
  const [selectedDonationPartner, setSelectedDonationPartner] = useState('');
  const [donationNotizen, setDonationNotizen] = useState('');

  useEffect(() => {
    const unsub1 = dealsCollection.subscribe(null, (all) => {
      const found = all.find(d => d.id === id);
      if (found) {
        setDeal(found);
        setNotizen(found.notizen);
      }
    });
    const unsub2 = dealArticlesCollection.subscribe(null, (all) => {
      setArticles(all.filter(a => a.dealId === id));
    });
    const unsub3 = partnersCollection.subscribe(null, setPartners);
    const unsub4 = documentsCollection.subscribe(null, (all) => {
      setDocuments(all.filter(d => d.dealId === id));
    });
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, [id]);

  const verkaeufer = useMemo(() => partners.find(p => p.id === deal?.verkaeuferId) ?? null, [partners, deal]);
  const kaeufer = useMemo(() => partners.find(p => p.id === deal?.kaeuferId) ?? null, [partners, deal]);
  const totals = useMemo(() => calculateDealTotals(articles), [articles]);
  const commission = useMemo(() => deal ? calculateCommission(deal.subtotalNetto, deal.provisionRate) : null, [deal]);

  if (!deal) {
    return (
      <div>
        <PageHeader title="Deal nicht gefunden" backTo="/admin/deals" />
        <p className="text-gray-400 text-sm">Der Deal mit der ID "{id}" wurde nicht gefunden.</p>
      </div>
    );
  }

  // Status → Document trigger mapping
  const DOC_TRIGGER: Partial<Record<DealStatus, DocumentType>> = {
    angebot_erstellt: 'angebot',
    bestellt: 'bestellbestaetigung',
    bestaetigt: 'auftragsbestaetigung',
    rechnung_erstellt: 'rechnung',
    abgeschlossen: 'provisionsrechnung',
  };

  // Email notification templates per status
  const getEmailTemplate = (newStatus: DealStatus): { recipient: Partner; subject: string; body: string } | null => {
    if (!verkaeufer || !kaeufer) return null;
    const platform = getPlatformSettings();
    const dealNr = deal.angebotNr || deal.id;

    switch (newStatus) {
      case 'angebot_erstellt':
      case 'angebot_gesendet':
        return {
          recipient: kaeufer,
          subject: `Angebot ${dealNr} — ${verkaeufer.firmenname}`,
          body: `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie unser Angebot ${dealNr}.\n\nAngebot online ansehen:\n${window.location.origin}/angebot/${deal.id}\n\nBei Fragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen\n${platform.firmenname}`,
        };
      case 'bestellt':
        return {
          recipient: verkaeufer,
          subject: `Bestellung eingegangen — Deal ${deal.id}`,
          body: `Sehr geehrte(r) ${verkaeufer.kontaktperson},\n\nwir freuen uns Ihnen mitteilen zu können, dass eine Bestellung für Deal ${deal.id} eingegangen ist.\n\nKäufer: ${kaeufer.firmenname}\nDealwert: ${formatCurrency(deal.subtotalNetto)} netto\n\nWir werden die Auftragsbestätigung zeitnah versenden.\n\nMit freundlichen Grüßen\n${platform.firmenname}`,
        };
      case 'bestaetigt':
        return {
          recipient: kaeufer,
          subject: `Auftragsbestätigung — Deal ${deal.id}`,
          body: `Sehr geehrte(r) ${kaeufer.kontaktperson},\n\nIhr Auftrag für Deal ${deal.id} wurde bestätigt.\n\nZahlungsbedingung: ${deal.zahlungsbedingung}\nLieferbedingung: ${deal.lieferbedingung}\n${deal.abholtermin ? `Abholtermin: ${deal.abholtermin}` : ''}\n\nMit freundlichen Grüßen\n${platform.firmenname}`,
        };
      case 'bezahlt':
        return {
          recipient: verkaeufer,
          subject: `Zahlung eingegangen — Deal ${deal.id}`,
          body: `Sehr geehrte(r) ${verkaeufer.kontaktperson},\n\ndie Zahlung für Deal ${deal.id} ist eingegangen.\n\nBetrag: ${formatCurrency(deal.totalBrutto)} brutto\n\nDie Ware kann zur Abholung/Lieferung vorbereitet werden.\n\nMit freundlichen Grüßen\n${platform.firmenname}`,
        };
      case 'rechnung_erstellt':
        return {
          recipient: kaeufer,
          subject: `Rechnung ${deal.rechnungNr || deal.id}`,
          body: `Sehr geehrte(r) ${kaeufer.kontaktperson},\n\nanbei erhalten Sie die Rechnung für Deal ${deal.id}.\n\nRechnungsbetrag: ${formatCurrency(deal.totalBrutto)} brutto\n\nMit freundlichen Grüßen\n${platform.firmenname}`,
        };
      case 'abgeholt':
        return {
          recipient: kaeufer,
          subject: `Ware abgeholt — Deal ${deal.id}`,
          body: `Sehr geehrte(r) ${kaeufer.kontaktperson},\n\ndie Ware für Deal ${deal.id} wurde erfolgreich abgeholt/geliefert.\n\nVielen Dank für Ihren Auftrag!\n\nMit freundlichen Grüßen\n${platform.firmenname}`,
        };
      case 'abgeschlossen':
        return {
          recipient: verkaeufer,
          subject: `Deal ${deal.id} abgeschlossen — Provisionsrechnung`,
          body: `Sehr geehrte(r) ${verkaeufer.kontaktperson},\n\nDeal ${deal.id} wurde erfolgreich abgeschlossen.\n\nAnbei erhalten Sie unsere Provisionsrechnung.\n\nProvision: ${formatCurrency(deal.provisionAmount)} netto (${formatPercent(deal.provisionRate * 100)})\n\nVielen Dank für die Zusammenarbeit!\n\nMit freundlichen Grüßen\n${platform.firmenname}`,
        };
      default:
        return null;
    }
  };

  const handleStatusChange = async (newStatus: DealStatus) => {
    if (!verkaeufer || !kaeufer) return;
    setIsGenerating(true);

    try {
      const platform = getPlatformSettings();
      const docType = DOC_TRIGGER[newStatus];
      const updates: Partial<Deal> = { status: newStatus };

      if (docType) {
        const nr = dealIdToDocNr(deal.id, docType);

        // Set document number on deal
        if (docType === 'angebot') updates.angebotNr = nr;
        if (docType === 'bestellbestaetigung') updates.bestellbestaetigungNr = nr;
        if (docType === 'auftragsbestaetigung') updates.auftragsbestaetigungNr = nr;
        if (docType === 'rechnung') updates.rechnungNr = nr;
        if (docType === 'provisionsrechnung') updates.provisionsrechnungNr = nr;

        // Update deal first (so numbers appear in PDF)
        dealsCollection.update(deal.id, updates);

        // Merge updates for PDF generation
        const updatedDeal = { ...deal, ...updates } as Deal;

        // Generate PDF
        const dataUri = generateDocument(docType, updatedDeal, articles, verkaeufer, kaeufer, platform);
        const base64 = dataUri.replace(/^data:application\/pdf;[^,]+,/, '');

        // Determine issuer/recipient
        const isKaeuferIssuer = docType === 'bestellbestaetigung';
        const isPlatformIssuer = docType === 'provisionsrechnung';
        const aussteller = isPlatformIssuer
          ? platform.firmenname
          : isKaeuferIssuer ? kaeufer.firmenname : verkaeufer.firmenname;
        const empfaenger = isPlatformIssuer
          ? verkaeufer.firmenname
          : isKaeuferIssuer ? verkaeufer.firmenname : kaeufer.firmenname;

        // Store document
        documentsCollection.add({
          type: docType,
          dealId: deal.id,
          nr,
          ausstellerName: aussteller,
          empfaengerName: empfaenger,
          fileName: `${nr}.pdf`,
          fileData: base64,
          createdAt: new Date().toISOString(),
        } as Omit<GeneratedDocument, 'id'>);
      } else {
        // No document needed, just update status
        dealsCollection.update(deal.id, updates);
      }

      // Toast notification
      const statusLabel = DEAL_STATUS_LABELS[newStatus];
      if (docType) {
        addToast(`Status → ${statusLabel} · Dokument generiert`, 'success');
        logActivity('document_generated', `Dokument generiert`, `${deal.id} — ${statusLabel}`, { dealId: deal.id });
      } else {
        addToast(`Status → ${statusLabel}`, 'success');
      }
      logActivity('deal_status_changed', `Deal ${statusLabel}`, `${deal.id} — ${verkaeufer.firmenname} → ${kaeufer.firmenname}`, { dealId: deal.id });

      // Show email prompt after status change
      const template = getEmailTemplate(newStatus);
      if (template) {
        setEmailPrompt({ ...template, newStatus });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStornieren = () => {
    dealsCollection.update(deal.id, { status: 'storniert' as DealStatus });
    logActivity('deal_status_changed', 'Deal storniert', `${deal.id}`, { dealId: deal.id });
    addToast('Deal wurde storniert', 'error');
  };

  const handleOpenDonation = () => {
    const allPartners = donationPartnersCollection.getAll().filter(p => p.aktiv);
    setDonationPartners(allPartners);
    setSelectedDonationPartner(allPartners[0]?.id || '');
    setDonationNotizen('');
    setShowDonationModal(true);
  };

  const handleDonate = () => {
    if (!deal || !selectedDonationPartner) return;
    createDonationFromDeal(deal, selectedDonationPartner, donationNotizen);
    setShowDonationModal(false);
    addToast('Spende erstellt! ❤️ Ware wird nicht entsorgt.', 'success');
  };

  const handleSaveNotizen = () => {
    dealsCollection.update(deal.id, { notizen });
    addToast('Notizen gespeichert', 'success');
  };

  const statusAction = STATUS_ACTION_MAP[deal.status];
  const canStornieren = !FINAL_STATUSES.includes(deal.status);
  const canShare = ['angebot_erstellt', 'angebot_gesendet'].includes(deal.status);

  const handleShareLink = async () => {
    const shareUrl = `${window.location.origin}/angebot/${deal.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      addToast('Angebots-Link in Zwischenablage kopiert', 'info');
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      addToast('Angebots-Link in Zwischenablage kopiert', 'info');
    }
  };

  const handleEmailSend = async () => {
    if (!kaeufer || !verkaeufer) return;

    // Try EmailJS first
    if (isEmailConfigured()) {
      setEmailSending(true);
      const result = await sendAngebotEmail({
        deal,
        articles,
        verkaeufer,
        kaeufer,
        angebotLink: `${window.location.origin}/angebot/${deal.id}`,
      });
      setEmailSending(false);
      if (result.success) {
        addToast(result.message, 'success');
      } else {
        addToast(result.message, 'error');
      }
      return;
    }

    // Fallback: mailto
    const shareUrl = `${window.location.origin}/angebot/${deal.id}`;
    const subject = encodeURIComponent(`Angebot ${deal.angebotNr || deal.id} — ${verkaeufer?.firmenname || ''}`);
    const body = encodeURIComponent(
      `Sehr geehrte Damen und Herren,\n\n` +
      `anbei erhalten Sie unser Angebot ${deal.angebotNr || deal.id}.\n\n` +
      `Angebot online ansehen:\n${shareUrl}\n\n` +
      `Bei Fragen stehen wir Ihnen gerne zur Verfügung.\n\n` +
      `Mit freundlichen Grüßen`
    );
    window.open(`mailto:${kaeufer.email}?subject=${subject}&body=${body}`, '_self');
  };

  const handleDuplicate = () => {
    navigate('/admin/deals/new', { state: { cloneFrom: deal.id } });
  };

  const articleColumns = [
    {
      key: 'pos',
      label: 'Pos',
      render: (_: DealArticle, idx?: number) => <span className="text-gray-400">{(articles.indexOf(_)) + 1}</span>,
    },
    {
      key: 'artikelname',
      label: 'Artikel',
      render: (art: DealArticle) => (
        <div>
          <span className="font-bold text-sm">{art.artikelname}</span>
          {art.marke && <span className="text-gray-400 ml-1 text-xs">{art.marke}</span>}
        </div>
      ),
    },
    {
      key: 'ean',
      label: 'EAN',
      render: (art: DealArticle) => <span className="font-mono text-xs">{art.ean || '—'}</span>,
    },
    {
      key: 'mhd',
      label: 'MHD',
      render: (art: DealArticle) => art.mhd ? <MhdBadge mhd={art.mhd} /> : <span className="text-gray-400">—</span>,
    },
    {
      key: 'menge',
      label: 'Menge',
      render: (art: DealArticle) => (
        <span className="text-sm font-mono">
          {art.mengePaletten} Pal{art.mengeKartons > 0 ? ` + ${art.mengeKartons} Kt` : ''}
          <span className="text-gray-400 ml-1">({getArticleStueck(art).toLocaleString('de-AT')} Stk)</span>
        </span>
      ),
    },
    {
      key: 'ekPreis',
      label: 'EK',
      render: (art: DealArticle) => <span className="font-mono text-sm">{formatCurrency(art.ekPreis)}</span>,
    },
    {
      key: 'vkPreis',
      label: 'VK',
      render: (art: DealArticle) => <span className="font-mono text-sm font-bold">{formatCurrency(art.vkPreis)}</span>,
    },
    {
      key: 'gesamt',
      label: 'Gesamt',
      render: (art: DealArticle) => {
        const stueck = getArticleStueck(art);
        return <span className="font-mono text-sm font-bold">{formatCurrency(art.vkPreis * stueck)}</span>;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title={deal.id}
        subtitle={DEAL_STATUS_LABELS[deal.status]}
        backTo="/admin/deals"
        breadcrumbs={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Deals', to: '/admin/deals' },
          { label: deal.id },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Flow */}
          <div className="bg-white border border-gray-200 p-4">
            <DealStatusFlow currentStatus={deal.status} />
          </div>

          {/* Articles Table */}
          <div className="bg-white border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#1a472a]">Deal-Artikel</h3>
            </div>
            <DataTable
              data={articles}
              columns={articleColumns}
              emptyMessage="Keine Artikel in diesem Deal."
            />
          </div>

          {/* Visual Angebot Preview */}
          {['angebot_erstellt', 'angebot_gesendet'].includes(deal.status) && verkaeufer && kaeufer && (
            <div className="bg-white border border-gray-200">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center gap-2">
                  {showPreview ? <EyeOff size={14} className="text-[#1a472a]" /> : <Eye size={14} className="text-[#1a472a]" />}
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[#1a472a]">Angebots-Vorschau</h3>
                </div>
                <span className="text-xs text-gray-400">{showPreview ? 'Ausblenden' : 'Anzeigen'}</span>
              </button>
              {showPreview && (
                <div className="p-4 bg-gray-50">
                  <VisualAngebotPreview deal={deal} articles={articles} verkaeufer={verkaeufer} kaeufer={kaeufer} />
                </div>
              )}
            </div>
          )}

          {/* Summen */}
          <div className="bg-white border border-gray-200 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Netto</p>
                <p className="text-lg font-black font-mono">{formatCurrency(deal.subtotalNetto)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">MwSt ({formatPercent(deal.mwstRate * 100)})</p>
                <p className="text-lg font-black font-mono">{formatCurrency(deal.mwstAmount)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Brutto</p>
                <p className="text-lg font-black font-mono text-[#1a472a]">{formatCurrency(deal.totalBrutto)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Provision</p>
                <p className="text-lg font-black font-mono text-emerald-600">{formatCurrency(deal.provisionAmount)}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white border border-gray-200 p-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#1a472a] mb-3">Aktionen</h3>
            <div className="flex flex-wrap gap-3">
              {statusAction && (
                <button
                  onClick={async () => await handleStatusChange(statusAction.next)}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 bg-[#1a472a] text-white px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] hover:bg-[#8cc63f] hover:text-[#1a472a] transition-all disabled:opacity-50 disabled:cursor-wait"
                >
                  {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                  {isGenerating ? 'Generiere...' : statusAction.label}
                </button>
              )}

              {/* Share Link */}
              {canShare && (
                <button
                  onClick={handleShareLink}
                  className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] hover:border-[#1a472a] hover:text-[#1a472a] transition-all"
                >
                  {linkCopied ? <Check size={14} className="text-emerald-500" /> : <Link2 size={14} />}
                  {linkCopied ? 'Link kopiert!' : 'Angebot teilen'}
                </button>
              )}

              {/* Email Send */}
              {canShare && kaeufer && (
                <button
                  onClick={handleEmailSend}
                  disabled={emailSending}
                  className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] hover:border-[#1a472a] hover:text-[#1a472a] transition-all disabled:opacity-50 disabled:cursor-wait"
                >
                  {emailSending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                  {emailSending ? 'Sende...' : isEmailConfigured() ? 'Per E-Mail senden' : 'Per E-Mail (mailto)'}
                </button>
              )}

              {/* Duplicate Deal */}
              <button
                onClick={handleDuplicate}
                className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] hover:border-[#1a472a] hover:text-[#1a472a] transition-all"
              >
                <Copy size={14} />
                Duplizieren
              </button>

              {/* Spenden statt Entsorgen */}
              {canStornieren && (
                <button
                  onClick={handleOpenDonation}
                  className="inline-flex items-center gap-2 border border-red-300 text-red-500 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] hover:bg-red-50 hover:border-red-400 transition-all"
                >
                  <Heart size={14} />
                  Spenden
                </button>
              )}

              {canStornieren && (
                <button
                  onClick={handleStornieren}
                  className="inline-flex items-center gap-2 border border-gray-300 text-gray-400 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-all"
                >
                  Stornieren
                </button>
              )}
            </div>
          </div>

          {/* Spenden-Vorschlag bei kritischem MHD */}
          {deal && shouldSuggestDonation(deal) && deal.status !== 'gespendet' && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart size={20} className="text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-black text-red-700">Spenden statt Entsorgen?</h3>
                  <p className="text-xs text-red-500 mt-0.5">Diese Ware hat kritisches MHD. Statt zu entsorgen, kann sie an eine Tafel oder Foodbank gespendet werden.</p>
                </div>
              </div>
              <button
                onClick={handleOpenDonation}
                className="flex-shrink-0 ml-4 px-4 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-wider hover:bg-red-600 transition-all"
              >
                Jetzt spenden ❤️
              </button>
            </div>
          )}

          {/* Email Notification Prompt */}
          {emailPrompt && (
            <div className="bg-blue-50 border border-blue-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail size={14} className="text-blue-600" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-700">E-Mail-Benachrichtigung</h3>
                  </div>
                  <p className="text-xs text-blue-600 mb-1">
                    <span className="font-bold">{emailPrompt.recipient.firmenname}</span> ({emailPrompt.recipient.email}) benachrichtigen?
                  </p>
                  <p className="text-[10px] text-blue-400">Betreff: {emailPrompt.subject}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    disabled={emailSending}
                    onClick={async () => {
                      if (isEmailConfigured() && emailPrompt.newStatus && verkaeufer && kaeufer) {
                        // Use EmailJS
                        setEmailSending(true);
                        const result = await sendStatusEmail({
                          deal,
                          verkaeufer,
                          kaeufer,
                          newStatus: emailPrompt.newStatus,
                          statusLabel: emailPrompt.subject,
                        });
                        setEmailSending(false);
                        if (result.success) {
                          addToast(result.message, 'success');
                        } else {
                          addToast(result.message, 'error');
                        }
                      } else {
                        // Fallback: mailto
                        const mailto = `mailto:${emailPrompt.recipient.email}?subject=${encodeURIComponent(emailPrompt.subject)}&body=${encodeURIComponent(emailPrompt.body)}`;
                        window.open(mailto, '_self');
                        addToast(`E-Mail an ${emailPrompt.recipient.firmenname} vorbereitet`, 'info');
                      }
                      setEmailPrompt(null);
                    }}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    {emailSending ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
                    {emailSending ? 'Sende...' : isEmailConfigured() ? 'Jetzt senden' : 'E-Mail öffnen'}
                  </button>
                  <button
                    onClick={() => setEmailPrompt(null)}
                    className="inline-flex items-center gap-2 border border-blue-200 text-blue-600 px-4 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition-all"
                  >
                    Überspringen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notizen */}
          <div className="bg-white border border-gray-200 p-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#1a472a] mb-3">Notizen</h3>
            <textarea
              value={notizen}
              onChange={e => setNotizen(e.target.value)}
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 py-2.5 px-3 text-sm focus:border-[#1a472a] focus:outline-none resize-none"
              placeholder="Interne Notizen zum Deal..."
            />
            <button
              onClick={handleSaveNotizen}
              className="mt-2 inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 text-[10px] font-black uppercase tracking-[0.1em] hover:border-[#1a472a] hover:text-[#1a472a] transition-all"
            >
              Notizen speichern
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="space-y-6">
          {/* Verkäufer Info */}
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building size={14} className="text-[#1a472a]" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#1a472a]">Verkäufer</h3>
            </div>
            {verkaeufer ? (
              <div className="space-y-1.5 text-sm">
                <p className="font-bold">{verkaeufer.firmenname}</p>
                <p className="text-gray-500">{verkaeufer.adresse}</p>
                <p className="text-gray-500">{verkaeufer.plz} {verkaeufer.ort}, {verkaeufer.land}</p>
                <div className="pt-2 border-t border-gray-100 mt-2 space-y-1">
                  <p className="flex items-center gap-2"><User size={12} className="text-gray-400" /> {verkaeufer.kontaktperson}</p>
                  <p className="text-gray-500 text-xs">{verkaeufer.telefon}</p>
                  <p className="text-gray-500 text-xs">{verkaeufer.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Verkäufer nicht gefunden</p>
            )}
          </div>

          {/* Käufer Info */}
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <User size={14} className="text-[#1a472a]" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#1a472a]">Käufer</h3>
            </div>
            {kaeufer ? (
              <div className="space-y-1.5 text-sm">
                <p className="font-bold">{kaeufer.firmenname}</p>
                <p className="text-gray-500">{kaeufer.adresse}</p>
                <p className="text-gray-500">{kaeufer.plz} {kaeufer.ort}, {kaeufer.land}</p>
                <div className="pt-2 border-t border-gray-100 mt-2 space-y-1">
                  <p className="flex items-center gap-2"><User size={12} className="text-gray-400" /> {kaeufer.kontaktperson}</p>
                  <p className="text-gray-500 text-xs">{kaeufer.telefon}</p>
                  <p className="text-gray-500 text-xs">{kaeufer.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Käufer nicht gefunden</p>
            )}
          </div>

          {/* Provisions Card */}
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Percent size={14} className="text-[#1a472a]" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#1a472a]">Provision</h3>
            </div>
            {commission && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Rate</span>
                  <span className="font-bold">{formatPercent(deal.provisionRate * 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Netto</span>
                  <span className="font-mono">{formatCurrency(commission.provisionNetto)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">MwSt (20%)</span>
                  <span className="font-mono">{formatCurrency(commission.provisionMwst)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <span className="font-bold">Brutto</span>
                  <span className="font-mono font-bold text-emerald-600">{formatCurrency(commission.provisionBrutto)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Dokumente Card */}
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={14} className="text-[#1a472a]" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#1a472a]">Dokumente</h3>
            </div>
            {documents.length === 0 ? (
              <p className="text-gray-400 text-xs">Noch keine Dokumente erstellt.</p>
            ) : (
              <div className="space-y-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-bold">{doc.nr}</p>
                      <p className="text-[10px] text-gray-400">{formatDate(doc.createdAt)}</p>
                    </div>
                    <button
                      onClick={() => {
                        try {
                          const raw = atob(doc.fileData);
                          const bytes = new Uint8Array(raw.length);
                          for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
                          const blob = new Blob([bytes], { type: 'application/pdf' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = doc.fileName;
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch { /* fallback */ }
                      }}
                      className="p-1.5 text-[#1a472a] hover:bg-[#f7f9f7] transition-all"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deal-Metadaten */}
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={14} className="text-[#1a472a]" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#1a472a]">Deal-Metadaten</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Deal-ID</span>
                <span className="font-mono font-bold text-xs">{deal.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Erstellt am</span>
                <span>{formatDate(deal.createdAt)}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-500 flex items-center gap-1"><CreditCard size={12} /> Zahlung</span>
                <span className="text-right">{deal.zahlungsbedingung}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-500 flex items-center gap-1"><Truck size={12} /> Lieferung</span>
                <span className="text-right">{deal.lieferbedingung}</span>
              </div>
              {deal.abholtermin && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Abholtermin</span>
                  <span>{formatDate(deal.abholtermin)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Spenden-Modal ═══ */}
      {showDonationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDonationModal(false)}>
          <div className="bg-white max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <Heart size={20} className="text-red-400" />
              </div>
              <div>
                <h2 className="font-black text-lg text-[#0a1a0f]">Spenden statt Entsorgen</h2>
                <p className="text-xs text-gray-400">Ware geht an eine gemeinnützige Organisation</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-100 p-3 mb-4 text-xs text-red-600">
              ❤️ Kein Sonderposten wird verschwendet. Diese Ware wird Familien in Not helfen.
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Spendenpartner *</label>
                {donationPartners.length > 0 ? (
                  <select
                    value={selectedDonationPartner}
                    onChange={e => setSelectedDonationPartner(e.target.value)}
                    className="w-full border border-gray-200 p-2.5 text-sm mt-1 focus:border-[#1a472a] focus:outline-none bg-white"
                  >
                    {donationPartners.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.ort}, {p.land} {p.kuehlung ? '❄️' : ''} {p.abholung ? '🚛' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-red-500 mt-1">Noch keine Spendenpartner angelegt. Bitte zuerst unter Spenden → Partner anlegen.</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Notizen zur Spende</label>
                <textarea
                  value={donationNotizen}
                  onChange={e => setDonationNotizen(e.target.value)}
                  rows={2}
                  placeholder="z.B. Abholung Dienstag, Kühlware beachten..."
                  className="w-full border border-gray-200 p-2.5 text-sm mt-1 focus:border-[#1a472a] focus:outline-none resize-none"
                />
              </div>

              <div className="bg-gray-50 p-3 text-xs text-gray-500">
                <p className="font-bold text-[#0a1a0f] mb-1">Was passiert:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Deal-Status wird auf "Gespendet ❤️" gesetzt</li>
                  <li>Spende wird erfasst (Gewicht, Wert, Mahlzeiten)</li>
                  <li>Impact-Dashboard wird aktualisiert</li>
                  <li>Spendenbestätigung wird erstellt</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
              <button onClick={() => setShowDonationModal(false)} className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-gray-600">
                Abbrechen
              </button>
              <button
                onClick={handleDonate}
                disabled={!selectedDonationPartner || donationPartners.length === 0}
                className="px-5 py-2.5 bg-red-500 text-white text-[10px] font-black uppercase tracking-wider hover:bg-red-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Heart size={13} className="inline mr-2" />
                Spende bestätigen ❤️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
