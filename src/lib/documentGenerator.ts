// ════════════════════════════════════════════════════════════
// Document Generator — 6 PDF Templates for HELLO SECOND/RUN
// ════════════════════════════════════════════════════════════
//
// CRITICAL: Documents run on PARTNER names, NOT platform name!
// Only exception: Provisionsrechnung (platform's own invoice)

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './formatters';
import { VAT_LABELS } from './vatCalculator';
import { getArticleStueck } from './priceCalculator';
import type { Deal, DealArticle, Partner, PlatformSettings, DocumentType } from '../types';

// ─── Shared Header Helper ───

function drawHeader(
  doc: jsPDF,
  issuer: { name: string; adresse: string; plz: string; ort: string; land: string; uid: string; telefon?: string; email?: string },
  recipient: { name: string; kontakt: string; adresse: string; plz: string; ort: string; land: string; uid?: string },
) {
  const pw = doc.internal.pageSize.getWidth();

  // Issuer (left)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(issuer.name, 14, 20);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(issuer.adresse, 14, 26);
  doc.text(`${issuer.plz} ${issuer.ort}, ${issuer.land}`, 14, 30);
  doc.text(`UID: ${issuer.uid}`, 14, 34);
  if (issuer.telefon || issuer.email) {
    doc.text(`${issuer.telefon || ''} | ${issuer.email || ''}`, 14, 38);
  }

  // Recipient (right)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(recipient.name, 120, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(recipient.kontakt, 120, 25);
  doc.text(recipient.adresse, 120, 29);
  doc.text(`${recipient.plz} ${recipient.ort}, ${recipient.land}`, 120, 33);
  if (recipient.uid) {
    doc.text(`UID: ${recipient.uid}`, 120, 37);
  }

  // Divider
  doc.setDrawColor(17, 17, 19);
  doc.setLineWidth(0.5);
  doc.line(14, 45, pw - 14, 45);
}

function drawDocTitle(doc: jsPDF, title: string, nr: string, datum: string, extra?: string) {
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 17, 19);
  doc.text(title, 14, 58);

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nr.: ${nr}`, 14, 66);
  doc.text(`Datum: ${formatDate(datum)}`, 14, 71);
  if (extra) {
    doc.text(extra, 14, 76);
  }
}

function drawArticleTable(doc: jsPDF, articles: DealArticle[], startY: number, showMhd = true) {
  const head = showMhd
    ? [['Pos', 'Artikel', 'Marke', 'EAN', 'MHD', 'Menge', 'Preis/Stk', 'Gesamt']]
    : [['Pos', 'Artikel', 'Marke', 'EAN', 'Menge', 'Preis/Stk', 'Gesamt']];

  const body = articles.map((art, i) => {
    const stueck = getArticleStueck(art);
    const gesamt = art.vkPreis * stueck;
    const row = [
      String(i + 1),
      art.artikelname,
      art.marke,
      art.ean || '—',
    ];
    if (showMhd) row.push(art.mhd ? formatDate(art.mhd) : '—');
    row.push(
      `${art.mengePaletten} Pal / ${art.mengeKartons} Kt`,
      formatCurrency(art.vkPreis),
      formatCurrency(gesamt),
    );
    return row;
  });

  autoTable(doc, {
    startY,
    head,
    body,
    theme: 'grid',
    headStyles: {
      fillColor: [17, 17, 19],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      cellPadding: 3,
    },
    bodyStyles: { fontSize: 8, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [247, 247, 248] },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      [showMhd ? 5 : 4]: { halign: 'center' },
      [showMhd ? 6 : 5]: { halign: 'right' },
      [showMhd ? 7 : 6]: { halign: 'right', fontStyle: 'bold' },
    },
  });
}

function drawTotals(doc: jsPDF, deal: Deal) {
  const pw = doc.internal.pageSize.getWidth();
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const tx = 140;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Nettobetrag:', tx, finalY);
  doc.text(formatCurrency(deal.subtotalNetto), pw - 14, finalY, { align: 'right' });

  doc.text(VAT_LABELS[deal.mwstType] + ':', tx, finalY + 6);
  doc.text(formatCurrency(deal.mwstAmount), pw - 14, finalY + 6, { align: 'right' });

  doc.setLineWidth(0.3);
  doc.line(tx, finalY + 9, pw - 14, finalY + 9);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 17, 19);
  doc.text('Gesamtbetrag:', tx, finalY + 16);
  doc.text(formatCurrency(deal.totalBrutto), pw - 14, finalY + 16, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  return finalY + 20;
}

function drawFooter(doc: jsPDF, footerEntity: { name: string; adresse: string; plz: string; ort: string; uid: string; bankName?: string; iban?: string; bic?: string; email?: string }, deal: Deal) {
  const pw = doc.internal.pageSize.getWidth();
  const fy = 268;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(14, fy - 4, pw - 14, fy - 4);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`${footerEntity.name} | ${footerEntity.adresse}, ${footerEntity.plz} ${footerEntity.ort} | UID: ${footerEntity.uid}`, 14, fy);

  if (footerEntity.bankName && footerEntity.iban) {
    doc.text(`Bank: ${footerEntity.bankName} | IBAN: ${footerEntity.iban} | BIC: ${footerEntity.bic || ''}`, 14, fy + 4);
  }

  if (deal.mwstType === 'innergemeinschaftlich') {
    doc.setFont('helvetica', 'bold');
    doc.text('Innergemeinschaftliche Lieferung gem. Art. 6 Abs. 1 UStG — Reverse Charge', 14, fy + 9);
  } else if (deal.mwstType === 'ausfuhr') {
    doc.setFont('helvetica', 'bold');
    doc.text('Ausfuhrlieferung gem. § 7 UStG — steuerfreie Ausfuhrlieferung', 14, fy + 9);
  }

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(140, 198, 63); // brand green
  doc.setFontSize(6.5);
  doc.text(`Erstellt via HELLO SECOND/RUN`, pw - 14, fy + 14, { align: 'right' });
  doc.setTextColor(160, 160, 160);
  doc.setFontSize(6);
  doc.text(`hello2ndrun.com | Deal: ${deal.id}`, pw - 14, fy + 18, { align: 'right' });
  doc.link(pw - 80, fy + 12, 66, 8, { url: 'https://hello2ndrun.com/' });
}

// ═══════════════════════════════════════════════
// 1. VISUELLES ANGEBOT (from Verkäufer)
// ═══════════════════════════════════════════════

export function generateAngebot(
  deal: Deal, articles: DealArticle[], verkaeufer: Partner, kaeufer: Partner
): string {
  const doc = new jsPDF();

  drawHeader(doc,
    { name: verkaeufer.firmenname, adresse: verkaeufer.adresse, plz: verkaeufer.plz, ort: verkaeufer.ort, land: verkaeufer.land, uid: verkaeufer.uidNummer, telefon: verkaeufer.telefon, email: verkaeufer.email },
    { name: kaeufer.firmenname, kontakt: kaeufer.kontaktperson, adresse: kaeufer.adresse, plz: kaeufer.plz, ort: kaeufer.ort, land: kaeufer.land, uid: kaeufer.uidNummer }
  );

  drawDocTitle(doc, 'ANGEBOT', deal.angebotNr, deal.createdAt);

  drawArticleTable(doc, articles, 82);
  drawTotals(doc, deal);

  // Conditions
  const condY = (doc as any).lastAutoTable.finalY + 30;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  if (deal.zahlungsbedingung) doc.text(`Zahlungsbedingung: ${deal.zahlungsbedingung}`, 14, condY);
  if (deal.lieferbedingung) doc.text(`Lieferbedingung: ${deal.lieferbedingung}`, 14, condY + 5);
  if (deal.abholtermin) doc.text(`Abholtermin: ${formatDate(deal.abholtermin)}`, 14, condY + 10);

  drawFooter(doc, { name: verkaeufer.firmenname, adresse: verkaeufer.adresse, plz: verkaeufer.plz, ort: verkaeufer.ort, uid: verkaeufer.uidNummer, email: verkaeufer.email }, deal);

  return doc.output('datauristring');
}

// ═══════════════════════════════════════════════
// 2. BESTELLBESTÄTIGUNG (from Käufer!)
// ═══════════════════════════════════════════════

export function generateBE(
  deal: Deal, articles: DealArticle[], verkaeufer: Partner, kaeufer: Partner
): string {
  const doc = new jsPDF();

  // IMPORTANT: Käufer is the issuer
  drawHeader(doc,
    { name: kaeufer.firmenname, adresse: kaeufer.adresse, plz: kaeufer.plz, ort: kaeufer.ort, land: kaeufer.land, uid: kaeufer.uidNummer, telefon: kaeufer.telefon, email: kaeufer.email },
    { name: verkaeufer.firmenname, kontakt: verkaeufer.kontaktperson, adresse: verkaeufer.adresse, plz: verkaeufer.plz, ort: verkaeufer.ort, land: verkaeufer.land, uid: verkaeufer.uidNummer }
  );

  drawDocTitle(doc, 'VERBINDLICHE BESTELLUNG', deal.bestellbestaetigungNr, new Date().toISOString(), `Bezug: Angebot ${deal.angebotNr}`);

  drawArticleTable(doc, articles, 82);
  drawTotals(doc, deal);

  const accY = (doc as any).lastAutoTable.finalY + 30;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Hiermit bestellen wir die oben aufgeführten Waren verbindlich zu den im Angebot genannten Konditionen.', 14, accY);

  drawFooter(doc, { name: kaeufer.firmenname, adresse: kaeufer.adresse, plz: kaeufer.plz, ort: kaeufer.ort, uid: kaeufer.uidNummer }, deal);

  return doc.output('datauristring');
}

// ═══════════════════════════════════════════════
// 3. AUFTRAGSBESTÄTIGUNG (from Verkäufer)
// ═══════════════════════════════════════════════

export function generateAB(
  deal: Deal, articles: DealArticle[], verkaeufer: Partner, kaeufer: Partner
): string {
  const doc = new jsPDF();

  drawHeader(doc,
    { name: verkaeufer.firmenname, adresse: verkaeufer.adresse, plz: verkaeufer.plz, ort: verkaeufer.ort, land: verkaeufer.land, uid: verkaeufer.uidNummer, telefon: verkaeufer.telefon, email: verkaeufer.email },
    { name: kaeufer.firmenname, kontakt: kaeufer.kontaktperson, adresse: kaeufer.adresse, plz: kaeufer.plz, ort: kaeufer.ort, land: kaeufer.land, uid: kaeufer.uidNummer }
  );

  drawDocTitle(doc, 'AUFTRAGSBESTÄTIGUNG', deal.auftragsbestaetigungNr, new Date().toISOString(), `Bezug: Bestellung ${deal.bestellbestaetigungNr}`);

  drawArticleTable(doc, articles, 82);
  drawTotals(doc, deal);

  const termY = (doc as any).lastAutoTable.finalY + 30;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  if (deal.zahlungsbedingung) doc.text(`Zahlungsfrist: ${deal.zahlungsbedingung}`, 14, termY);
  if (deal.abholtermin) doc.text(`Abholtermin: ${formatDate(deal.abholtermin)}`, 14, termY + 6);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Die Ware bleibt bis zur vollständigen Bezahlung Eigentum des Verkäufers (Eigentumsvorbehalt).', 14, termY + 14);

  drawFooter(doc, { name: verkaeufer.firmenname, adresse: verkaeufer.adresse, plz: verkaeufer.plz, ort: verkaeufer.ort, uid: verkaeufer.uidNummer, bankName: verkaeufer.bankName, iban: verkaeufer.iban, bic: verkaeufer.bic }, deal);

  return doc.output('datauristring');
}

// ═══════════════════════════════════════════════
// 4. RECHNUNG (from Verkäufer)
// ═══════════════════════════════════════════════

export function generateRechnung(
  deal: Deal, articles: DealArticle[], verkaeufer: Partner, kaeufer: Partner
): string {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();

  drawHeader(doc,
    { name: verkaeufer.firmenname, adresse: verkaeufer.adresse, plz: verkaeufer.plz, ort: verkaeufer.ort, land: verkaeufer.land, uid: verkaeufer.uidNummer, telefon: verkaeufer.telefon, email: verkaeufer.email },
    { name: kaeufer.firmenname, kontakt: kaeufer.kontaktperson, adresse: kaeufer.adresse, plz: kaeufer.plz, ort: kaeufer.ort, land: kaeufer.land, uid: kaeufer.uidNummer }
  );

  drawDocTitle(doc, 'RECHNUNG', deal.rechnungNr, new Date().toISOString());

  // Large amount at top
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 17, 19);
  doc.text(`Rechnungsbetrag: ${formatCurrency(deal.totalBrutto)}`, pw - 14, 62, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  drawArticleTable(doc, articles, 82, false);
  drawTotals(doc, deal);

  // Both UIDs
  const uidY = (doc as any).lastAutoTable.finalY + 30;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`UID Verkäufer: ${verkaeufer.uidNummer}`, 14, uidY);
  doc.text(`UID Käufer: ${kaeufer.uidNummer || '—'}`, 14, uidY + 5);

  // Bank details prominent
  if (verkaeufer.bankName && verkaeufer.iban) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Bankverbindung für Zahlung:', 14, uidY + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(`${verkaeufer.bankName} | IBAN: ${verkaeufer.iban} | BIC: ${verkaeufer.bic || ''}`, 14, uidY + 19);
  }

  drawFooter(doc, { name: verkaeufer.firmenname, adresse: verkaeufer.adresse, plz: verkaeufer.plz, ort: verkaeufer.ort, uid: verkaeufer.uidNummer, bankName: verkaeufer.bankName, iban: verkaeufer.iban, bic: verkaeufer.bic }, deal);

  return doc.output('datauristring');
}

// ═══════════════════════════════════════════════
// 5. LIEFERSCHEIN (from Verkäufer — ohne Preise!)
// ═══════════════════════════════════════════════

export function generateLieferschein(
  deal: Deal, articles: DealArticle[], verkaeufer: Partner, kaeufer: Partner
): string {
  const doc = new jsPDF();

  drawHeader(doc,
    { name: verkaeufer.firmenname, adresse: verkaeufer.adresse, plz: verkaeufer.plz, ort: verkaeufer.ort, land: verkaeufer.land, uid: verkaeufer.uidNummer, telefon: verkaeufer.telefon, email: verkaeufer.email },
    { name: kaeufer.firmenname, kontakt: kaeufer.kontaktperson, adresse: kaeufer.adresse, plz: kaeufer.plz, ort: kaeufer.ort, land: kaeufer.land, uid: kaeufer.uidNummer }
  );

  const lsNr = deal.id.replace('HSR-', 'LS-');
  drawDocTitle(doc, 'LIEFERSCHEIN', lsNr, new Date().toISOString(), `Bezug: Auftrag ${deal.auftragsbestaetigungNr || deal.angebotNr}`);

  // Article table WITHOUT prices
  const head = [['Pos', 'Artikel', 'Marke', 'EAN', 'MHD', 'Menge']];
  const body = articles.map((art, i) => [
    String(i + 1),
    art.artikelname,
    art.marke,
    art.ean || '\u2014',
    art.mhd ? formatDate(art.mhd) : '\u2014',
    `${art.mengePaletten} Pal / ${art.mengeKartons} Kt`,
  ]);

  autoTable(doc, {
    startY: 82,
    head,
    body,
    theme: 'grid',
    headStyles: {
      fillColor: [17, 17, 19],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      cellPadding: 3,
    },
    bodyStyles: { fontSize: 8, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [247, 247, 248] },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      5: { halign: 'center' },
    },
  });

  // Delivery details
  const detY = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Lieferdatum: ${formatDate(new Date().toISOString())}`, 14, detY);
  if (deal.abholtermin) {
    doc.text(`Abholtermin: ${formatDate(deal.abholtermin)}`, 14, detY + 6);
  }
  if (deal.lieferbedingung) {
    doc.setFont('helvetica', 'normal');
    doc.text(`Lieferbedingung: ${deal.lieferbedingung}`, 14, detY + 12);
  }

  // Signature field
  const sigY = detY + 30;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Ware vollst\u00e4ndig und unbeschadet erhalten:', 14, sigY);
  doc.setLineWidth(0.3);
  doc.line(14, sigY + 14, 100, sigY + 14);
  doc.setFontSize(7);
  doc.text('Datum, Unterschrift Empf\u00e4nger', 14, sigY + 18);

  drawFooter(doc, { name: verkaeufer.firmenname, adresse: verkaeufer.adresse, plz: verkaeufer.plz, ort: verkaeufer.ort, uid: verkaeufer.uidNummer }, deal);

  return doc.output('datauristring');
}

// ═══════════════════════════════════════════════
// 6. PROVISIONSRECHNUNG (from HELLO SECOND/RUN!)
// ═══════════════════════════════════════════════

export function generateProvision(
  deal: Deal, verkaeufer: Partner, platform: PlatformSettings
): string {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();

  // Platform is the issuer (only document from platform!)
  drawHeader(doc,
    { name: platform.firmenname, adresse: platform.adresse, plz: platform.plz, ort: platform.ort, land: platform.land, uid: platform.uid, telefon: platform.telefon, email: platform.email },
    { name: verkaeufer.firmenname, kontakt: verkaeufer.kontaktperson, adresse: verkaeufer.adresse, plz: verkaeufer.plz, ort: verkaeufer.ort, land: verkaeufer.land, uid: verkaeufer.uidNummer }
  );

  drawDocTitle(doc, 'PROVISIONSRECHNUNG', deal.provisionsrechnungNr, new Date().toISOString(), `Bezug: Deal ${deal.id}`);

  // Commission details
  const provNetto = deal.provisionAmount;
  const provMwst = Math.round(provNetto * 0.20 * 100) / 100;
  const provBrutto = Math.round((provNetto + provMwst) * 100) / 100;

  let y = 82;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Vermittlungsprovision für Deal ${deal.id}`, 14, y);
  y += 8;
  doc.text(`Dealwert (Netto): ${formatCurrency(deal.subtotalNetto)}`, 14, y);
  y += 6;
  doc.text(`Provisionsrate: ${(deal.provisionRate * 100).toFixed(1)}%`, 14, y);

  y += 14;
  const tx = 140;
  doc.setFontSize(9);
  doc.text('Provision Netto:', tx, y);
  doc.text(formatCurrency(provNetto), pw - 14, y, { align: 'right' });

  doc.text('20% USt:', tx, y + 6);
  doc.text(formatCurrency(provMwst), pw - 14, y + 6, { align: 'right' });

  doc.setLineWidth(0.3);
  doc.line(tx, y + 9, pw - 14, y + 9);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 17, 19);
  doc.text('Rechnungsbetrag:', tx, y + 16);
  doc.text(formatCurrency(provBrutto), pw - 14, y + 16, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  // Platform bank details
  y += 30;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Bankverbindung:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${platform.bankName} | IBAN: ${platform.iban} | BIC: ${platform.bic}`, 14, y + 5);

  // Footer
  const fy = 268;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(14, fy - 4, pw - 14, fy - 4);

  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`${platform.firmenname} | ${platform.adresse}, ${platform.plz} ${platform.ort} | UID: ${platform.uid}`, 14, fy);
  doc.text(`Bank: ${platform.bankName} | IBAN: ${platform.iban} | BIC: ${platform.bic}`, 14, fy + 4);
  doc.text(`${platform.email} | ${platform.website}`, pw - 14, fy, { align: 'right' });

  doc.setTextColor(140, 198, 63);
  doc.setFontSize(6.5);
  doc.text(`Erstellt via HELLO SECOND/RUN`, pw - 14, fy + 10, { align: 'right' });
  doc.setTextColor(160, 160, 160);
  doc.setFontSize(6);
  doc.text(`hello2ndrun.com | Deal: ${deal.id}`, pw - 14, fy + 14, { align: 'right' });
  doc.link(pw - 80, fy + 8, 66, 8, { url: 'https://hello2ndrun.com/' });

  return doc.output('datauristring');
}

// ═══════════════════════════════════════════════
// MAIN DISPATCHER
// ═══════════════════════════════════════════════

export function generateDocument(
  type: DocumentType,
  deal: Deal,
  articles: DealArticle[],
  verkaeufer: Partner,
  kaeufer: Partner,
  platform: PlatformSettings,
): string {
  switch (type) {
    case 'angebot':
      return generateAngebot(deal, articles, verkaeufer, kaeufer);
    case 'bestellbestaetigung':
      return generateBE(deal, articles, verkaeufer, kaeufer);
    case 'auftragsbestaetigung':
      return generateAB(deal, articles, verkaeufer, kaeufer);
    case 'lieferschein':
      return generateLieferschein(deal, articles, verkaeufer, kaeufer);
    case 'rechnung':
      return generateRechnung(deal, articles, verkaeufer, kaeufer);
    case 'provisionsrechnung':
      return generateProvision(deal, verkaeufer, platform);
    default:
      throw new Error(`Unknown document type: ${type}`);
  }
}
