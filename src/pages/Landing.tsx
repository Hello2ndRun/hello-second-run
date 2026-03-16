import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Shield, TrendingUp, Play, FileText, Handshake, Clock, Phone, Timer, SearchX, ShieldCheck, Sparkles, Eye, ChevronDown, Send, Loader2, CheckCircle, Heart, Package, Users } from 'lucide-react';
import { sendKontaktEmail, isEmailConfigured } from '../lib/emailService';
import { getImpactStats } from '../lib/donationService';
import { DEMO_USERS, type DemoUser } from '../lib/demoStore';

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

function KontaktFormular() {
  const [form, setForm] = useState({ name: '', email: '', firma: '', telefon: '', nachricht: '', typ: 'verkauf' as 'verkauf' | 'kauf' | 'allgemein' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.nachricht) {
      setError('Bitte Name, E-Mail und Nachricht ausfüllen.');
      return;
    }

    if (isEmailConfigured()) {
      setSending(true);
      const result = await sendKontaktEmail(form);
      setSending(false);
      if (result.success) {
        setSent(true);
      } else {
        setError(result.message);
      }
    } else {
      // Fallback: mailto
      const subject = encodeURIComponent(`Anfrage von ${form.name} — ${form.firma || 'Privat'}`);
      const body = encodeURIComponent(
        `Name: ${form.name}\nFirma: ${form.firma}\nE-Mail: ${form.email}\nTelefon: ${form.telefon}\n\nTyp: ${form.typ}\n\nNachricht:\n${form.nachricht}`
      );
      window.open(`mailto:info@hello2ndrun.com?subject=${subject}&body=${body}`, '_self');
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-12 text-center">
        <CheckCircle size={48} className="text-[#8cc63f] mx-auto mb-4" />
        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Nachricht gesendet!</h3>
        <p className="text-white/60 text-sm">Wir melden uns innerhalb von 24 Stunden bei dir.</p>
        <button
          onClick={() => { setSent(false); setForm({ name: '', email: '', firma: '', telefon: '', nachricht: '', typ: 'verkauf' }); }}
          className="mt-6 text-[10px] font-black uppercase tracking-widest text-[#8cc63f] hover:text-white transition-colors underline underline-offset-4"
        >
          Neue Anfrage senden
        </button>
      </div>
    );
  }

  const inputClass = 'w-full bg-white/10 border border-white/20 text-white py-3 px-4 text-sm placeholder-white/30 focus:border-[#8cc63f] focus:outline-none transition-all';

  return (
    <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-sm border border-white/10 p-8">
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8cc63f] mb-6">Kontaktformular</h3>

      {/* Typ Selection */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: 'verkauf', label: 'Verkaufen' },
          { value: 'kauf', label: 'Kaufen' },
          { value: 'allgemein', label: 'Allgemein' },
        ].map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setForm(prev => ({ ...prev, typ: opt.value as any }))}
            className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all flex-1 min-w-[90px] sm:flex-none ${
              form.typ === opt.value
                ? 'bg-[#8cc63f] text-[#1a472a]'
                : 'border border-white/20 text-white/50 hover:border-white/40 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Name *"
          className={inputClass}
          required
        />
        <input
          type="email"
          value={form.email}
          onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
          placeholder="E-Mail *"
          className={inputClass}
          required
        />
        <input
          type="text"
          value={form.firma}
          onChange={e => setForm(prev => ({ ...prev, firma: e.target.value }))}
          placeholder="Firma"
          className={inputClass}
        />
        <input
          type="text"
          value={form.telefon}
          onChange={e => setForm(prev => ({ ...prev, telefon: e.target.value }))}
          placeholder="Telefon"
          className={inputClass}
        />
      </div>
      <textarea
        value={form.nachricht}
        onChange={e => setForm(prev => ({ ...prev, nachricht: e.target.value }))}
        placeholder="Deine Nachricht — z.B. Artikelliste, Paletten-Anzahl, MHD... *"
        rows={4}
        className={`${inputClass} resize-none mb-4`}
        required
      />

      {error && (
        <p className="text-red-400 text-xs font-bold mb-4">{error}</p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="w-full bg-[#8cc63f] text-[#1a472a] py-4 font-black uppercase tracking-[0.1em] text-[12px] hover:bg-white transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-wait"
      >
        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
        {sending ? 'Wird gesendet...' : 'Anfrage senden'}
      </button>
    </form>
  );
}

export default function Landing() {
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const hero = useInView(0.1);
  const mission = useInView();
  const how = useInView();
  const impact = useInView();
  const cta = useInView();

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
      } else {
        setLoginError('Login-Popup geschlossen. Nutze den Demo-Modus.');
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
      {/* HERO */}
      <header ref={hero.ref} id="vision" className="min-h-screen pt-28 md:pt-48 pb-12 md:pb-20 px-5 md:px-8 flex items-center relative" style={{
        backgroundImage: 'linear-gradient(to right, #eef2ee 1px, transparent 1px), linear-gradient(to bottom, #eef2ee 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }}>
        <div className="absolute top-32 right-12 w-72 h-72 bg-[#8cc63f]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-12 w-96 h-96 bg-[#1a472a]/5 rounded-full blur-3xl pointer-events-none" />

        <div className={`max-w-7xl mx-auto w-full relative z-10 transition-all duration-1000 ${hero.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[2px] w-12 bg-[#1a472a]"></div>
              <span className="text-[11px] font-black uppercase tracking-[0.5em] text-[#1a472a]">Die Plattform f&uuml;r Sonderposten-Vermittlung</span>
            </div>
            <h1 className="font-black text-[clamp(2.5rem,8vw,6rem)] leading-[1.02] uppercase tracking-[-0.03em] mb-12">
              <span className="block">DEIN</span>
              <span className="block text-[#8cc63f]">SONDERPOSTEN.</span>
              <span className="block">UNSER NETZWERK.</span>
              <span className="block text-[#8cc63f]">DEIN DEAL.</span>
            </h1>
            <div className="grid lg:grid-cols-2 gap-16 items-end">
              <p className="text-xl md:text-2xl font-light leading-relaxed text-gray-600 max-w-lg">
                Du hast &Uuml;berbest&auml;nde, kurzes MHD oder Retouren? Wir finden den K&auml;ufer. Schnell, diskret und ohne Risiko f&uuml;r dich.
              </p>
              <div className="flex flex-col gap-6 items-start">
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="#kontakt" className="group bg-[#1a472a] text-white px-9 py-4 font-black uppercase tracking-[0.1em] text-[11px] border-2 border-[#1a472a] hover:bg-[#8cc63f] hover:border-[#8cc63f] hover:text-[#1a472a] transition-all duration-300 inline-flex items-center gap-3">
                    Jetzt Angebot einreichen
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                  <div className="relative">
                    <button
                      onClick={() => setShowDemoMenu(!showDemoMenu)}
                      className="group flex items-center gap-3 border-2 border-[#1a472a] px-8 py-4 font-black uppercase tracking-[0.1em] text-[11px] hover:bg-[#1a472a] hover:text-white transition-all duration-300"
                    >
                      <Play size={14} />
                      Demo ansehen
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
        </div>
      </header>

      {/* IMPACT NUMBERS */}
      <section ref={impact.ref} className="py-12 md:py-16 px-5 md:px-8 bg-[#1a472a]">
        <div className={`max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 transition-all duration-700 ${impact.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-black text-[#8cc63f]"><CountUp target={48} />h</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 mt-2">Bis zum Angebot</p>
          </div>
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-black text-white"><CountUp target={500} suffix="+" /></p>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 mt-2">K&auml;ufer im DACH-Netzwerk</p>
          </div>
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-black text-[#8cc63f]">0 &euro;</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 mt-2">Keine Kosten f&uuml;r Verk&auml;ufer</p>
          </div>
          <div className="text-center">
            <p className="text-4xl md:text-5xl font-black text-white"><CountUp target={100} suffix="%" /></p>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 mt-2">Diskret &mdash; dein Preis bleibt geheim</p>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section ref={mission.ref} className="py-20 md:py-32 px-5 md:px-8 bg-[#0a1a0f] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        <div className={`max-w-7xl mx-auto relative z-10 transition-all duration-700 ${mission.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="mb-20">
            <h2 className="font-black text-[clamp(2.5rem,7vw,5rem)] leading-[1.05] uppercase tracking-[-0.03em] mb-6">SONDERPOSTEN LOSWERDEN<br />IST <span className="text-[#8cc63f]">M&Uuml;HSAM.</span></h2>
            <div className="flex items-center gap-4 opacity-50">
              <div className="h-[1px] w-10 bg-white"></div>
              <p className="uppercase font-black text-[10px] tracking-[0.4em]">Jeder kennt das</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Phone, title: 'Anrufen, mailen, warten', desc: 'Du hast 10 Paletten \u00dcberschuss. Du rufst 5 H\u00e4ndler an, schickst 3 Mails, wartest 2 Wochen. Am Ende kauft keiner \u2014 oder nur mit 80% Abschlag.' },
              { icon: Timer, title: 'Preisdruck & Zeitdruck', desc: 'MHD l\u00e4uft ab, der Druck steigt. Du gibst die Ware unter Wert ab, weil du keinen besseren Kanal hast. Das kostet dich tausende Euro pro Jahr.' },
              { icon: SearchX, title: 'Kein passender Kanal', desc: 'eBay Kleinanzeigen? Zu langsam. Gro\u00dfh\u00e4ndler? Wollen nur Dauerware. Es fehlt eine Plattform, die Sonderposten versteht.' },
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

      {/* HOW IT WORKS */}
      <section ref={how.ref} id="how" className="py-20 md:py-32 px-5 md:px-8 bg-[#f7f9f7]">
        <div className={`max-w-7xl mx-auto transition-all duration-700 ${how.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="mb-20">
            <h2 className="font-black text-[clamp(2.5rem,7vw,5rem)] leading-[1.05] uppercase tracking-[-0.03em] mb-6">SO EINFACH <span className="text-[#8cc63f]">GEHT'S.</span></h2>
            <p className="text-xl text-gray-500 font-light max-w-2xl">Drei Schritte. Von der Palette zum Deal.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-20">
            {[
              { num: '01', tag: 'Einreichen', title: 'Sag uns was du hast', desc: 'Du schickst uns deine Artikelliste \u2014 als PDF, Excel oder einfach per Nachricht. Wir k\u00fcmmern uns um den Rest.', icon: FileText },
              { num: '02', tag: 'Vermitteln', title: 'Wir finden den K\u00e4ufer', desc: 'Wir erstellen ein professionelles Angebot mit Produktfotos und MHD-Bewertung. Unser Netzwerk aus K\u00e4ufern bekommt es innerhalb von 48 Stunden.', icon: Zap },
              { num: '03', tag: 'Abwickeln', title: 'Du lieferst, wir rechnen ab', desc: 'K\u00e4ufer best\u00e4tigt, du lieferst. Alle Dokumente \u2014 Bestellung, Rechnung, Abrechnung \u2014 werden automatisch erstellt. Du bekommst dein Geld.', icon: Handshake },
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

      {/* WHY US */}
      <section className="py-20 md:py-32 px-5 md:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="font-black text-[clamp(2.5rem,7vw,5rem)] leading-[1.05] uppercase tracking-[-0.03em] mb-6">WARUM <span className="text-[#8cc63f]">&Uuml;BER UNS?</span></h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            {[
              { title: 'Kein Risiko f\u00fcr dich', desc: 'Du zahlst nichts im Voraus. Provision f\u00e4llt nur an, wenn der Deal zustande kommt. Kein Listing-Geb\u00fchr, kein Vertrag.' },
              { title: 'Professionelle Angebote', desc: 'Deine Ware wird mit Produktfotos, EAN-Daten und MHD-Bewertung professionell pr\u00e4sentiert. Das steigert den Verkaufspreis.' },
              { title: 'Schnelle Abwicklung', desc: 'Vom Einreichen bis zum Angebot: 48 Stunden. Vom Deal bis zur Rechnung: automatisch. Keine Excel-Tabellen, kein Papierkram.' },
              { title: 'Diskreter Handel', desc: 'Dein Einkaufspreis bleibt geheim. Deine Marke wird gesch\u00fctzt. Sonderposten-Vermittlung ohne \u00f6ffentliche Preisschlacht.' },
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

      {/* SOCIAL IMPACT SECTION */}
      <section className="py-20 md:py-32 px-5 md:px-8 bg-gradient-to-br from-red-50 via-pink-50 to-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-16">
            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-red-400 mb-4">❤️ Social Impact</div>
            <h2 className="font-black text-[clamp(2rem,6vw,4rem)] leading-[1.05] uppercase tracking-[-0.03em] mb-4">KEIN SONDERPOSTEN<br /><span className="text-red-500">WIRD VERSCHWENDET.</span></h2>
            <p className="text-lg text-gray-500 font-light max-w-2xl">
              Was nicht verkauft wird, wird nicht entsorgt — sondern gespendet. An Tafeln, Caritas, Foodbanks und andere Organisationen, die Menschen in Not helfen.
            </p>
          </div>

          {(() => {
            const impact = getImpactStats();
            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                <div className="bg-white/80 backdrop-blur border border-red-100 p-6 text-center">
                  <Heart size={24} className="text-red-400 mx-auto mb-3" />
                  <p className="text-3xl font-black text-[#0a1a0f]"><CountUp target={impact.totalMahlzeiten} /></p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mt-1">Mahlzeiten gerettet</p>
                </div>
                <div className="bg-white/80 backdrop-blur border border-red-100 p-6 text-center">
                  <Package size={24} className="text-red-400 mx-auto mb-3" />
                  <p className="text-3xl font-black text-[#0a1a0f]"><CountUp target={impact.totalGewichtKg} suffix=" kg" /></p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mt-1">Lebensmittel gerettet</p>
                </div>
                <div className="bg-white/80 backdrop-blur border border-red-100 p-6 text-center">
                  <Users size={24} className="text-red-400 mx-auto mb-3" />
                  <p className="text-3xl font-black text-[#0a1a0f]"><CountUp target={impact.partnerCount} /></p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mt-1">Partner beliefert</p>
                </div>
                <div className="bg-white/80 backdrop-blur border border-red-100 p-6 text-center">
                  <TrendingUp size={24} className="text-red-400 mx-auto mb-3" />
                  <p className="text-3xl font-black text-[#0a1a0f]">€ <CountUp target={Math.round(impact.totalWert)} /></p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mt-1">Warenwert gespendet</p>
                </div>
              </div>
            );
          })()}

          <div className="max-w-3xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-1 h-full bg-red-300 flex-shrink-0 min-h-[60px]" />
              <blockquote className="text-lg md:text-xl text-gray-700 font-light italic leading-relaxed">
                "Erst vermitteln, dann spenden — nie entsorgen. Wenn die Ware nicht verkauft wird, muss sie nicht in den Müll. Sie kann Familien helfen."
              </blockquote>
            </div>
            <p className="text-sm text-gray-400 ml-5">— HELLO SECOND/RUN. Gründervision</p>
          </div>
        </div>
      </section>

      {/* CTA + KONTAKTFORMULAR */}
      <section ref={cta.ref} id="kontakt" className="py-20 md:py-32 px-5 md:px-8 bg-[#1a472a] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#8cc63f]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#8cc63f]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        </div>
        <div className={`max-w-5xl mx-auto relative z-10 transition-all duration-700 ${cta.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="text-center mb-16">
            <h2 className="font-black text-[clamp(2.5rem,7vw,5rem)] leading-[1.05] uppercase tracking-[-0.03em] mb-6 text-white">SONDERPOSTEN?<br /><span className="text-[#8cc63f]">WIR &Uuml;BERNEHMEN.</span></h2>
            <p className="text-lg text-white/60 font-light max-w-xl mx-auto">Schick uns deine Artikelliste oder stell eine Anfrage. Wir melden uns innerhalb von 24 Stunden.</p>
          </div>

          <KontaktFormular />

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-12">
            <a href="mailto:info@hello2ndrun.com" className="bg-[#8cc63f] text-[#1a472a] px-12 py-5 font-black uppercase tracking-[0.1em] text-[12px] hover:bg-white transition-all duration-300 flex items-center gap-3">
              <ArrowRight size={14} />
              Direkt per E-Mail
            </a>
            <button onClick={() => handleDemoLogin()} className="border-2 border-white/30 text-white px-12 py-5 font-black uppercase tracking-[0.1em] text-[12px] hover:bg-white/10 transition-all duration-300 flex items-center gap-3">
              <Play size={14} />
              Plattform testen
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
