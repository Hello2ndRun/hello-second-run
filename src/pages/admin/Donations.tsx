// ================================================================
// Donations -- Spenden-Übersicht, Partner & Impact
// "Erst vermitteln, dann spenden — nie entsorgen."
// ================================================================

import { useEffect, useState } from 'react';
import { Heart, Users, Package, TrendingUp, Plus, ChevronDown, ChevronUp, MapPin, Phone, Mail, Snowflake, Truck, CheckCircle, Clock, Calendar } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { donationPartnersCollection, donationRecordsCollection } from '../../lib/demoStore';
import { getImpactStats, confirmDonation, updateDonationStatus, DONATION_STATUS_LABELS, DONATION_STATUS_COLORS, type ImpactStats } from '../../lib/donationService';
import type { DonationPartner, DonationRecord } from '../../types';

// ──────────────────────────────────────────────
// IMPACT STAT CARD
// ──────────────────────────────────────────────

function ImpactCard({ icon: Icon, value, label, accent = false }: {
  icon: typeof Heart; value: string; label: string; accent?: boolean;
}) {
  return (
    <div className={`p-5 border ${accent ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200' : 'bg-white border-gray-100'}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${accent ? 'bg-red-100' : 'bg-[#1a472a]/10'}`}>
        <Icon size={20} className={accent ? 'text-red-500' : 'text-[#1a472a]'} />
      </div>
      <p className="text-2xl font-black text-[#0a1a0f]">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mt-1">{label}</p>
    </div>
  );
}

// ──────────────────────────────────────────────
// PARTNER CARD
// ──────────────────────────────────────────────

function PartnerCard({ partner, onEdit }: { partner: DonationPartner; onEdit: (p: DonationPartner) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-100 bg-white hover:border-[#1a472a]/20 transition-all">
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Heart size={18} className="text-red-400" />
            </div>
            <div>
              <h3 className="font-black text-sm text-[#0a1a0f]">{partner.name}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{partner.organisation}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${partner.aktiv ? 'bg-green-400' : 'bg-gray-300'}`} />
            {expanded ? <ChevronUp size={16} className="text-gray-300" /> : <ChevronDown size={16} className="text-gray-300" />}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
            <MapPin size={12} /> {partner.plz} {partner.ort}, {partner.land}
          </span>
          {partner.kuehlung && (
            <span className="inline-flex items-center gap-1 text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5">
              <Snowflake size={11} /> Kühlung
            </span>
          )}
          {partner.abholung && (
            <span className="inline-flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5">
              <Truck size={11} /> Abholung
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-50 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Kontakt</p>
              <p className="font-medium text-[#0a1a0f]">{partner.kontaktperson}</p>
              <p className="text-gray-500 text-xs flex items-center gap-1 mt-1"><Phone size={11} /> {partner.telefon}</p>
              <p className="text-gray-500 text-xs flex items-center gap-1"><Mail size={11} /> {partner.email}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Kapazität</p>
              <p className="font-medium text-[#0a1a0f]">{partner.maxKapazitaet}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {partner.kategorien.map(k => (
                  <span key={k} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 uppercase font-bold">{k}</span>
                ))}
              </div>
            </div>
          </div>
          {partner.notizen && (
            <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">{partner.notizen}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// NEW PARTNER MODAL
// ──────────────────────────────────────────────

function NewPartnerModal({ onClose, onSave }: { onClose: () => void; onSave: (data: Omit<DonationPartner, 'id' | 'createdAt'>) => void }) {
  const [form, setForm] = useState({
    name: '', organisation: '', kontaktperson: '', email: '', telefon: '',
    adresse: '', plz: '', ort: '', land: 'AT',
    maxKapazitaet: '', kuehlung: false, abholung: false, notizen: '',
  });

  const handleSubmit = () => {
    if (!form.name || !form.organisation || !form.email) return;
    onSave({
      ...form,
      kategorien: ['food', 'beverages', 'dairy'],
      aktiv: true,
      createdAt: new Date().toISOString(),
    } as any);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-black text-[#0a1a0f] mb-1">Neuer Spendenpartner</h2>
        <p className="text-xs text-gray-400 mb-5">Tafel, Caritas, Foodbank oder andere Organisation</p>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="z.B. Tafel Salzburg" className="w-full border border-gray-200 p-2.5 text-sm mt-1 focus:border-[#1a472a] focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Organisation *</label>
              <input value={form.organisation} onChange={e => setForm({ ...form, organisation: e.target.value })} placeholder="z.B. Tafel Österreich" className="w-full border border-gray-200 p-2.5 text-sm mt-1 focus:border-[#1a472a] focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Kontaktperson</label>
              <input value={form.kontaktperson} onChange={e => setForm({ ...form, kontaktperson: e.target.value })} className="w-full border border-gray-200 p-2.5 text-sm mt-1 focus:border-[#1a472a] focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">E-Mail *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-200 p-2.5 text-sm mt-1 focus:border-[#1a472a] focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Telefon</label>
            <input value={form.telefon} onChange={e => setForm({ ...form, telefon: e.target.value })} className="w-full border border-gray-200 p-2.5 text-sm mt-1 focus:border-[#1a472a] focus:outline-none" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">PLZ</label>
              <input value={form.plz} onChange={e => setForm({ ...form, plz: e.target.value })} className="w-full border border-gray-200 p-2.5 text-sm mt-1 focus:border-[#1a472a] focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ort</label>
              <input value={form.ort} onChange={e => setForm({ ...form, ort: e.target.value })} className="w-full border border-gray-200 p-2.5 text-sm mt-1 focus:border-[#1a472a] focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Land</label>
              <select value={form.land} onChange={e => setForm({ ...form, land: e.target.value })} className="w-full border border-gray-200 p-2.5 text-sm mt-1 focus:border-[#1a472a] focus:outline-none bg-white">
                <option value="AT">AT</option>
                <option value="DE">DE</option>
                <option value="BA">BA</option>
                <option value="HR">HR</option>
                <option value="RS">RS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Max. Kapazität</label>
            <input value={form.maxKapazitaet} onChange={e => setForm({ ...form, maxKapazitaet: e.target.value })} placeholder="z.B. 10 Paletten/Woche" className="w-full border border-gray-200 p-2.5 text-sm mt-1 focus:border-[#1a472a] focus:outline-none" />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.kuehlung} onChange={e => setForm({ ...form, kuehlung: e.target.checked })} className="accent-[#1a472a]" />
              <Snowflake size={14} className="text-blue-400" />
              <span className="text-sm">Kühlware möglich</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.abholung} onChange={e => setForm({ ...form, abholung: e.target.checked })} className="accent-[#1a472a]" />
              <Truck size={14} className="text-green-500" />
              <span className="text-sm">Eigene Abholung</span>
            </label>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Notizen</label>
            <textarea value={form.notizen} onChange={e => setForm({ ...form, notizen: e.target.value })} rows={2} className="w-full border border-gray-200 p-2.5 text-sm mt-1 focus:border-[#1a472a] focus:outline-none resize-none" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-gray-600">
            Abbrechen
          </button>
          <button onClick={handleSubmit} disabled={!form.name || !form.organisation || !form.email} className="px-5 py-2.5 bg-[#1a472a] text-white text-[10px] font-black uppercase tracking-wider hover:bg-[#8cc63f] hover:text-[#1a472a] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            <Heart size={13} className="inline mr-2" />
            Partner anlegen
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// MAIN DONATIONS PAGE
// ──────────────────────────────────────────────

export default function Donations() {
  const [partners, setPartners] = useState<DonationPartner[]>([]);
  const [records, setRecords] = useState<DonationRecord[]>([]);
  const [impact, setImpact] = useState<ImpactStats | null>(null);
  const [showNewPartner, setShowNewPartner] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'partners' | 'history'>('overview');

  useEffect(() => {
    const unsub1 = donationPartnersCollection.subscribe(null, setPartners);
    const unsub2 = donationRecordsCollection.subscribe(null, setRecords);
    return () => { unsub1(); unsub2(); };
  }, []);

  useEffect(() => {
    setImpact(getImpactStats());
  }, [records]);

  const handleNewPartner = (data: Omit<DonationPartner, 'id' | 'createdAt'>) => {
    donationPartnersCollection.add(data as any);
    setShowNewPartner(false);
  };

  const handleConfirm = (id: string) => {
    confirmDonation(id);
  };

  const handleMarkAbgeholt = (id: string) => {
    updateDonationStatus(id, 'abgeholt', { abholDatum: new Date().toISOString() });
  };

  const tabs = [
    { key: 'overview' as const, label: 'Impact' },
    { key: 'partners' as const, label: `Partner (${partners.length})` },
    { key: 'history' as const, label: `Spenden (${records.length})` },
  ];

  return (
    <div>
      <PageHeader
        title="Spenden"
        subtitle="Erst vermitteln, dann spenden — nie entsorgen."
        breadcrumbs={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Spenden' },
        ]}
        actions={
          <button
            onClick={() => setShowNewPartner(true)}
            className="inline-flex items-center gap-2 bg-[#1a472a] text-white px-5 py-2.5 font-black uppercase tracking-[0.1em] text-[11px] hover:bg-[#8cc63f] hover:text-[#1a472a] transition-all"
          >
            <Plus size={14} />
            Neuer Spendenpartner
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.key
                ? 'bg-[#1a472a] text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-[#1a472a] hover:text-[#1a472a]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* === OVERVIEW TAB === */}
      {activeTab === 'overview' && impact && (
        <div className="space-y-6">
          {/* Impact Hero */}
          <div className="bg-gradient-to-br from-[#1a472a] to-[#0a1a0f] text-white p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-6xl opacity-10">❤️</div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8cc63f] mb-2">Social Impact</p>
            <h2 className="text-4xl md:text-5xl font-black mb-1">
              {impact.totalMahlzeiten.toLocaleString('de-AT')}
            </h2>
            <p className="text-white/60 text-sm font-bold">Mahlzeiten gerettet</p>
            <p className="text-white/40 text-xs mt-4">
              Jedes Kilogramm gespendeter Lebensmittel bedeutet ca. 2 Mahlzeiten für Menschen in Not.
              Kein Sonderposten wird verschwendet.
            </p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ImpactCard icon={Heart} value={String(impact.totalDonations)} label="Spenden gesamt" accent />
            <ImpactCard icon={Package} value={`${impact.totalGewichtKg.toLocaleString('de-AT')} kg`} label="Gewicht gerettet" />
            <ImpactCard icon={TrendingUp} value={`€ ${impact.totalWert.toLocaleString('de-AT', { minimumFractionDigits: 0 })}`} label="Warenwert gespendet" />
            <ImpactCard icon={Users} value={String(impact.partnerCount)} label="Spendenpartner beliefert" />
          </div>

          {/* Letzte Spenden */}
          {impact.letzteSpenden.length > 0 && (
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-3">Letzte Spenden</h3>
              <div className="space-y-2">
                {impact.letzteSpenden.map(d => {
                  const partner = donationPartnersCollection.getById(d.donationPartnerId);
                  return (
                    <div key={d.id} className="flex items-center justify-between bg-white border border-gray-100 p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Heart size={14} className="text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0a1a0f]">{partner?.name || 'Unbekannt'}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[300px]">{d.artikelBeschreibung}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-black text-[#0a1a0f]">{d.gewichtKg} kg</p>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 ${DONATION_STATUS_COLORS[d.status]}`}>
                          {DONATION_STATUS_LABELS[d.status]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* === PARTNERS TAB === */}
      {activeTab === 'partners' && (
        <div className="space-y-3">
          {partners.length === 0 ? (
            <div className="text-center py-16">
              <Heart size={48} className="mx-auto text-gray-200 mb-4" />
              <h3 className="font-black text-lg text-gray-400">Keine Spendenpartner</h3>
              <p className="text-sm text-gray-300 mt-1">Lege deinen ersten Spendenpartner an (Tafel, Caritas, Foodbank...)</p>
              <button onClick={() => setShowNewPartner(true)} className="mt-4 inline-flex items-center gap-2 bg-[#1a472a] text-white px-5 py-2.5 font-black uppercase tracking-[0.1em] text-[11px] hover:bg-[#8cc63f] hover:text-[#1a472a] transition-all">
                <Plus size={14} /> Spendenpartner anlegen
              </button>
            </div>
          ) : (
            partners.map(p => <PartnerCard key={p.id} partner={p} onEdit={() => {}} />)
          )}
        </div>
      )}

      {/* === HISTORY TAB === */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="text-center py-16">
              <Package size={48} className="mx-auto text-gray-200 mb-4" />
              <h3 className="font-black text-lg text-gray-400">Noch keine Spenden</h3>
              <p className="text-sm text-gray-300 mt-1">Spenden werden aus dem Deal-Flow erstellt, wenn Ware nicht verkauft wird.</p>
            </div>
          ) : (
            records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(d => {
              const partner = donationPartnersCollection.getById(d.donationPartnerId);
              return (
                <div key={d.id} className="bg-white border border-gray-100 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-gray-300">{d.spendenbestaetigungNr}</span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 ${DONATION_STATUS_COLORS[d.status]}`}>
                          {DONATION_STATUS_LABELS[d.status]}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-[#0a1a0f]">{partner?.name || 'Unbekannt'}</h3>
                      <p className="text-xs text-gray-400 mt-1">{d.artikelBeschreibung}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-[#0a1a0f]">{d.gewichtKg} kg</p>
                      <p className="text-[10px] text-gray-400">{d.mengePaletten} Pal. / {d.mengeKartons} Krt.</p>
                      <p className="text-xs text-gray-400 mt-1">€ {d.geschaetzterWert.toLocaleString('de-AT')}</p>
                    </div>
                  </div>

                  {d.dealId && (
                    <p className="text-[10px] text-gray-300 mt-2 flex items-center gap-1">
                      <Calendar size={11} /> Deal: {d.dealId}
                    </p>
                  )}

                  {/* Action Buttons */}
                  {d.status !== 'bestaetigt' && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                      {d.status === 'vorgeschlagen' && (
                        <button onClick={() => updateDonationStatus(d.id, 'geplant')} className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 transition-all">
                          <Clock size={11} className="inline mr-1" /> Als geplant markieren
                        </button>
                      )}
                      {(d.status === 'geplant' || d.status === 'vorgeschlagen') && (
                        <button onClick={() => handleMarkAbgeholt(d.id)} className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 border border-purple-200 text-purple-600 hover:bg-purple-50 transition-all">
                          <Truck size={11} className="inline mr-1" /> Abgeholt
                        </button>
                      )}
                      <button onClick={() => handleConfirm(d.id)} className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 transition-all">
                        <CheckCircle size={11} className="inline mr-1" /> Bestätigen
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* New Partner Modal */}
      {showNewPartner && (
        <NewPartnerModal onClose={() => setShowNewPartner(false)} onSave={handleNewPartner} />
      )}
    </div>
  );
}
