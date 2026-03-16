import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Impressum() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-8 py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-[#1a472a] transition-colors mb-12">
          <ArrowLeft size={14} />
          Zur&uuml;ck
        </Link>

        <h1 className="font-black text-4xl md:text-5xl uppercase tracking-tight mb-4">Impressum</h1>
        <div className="h-1 w-16 bg-[#8cc63f] mb-12"></div>

        <div className="space-y-10 text-gray-600 leading-relaxed">
          <section>
            <h2 className="font-black text-lg uppercase tracking-tight text-black mb-3">Angaben gem&auml;&szlig; &sect; 5 ECG / &sect; 25 MedienG</h2>
            <p className="font-bold text-black">HELLO SECOND/RUN.</p>
            <p>Sonderposten-Vermittlung</p>
            <p className="mt-2">Alen M.</p>
            <p>Salzburg, &Ouml;sterreich</p>
          </section>

          <section>
            <h2 className="font-black text-lg uppercase tracking-tight text-black mb-3">Kontakt</h2>
            <p>E-Mail: <a href="mailto:info@hello2ndrun.com" className="text-[#1a472a] hover:text-[#8cc63f] transition-colors font-medium">info@hello2ndrun.com</a></p>
          </section>

          <section>
            <h2 className="font-black text-lg uppercase tracking-tight text-black mb-3">Unternehmensgegenstand</h2>
            <p>Vermittlung von Sonderposten, &Uuml;berbest&auml;nden, Retouren und Waren mit kurzem Mindesthaltbarkeitsdatum (MHD) im DACH-Raum.</p>
          </section>

          <section>
            <h2 className="font-black text-lg uppercase tracking-tight text-black mb-3">Haftungsausschluss</h2>
            <p>
              Die Inhalte dieser Website wurden mit gr&ouml;&szlig;ter Sorgfalt erstellt. F&uuml;r die Richtigkeit, Vollst&auml;ndigkeit und
              Aktualit&auml;t der Inhalte k&ouml;nnen wir jedoch keine Gew&auml;hr &uuml;bernehmen. Als Diensteanbieter sind wir f&uuml;r eigene
              Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
            </p>
          </section>

          <section>
            <h2 className="font-black text-lg uppercase tracking-tight text-black mb-3">Urheberrecht</h2>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem &ouml;sterreichischen Urheberrecht.
              Die Vervielf&auml;ltigung, Bearbeitung, Verbreitung und jede Art der Verwertung au&szlig;erhalb der Grenzen des Urheberrechtes
              bed&uuml;rfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </section>

          <section>
            <h2 className="font-black text-lg uppercase tracking-tight text-black mb-3">Streitschlichtung</h2>
            <p>
              Die Europ&auml;ische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-[#1a472a] hover:text-[#8cc63f] transition-colors font-medium">
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
            <p className="mt-2">Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-300">Stand: M&auml;rz 2026</p>
        </div>
      </div>
    </div>
  );
}
