// ================================================================
// PartnerDetail -- Partner detail/edit page with deal history
// ================================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Trash2, ExternalLink, Check, Handshake, TrendingUp, FileText, Mail } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { partnersCollection, dealsCollection, documentsCollection, logActivity } from '../../lib/demoStore';
import { formatDate, formatCurrency } from '../../lib/formatters';
import { DEAL_STATUS_LABELS } from '../../types';
import type { ArticleCategory, Partner, Deal, GeneratedDocument, DealStatus } from '../../types';

const CATEGORY_OPTIONS: { value: ArticleCategory; label: string }[] = [
  { value: 'food', label: 'Lebensmittel' },
  { value: 'beverages', label: 'Getränke' },
  { value: 'dairy', label: 'Molkerei' },
  { value: 'frozen', label: 'Tiefkühl' },
  { value: 'non-food', label: 'Non-Food' },
  { value: 'household', label: 'Haushalt' },
  { value: 'other', label: 'Sonstiges' },
];

const LAND_OPTIONS = [
  { value: 'AT', label: 'Österreich' },
  { value: 'DE', label: 'Deutschland' },
  { value: 'IT', label: 'Italien' },
  { value: 'CZ', label: 'Tschechien' },
  { value: 'HU', label: 'Ungarn' },
  { value: 'SK', label: 'Slowakei' },
  { value: 'SI', label: 'Slowenien' },
  { value: 'HR', label: 'Kroatien' },
  { value: 'BA', label: 'Bosnien' },
  { value: 'RS', label: 'Serbien' },
];

export default function PartnerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Partner | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [portalLinkCopied, setPortalLinkCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    const partner = partnersCollection.getById(id);
    if (partner) {
      setForm({ ...partner });
    } else {
      navigate('/admin/partners');
    }
  }, [id, navigate]);

  useEffect(() => {
    const unsub1 = dealsCollection.subscribe(null, (allDeals) => {
      if (!id) return;
      const related = allDeals.filter(
        (d) => d.verkaeuferId === id || d.kaeuferId === id
      );
      setDeals(related);
    });
    const unsub2 = documentsCollection.subscribe(null, (allDocs) => {
      if (!id) return;
      // Get docs for this partner's deals
      const dealIds = new Set(dealsCollection.getAll().filter(d => d.verkaeuferId === id || d.kaeuferId === id).map(d => d.id));
      setDocuments(allDocs.filter(d => dealIds.has(d.dealId)));
    });
    return () => { unsub1(); unsub2(); };
  }, [id]);

  if (!form) return null;

  const update = <K extends keyof Partner>(key: K, value: Partner[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const toggleCategory = (cat: ArticleCategory) => {
    if (!form) return;
    const updated = form.kategorien.includes(cat)
      ? form.kategorien.filter((c) => c !== cat)
      : [...form.kategorien, cat];
    update('kategorien', updated);
  };

  const showBank = form.rolle === 'verkaeufer' || form.rolle === 'beides';

  const handleSave = () => {
    if (!form || !form.firmenname || !form.kontaktperson || !form.email) return;
    const { id: partnerId, ...updates } = form;
    partnersCollection.update(partnerId, updates);
    logActivity('partner_updated', 'Partner aktualisiert', `${form.firmenname}`, { partnerId });
    navigate('/admin/partners');
  };

  // ═══ Stats ═══
  const totalUmsatz = deals.reduce((sum, d) => sum + d.subtotalNetto, 0);
  const abgeschlosseneDeals = deals.filter(d => d.status === 'abgeschlossen').length;
  const activeDeals = deals.filter(d => d.status !== 'abgeschlossen' && d.status !== 'storniert').length;

  const getStatusBadgeStyle = (status: DealStatus): string => {
    const map: Record<string, string> = {
      draft: 'bg-gray-50 text-gray-500',
      angebot_erstellt: 'bg-blue-50 text-blue-700',
      angebot_gesendet: 'bg-blue-50 text-blue-700',
      bestellt: 'bg-amber-50 text-amber-700',
      bestaetigt: 'bg-indigo-50 text-indigo-700',
      bezahlt: 'bg-emerald-50 text-emerald-700',
      rechnung_erstellt: 'bg-purple-50 text-purple-700',
      abgeholt: 'bg-teal-50 text-teal-700',
      abgeschlossen: 'bg-green-50 text-green-700',
      storniert: 'bg-red-50 text-red-600',
    };
    return map[status] || 'bg-gray-50 text-gray-500';
  };

  const handleDelete = () => {
    if (!id) return;
    partnersCollection.remove(id);
    navigate('/admin/partners');
  };

  const inputClasses =
    'w-full bg-gray-50 border border-gray-300 py-2 px-3 text-sm focus:border-[#1a472a] focus:outline-none transition-all';
  const labelClasses =
    'block text-[10px] font-black uppercase tracking-widest text-[#1a472a] mb-1';

  return (
    <div>
      <PageHeader
        title={form.firmenname}
        subtitle={`Partner bearbeiten`}
        backTo="/admin/partners"
        breadcrumbs={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Partner', to: '/admin/partners' },
          { label: form.firmenname },
        ]}
      />

      {/* Portal-Link */}
      <div className="bg-[#f7f9f7] border border-[#1a472a]/10 px-5 py-3 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ExternalLink size={14} className="text-[#1a472a]" />
          <span className="text-xs text-gray-600">
            Partner-Portal: <span className="font-mono font-bold text-[#1a472a]">/portal/{id}</span>
          </span>
        </div>
        <button
          onClick={() => {
            const url = `${window.location.origin}/portal/${id}`;
            navigator.clipboard.writeText(url).then(() => {
              setPortalLinkCopied(true);
              setTimeout(() => setPortalLinkCopied(false), 2000);
            }).catch(() => {
              const input = document.createElement('input');
              input.value = url;
              document.body.appendChild(input);
              input.select();
              document.execCommand('copy');
              document.body.removeChild(input);
              setPortalLinkCopied(true);
              setTimeout(() => setPortalLinkCopied(false), 2000);
            });
          }}
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#1a472a] hover:bg-[#1a472a] hover:text-white px-3 py-1.5 transition-all"
        >
          {portalLinkCopied ? <><Check size={12} /> Kopiert!</> : 'Link kopieren'}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Handshake size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-black font-mono">{deals.length}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Deals</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={16} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-lg font-black font-mono">{formatCurrency(totalUmsatz)}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Umsatz</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#1a472a]/10 flex items-center justify-center flex-shrink-0">
            <Handshake size={16} className="text-[#1a472a]" />
          </div>
          <div>
            <p className="text-lg font-black font-mono">{activeDeals}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Aktiv</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-50 flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="text-lg font-black font-mono">{documents.length}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Dokumente</p>
          </div>
        </div>
      </div>

      {/* Firmendaten */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h3 className="text-sm font-black uppercase tracking-tight mb-4">Firmendaten</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Firmenname *</label>
            <input type="text" value={form.firmenname} onChange={(e) => update('firmenname', e.target.value)} className={inputClasses} />
          </div>
          <div>
            <label className={labelClasses}>UID-Nummer</label>
            <input type="text" value={form.uidNummer} onChange={(e) => update('uidNummer', e.target.value)} placeholder="ATU12345678" className={inputClasses} />
          </div>
          <div>
            <label className={labelClasses}>Steuernummer</label>
            <input type="text" value={form.steuernummer || ''} onChange={(e) => update('steuernummer', e.target.value)} className={inputClasses} />
          </div>
        </div>
      </div>

      {/* Kontakt */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h3 className="text-sm font-black uppercase tracking-tight mb-4">Kontakt</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className={labelClasses}>Kontaktperson *</label>
            <input type="text" value={form.kontaktperson} onChange={(e) => update('kontaktperson', e.target.value)} className={inputClasses} />
          </div>
          <div>
            <label className={labelClasses}>E-Mail *</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClasses} />
          </div>
          <div>
            <label className={labelClasses}>Telefon</label>
            <input type="text" value={form.telefon} onChange={(e) => update('telefon', e.target.value)} className={inputClasses} />
          </div>
        </div>
      </div>

      {/* Adresse */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h3 className="text-sm font-black uppercase tracking-tight mb-4">Adresse</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className={labelClasses}>Adresse</label>
            <input type="text" value={form.adresse} onChange={(e) => update('adresse', e.target.value)} className={inputClasses} />
          </div>
          <div>
            <label className={labelClasses}>PLZ</label>
            <input type="text" value={form.plz} onChange={(e) => update('plz', e.target.value)} className={inputClasses} />
          </div>
          <div>
            <label className={labelClasses}>Ort</label>
            <input type="text" value={form.ort} onChange={(e) => update('ort', e.target.value)} className={inputClasses} />
          </div>
          <div>
            <label className={labelClasses}>Land</label>
            <select value={form.land} onChange={(e) => update('land', e.target.value)} className={inputClasses}>
              {LAND_OPTIONS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Rolle & Kategorien */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h3 className="text-sm font-black uppercase tracking-tight mb-4">Rolle & Kategorien</h3>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelClasses}>Rolle *</label>
            <select value={form.rolle} onChange={(e) => update('rolle', e.target.value as Partner['rolle'])} className={inputClasses}>
              <option value="verkaeufer">Verkäufer</option>
              <option value="kaeufer">Käufer</option>
              <option value="beides">Beides</option>
            </select>
          </div>
          <div>
            <label className={labelClasses}>Sprache</label>
            <select value={form.sprache} onChange={(e) => update('sprache', e.target.value as Partner['sprache'])} className={inputClasses}>
              <option value="de">Deutsch</option>
              <option value="en">English</option>
              <option value="bhs">BHS (Bosnisch/Kroatisch/Serbisch)</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClasses}>Kategorien</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {CATEGORY_OPTIONS.map((cat) => (
              <label
                key={cat.value}
                className={`inline-flex items-center gap-2 px-3 py-1.5 border text-xs cursor-pointer transition-all ${
                  form.kategorien.includes(cat.value)
                    ? 'bg-[#1a472a] text-white border-[#1a472a]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#1a472a]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.kategorien.includes(cat.value)}
                  onChange={() => toggleCategory(cat.value)}
                  className="sr-only"
                />
                {cat.label}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <label className={labelClasses}>Notizen</label>
          <textarea value={form.notizen} onChange={(e) => update('notizen', e.target.value)} rows={3} className={inputClasses} />
        </div>
      </div>

      {/* Bankdaten */}
      {showBank && (
        <div className="bg-white border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-black uppercase tracking-tight mb-4">Bankdaten</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className={labelClasses}>Bank</label>
              <input type="text" value={form.bankName || ''} onChange={(e) => update('bankName', e.target.value)} className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>IBAN</label>
              <input type="text" value={form.iban || ''} onChange={(e) => update('iban', e.target.value)} className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>BIC</label>
              <input type="text" value={form.bic || ''} onChange={(e) => update('bic', e.target.value)} className={inputClasses} />
            </div>
          </div>
        </div>
      )}

      {/* Kontakt-Aktionen */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h3 className="text-sm font-black uppercase tracking-tight mb-4">Schnellaktionen</h3>
        <div className="flex flex-wrap gap-3">
          <a
            href={`mailto:${form.email}`}
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] hover:border-[#1a472a] hover:text-[#1a472a] transition-all"
          >
            <Mail size={14} />
            E-Mail senden
          </a>
          {form.telefon && (
            <a
              href={`tel:${form.telefon}`}
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] hover:border-[#1a472a] hover:text-[#1a472a] transition-all"
            >
              Anrufen
            </a>
          )}
          <button
            onClick={() => navigate('/admin/deals/new')}
            className="inline-flex items-center gap-2 bg-[#1a472a] text-white px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] hover:bg-[#8cc63f] hover:text-[#1a472a] transition-all"
          >
            <Handshake size={14} />
            Neuen Deal erstellen
          </button>
        </div>
      </div>

      {/* Deal-Historie */}
      {deals.length > 0 && (
        <div className="bg-white border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-black uppercase tracking-tight mb-4">
            Deal-Historie ({deals.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-2 text-left text-[9px] font-black uppercase tracking-[0.15em] text-gray-400">Deal-Nr</th>
                  <th className="px-4 py-2 text-left text-[9px] font-black uppercase tracking-[0.15em] text-gray-400">Status</th>
                  <th className="px-4 py-2 text-left text-[9px] font-black uppercase tracking-[0.15em] text-gray-400">Rolle</th>
                  <th className="px-4 py-2 text-right text-[9px] font-black uppercase tracking-[0.15em] text-gray-400">Betrag</th>
                  <th className="px-4 py-2 text-left text-[9px] font-black uppercase tracking-[0.15em] text-gray-400">Erstellt</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => {
                  const isVerkaeufer = deal.verkaeuferId === id;
                  return (
                    <tr
                      key={deal.id}
                      onClick={() => navigate(`/admin/deals/${deal.id}`)}
                      className="border-b border-gray-50 last:border-0 hover:bg-[#f7f9f7] cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-2.5 text-sm font-mono font-bold text-[#1a472a]">{deal.id}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded ${getStatusBadgeStyle(deal.status)}`}>
                          {DEAL_STATUS_LABELS[deal.status]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] font-bold uppercase ${isVerkaeufer ? 'text-emerald-600' : 'text-blue-600'}`}>
                          {isVerkaeufer ? 'Verkäufer' : 'Käufer'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-right font-mono font-bold">
                        {formatCurrency(deal.totalBrutto)}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-500">
                        {formatDate(deal.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!form.firmenname || !form.kontaktperson || !form.email}
          className="inline-flex items-center gap-2 bg-[#1a472a] text-white px-6 py-3 font-black uppercase tracking-[0.1em] text-[11px] hover:bg-[#8cc63f] hover:text-[#1a472a] transition-all disabled:opacity-30"
        >
          <Save size={14} />
          Speichern
        </button>
        <button
          onClick={() => navigate('/admin/partners')}
          className="inline-flex items-center gap-2 border border-gray-200 text-gray-500 px-6 py-3 text-[11px] font-black uppercase tracking-widest hover:border-gray-400 transition-all"
        >
          <ArrowLeft size={14} />
          Zurück
        </button>
        <div className="flex-1" />
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 border border-red-200 text-red-500 px-5 py-3 text-[11px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
          >
            <Trash2 size={14} />
            Löschen
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-600 font-semibold">Wirklich löschen?</span>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-3 text-[11px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
            >
              Ja, löschen
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-500 px-5 py-3 text-[11px] font-black uppercase tracking-widest hover:border-gray-400 transition-all"
            >
              Abbrechen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
