// ================================================================
// PartnerNew -- Partner creation form
// ================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { partnersCollection, logActivity } from '../../lib/demoStore';
import type { ArticleCategory, Partner } from '../../types';

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

type FormData = Omit<Partner, 'id' | 'createdAt'>;

const initialForm: FormData = {
  firmenname: '',
  adresse: '',
  plz: '',
  ort: '',
  land: 'AT',
  uidNummer: '',
  steuernummer: '',
  kontaktperson: '',
  telefon: '',
  email: '',
  iban: '',
  bic: '',
  bankName: '',
  rolle: 'verkaeufer',
  kategorien: [],
  sprache: 'de',
  notizen: '',
};

export default function PartnerNew() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(initialForm);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (cat: ArticleCategory) => {
    setForm((prev) => ({
      ...prev,
      kategorien: prev.kategorien.includes(cat)
        ? prev.kategorien.filter((c) => c !== cat)
        : [...prev.kategorien, cat],
    }));
  };

  const showBank = form.rolle === 'verkaeufer' || form.rolle === 'beides';

  const handleSave = () => {
    if (!form.firmenname || !form.kontaktperson || !form.email) return;
    const partnerId = partnersCollection.add({
      ...form,
      createdAt: new Date().toISOString(),
    } as Omit<Partner, 'id'>);
    const rolleLabel = form.rolle === 'verkaeufer' ? 'Verkäufer' : form.rolle === 'kaeufer' ? 'Käufer' : 'Verkäufer & Käufer';
    logActivity('partner_created', 'Neuer Partner angelegt', `${form.firmenname} (${rolleLabel})`, { partnerId });
    navigate('/admin/partners');
  };

  const inputClasses =
    'w-full bg-gray-50 border border-gray-300 py-2 px-3 text-sm focus:border-[#1a472a] focus:outline-none transition-all';
  const labelClasses =
    'block text-[10px] font-black uppercase tracking-widest text-[#1a472a] mb-1';

  return (
    <div>
      <PageHeader
        title="Neuer Partner"
        subtitle="Partner anlegen"
        backTo="/admin/partners"
        breadcrumbs={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Partner', to: '/admin/partners' },
          { label: 'Neu' },
        ]}
      />

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
            <input type="text" value={form.telefon} onChange={(e) => update('telefon', e.target.value)} placeholder="+43 ..." className={inputClasses} />
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

      {/* Bankdaten (nur bei Verkäufer/Beides) */}
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
              <input type="text" value={form.iban || ''} onChange={(e) => update('iban', e.target.value)} placeholder="AT61 ..." className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>BIC</label>
              <input type="text" value={form.bic || ''} onChange={(e) => update('bic', e.target.value)} className={inputClasses} />
            </div>
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
          Partner speichern
        </button>
        <button
          onClick={() => navigate('/admin/partners')}
          className="inline-flex items-center gap-2 border border-gray-200 text-gray-500 px-6 py-3 text-[11px] font-black uppercase tracking-widest hover:border-gray-400 transition-all"
        >
          <ArrowLeft size={14} />
          Abbrechen
        </button>
      </div>
    </div>
  );
}
