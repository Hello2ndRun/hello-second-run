import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileText, Loader2 } from 'lucide-react';
import VisualAngebotPreview from '../components/admin/VisualAngebotPreview';
import { dealsCollection, dealArticlesCollection, partnersCollection, getPlatformSettings } from '../lib/demoStore';
import { generateDocument } from '../lib/documentGenerator';
import type { Deal, DealArticle, Partner } from '../types';

const ANGEBOT_STATUSES = ['angebot_erstellt', 'angebot_gesendet', 'bestellt', 'bestaetigt', 'bezahlt', 'rechnung_erstellt', 'abgeholt', 'abgeschlossen'];

export default function PublicAngebot() {
  const { id } = useParams<{ id: string }>();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [articles, setArticles] = useState<DealArticle[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsub1 = dealsCollection.subscribe(null, (all) => {
      const found = all.find(d => d.id === id || d.angebotNr === id);
      setDeal(found ?? null);
      setLoaded(true);
    });
    const unsub2 = dealArticlesCollection.subscribe(null, (all) => {
      setArticles(all);
    });
    const unsub3 = partnersCollection.subscribe(null, setPartners);
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [id]);

  const dealArticles = useMemo(() => articles.filter(a => a.dealId === deal?.id), [articles, deal]);
  const verkaeufer = useMemo(() => partners.find(p => p.id === deal?.verkaeuferId) ?? null, [partners, deal]);
  const kaeufer = useMemo(() => partners.find(p => p.id === deal?.kaeuferId) ?? null, [partners, deal]);

  const isValidAngebot = deal && ANGEBOT_STATUSES.includes(deal.status);

  const handleDownloadPdf = () => {
    if (!deal || !verkaeufer || !kaeufer) return;
    setIsDownloading(true);

    try {
      const platform = getPlatformSettings();
      const dataUri = generateDocument('angebot', deal, dealArticles, verkaeufer, kaeufer, platform);
      const base64 = dataUri.replace(/^data:application\/pdf;[^,]+,/, '');

      // Create download link
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${deal.angebotNr || deal.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  // Loading state
  if (!loaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#1a472a]" />
      </div>
    );
  }

  // Not found or invalid status
  if (!deal || !isValidAngebot) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-gray-300" />
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-2">Angebot nicht gefunden</h1>
          <p className="text-sm text-gray-500">
            Dieses Angebot existiert nicht oder ist nicht mehr verfügbar.
          </p>
        </div>
      </div>
    );
  }

  // Missing partner data
  if (!verkaeufer || !kaeufer) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#1a472a]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1">Angebot</p>
          <h1 className="text-2xl font-black text-[#1a472a]">{deal.angebotNr || deal.id}</h1>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 bg-[#1a472a] text-white px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] hover:bg-[#8cc63f] hover:text-[#1a472a] transition-all disabled:opacity-50"
        >
          {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          PDF herunterladen
        </button>
      </div>

      {/* Angebot Preview */}
      <VisualAngebotPreview deal={deal} articles={dealArticles} verkaeufer={verkaeufer} kaeufer={kaeufer} />

      {/* Footer note */}
      <div className="mt-8 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-300">
          Erstellt via HELLO SECOND/RUN
        </p>
      </div>
    </div>
  );
}
