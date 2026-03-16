// ════════════════════════════════════════════════════════════
// HOMEPAGE — Ehrlich, direkt, aus Salzburg
// ════════════════════════════════════════════════════════════

import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  ArrowRight, FileText, Handshake,
  Phone, Heart, Package, Users, TrendingUp,
  Play, ChevronDown, Upload, Globe, Shield,
} from 'lucide-react';
import { getImpactStats } from '../lib/donationService';
import { DEMO_USERS, type DemoUser } from '../lib/demoStore';

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

// ─── Animated counter ───
function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const { ref, inView } = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.max(1, Math.floor(target / 40));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(start);
    }, 30);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

export default function Homepage() {
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const hero = useInView(0.1);
  const impact = useInView();
  const problem = useInView();
  const how = useInView();
  const socialImpact = useInView();
  const tool = useInView();

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError('');
    try {
      await login();
      navigate('/admin/dashboard');
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        setLoginError('Login fehlgeschlagen. Nutze den Demo-Modus.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDemoLogin = (demoUser?: DemoUser) => {
    loginDemo(demoUser);
    navigate('/admin/dashboard');
  };

  return (
    <div className="bg-white text-[#0a0c0a] font-sans overflow-x-hidden">

      {/* ═══════════════════════════════════════════════ */}
      {/* HERO                                           */}
      {/* ═══════════════════════════════════════════════ */}
      <header ref={hero.ref} className="min-h-[90vh] pt-28 md:pt-40 pb-16 md:pb-24 px-5 md:px-8 flex items-center relative" style={{
        backgroundImage: 'linear-gradient(to right, #eef2ee 1px, transparent 1px), linear-gradient(to bottom, #eef2ee 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }}>
        <div className="absolute top-32 right-12 w-72 h-72 bg-[#8cc63f]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-12 w-96 h-96 bg-[#1a472a]/5 rounded-full blur-3xl pointer-events-none" />

        <div className={`max-w-7xl mx-auto w-full relative z-10 transition-all duration-1000 ${hero.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-[2px] w-12 bg-[#1a472a]" />
            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-[#1a472a]">Aus Salzburg</span>
          </div>

          <h1 className="font-black text-[clamp(2.5rem,8vw,6rem)] leading-[1.02] uppercase tracking-[-0.03em] mb-8">
            <span className="block">DEINE WARE</span>
            <span className="block text-[#8cc63f]">HAT NOCH WERT.</span>
            <span className="block">WIR FINDEN</span>
            <span className="block text-[#8cc63f]">DEN KÄUFER.</span>
          </h1>

          <div className="grid lg:grid-cols-2 gap-16 items-end">
            <div>
              <p className="text-xl md:text-2xl font-light leading-relaxed text-gray-600 max-w-lg mb-8">
                Überbestände, kurzes MHD, Retouren — bei den meisten landet das im Container. Bei uns nicht. Wir vermitteln deine Sonderposten an Käufer, die genau sowas suchen. Und was wirklich keiner mehr nimmt, geht an die Tafel. Nicht in den Müll.
              </p>
              <div className="flex items-center gap-3 mb-8">
                <Heart size={18} className="text-red-500 animate-pulse" />
                <span className="text-sm font-bold text-gray-500">Bisher <span className="font-black text-[#1a472a]">1.000+ Mahlzeiten</span> weitergegeben statt entsorgt</span>
              </div>
            </div>

            <div className="flex flex-col gap-6 items-start">
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/angebot" className="group bg-[#8cc63f] text-[#1a472a] px-9 py-4 font-black uppercase tracking-[0.1em] text-[11px] border-2 border-[#8cc63f] hover:bg-[#1a472a] hover:border-[#1a472a] hover:text-white transition-all duration-300 inline-flex items-center gap-3">
                  <FileText size={14} />
                  Angebot erstellen
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#kontakt-section" className="group bg-[#1a472a] text-white px-9 py-4 font-black uppercase tracking-[0.1em] text-[11px] border-2 border-[#1a472a] hover:bg-[#8cc63f] hover:border-[#8cc63f] hover:text-[#1a472a] transition-all duration-300 inline-flex items-center gap-3">
                  Schreib uns
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </a>
                <div className="relative">
                  <button
                    onClick={() => setShowDemoMenu(!showDemoMenu)}
                    className="group flex items-center gap-3 border-2 border-[#1a472a] px-8 py-4 font-black uppercase tracking-[0.1em] text-[11px] hover:bg-[#1a472a] hover:text-white transition-all duration-300"
                  >
                    <Play size={14} />
                    Demo
                    <ChevronDown size={12} className={`transition-transform ${showDemoMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showDemoMenu && (
                    <div className="absolute top-full left-0 mt-2 bg-white border-2 border-[#1a472a] shadow-lg z-50 min-w-[220px]">
                      {DEMO_USERS.map(du => (
                        <button
                          key={du.uid}
                          onClick={() => handleDemoLogin(du)}
                          className="w-full text-left px-5 py-3 hover:bg-[#f7f9f7] transition-colors border-b border-gray-100 last:border-0"
                        >
                          <p className="text-[11px] font-black uppercase tracking-wider">{du.displayName}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                            {du.role === 'admin' ? 'Admin — Alle Rechte' : `Broker — ${du.email}`}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {loginError && <span className="text-red-500 text-[10px]">{loginError}</span>}
              <button onClick={handleLogin} disabled={isLoggingIn} className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-[#1a472a] transition-colors disabled:opacity-50 underline underline-offset-4">
                {isLoggingIn ? '...' : 'Partner-Login'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════ */}
      {/* ZAHLEN — kurz, konkret                         */}
      {/* ═══════════════════════════════════════════════ */}
      <section ref={impact.ref} className="py-12 md:py-16 px-5 md:px-8 bg-[#1a472a]">
        <div className={`max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 transition-all duration-700 ${impact.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-black text-[#8cc63f]"><CountUp target={48} />h</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 mt-2">bis dein Angebot draußen ist</p>
          </div>
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-black text-white"><CountUp target={500} suffix="+" /></p>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 mt-2">Käufer im Netzwerk</p>
          </div>
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-black text-[#8cc63f]">0 €</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 mt-2">Vorab&shy;kosten für dich</p>
          </div>
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-black text-white"><CountUp target={100} suffix="%" /></p>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 mt-2">Diskretion garantiert</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* SOCIAL IMPACT                                  */}
      {/* ═══════════════════════════════════════════════ */}
      <section ref={socialImpact.ref} className="py-20 md:py-32 px-5 md:px-8 bg-gradient-to-br from-red-50 via-pink-50 to-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className={`max-w-7xl mx-auto relative z-10 transition-all duration-700 ${socialImpact.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.25em] text-red-400 mb-4">❤️ Warum wir das machen</div>
              <h2 className="font-black text-[clamp(2rem,6vw,4rem)] leading-[1.05] uppercase tracking-[-0.03em] mb-6">
                GUTES ESSEN<br />GEHÖRT NICHT<br /><span className="text-red-500">IN DEN MÜLL.</span>
              </h2>
              <p className="text-lg text-gray-600 font-light leading-relaxed mb-8">
                Ehrlich gesagt: Wir haben HELLO SECOND/RUN gestartet, weil uns das Thema nicht losgelassen hat. Jedes Jahr werden in Österreich hunderttausende Tonnen Lebensmittel entsorgt — nicht weil sie schlecht sind, sondern weil das MHD zu kurz ist oder die Palette nicht ins Sortiment passt. Was wir nicht verkaufen können, geben wir an Tafeln und Sozialmärkte weiter. Wegwerfen kommt für uns nicht in Frage.
              </p>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-1 bg-red-300 flex-shrink-0 min-h-[60px]" />
                <blockquote className="text-base md:text-lg text-gray-700 font-light italic leading-relaxed">
                  "Wenn eine Palette Nudeln kurz vor MHD steht, sind das nicht Abfall — das sind 200 warme Mahlzeiten."
                </blockquote>
              </div>
            </div>

            <div>
              {(() => {
                const stats = getImpactStats();
                return (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/80 backdrop-blur border border-red-100 p-6 text-center">
                      <Heart size={24} className="text-red-400 mx-auto mb-3" />
                      <p className="text-3xl font-black text-[#0a1a0f]"><CountUp target={stats.totalMahlzeiten} /></p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mt-1">Mahlzeiten weitergegeben</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur border border-red-100 p-6 text-center">
                      <Package size={24} className="text-red-400 mx-auto mb-3" />
                      <p className="text-3xl font-black text-[#0a1a0f]"><CountUp target={stats.totalGewichtKg} suffix=" kg" /></p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mt-1">Lebensmittel gerettet</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur border border-red-100 p-6 text-center">
                      <Users size={24} className="text-red-400 mx-auto mb-3" />
                      <p className="text-3xl font-black text-[#0a1a0f]"><CountUp target={stats.partnerCount} /></p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mt-1">Soziale Partner</p>
                    </div>
                    <div className="bg-white/80 backdrop-blur border border-red-100 p-6 text-center">
                      <TrendingUp size={24} className="text-red-400 mx-auto mb-3" />
                      <p className="text-3xl font-black text-[#0a1a0f]">€ <CountUp target={Math.round(stats.totalWert)} /></p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mt-1">Warenwert gespendet</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* DAS PROBLEM — ehrlich, aus Erfahrung           */}
      {/* ═══════════════════════════════════════════════ */}
      <section ref={problem.ref} className="py-20 md:py-32 px-5 md:px-8 bg-[#0a1a0f] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        <div className={`max-w-7xl mx-auto relative z-10 transition-all duration-700 ${problem.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="mb-20">
            <h2 className="font-black text-[clamp(2.5rem,7vw,5rem)] leading-[1.05] uppercase tracking-[-0.03em] mb-6">DAS KENNEN<br />WIR <span className="text-[#8cc63f]">ZU GUT.</span></h2>
            <div className="flex items-center gap-4 opacity-50">
              <div className="h-[1px] w-10 bg-white" />
              <p className="uppercase font-black text-[10px] tracking-[0.4em]">Deshalb haben wir hello second/run gestartet</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Phone, title: 'Anrufen, mailen, hoffen.', desc: 'Du hast Ware übrig und fängst an rumzutelefonieren. Nach drei Tagen hast du vielleicht eine Antwort — meistens ein Preis, der wehtut.' },
              { icon: Package, title: 'Die Uhr tickt.', desc: 'Je länger die Ware steht, desto weniger ist sie wert. Und irgendwann bleibt nur noch: unter Einkaufspreis rausgeben oder wegwerfen.' },
              { icon: Handshake, title: 'Die richtigen Leute fehlen.', desc: 'Genau den Käufer finden, der genau diesen Posten braucht, genau jetzt — dafür brauchst du ein Netzwerk. Das aufzubauen dauert Jahre.' },
            ].map((item, i) => (
              <div key={i} className="group" style={{ transitionDelay: `${i * 150}ms` }}>
                <div className="w-14 h-14 bg-[#8cc63f]/10 flex items-center justify-center mb-6 group-hover:bg-[#8cc63f]/20 transition-colors">
                  <item.icon size={24} className="text-[#8cc63f]" />
                </div>
                <h3 className="text-2xl font-black mb-4 uppercase tracking-tight">{item.title}</h3>
                <p className="text-base opacity-60 leading-relaxed font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* SO LÄUFT'S — 3 Schritte                        */}
      {/* ═══════════════════════════════════════════════ */}
      <section ref={how.ref} className="py-20 md:py-32 px-5 md:px-8 bg-[#f7f9f7]">
        <div className={`max-w-7xl mx-auto transition-all duration-700 ${how.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="mb-20">
            <h2 className="font-black text-[clamp(2.5rem,7vw,5rem)] leading-[1.05] uppercase tracking-[-0.03em] mb-6">WIE WIR <span className="text-[#8cc63f]">ARBEITEN.</span></h2>
            <p className="text-xl text-gray-500 font-light max-w-2xl">Kein langes Hin und Her. Du sagst uns was du hast, wir kümmern uns um den Rest.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-20">
            {[
              { num: '01', tag: 'Schick uns', title: 'Was du loswerden willst', desc: 'Per Mail, WhatsApp, oder über unser Tool. Schick uns einfach deine Artikelliste — als PDF, Excel oder Nachricht. Wir brauchen: was, wie viel, MHD.', icon: FileText },
              { num: '02', tag: 'Wir kümmern uns', title: 'Um alles Weitere', desc: 'Wir bereiten deine Posten auf — mit Fotos, EAN-Daten, Preiskalkulation — und schicken das Angebot innerhalb von 48h an unser Käufer-Netzwerk.', icon: Users },
              { num: '03', tag: 'Du lieferst', title: 'Und bekommst dein Geld', desc: 'Wenn ein Käufer zusagt, erstellen wir alle Dokumente — Bestellung, Lieferschein, Rechnung. Du musst nur noch ausliefern.', icon: Handshake },
            ].map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center group" style={{ transitionDelay: `${i * 200}ms` }}>
                <div className="w-[72px] h-[72px] bg-[#1a472a] flex items-center justify-center relative mb-6 group-hover:bg-[#8cc63f] transition-colors duration-300">
                  <step.icon size={28} className="text-white group-hover:text-[#1a472a] transition-colors" />
                  <div className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-[#8cc63f] text-[#1a472a] text-[10px] font-black flex items-center justify-center group-hover:bg-[#1a472a] group-hover:text-white transition-colors">{step.num}</div>
                </div>
                <div className="text-[9px] font-black uppercase tracking-[0.25em] text-[#8cc63f] mb-2">{step.tag}</div>
                <h3 className="font-black uppercase text-xl mb-3 tracking-tight">{step.title}</h3>
                <p className="text-sm text-gray-500 font-light leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* TOOL CTA — Das Angebot-Tool                    */}
      {/* ═══════════════════════════════════════════════ */}
      <section ref={tool.ref} className="py-20 md:py-28 px-5 md:px-8 bg-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#8cc63f]/5 rounded-full blur-3xl -translate-y-1/3 -translate-x-1/4" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#1a472a]/5 rounded-full blur-3xl translate-y-1/3 translate-x-1/4" />
        </div>
        <div className={`max-w-5xl mx-auto relative z-10 transition-all duration-700 ${tool.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="text-center mb-12">
            <h2 className="font-black text-[clamp(2rem,6vw,4rem)] leading-[1.05] uppercase tracking-[-0.03em] mb-6">
              LIEBER <span className="text-[#8cc63f]">SELBER MACHEN?</span>
            </h2>
            <p className="text-lg text-gray-500 font-light max-w-2xl mx-auto mb-4">
              Wenn du nicht auf uns warten willst — kein Problem. Unser Quick-Tool macht dasselbe: Preisliste hochladen, EAN eingeben, und du bekommst ein fertiges Angebot als PDF. Dauert ein paar Minuten. Kostenlos, ohne Login.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { icon: Upload, label: 'Datei hochladen', desc: 'PDF oder Excel reinziehen' },
              { icon: Globe, label: 'Preise automatisch', desc: 'UVP wird online gesucht' },
              { icon: FileText, label: 'PDF fertig', desc: 'Angebot zum Verschicken' },
              { icon: Shield, label: 'Kein Account nötig', desc: 'Einfach loslegen' },
            ].map((feat, i) => (
              <div key={i} className="bg-[#f7f9f7] border border-gray-200 p-5 text-center">
                <feat.icon size={24} className="text-[#8cc63f] mx-auto mb-3" />
                <p className="text-[11px] font-black uppercase tracking-wider text-[#1a472a] mb-1">{feat.label}</p>
                <p className="text-[10px] text-gray-400">{feat.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/angebot"
              className="group inline-flex items-center gap-4 bg-[#8cc63f] text-[#1a472a] px-12 py-5 font-black uppercase tracking-[0.15em] text-[13px] border-2 border-[#8cc63f] hover:bg-[#1a472a] hover:border-[#1a472a] hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <FileText size={20} />
              Zum Quick-Tool
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-4">Kostenlos · Kein Login · Sofort nutzbar</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* WARUM WIR                                      */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-20 md:py-32 px-5 md:px-8 bg-[#f7f9f7]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="font-black text-[clamp(2.5rem,7vw,5rem)] leading-[1.05] uppercase tracking-[-0.03em] mb-6">WARUM <span className="text-[#8cc63f]">MIT UNS.</span></h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            {[
              { title: 'Kein Risiko für dich.', desc: 'Kein Vertrag, keine Grundgebühr, kein Listing-Fee. Du zahlst nur dann Provision, wenn wir tatsächlich einen Käufer finden und der Deal steht.' },
              { title: 'Deine Posten, gut aufbereitet.', desc: 'Produktfotos, EAN-Daten, MHD-Bewertung — wir machen aus deinem Sonderposten ein Angebot, das sich sehen lassen kann. Das hilft beim Preis.' },
              { title: 'In Tagen, nicht Wochen.', desc: '48 Stunden nach Einreichung ist dein Angebot im Netzwerk. Wenn jemand zuschlägt, übernehmen wir den ganzen Papierkram.' },
              { title: 'Diskret, ohne Preisschlacht.', desc: 'Dein Einkaufspreis geht niemanden was an. Wir bieten nicht öffentlich — kein eBay, kein Willhaben, keine Plattform wo jeder mitlesen kann.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="w-10 h-10 bg-[#1a472a] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#8cc63f] text-sm font-black">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div>
                  <h3 className="font-black uppercase text-lg mb-2 tracking-tight">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* KONTAKT                                        */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="kontakt-section" className="py-20 md:py-32 px-5 md:px-8 bg-[#1a472a] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#8cc63f]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#8cc63f]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-black text-[clamp(2.5rem,7vw,5rem)] leading-[1.05] uppercase tracking-[-0.03em] mb-6 text-white">LASS UNS<br /><span className="text-[#8cc63f]">REDEN.</span></h2>
            <p className="text-lg text-white/60 font-light max-w-xl mx-auto">Schick uns einfach deine Artikelliste — per Mail, oder erstell direkt ein Angebot über das Tool. Wir schauen uns das an und melden uns innerhalb von einem Tag bei dir.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link to="/angebot" className="bg-[#8cc63f] text-[#1a472a] px-12 py-5 font-black uppercase tracking-[0.1em] text-[12px] hover:bg-white transition-all duration-300 flex items-center gap-3">
              <FileText size={14} />
              Angebot erstellen
            </Link>
            <a href="mailto:info@hello2ndrun.com" className="border-2 border-white/30 text-white px-12 py-5 font-black uppercase tracking-[0.1em] text-[12px] hover:bg-white/10 transition-all duration-300 flex items-center gap-3">
              <ArrowRight size={14} />
              E-Mail schreiben
            </a>
            <button onClick={() => handleDemoLogin()} className="border-2 border-white/30 text-white px-12 py-5 font-black uppercase tracking-[0.1em] text-[12px] hover:bg-white/10 transition-all duration-300 flex items-center gap-3">
              <Play size={14} />
              Demo ausprobieren
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
