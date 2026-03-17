// ════════════════════════════════════════════════════════════
// SO FUNKTIONIERT'S — Clean SaaS Design
// HELLO SECOND/RUN = Tool für Sonderposten-Händler
// Erklärt wie das Tool funktioniert, Feature-Details, Use-Cases
// ════════════════════════════════════════════════════════════

import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, FileText, Zap, Handshake,
  Upload, Scan, BarChart3, Send, Shield,
  Globe, Clock, Lock, Eye, Package,
  CheckCircle2, Sparkles,
} from 'lucide-react';

// ─── Intersection Observer hook ───
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

export default function Landing() {
  const hero = useInView(0.1);
  const features = useInView();
  const workflow = useInView();
  const details = useInView();
  const usecases = useInView();
  const faq = useInView();

  // FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="bg-[#ffffff] text-[#111113] overflow-x-hidden">

      {/* ═══════════════════════════════════════════════ */}
      {/* HERO — Centered, matches Homepage style         */}
      {/* ═══════════════════════════════════════════════ */}
      <header ref={hero.ref} className="min-h-[70vh] flex flex-col justify-center items-center text-center px-6 md:px-12 pt-28 pb-20 relative">
        <div className={`max-w-4xl mx-auto transition-all duration-1000 ease-out ${hero.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#9394a1] mb-8">
            So funktioniert's
          </p>

          <h1 className="heading-display text-[clamp(2.5rem,7vw,5.5rem)] mb-8">
            Von der Preisliste zum<br className="hidden md:block" /> fertigen <span className="text-[#8cc63f] font-extrabold">PDF.</span>
          </h1>

          <p className="text-lg md:text-xl text-[#5f5f6b] font-light leading-relaxed max-w-2xl mx-auto mb-12">
            Du hast Sonderposten und willst ein professionelles Angebot? Das Tool macht den ganzen Aufwand für dich — automatisch, kostenlos, in Sekunden.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              to="/angebot"
              className="group bg-[#111113] text-[#ffffff] px-8 py-4 rounded-lg font-semibold text-sm hover:bg-[#8cc63f] hover:text-[#111113] transition-all duration-300 inline-flex items-center gap-3"
            >
              Jetzt ausprobieren
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#workflow"
              className="group text-[#111113] px-8 py-4 rounded-lg font-semibold text-sm border border-[#e4e4e7] hover:border-[#111113]/40 transition-all duration-300 inline-flex items-center gap-3"
            >
              Schritt für Schritt
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════ */}
      {/* FEATURES — 4 Karten, clean grid                 */}
      {/* ═══════════════════════════════════════════════ */}
      <section ref={features.ref} className="py-24 md:py-32 px-6 md:px-12 bg-[#f7f7f8]">
        <div className={`max-w-7xl mx-auto transition-all duration-700 ${features.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="mb-16 md:mb-20">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#9394a1] mb-6">Was das Tool kann</p>
            <h2 className="heading-display text-[clamp(2rem,5vw,4rem)]">
              Alles was du brauchst.<br /><span className="text-[#8cc63f] font-extrabold">Nichts was du nicht brauchst.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Scan, title: 'EAN-Erkennung', desc: 'Gib eine EAN ein oder lade eine Preisliste hoch. Das Tool erkennt Produkte automatisch und holt alle Stammdaten.' },
              { icon: Globe, title: 'Marktpreise per KI', desc: 'Aktuelle Marktpreise werden automatisch recherchiert. Du siehst sofort, was deine Ware am Markt wert ist.' },
              { icon: BarChart3, title: 'MHD-Bewertung', desc: 'Restlaufzeit wird automatisch bewertet, Abschläge berechnet. Je kürzer das MHD, desto genauer der Preis.' },
              { icon: FileText, title: 'PDF-Angebot', desc: 'Professionelles Angebot als PDF — mit Produktdaten, Preisen und MHD-Ampel. Sofort per WhatsApp oder E-Mail versenden.' },
            ].map((feat, i) => (
              <div
                key={i}
                className={`bg-white border border-[#e4e4e7] rounded-xl p-6 card-hover transition-all duration-500 ${features.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-[#f7f7f8] flex items-center justify-center mb-5 group-hover:bg-[#8cc63f]/10 transition-colors">
                  <feat.icon size={22} className="text-[#111113]" />
                </div>
                <h3 className="text-base font-semibold tracking-tight mb-2">{feat.title}</h3>
                <p className="text-sm text-[#9394a1] font-light leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* WORKFLOW — 4 Schritte, editorial rows            */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="workflow" ref={workflow.ref} className="py-24 md:py-40 px-6 md:px-12">
        <div className={`max-w-7xl mx-auto transition-all duration-700 ${workflow.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="mb-16 md:mb-24">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#9394a1] mb-6">Schritt für Schritt</p>
            <h2 className="heading-display text-[clamp(2.5rem,6vw,5.5rem)]">
              Vier Schritte zum <span className="text-[#8cc63f] font-extrabold">Angebot.</span>
            </h2>
          </div>

          <div className="space-y-0">
            {[
              { num: '01', title: 'Preisliste hochladen.', subtitle: 'PDF, Excel oder manuell', desc: 'Zieh deine Artikelliste ins Tool — oder tipp die EAN-Codes einzeln ein. Kein Login nötig, kein Account, kein Setup. Einfach loslegen.', icon: Upload },
              { num: '02', title: 'KI recherchiert Preise.', subtitle: 'Automatisch, in Sekunden', desc: 'Das Tool sucht aktuelle Marktpreise, gleicht EAN-Daten ab und berechnet den optimalen Verkaufspreis. Du musst nichts googlen, nichts rechnen.', icon: Sparkles },
              { num: '03', title: 'MHD wird bewertet.', subtitle: 'Restlaufzeit → Abschlag', desc: 'Wie lange ist das MHD noch gültig? Das Tool berechnet automatisch den passenden Abschlag und zeigt eine Ampel-Bewertung: Grün, Gelb, Rot.', icon: Clock },
              { num: '04', title: 'PDF raus, verschicken.', subtitle: 'WhatsApp, E-Mail, Download', desc: 'Dein Angebot ist fertig — als professionelles PDF mit allen Details. Per WhatsApp teilen, per E-Mail verschicken oder lokal speichern.', icon: Send },
            ].map((step, i) => (
              <div
                key={i}
                className={`group grid md:grid-cols-12 gap-6 md:gap-8 py-10 md:py-14 border-t border-[#e4e4e7] transition-all duration-500 ${workflow.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${200 + i * 150}ms` }}
              >
                <div className="md:col-span-1">
                  <span className="text-xs font-semibold text-[#9394a1]">{step.num}</span>
                </div>
                <div className="md:col-span-4">
                  <h3 className="heading-display text-3xl md:text-4xl group-hover:text-[#111113] transition-colors duration-300">{step.title}</h3>
                  <p className="text-xs font-medium text-[#8cc63f] mt-2 uppercase tracking-[0.15em]">{step.subtitle}</p>
                </div>
                <div className="md:col-span-6">
                  <p className="text-base text-[#5f5f6b] font-light leading-relaxed">{step.desc}</p>
                </div>
                <div className="md:col-span-1 flex items-start justify-end">
                  <ArrowUpRight size={20} className="text-[#111113]/10 group-hover:text-[#8cc63f] transition-colors duration-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* DETAIL — Was im PDF steht                       */}
      {/* ═══════════════════════════════════════════════ */}
      <section ref={details.ref} className="section-dark py-24 md:py-40 px-6 md:px-12">
        <div className={`max-w-7xl mx-auto transition-all duration-700 ${details.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#9394a1] mb-6">Was im Angebot steht</p>
              <h2 className="heading-display text-[clamp(2rem,5vw,4rem)] text-[#ffffff] mb-8">
                Mehr als eine <span className="text-[#8cc63f] font-extrabold">Excel-Tabelle.</span>
              </h2>
              <p className="text-base text-[#ffffff]/40 font-light leading-relaxed mb-10">
                Das PDF-Angebot enthält alles, was dein Käufer braucht um sofort zuzusagen — professionell formatiert, mit allen relevanten Daten.
              </p>
              <Link
                to="/angebot"
                className="group inline-flex items-center gap-3 bg-[#8cc63f] text-[#111113] px-8 py-3.5 rounded-lg font-semibold text-sm hover:bg-[#ffffff] transition-all duration-300"
              >
                Jetzt Angebot erstellen
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="space-y-4">
              {[
                { icon: Package, label: 'Produktdaten', desc: 'Artikelname, EAN, Gewicht, Verpackungseinheit — automatisch aus der Datenbank geholt.' },
                { icon: Globe, label: 'Marktpreisvergleich', desc: 'Aktueller UVP von Supermärkten als Referenz. Dein Käufer sieht sofort den Vorteil.' },
                { icon: Clock, label: 'MHD-Ampel', desc: 'Grün / Gelb / Rot — visuelle Bewertung der Restlaufzeit mit automatischem Abschlag.' },
                { icon: BarChart3, label: 'Kalkulation', desc: 'Empfohlener VK, Marge, Gesamtwert — übersichtlich berechnet, nicht geraten.' },
                { icon: Shield, label: 'Professionelles Layout', desc: 'Sauberes PDF mit deinem Firmennamen, Artikelfotos und allen Details.' },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-5 p-5 rounded-xl border border-[#ffffff]/8 bg-[#ffffff]/[0.03] transition-all duration-500 ${details.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${200 + i * 80}ms` }}
                >
                  <div className="w-10 h-10 rounded-lg bg-[#ffffff]/5 flex items-center justify-center flex-shrink-0">
                    <item.icon size={18} className="text-[#8cc63f]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#ffffff] mb-1">{item.label}</p>
                    <p className="text-xs text-[#ffffff]/40 font-light leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* USE CASES — Für wen ist das Tool                */}
      {/* ═══════════════════════════════════════════════ */}
      <section ref={usecases.ref} className="py-24 md:py-40 px-6 md:px-12">
        <div className={`max-w-7xl mx-auto transition-all duration-700 ${usecases.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 mb-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#9394a1] mb-6">Für wen</p>
              <h2 className="heading-display text-[clamp(2rem,5vw,4rem)]">
                Gemacht für <span className="text-[#8cc63f] font-extrabold">Sonderposten-Händler.</span>
              </h2>
            </div>
            <div className="flex items-end">
              <p className="text-base text-[#9394a1] font-light leading-relaxed">
                Egal ob Lebensmittel, Drogerie oder Non-Food — wenn du Sonderposten hast und Angebote verschicken willst, ist das dein Tool.
              </p>
            </div>
          </div>

          <div className="space-y-0">
            {[
              { title: 'MHD-Ware & kurze Restlaufzeiten', desc: 'Du hast Paletten mit kurzem MHD und musst schnell raus. Das Tool berechnet automatisch den richtigen Abschlag und erstellt ein Angebot, das du sofort verschicken kannst.' },
              { title: 'Überbestände & Lagerräumung', desc: 'Zu viel bestellt, Saison vorbei, Regallücke — egal warum. Du lädst die Liste hoch, bekommst automatisch Marktpreise und ein fertiges PDF.' },
              { title: 'Retouren & B-Ware', desc: 'Rücksendungen, beschädigte Verpackungen, Aktionsware — alles was nicht mehr ins Standardsortiment passt. Das Tool macht ein sauberes Angebot draus.' },
              { title: 'Regelmäßige Angebote an Stammkunden', desc: 'Du verschickst jede Woche Angebote an deine Käufer? Spar dir das Excel-Gefummel. Preisliste rein, PDF raus, per WhatsApp verschicken — fertig.' },
            ].map((item, i) => (
              <div
                key={i}
                className={`group grid md:grid-cols-12 gap-6 md:gap-8 py-8 md:py-10 border-t border-[#e4e4e7] transition-all duration-500 ${usecases.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="md:col-span-1">
                  <div className="w-10 h-10 rounded-full bg-[#f7f7f8] flex items-center justify-center group-hover:bg-[#8cc63f]/10 transition-colors duration-300">
                    <CheckCircle2 size={18} className="text-[#111113] group-hover:text-[#8cc63f] transition-colors duration-300" />
                  </div>
                </div>
                <div className="md:col-span-4">
                  <h3 className="text-lg font-semibold text-[#111113] leading-tight">{item.title}</h3>
                </div>
                <div className="md:col-span-7">
                  <p className="text-sm text-[#9394a1] font-light leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* FAQ — Häufige Fragen                            */}
      {/* ═══════════════════════════════════════════════ */}
      <section ref={faq.ref} className="py-24 md:py-32 px-6 md:px-12 bg-[#f7f7f8]">
        <div className={`max-w-3xl mx-auto transition-all duration-700 ${faq.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#9394a1] mb-6">FAQ</p>
            <h2 className="heading-display text-[clamp(2rem,5vw,3.5rem)]">
              Häufige <span className="text-[#8cc63f] font-extrabold">Fragen.</span>
            </h2>
          </div>

          <div className="space-y-0">
            {[
              { q: 'Kostet das Tool etwas?', a: 'Nein. Das Tool ist komplett kostenlos — ohne versteckte Gebühren, ohne Abo, ohne Provision. Du kannst es so oft nutzen wie du willst.' },
              { q: 'Brauche ich einen Account?', a: 'Nein. Du kannst sofort loslegen, ohne Login und ohne Registrierung. Einfach Preisliste hochladen oder EAN eingeben.' },
              { q: 'Woher kommen die Marktpreise?', a: 'Die Preise werden per KI automatisch aus öffentlichen Quellen recherchiert — z.B. aus Supermarkt-Websites. Du siehst immer die Quelle.' },
              { q: 'Welche Dateiformate kann ich hochladen?', a: 'PDF und Excel (CSV, XLSX). Du kannst auch einzelne EAN-Codes manuell eintippen. Das Tool erkennt die Artikel automatisch.' },
              { q: 'Was passiert mit meinen Daten?', a: 'Nichts wird veröffentlicht oder weitergegeben. Dein Angebot gehört dir — du entscheidest, wer es bekommt. Kein Marktplatz, keine Plattform.' },
              { q: 'Kann ich das Angebot anpassen?', a: 'Ja. Du kannst Preise, Mengen und Beschreibungen vor dem PDF-Export anpassen. Das Tool schlägt vor — du entscheidest.' },
            ].map((item, i) => (
              <div
                key={i}
                className="border-t border-[#e4e4e7]"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-5 md:py-6 text-left group"
                >
                  <span className="text-base font-semibold text-[#111113] pr-8">{item.q}</span>
                  <ArrowRight
                    size={16}
                    className={`text-[#9394a1] flex-shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-90' : 'group-hover:translate-x-1'}`}
                  />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 pb-6' : 'max-h-0'}`}>
                  <p className="text-sm text-[#5f5f6b] font-light leading-relaxed">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* CTA — Dark, centered, matches Homepage          */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="section-dark py-24 md:py-40 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="heading-display text-[clamp(2.5rem,7vw,5rem)] text-[#ffffff] mb-6">
            Bereit? <span className="text-[#8cc63f] font-extrabold">Los geht's.</span>
          </h2>

          <p className="text-base text-[#ffffff]/35 font-light max-w-xl mx-auto leading-relaxed mb-12">
            Dein nächster Sonderposten verdient ein professionelles Angebot. Kostenlos, sofort, ohne Login.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6">
            <Link
              to="/angebot"
              className="group bg-[#ffffff] text-[#111113] px-8 py-4 rounded-lg font-semibold text-sm hover:bg-[#8cc63f] transition-all duration-300 flex items-center gap-3"
            >
              <FileText size={16} />
              Angebot erstellen
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="mailto:info@hello2ndrun.com"
              className="group border border-[#ffffff]/15 text-[#ffffff] px-8 py-4 rounded-lg font-semibold text-sm hover:border-[#ffffff]/40 transition-all duration-300 flex items-center gap-3"
            >
              Fragen? Schreib uns
              <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

          <p className="text-xs font-medium text-[#ffffff]/25">Kostenlos · Kein Login · Sofort nutzbar</p>
        </div>
      </section>
    </div>
  );
}
