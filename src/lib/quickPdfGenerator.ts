// ════════════════════════════════════════════════════════════
// Quick PDF Generator — Standalone Angebot without Deal system
// Used by QuickAngebot page for instant PDF generation
// ════════════════════════════════════════════════════════════

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './formatters';
import { getMhdStatus, getDaysRemaining } from './mhdCalculator';

// ─── Types ───

export interface QuickArticle {
  id: string;
  artikelname: string;
  marke: string;
  ean: string;
  imageUrl: string;
  imageData?: string;
  mhd: string;
  gewicht: string;
  category: string;
  // Mengen
  mengeKartons: number;
  stueckProKarton: number;
  mengePaletten: number;
  kartonsProPalette: number;
  // Preise
  ekPreis: number;
  uvpPreis: number;
  vkPreis: number;
}

export interface QuickSender {
  firma: string;
  kontaktperson: string;
  adresse: string;
  plz: string;
  ort: string;
  land: string;
  email: string;
  telefon: string;
  uid: string;
}

export interface QuickRecipient {
  firma: string;
  kontaktperson: string;
  adresse: string;
  email: string;
}

export interface QuickKonditionen {
  zahlungsbedingung: string;
  lieferbedingung: string;
  gueltigkeitsTage: number;
}

// ─── Helpers ───

function getArticleStueck(art: QuickArticle): number {
  const fromKartons = art.mengeKartons * art.stueckProKarton;
  const fromPaletten = art.mengePaletten * art.kartonsProPalette * art.stueckProKarton;
  return fromKartons + fromPaletten;
}

function getSubtotal(articles: QuickArticle[]): number {
  return articles.reduce((sum, art) => {
    return sum + art.vkPreis * getArticleStueck(art);
  }, 0);
}

// ─── Generate Quick Angebot PDF ───

export function generateQuickAngebotPdf(
  articles: QuickArticle[],
  sender: QuickSender,
  recipient: QuickRecipient,
  konditionen: QuickKonditionen,
): string {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const now = new Date();
  const subtotal = Math.round(getSubtotal(articles) * 100) / 100;
  const angNr = `ANG-${now.getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

  // ─── Header: Sender (left) ───
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(sender.firma || 'Absender', 14, 20);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  if (sender.adresse) doc.text(sender.adresse, 14, 26);
  doc.text(`${sender.plz || ''} ${sender.ort || ''}, ${sender.land || 'AT'}`.trim(), 14, 30);
  if (sender.uid) doc.text(`UID: ${sender.uid}`, 14, 34);
  if (sender.telefon || sender.email) {
    doc.text(`${sender.telefon || ''} | ${sender.email || ''}`, 14, 38);
  }

  // ─── Header: Recipient (right) ───
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(recipient.firma || 'Empfänger', 120, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (recipient.kontaktperson) doc.text(recipient.kontaktperson, 120, 25);
  if (recipient.adresse) doc.text(recipient.adresse, 120, 29);
  if (recipient.email) doc.text(recipient.email, 120, 33);

  // Divider
  doc.setDrawColor(17, 17, 19);
  doc.setLineWidth(0.5);
  doc.line(14, 45, pw - 14, 45);

  // ─── Title ───
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 17, 19);
  doc.text('ANGEBOT', 14, 58);

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nr.: ${angNr}`, 14, 66);
  doc.text(`Datum: ${formatDate(now.toISOString())}`, 14, 71);
  doc.text(`Gültig bis: ${formatDate(new Date(now.getTime() + konditionen.gueltigkeitsTage * 86400000).toISOString())}`, 14, 76);

  // ─── Article Table ───
  const head = [['Pos', 'Artikel', 'Marke', 'EAN', 'MHD', 'Menge', 'VK/Stk', 'Gesamt']];

  const body = articles.map((art, i) => {
    const stueck = getArticleStueck(art);
    const gesamt = art.vkPreis * stueck;
    const mhdDisplay = art.mhd ? formatDate(art.mhd) : '—';
    const mengeDisplay = art.mengePaletten > 0
      ? `${art.mengePaletten} Pal`
      : `${art.mengeKartons} Krt`;

    return [
      String(i + 1),
      art.artikelname || '—',
      art.marke || '—',
      art.ean || '—',
      mhdDisplay,
      mengeDisplay,
      formatCurrency(art.vkPreis),
      formatCurrency(gesamt),
    ];
  });

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
      6: { halign: 'right' },
      7: { halign: 'right', fontStyle: 'bold' },
    },
  });

  // ─── Totals ───
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const tx = 140;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Nettobetrag:', tx, finalY);
  doc.text(formatCurrency(subtotal), pw - 14, finalY, { align: 'right' });

  // 20% MwSt
  const mwst = Math.round(subtotal * 0.20 * 100) / 100;
  doc.text('20% MwSt.:', tx, finalY + 6);
  doc.text(formatCurrency(mwst), pw - 14, finalY + 6, { align: 'right' });

  doc.setLineWidth(0.3);
  doc.line(tx, finalY + 9, pw - 14, finalY + 9);

  const brutto = Math.round((subtotal + mwst) * 100) / 100;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 17, 19);
  doc.text('Gesamtbetrag:', tx, finalY + 16);
  doc.text(formatCurrency(brutto), pw - 14, finalY + 16, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  // ─── Konditionen ───
  const condY = finalY + 28;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  if (konditionen.zahlungsbedingung) doc.text(`Zahlungsbedingung: ${konditionen.zahlungsbedingung}`, 14, condY);
  if (konditionen.lieferbedingung) doc.text(`Lieferbedingung: ${konditionen.lieferbedingung}`, 14, condY + 5);

  // ─── Footer ───
  const fy = 268;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(14, fy - 4, pw - 14, fy - 4);

  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  const footerLine = [sender.firma, sender.adresse, `${sender.plz} ${sender.ort}`.trim(), sender.uid ? `UID: ${sender.uid}` : ''].filter(Boolean).join(' | ');
  doc.text(footerLine, 14, fy);
  if (sender.email || sender.telefon) {
    doc.text([sender.email, sender.telefon].filter(Boolean).join(' | '), 14, fy + 4);
  }

  // Branding with link
  doc.setTextColor(140, 198, 63); // brand green
  doc.setFontSize(6.5);
  doc.text('Erstellt mit HELLO SECOND/RUN.', pw - 14, fy + 10, { align: 'right' });
  doc.setTextColor(160, 160, 160);
  doc.setFontSize(6);
  doc.text('hello2ndrun.com/tool — Sonderposten-Angebot in 30 Sekunden', pw - 14, fy + 14, { align: 'right' });
  // Add clickable link area
  doc.link(pw - 80, fy + 8, 66, 8, { url: 'https://hello2ndrun.com/' });

  return doc.output('datauristring');
}

/** Get the PDF as Blob for download */
export function getQuickAngebotBlob(
  articles: QuickArticle[],
  sender: QuickSender,
  recipient: QuickRecipient,
  konditionen: QuickKonditionen,
): Blob {
  const doc = new jsPDF();
  // We regenerate here — could optimize but simplicity wins
  const dataUri = generateQuickAngebotPdf(articles, sender, recipient, konditionen);
  // Convert data URI to blob
  const byteString = atob(dataUri.split(',')[1]);
  const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}
