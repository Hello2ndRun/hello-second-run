import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Datenschutz() {
  return (
    <div className="bg-[#ffffff] min-h-screen">
      <div className="max-w-3xl mx-auto px-8 py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 hover:text-[#111113] transition-colors mb-12">
          <ArrowLeft size={14} />
          Zur&uuml;ck
        </Link>

        <h1 className="heading-display text-4xl md:text-5xl mb-4">Datenschutz</h1>
        <div className="h-1 w-16 bg-[#8cc63f] mb-12"></div>

        <div className="space-y-10 text-gray-600 leading-relaxed">
          <section>
            <h2 className="font-semibold text-lg text-[#111113] mb-3">1. Datenschutz auf einen Blick</h2>
            <p>
              Diese Datenschutzerkl&auml;rung kl&auml;rt Sie &uuml;ber die Art, den Umfang und Zweck der Verarbeitung
              von personenbezogenen Daten auf unserer Website auf. Personenbezogene Daten sind alle Daten,
              mit denen Sie pers&ouml;nlich identifiziert werden k&ouml;nnen.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg text-[#111113] mb-3">2. Verantwortliche Stelle</h2>
            <p className="font-bold text-black">HELLO SECOND/RUN.</p>
            <p>Alen M.</p>
            <p>Salzburg, &Ouml;sterreich</p>
            <p>E-Mail: <a href="mailto:info@hello2ndrun.com" className="text-[#111113] hover:text-[#8cc63f] transition-colors font-medium">info@hello2ndrun.com</a></p>
          </section>

          <section>
            <h2 className="font-semibold text-lg text-[#111113] mb-3">3. Datenerfassung auf unserer Website</h2>

            <h3 className="font-bold text-black mt-6 mb-2">Server-Log-Dateien</h3>
            <p>
              Der Provider der Seiten erhebt und speichert automatisch Informationen in sogenannten Server-Log-Dateien,
              die Ihr Browser automatisch an uns &uuml;bermittelt. Dies sind: Browsertyp und Browserversion,
              verwendetes Betriebssystem, Referrer URL, Hostname des zugreifenden Rechners, Uhrzeit der Serveranfrage
              und IP-Adresse.
            </p>
            <p className="mt-2">
              Eine Zusammenf&uuml;hrung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.
              Grundlage f&uuml;r die Datenverarbeitung ist Art. 6 Abs. 1 lit. f DSGVO.
            </p>

            <h3 className="font-bold text-black mt-6 mb-2">Cookies</h3>
            <p>
              Unsere Website verwendet keine Tracking-Cookies. Wir verwenden ausschlie&szlig;lich technisch notwendige
              Cookies (z.B. f&uuml;r die Anmeldung), die f&uuml;r den Betrieb der Website erforderlich sind.
              Diese Cookies werden nach Ende Ihrer Browser-Sitzung gel&ouml;scht.
            </p>

            <h3 className="font-bold text-black mt-6 mb-2">Lokale Datenspeicherung</h3>
            <p>
              Unsere Anwendung verwendet den lokalen Speicher Ihres Browsers (localStorage), um Anwendungsdaten
              wie Deals, Partner und Einstellungen zu speichern. Diese Daten verlassen Ihren Browser nicht und
              werden nicht an Dritte &uuml;bermittelt.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg text-[#111113] mb-3">4. Authentifizierung</h2>
            <p>
              F&uuml;r die Anmeldung bieten wir die M&ouml;glichkeit, sich &uuml;ber Google (OAuth 2.0) anzumelden.
              Dabei werden folgende Daten von Google &uuml;bermittelt: Name, E-Mail-Adresse und Profilbild.
              Diese Daten werden ausschlie&szlig;lich f&uuml;r die Identifikation innerhalb unserer Plattform verwendet.
            </p>
            <p className="mt-2">
              Im Demo-Modus werden keine echten personenbezogenen Daten erhoben.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg text-[#111113] mb-3">5. Ihre Rechte (DSGVO)</h2>
            <p>Sie haben gem&auml;&szlig; DSGVO folgende Rechte:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Auskunftsrecht</strong> (Art. 15 DSGVO) &mdash; Welche Daten wir &uuml;ber Sie gespeichert haben</li>
              <li><strong>Berichtigungsrecht</strong> (Art. 16 DSGVO) &mdash; Korrektur unrichtiger Daten</li>
              <li><strong>L&ouml;schungsrecht</strong> (Art. 17 DSGVO) &mdash; L&ouml;schung Ihrer gespeicherten Daten</li>
              <li><strong>Einschr&auml;nkung</strong> (Art. 18 DSGVO) &mdash; Einschr&auml;nkung der Verarbeitung</li>
              <li><strong>Daten&uuml;bertragbarkeit</strong> (Art. 20 DSGVO) &mdash; Herausgabe Ihrer Daten in maschinenlesbarem Format</li>
              <li><strong>Widerspruchsrecht</strong> (Art. 21 DSGVO) &mdash; Widerspruch gegen die Verarbeitung</li>
            </ul>
            <p className="mt-4">
              Zur Aus&uuml;bung Ihrer Rechte kontaktieren Sie uns unter:{' '}
              <a href="mailto:info@hello2ndrun.com" className="text-[#111113] hover:text-[#8cc63f] transition-colors font-medium">info@hello2ndrun.com</a>
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg text-[#111113] mb-3">6. Beschwerderecht</h2>
            <p>
              Sie haben das Recht, sich bei der &ouml;sterreichischen Datenschutzbeh&ouml;rde zu beschweren:{' '}
              <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" className="text-[#111113] hover:text-[#8cc63f] transition-colors font-medium">
                www.dsb.gv.at
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-lg text-[#111113] mb-3">7. Hosting</h2>
            <p>
              Diese Website wird auf Servern von Vercel Inc. (USA) gehostet. Vercel verarbeitet Daten
              gem&auml;&szlig; den EU-Standardvertragsklauseln. Weitere Informationen finden Sie in der
              Datenschutzerkl&auml;rung von Vercel.
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
