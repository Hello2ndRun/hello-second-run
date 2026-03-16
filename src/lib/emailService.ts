// ════════════════════════════════════════════════════════════
// EmailJS Service — Send real emails from the browser
// No backend needed. Free: 200 emails/month
// Setup: https://www.emailjs.com → Account → Service → Templates
// ════════════════════════════════════════════════════════════

import emailjs from '@emailjs/browser';
import { getPlatformSettings } from './demoStore';
import type { Deal, DealArticle, Partner, PlatformSettings } from '../types';
import { formatCurrency, formatPercent } from './formatters';

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────

export interface EmailResult {
  success: boolean;
  message: string;
}

interface AngebotEmailParams {
  deal: Deal;
  articles: DealArticle[];
  verkaeufer: Partner;
  kaeufer: Partner;
  angebotLink: string;
}

interface StatusEmailParams {
  deal: Deal;
  verkaeufer: Partner;
  kaeufer: Partner;
  newStatus: string;
  statusLabel: string;
}

interface KontaktEmailParams {
  name: string;
  email: string;
  firma: string;
  telefon: string;
  nachricht: string;
  typ: 'verkauf' | 'kauf' | 'allgemein';
}

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

function isConfigured(settings: PlatformSettings): boolean {
  return !!(
    settings.emailjsPublicKey &&
    settings.emailjsServiceId
  );
}

function initEmailJS(publicKey: string) {
  emailjs.init(publicKey);
}

// ──────────────────────────────────────────────
// SEND: Angebot per E-Mail
// ──────────────────────────────────────────────

export async function sendAngebotEmail(params: AngebotEmailParams): Promise<EmailResult> {
  const settings = getPlatformSettings();
  if (!isConfigured(settings) || !settings.emailjsTemplateAngebot) {
    return { success: false, message: 'EmailJS nicht konfiguriert. Gehe zu Einstellungen → E-Mail.' };
  }

  initEmailJS(settings.emailjsPublicKey);

  const artikelListe = params.articles
    .map((a, i) => `${i + 1}. ${a.artikelname} — ${a.mengePaletten} Pal — VK ${formatCurrency(a.vkPreis)}/Stk`)
    .join('\n');

  try {
    await emailjs.send(settings.emailjsServiceId, settings.emailjsTemplateAngebot, {
      to_email: params.kaeufer.email,
      to_name: params.kaeufer.kontaktperson || params.kaeufer.firmenname,
      from_name: settings.firmenname,
      reply_to: settings.email,
      deal_nr: params.deal.angebotNr || params.deal.id,
      verkaeufer_firma: params.verkaeufer.firmenname,
      kaeufer_firma: params.kaeufer.firmenname,
      artikel_liste: artikelListe,
      netto_betrag: formatCurrency(params.deal.subtotalNetto),
      brutto_betrag: formatCurrency(params.deal.totalBrutto),
      mwst_betrag: formatCurrency(params.deal.mwstAmount),
      angebot_link: params.angebotLink,
      zahlungsbedingung: params.deal.zahlungsbedingung,
      lieferbedingung: params.deal.lieferbedingung,
      plattform_name: settings.firmenname,
      plattform_email: settings.email,
      plattform_telefon: settings.telefon,
    });

    return { success: true, message: `Angebot an ${params.kaeufer.email} gesendet!` };
  } catch (err: any) {
    console.error('EmailJS Angebot error:', err);
    return { success: false, message: `Fehler: ${err?.text || err?.message || 'Unbekannt'}` };
  }
}

// ──────────────────────────────────────────────
// SEND: Status-Update E-Mail
// ──────────────────────────────────────────────

export async function sendStatusEmail(params: StatusEmailParams): Promise<EmailResult> {
  const settings = getPlatformSettings();
  if (!isConfigured(settings) || !settings.emailjsTemplateStatus) {
    return { success: false, message: 'EmailJS nicht konfiguriert. Gehe zu Einstellungen → E-Mail.' };
  }

  initEmailJS(settings.emailjsPublicKey);

  // Determine recipient based on status
  const isKaeuferRecipient = ['angebot_gesendet', 'bestaetigt', 'rechnung_erstellt', 'abgeholt'].includes(params.newStatus);
  const recipient = isKaeuferRecipient ? params.kaeufer : params.verkaeufer;

  try {
    await emailjs.send(settings.emailjsServiceId, settings.emailjsTemplateStatus, {
      to_email: recipient.email,
      to_name: recipient.kontaktperson || recipient.firmenname,
      from_name: settings.firmenname,
      reply_to: settings.email,
      deal_nr: params.deal.angebotNr || params.deal.id,
      status_label: params.statusLabel,
      verkaeufer_firma: params.verkaeufer.firmenname,
      kaeufer_firma: params.kaeufer.firmenname,
      netto_betrag: formatCurrency(params.deal.subtotalNetto),
      brutto_betrag: formatCurrency(params.deal.totalBrutto),
      provision_betrag: formatCurrency(params.deal.provisionAmount),
      provision_rate: formatPercent(params.deal.provisionRate * 100),
      plattform_name: settings.firmenname,
      plattform_email: settings.email,
      plattform_telefon: settings.telefon,
    });

    return { success: true, message: `Status-E-Mail an ${recipient.email} gesendet!` };
  } catch (err: any) {
    console.error('EmailJS Status error:', err);
    return { success: false, message: `Fehler: ${err?.text || err?.message || 'Unbekannt'}` };
  }
}

// ──────────────────────────────────────────────
// SEND: Kontaktformular E-Mail
// ──────────────────────────────────────────────

export async function sendKontaktEmail(params: KontaktEmailParams): Promise<EmailResult> {
  const settings = getPlatformSettings();
  if (!isConfigured(settings) || !settings.emailjsTemplateKontakt) {
    return { success: false, message: 'EmailJS nicht konfiguriert.' };
  }

  initEmailJS(settings.emailjsPublicKey);

  const typLabels: Record<string, string> = {
    verkauf: 'Ware verkaufen (Sonderposten anbieten)',
    kauf: 'Ware kaufen (Sonderposten suchen)',
    allgemein: 'Allgemeine Anfrage',
  };

  try {
    await emailjs.send(settings.emailjsServiceId, settings.emailjsTemplateKontakt, {
      from_name: params.name,
      from_email: params.email,
      firma: params.firma,
      telefon: params.telefon,
      nachricht: params.nachricht,
      anfrage_typ: typLabels[params.typ] || params.typ,
      reply_to: params.email,
      to_email: settings.email,
      plattform_name: settings.firmenname,
    });

    return { success: true, message: 'Nachricht erfolgreich gesendet!' };
  } catch (err: any) {
    console.error('EmailJS Kontakt error:', err);
    return { success: false, message: `Fehler: ${err?.text || err?.message || 'Unbekannt'}` };
  }
}

// ──────────────────────────────────────────────
// CHECK: Ist EmailJS konfiguriert?
// ──────────────────────────────────────────────

export function isEmailConfigured(): boolean {
  return isConfigured(getPlatformSettings());
}

export function getEmailConfigStatus(): {
  configured: boolean;
  hasPublicKey: boolean;
  hasServiceId: boolean;
  hasAngebotTemplate: boolean;
  hasKontaktTemplate: boolean;
  hasStatusTemplate: boolean;
} {
  const s = getPlatformSettings();
  return {
    configured: isConfigured(s),
    hasPublicKey: !!s.emailjsPublicKey,
    hasServiceId: !!s.emailjsServiceId,
    hasAngebotTemplate: !!s.emailjsTemplateAngebot,
    hasKontaktTemplate: !!s.emailjsTemplateKontakt,
    hasStatusTemplate: !!s.emailjsTemplateStatus,
  };
}
