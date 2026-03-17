import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AGB() {
  return (
    <div className="bg-[#ffffff] min-h-screen">
      <div className="max-w-3xl mx-auto px-8 py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 hover:text-[#111113] transition-colors mb-12">
          <ArrowLeft size={14} />
          Zur&uuml;ck
        </Link>

        <h1 className="heading-display text-4xl md:text-5xl mb-4">AGB</h1>
        <p className="text-gray-400 text-sm mb-4">Allgemeine Gesch&auml;ftsbedingungen</p>
        <div className="h-1 w-16 bg-[#8cc63f] mb-12"></div>

        <div className="space-y-10 text-gray-600 leading-relaxed">
          <section>
            <h2 className="font-semibold text-lg text-[#111113] mb-3">1. Geltungsbereich</h2>
            <p>
              Diese Allgemeinen Gesch&auml;ftsbedingungen (AGB) gelten f&uuml;r alle Gesch&auml;ftsbeziehungen
              zwischen HELLO SECOND/RUN. (&bdquo;Vermittler&ldquo;) und seinen Vertragspartnern
              (&bdquo;Verk&auml;ufer&ldquo; und &bdquo;K&auml;ufer&ldquo;) im Bereich der Sonderposten-Vermittlung.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg text-[#111113] mb-3">2. Leistungsbeschreibung</h2>
            <p>
              Der Vermittler bringt Verk&auml;ufer von Sonderposten, &Uuml;berbest&auml;nden, Retouren
              und MHD-nahen Waren mit potenziellen K&auml;ufern zusammen. Der Vermittler handelt
              ausschlie&szlig;lich als Makler im Sinne des &ouml;sterreichischen Maklerrechts (&sect;&sect; 1ff MaklerG).
            </p>
            <p className="mt-2">
              Der Vermittler ist nicht Partei des Kaufvertrags zwischen Verk&auml;ufer und K&auml;ufer.
              Der Kaufvertrag kommt ausschlie&szlig;lich zwischen Verk&auml;ufer und K&auml;ufer zustande.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg text-[#111113] mb-3">3. Provision</h2>
            <p>
              Die Provision wird individuell pro Deal vereinbart und in der Plattform transparent ausgewiesen.
              Die Provision wird erst f&auml;llig, wenn ein rechtsverbindlicher Kaufvertrag zwischen
              Verk&auml;ufer und K&auml;ufer zustande kommt und die Ware &uuml;bergeben wurde.
            </p>
            <p className="mt-2">
              F&uuml;r den Verk&auml;ufer fallen keine Vorabkosten, Listing-Geb&uuml;hren oder
              Mitgliedschaftsbeitr&auml;ge an.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg text-[#111113] mb-3">4. Vertraulichkeit</h2>
            <p>
              Der Vermittler behandelt alle Gesch&auml;ftsinformationen vertraulich. Insbesondere werden
              Einkaufspreise des Verk&auml;ufers nicht an K&auml;ufer weitergegeben. Produktdaten werden
              nur im Rahmen der Angebotserstellung an potenzielle K&auml;ufer &uuml;bermittelt.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg text-[#111113] mb-3">5. Haftung</h2>
            <p>
              Der Vermittler haftet nicht f&uuml;r die Qualit&auml;t, Beschaffenheit oder Lieferung der
              vermittelten Waren. Die Haftung liegt beim jeweiligen Verk&auml;ufer. Der Vermittler haftet
              nicht f&uuml;r Sch&auml;den, die aus der Nichtverf&uuml;gbarkeit der Plattform entstehen.
            </p>
            <p className="mt-2">
              Die Haftung des Vermittlers ist auf Vorsatz und grobe Fahrl&auml;ssigkeit beschr&auml;nkt.
              Die Haftung f&uuml;r leichte Fahrl&auml;ssigkeit wird, soweit gesetzlich zul&auml;ssig, ausgeschlossen.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg text-[#111113] mb-3">6. Waren und MHD</h2>
            <p>
              Der Verk&auml;ufer ist verpflichtet, korrekte Angaben zu seinen Waren zu machen, insbesondere
              hinsichtlich Mindesthaltbarkeitsdatum (MHD), Menge, Zustand und EAN-Codes. Falsche Angaben
              k&ouml;nnen zum Ausschluss von der Plattform f&uuml;hren.
            </p>
            <p className="mt-2">
              Der K&auml;ufer best&auml;tigt, dass er mit dem Kauf von Sonderposten und MHD-nahen Waren
              vertraut ist und die damit verbundenen Risiken kennt.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg text-[#111113] mb-3">7. Zahlungsbedingungen</h2>
            <p>
              Die Zahlungsbedingungen werden individuell pro Deal festgelegt und sind im jeweiligen
              Angebot bzw. der Bestellbest&auml;tigung ausgewiesen. G&auml;ngige Zahlungsziele sind:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li>Vorkasse</li>
              <li>Zahlung bei Abholung</li>
              <li>14 Tage netto</li>
              <li>30 Tage netto</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-lg text-[#111113] mb-3">8. Anwendbares Recht</h2>
            <p>
              Es gilt &ouml;sterreichisches Recht unter Ausschluss des UN-Kaufrechts.
              Gerichtsstand ist Salzburg, &Ouml;sterreich.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg text-[#111113] mb-3">9. Salvatorische Klausel</h2>
            <p>
              Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, so wird dadurch die
              Wirksamkeit der &uuml;brigen Bestimmungen nicht ber&uuml;hrt. An die Stelle der unwirksamen
              Bestimmung tritt eine solche, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung
              am n&auml;chsten kommt.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-300">Stand: M&auml;rz 2026</p>
        </div>
      </div>
    </div>
  );
}
