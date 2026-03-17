import { useState, useRef } from 'react';
import { Save, Building, RotateCcw, Upload, X, Mail, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { getPlatformSettings, updatePlatformSettings, resetAllData } from '../../lib/demoStore';
import type { PlatformSettings } from '../../types';
import { getEmailConfigStatus } from '../../lib/emailService';

export default function Settings() {
  const [form, setForm] = useState<PlatformSettings>(getPlatformSettings());
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) { alert('Logo darf max. 500 KB groß sein.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      // Compress via canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 200;
        const scale = Math.min(maxW / img.width, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png', 0.9);
        update('logoUrl', dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const update = (field: keyof PlatformSettings, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    updatePlatformSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputClass =
    'w-full bg-gray-50 border border-gray-200 py-2.5 px-3 text-sm focus:border-[#111113] focus:outline-none transition-all';
  const labelClass =
    'block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#111113] mb-1';

  return (
    <div>
      <PageHeader
        title="Einstellungen"
        subtitle="Firmendaten, Bankverbindung und Standardwerte"
        actions={
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 bg-[#111113] text-[#ffffff] px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] hover:bg-[#8cc63f] hover:text-[#111113] transition-all"
          >
            <Save size={14} />
            {saved ? 'Gespeichert!' : 'Speichern'}
          </button>
        }
      />

      {saved && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm font-bold">
          Einstellungen erfolgreich gespeichert.
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Firmendaten */}
        <div className="bg-[#ffffff] border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building size={16} className="text-[#111113]" />
            <h3 className="text-sm font-black uppercase tracking-tight">Firmendaten</h3>
          </div>
          <div className="space-y-4">
            {/* Logo Upload */}
            <div>
              <label className={labelClass}>Logo</label>
              <div className="flex items-center gap-4">
                {form.logoUrl ? (
                  <div className="relative group">
                    <img src={form.logoUrl} alt="Logo" className="h-14 object-contain border border-gray-200 p-1 bg-[#ffffff]" />
                    <button
                      onClick={() => update('logoUrl', '')}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <div className="h-14 w-24 border-2 border-dashed border-gray-200 flex items-center justify-center">
                    <span className="text-[9px] text-gray-300 uppercase font-bold">Kein Logo</span>
                  </div>
                )}
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-2 border border-gray-200 text-gray-500 px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:border-[#111113] hover:text-[#111113] transition-all"
                >
                  <Upload size={12} />
                  Hochladen
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Firmenname</label>
              <input
                type="text"
                value={form.firmenname}
                onChange={e => update('firmenname', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Adresse</label>
              <input
                type="text"
                value={form.adresse}
                onChange={e => update('adresse', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>PLZ</label>
                <input
                  type="text"
                  value={form.plz}
                  onChange={e => update('plz', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Ort</label>
                <input
                  type="text"
                  value={form.ort}
                  onChange={e => update('ort', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Land</label>
                <input
                  type="text"
                  value={form.land}
                  onChange={e => update('land', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>UID-Nummer</label>
              <input
                type="text"
                value={form.uid}
                onChange={e => update('uid', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Kontakt + Bank + Defaults */}
        <div className="space-y-6">
          {/* Kontakt */}
          <div className="bg-[#ffffff] border border-gray-200 p-6">
            <h3 className="text-sm font-black uppercase tracking-tight mb-5">Kontakt</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>E-Mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Telefon</label>
                  <input
                    type="text"
                    value={form.telefon}
                    onChange={e => update('telefon', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Website</label>
                <input
                  type="text"
                  value={form.website}
                  onChange={e => update('website', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Bankverbindung */}
          <div className="bg-[#ffffff] border border-gray-200 p-6">
            <h3 className="text-sm font-black uppercase tracking-tight mb-5">Bankverbindung</h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Bank</label>
                <input
                  type="text"
                  value={form.bankName}
                  onChange={e => update('bankName', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>IBAN</label>
                <input
                  type="text"
                  value={form.iban}
                  onChange={e => update('iban', e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className={labelClass}>BIC</label>
                <input
                  type="text"
                  value={form.bic}
                  onChange={e => update('bic', e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>
          </div>

          {/* Standardwerte */}
          <div className="bg-[#ffffff] border border-gray-200 p-6">
            <h3 className="text-sm font-black uppercase tracking-tight mb-5">Standardwerte</h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Standard-Provisionssatz (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={parseFloat((form.defaultProvisionRate * 100).toFixed(2))}
                  onChange={e => update('defaultProvisionRate', (parseFloat(e.target.value) || 0) / 100)}
                  className={`${inputClass} font-mono`}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  z.B. 6 = 6% Provision. Aktuell: {(form.defaultProvisionRate * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <label className={labelClass}>Standard-Zahlungsbedingung</label>
                <input
                  type="text"
                  value={form.defaultZahlungsbedingung}
                  onChange={e => update('defaultZahlungsbedingung', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Standard-Lieferbedingung</label>
                <input
                  type="text"
                  value={form.defaultLieferbedingung}
                  onChange={e => update('defaultLieferbedingung', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Standard-MwSt-Satz (%)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={parseFloat((form.defaultMwstRate * 100).toFixed(2))}
                  onChange={e => update('defaultMwstRate', (parseFloat(e.target.value) || 0) / 100)}
                  className={`${inputClass} font-mono`}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  z.B. 20 = 20% MwSt. Aktuell: {(form.defaultMwstRate * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EmailJS Konfiguration */}
      <div className="mt-8 bg-[#ffffff] border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-[#111113]" />
            <h3 className="text-sm font-black uppercase tracking-tight">E-Mail-Versand (EmailJS)</h3>
          </div>
          <a
            href="https://www.emailjs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#111113] hover:text-[#8cc63f] transition-colors uppercase tracking-wider"
          >
            <ExternalLink size={11} />
            EmailJS Dashboard
          </a>
        </div>

        {/* Status Badges */}
        {(() => {
          const status = getEmailConfigStatus();
          return (
            <div className="flex flex-wrap gap-2 mb-5">
              {[
                { ok: status.hasPublicKey, label: 'Public Key' },
                { ok: status.hasServiceId, label: 'Service ID' },
                { ok: status.hasAngebotTemplate, label: 'Angebot' },
                { ok: status.hasKontaktTemplate, label: 'Kontakt' },
                { ok: status.hasStatusTemplate, label: 'Status' },
              ].map(item => (
                <span
                  key={item.label}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${
                    item.ok ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-50 text-gray-400 border border-gray-200'
                  }`}
                >
                  {item.ok ? <CheckCircle size={10} /> : <XCircle size={10} />}
                  {item.label}
                </span>
              ))}
            </div>
          );
        })()}

        <p className="text-xs text-gray-500 mb-5 leading-relaxed">
          EmailJS ermöglicht den E-Mail-Versand direkt aus dem Browser — ohne Backend.
          Erstelle ein kostenloses Konto auf <a href="https://www.emailjs.com" target="_blank" rel="noopener noreferrer" className="text-[#111113] font-bold underline">emailjs.com</a>,
          verbinde deinen E-Mail-Service (Gmail, Outlook, SMTP) und erstelle E-Mail-Templates.
          Trage die IDs hier ein.
        </p>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Public Key</label>
              <input
                type="text"
                value={form.emailjsPublicKey}
                onChange={e => update('emailjsPublicKey', e.target.value)}
                className={`${inputClass} font-mono`}
                placeholder="z.B. AbCdEfGh12345678"
              />
              <p className="text-[10px] text-gray-400 mt-1">Account → API Keys → Public Key</p>
            </div>
            <div>
              <label className={labelClass}>Service ID</label>
              <input
                type="text"
                value={form.emailjsServiceId}
                onChange={e => update('emailjsServiceId', e.target.value)}
                className={`${inputClass} font-mono`}
                placeholder="z.B. service_abc123"
              />
              <p className="text-[10px] text-gray-400 mt-1">Email Services → dein Service → Service ID</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Template ID — Angebot</label>
              <input
                type="text"
                value={form.emailjsTemplateAngebot}
                onChange={e => update('emailjsTemplateAngebot', e.target.value)}
                className={`${inputClass} font-mono`}
                placeholder="z.B. template_angebot"
              />
              <p className="text-[10px] text-gray-400 mt-1">Für Angebots-E-Mails an Käufer</p>
            </div>
            <div>
              <label className={labelClass}>Template ID — Kontaktformular</label>
              <input
                type="text"
                value={form.emailjsTemplateKontakt}
                onChange={e => update('emailjsTemplateKontakt', e.target.value)}
                className={`${inputClass} font-mono`}
                placeholder="z.B. template_kontakt"
              />
              <p className="text-[10px] text-gray-400 mt-1">Für Anfragen von der Landing Page</p>
            </div>
            <div>
              <label className={labelClass}>Template ID — Status-Update</label>
              <input
                type="text"
                value={form.emailjsTemplateStatus}
                onChange={e => update('emailjsTemplateStatus', e.target.value)}
                className={`${inputClass} font-mono`}
                placeholder="z.B. template_status"
              />
              <p className="text-[10px] text-gray-400 mt-1">Für Deal-Status-Benachrichtigungen</p>
            </div>
          </div>
        </div>

        {/* Setup Anleitung */}
        <details className="mt-6">
          <summary className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#111113] cursor-pointer hover:text-[#8cc63f] transition-colors">
            Setup-Anleitung anzeigen
          </summary>
          <div className="mt-4 bg-[#ffffff] p-4 text-xs text-gray-600 space-y-3 leading-relaxed">
            <p><strong>1.</strong> Gehe zu <a href="https://www.emailjs.com" target="_blank" rel="noopener noreferrer" className="text-[#111113] font-bold underline">emailjs.com</a> und erstelle ein kostenloses Konto.</p>
            <p><strong>2.</strong> Unter "Email Services" → "Add New Service" → wähle deinen E-Mail-Provider (z.B. Outlook/Microsoft 365 für info@hello2ndrun.com).</p>
            <p><strong>3.</strong> Unter "Email Templates" erstelle 3 Templates:</p>
            <div className="ml-4 space-y-2">
              <p><strong>Angebot-Template:</strong> Variablen: {'{{to_name}}, {{deal_nr}}, {{verkaeufer_firma}}, {{kaeufer_firma}}, {{artikel_liste}}, {{netto_betrag}}, {{brutto_betrag}}, {{angebot_link}}'}</p>
              <p><strong>Kontakt-Template:</strong> Variablen: {'{{from_name}}, {{from_email}}, {{firma}}, {{telefon}}, {{nachricht}}, {{anfrage_typ}}'}</p>
              <p><strong>Status-Template:</strong> Variablen: {'{{to_name}}, {{deal_nr}}, {{status_label}}, {{verkaeufer_firma}}, {{kaeufer_firma}}, {{netto_betrag}}'}</p>
            </div>
            <p><strong>4.</strong> Kopiere Public Key, Service ID und Template IDs hierher und klicke "Speichern".</p>
            <p className="text-[#8cc63f] font-bold">Fertig! Alle E-Mails werden jetzt automatisch versendet.</p>
          </div>
        </details>
      </div>

      {/* Danger Zone */}
      <div className="mt-8 bg-[#ffffff] border border-red-200 p-6">
        <h3 className="text-sm font-black uppercase tracking-tight text-red-600 mb-2">Gefahrenzone</h3>
        <p className="text-xs text-gray-500 mb-4">
          Alle Daten (Partner, Deals, Artikel, Dokumente) auf die Seed-Daten zurücksetzen.
          Alle manuell erstellten Einträge gehen verloren.
        </p>
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="inline-flex items-center gap-2 border border-red-200 text-red-500 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] hover:bg-red-50 transition-all"
          >
            <RotateCcw size={14} />
            Alle Daten zurücksetzen
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-red-600 font-bold">Wirklich alle Daten zurücksetzen?</span>
            <button
              onClick={() => {
                resetAllData();
                setForm(getPlatformSettings());
                setShowResetConfirm(false);
                setSaved(false);
              }}
              className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] hover:bg-red-700 transition-all"
            >
              Ja, zurücksetzen
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-500 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] hover:border-gray-400 transition-all"
            >
              Abbrechen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
