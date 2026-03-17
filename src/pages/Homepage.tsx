// ════════════════════════════════════════════════════════════
// HOMEPAGE — Clean SaaS Design
// HELLO SECOND/RUN = Tool für Sonderposten-Händler
// Du machst Angebote. Wir geben dir das Werkzeug.
// ════════════════════════════════════════════════════════════

import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  ArrowRight, FileText, Handshake,
  Phone, Heart, Package, Users, TrendingUp,
  Play, ChevronDown, Upload, Globe, Shield,
  Zap, Clock, Lock, Eye, Sparkles,
  CheckCircle2, BarChart3, Send, Scan, ArrowUpRight,
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

// ─── Workflow Showcase data ───
const SHOWCASE_TABS = [
  { id: 'upload', label: 'Hochladen', icon: Upload, title: 'Preisliste hochladen' },
  { id: 'analyze', label: 'KI-Analyse', icon: Scan, title: 'Automatische Bewertung' },
  { id: 'offer', label: 'Angebot', icon: FileText, title: 'PDF wird generiert' },
  { id: 'send', label: 'Versenden', icon: Send, title: 'Per WhatsApp oder E-Mail' },
];

// ─── Typewriter hook ───
function useTypewriter(text: string, speed = 35, startDelay = 0, active = false) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active) { setDisplayed(''); setDone(false); return; }
    setDisplayed('');
    setDone(false);
    let i = 0;
    const delay = setTimeout(() => {
      const timer = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) { clearInterval(timer); setDone(true); }
      }, speed);
      return () => clearInterval(timer);
    }, startDelay);
    return () => clearTimeout(delay);
  }, [text, speed, startDelay, active]);
  return { displayed, done };
}

// ─── Animated counter ───
function AnimatedValue({ target, prefix = '', suffix = '', duration = 1200, active = false }: { target: number; prefix?: string; suffix?: string; duration?: number; active?: boolean }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) { setVal(0); return; }
    let start = 0;
    const steps = 30;
    const step = target / steps;
    const interval = duration / steps;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.round(start * 100) / 100);
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration, active]);
  return <>{prefix}{typeof target === 'number' && target % 1 !== 0 ? val.toFixed(2) : val.toLocaleString()}{suffix}</>;
}

// ─── Animated progress bar ───
function AnimatedBar({ percent, delay = 0, active = false, color = '#8cc63f' }: { percent: number; delay?: number; active?: boolean; color?: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!active) { setWidth(0); return; }
    const t = setTimeout(() => setWidth(percent), delay);
    return () => clearTimeout(t);
  }, [percent, delay, active]);
  return (
    <div className="w-full h-1.5 bg-[#ffffff]/8 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all ease-out" style={{ width: `${width}%`, backgroundColor: color, transitionDuration: '1.2s' }} />
    </div>
  );
}

// ─── Step 1: Upload Panel ───
function UploadPanel({ active }: { active: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) { setStep(0); return; }
    const timers = [
      setTimeout(() => setStep(1), 200),   // file appears
      setTimeout(() => setStep(2), 800),   // scanning
      setTimeout(() => setStep(3), 1800),  // rows reveal
      setTimeout(() => setStep(4), 2800),  // done
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all duration-500 ${step >= 1 ? 'border-[#8cc63f]/40 bg-[#8cc63f]/5' : 'border-[#ffffff]/10'}`}>
        {step < 1 ? (
          <div className="py-3">
            <Upload size={20} className="mx-auto text-[#ffffff]/20 mb-2" />
            <p className="text-[11px] text-[#ffffff]/20">PDF oder Excel hierher ziehen</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-1">
            <div className="w-8 h-8 rounded-lg bg-[#8cc63f]/20 flex items-center justify-center">
              <FileText size={14} className="text-[#8cc63f]" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-semibold text-[#ffffff]">preisliste_kw12.xlsx</p>
              <p className="text-[10px] text-[#ffffff]/30">4 Artikel · 124 KB</p>
            </div>
            {step >= 2 && <div className="w-4 h-4 rounded-full border-2 border-[#8cc63f] border-t-transparent animate-spin" />}
            {step >= 4 && <CheckCircle2 size={16} className="text-[#8cc63f] showcase-pop" />}
          </div>
        )}
      </div>

      {/* Scanned rows appearing one by one */}
      {step >= 3 && (
        <div className="space-y-0">
          {[
            { ean: '8076809513753', name: 'Barilla Spaghetti No. 5', delay: 0 },
            { ean: '4005500068204', name: 'Nutella 750g', delay: 200 },
            { ean: '5449000000996', name: 'Coca-Cola 1.5L', delay: 400 },
            { ean: '4017100265808', name: 'Haribo Goldbären 200g', delay: 600 },
          ].map((item, i) => (
            <div key={i} className="showcase-row-enter flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[#ffffff]/[0.02] border-b border-[#ffffff]/5 last:border-0" style={{ animationDelay: `${item.delay}ms` }}>
              <div className="w-6 h-6 rounded bg-[#ffffff]/5 flex items-center justify-center">
                <Scan size={10} className="text-[#8cc63f]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-[#ffffff]/80 truncate">{item.name}</p>
                <p className="text-[9px] text-[#ffffff]/25 font-mono">{item.ean}</p>
              </div>
              <CheckCircle2 size={12} className="text-[#8cc63f]/60 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Status */}
      {step >= 4 && (
        <div className="flex items-center gap-2 pt-2 showcase-status-enter">
          <div className="w-1.5 h-1.5 rounded-full bg-[#8cc63f] animate-pulse-soft" />
          <span className="text-[11px] font-semibold text-[#8cc63f]">4 Artikel erkannt</span>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Analyze Panel ───
function AnalyzePanel({ active }: { active: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) { setStep(0); return; }
    const timers = [
      setTimeout(() => setStep(1), 300),   // scanning start
      setTimeout(() => setStep(2), 1200),  // prices found
      setTimeout(() => setStep(3), 2000),  // MHD calc
      setTimeout(() => setStep(4), 2800),  // result
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <div className="space-y-3">
      {/* Product being analyzed */}
      <div className="flex items-center gap-3 pb-3 border-b border-[#ffffff]/8">
        <div className="w-10 h-10 rounded-lg bg-[#ffffff]/5 flex items-center justify-center">
          <Package size={16} className="text-[#ffffff]/40" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#ffffff]">Barilla Spaghetti No. 5</p>
          <p className="text-[10px] text-[#ffffff]/30 font-mono">EAN 8076809513753 · 480 Stk</p>
        </div>
      </div>

      {/* Scanning animation */}
      {step >= 1 && step < 4 && (
        <div className="flex items-center gap-3 py-2 showcase-fade-in">
          <div className="showcase-scan-pulse w-2 h-2 rounded-full bg-[#8cc63f]" />
          <span className="text-[11px] text-[#ffffff]/50">
            {step < 2 ? 'Suche Marktpreise...' : step < 3 ? 'Berechne MHD-Abschlag...' : 'Kalkuliere VK...'}
          </span>
        </div>
      )}

      {/* Price rows */}
      {step >= 2 && (
        <div className="space-y-2 showcase-fade-in">
          <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-[#ffffff]/[0.03]">
            <span className="text-[10px] font-medium text-[#ffffff]/40">UVP (billa.at)</span>
            <span className="text-xs font-bold text-[#ffffff]">€ <AnimatedValue target={1.99} active={step >= 2} duration={800} /></span>
          </div>
          <div className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-[#ffffff]/[0.03]">
            <span className="text-[10px] font-medium text-[#ffffff]/40">UVP (spar.at)</span>
            <span className="text-xs font-bold text-[#ffffff]">€ <AnimatedValue target={2.19} active={step >= 2} duration={1000} /></span>
          </div>
        </div>
      )}

      {/* MHD calculation */}
      {step >= 3 && (
        <div className="p-3 rounded-lg border border-[#ffffff]/8 space-y-2 showcase-fade-in">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-medium text-[#ffffff]/40">MHD-Restlaufzeit</span>
            <span className="text-[11px] font-semibold text-yellow-400">68 Tage</span>
          </div>
          <AnimatedBar percent={68} active={step >= 3} color="#eab308" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-medium text-[#ffffff]/40">MHD-Abschlag</span>
            <span className="text-[11px] font-semibold text-[#ffffff]/70">−25 %</span>
          </div>
        </div>
      )}

      {/* Final result */}
      {step >= 4 && (
        <div className="flex items-center justify-between pt-2 border-t border-[#ffffff]/8 showcase-status-enter">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#8cc63f] animate-pulse-soft" />
            <span className="text-[11px] font-semibold text-[#8cc63f]">Empf. VK: € 0,89</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#ffffff]/30">Marge</span>
            <span className="text-[11px] font-bold text-[#8cc63f]"><AnimatedValue target={72} suffix="%" active={step >= 4} /></span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Offer Panel ───
function OfferPanel({ active }: { active: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) { setStep(0); return; }
    const timers = [
      setTimeout(() => setStep(1), 300),   // generating
      setTimeout(() => setStep(2), 1500),  // progress
      setTimeout(() => setStep(3), 2500),  // done
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <div className="space-y-3">
      {/* PDF preview mock */}
      <div className={`rounded-xl border overflow-hidden transition-all duration-700 ${step >= 3 ? 'border-[#8cc63f]/30' : 'border-[#ffffff]/8'}`}>
        {/* PDF header bar */}
        <div className="bg-[#ffffff]/[0.04] px-4 py-2.5 flex items-center gap-3 border-b border-[#ffffff]/5">
          <FileText size={14} className={`transition-colors duration-500 ${step >= 3 ? 'text-[#8cc63f]' : 'text-[#ffffff]/30'}`} />
          <span className="text-[11px] font-semibold text-[#ffffff]/70">ANG-2026-00142.pdf</span>
          <div className="flex-1" />
          {step >= 1 && step < 3 && <div className="w-3 h-3 rounded-full border-2 border-[#8cc63f] border-t-transparent animate-spin" />}
          {step >= 3 && <CheckCircle2 size={14} className="text-[#8cc63f] showcase-pop" />}
        </div>

        {/* PDF body mock */}
        <div className="p-4 space-y-3">
          {/* Logo area */}
          <div className="flex items-center justify-between mb-2">
            <div className={`h-3 rounded bg-[#ffffff]/10 transition-all duration-700 ${step >= 1 ? 'w-20 opacity-100' : 'w-0 opacity-0'}`} />
            <div className={`text-right transition-all duration-700 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>
              <div className="h-2 w-16 rounded bg-[#ffffff]/8 mb-1" />
              <div className="h-2 w-12 rounded bg-[#ffffff]/5" />
            </div>
          </div>

          {/* Table rows building up */}
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`flex items-center gap-2 transition-all duration-500 ${step >= 2 && i <= (step >= 3 ? 3 : 1) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'}`} style={{ transitionDelay: `${i * 150}ms` }}>
              <div className="w-6 h-6 rounded bg-[#ffffff]/5 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-2 rounded bg-[#ffffff]/10" style={{ width: `${70 + i * 5}%` }} />
                <div className="h-1.5 rounded bg-[#ffffff]/5" style={{ width: `${40 + i * 8}%` }} />
              </div>
              <div className={`h-2 w-12 rounded transition-colors duration-500 ${step >= 3 ? 'bg-[#8cc63f]/30' : 'bg-[#ffffff]/8'}`} />
            </div>
          ))}

          {/* Total row */}
          {step >= 3 && (
            <div className="flex items-center justify-between pt-2 border-t border-[#ffffff]/10 showcase-fade-in">
              <span className="text-[10px] font-medium text-[#ffffff]/40">Gesamtwert</span>
              <span className="text-sm font-bold text-[#ffffff]">€ <AnimatedValue target={4280} active={step >= 3} duration={1000} /></span>
            </div>
          )}
        </div>
      </div>

      {/* Generation progress */}
      {step >= 1 && (
        <div className="space-y-1.5 showcase-fade-in">
          <div className="flex justify-between">
            <span className="text-[10px] text-[#ffffff]/30">{step >= 3 ? 'PDF generiert' : 'Generiere PDF...'}</span>
            <span className="text-[10px] font-semibold text-[#8cc63f]">{step >= 3 ? '100' : step >= 2 ? '67' : '23'}%</span>
          </div>
          <AnimatedBar percent={step >= 3 ? 100 : step >= 2 ? 67 : 23} active={step >= 1} />
        </div>
      )}

      {/* Done */}
      {step >= 3 && (
        <div className="flex items-center gap-2 showcase-status-enter">
          <div className="w-1.5 h-1.5 rounded-full bg-[#8cc63f] animate-pulse-soft" />
          <span className="text-[11px] font-semibold text-[#8cc63f]">Bereit zum Versenden</span>
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Send Panel ───
function SendPanel({ active }: { active: boolean }) {
  const [step, setStep] = useState(0);
  const [sentIdx, setSentIdx] = useState(-1);
  useEffect(() => {
    if (!active) { setStep(0); setSentIdx(-1); return; }
    const timers = [
      setTimeout(() => setStep(1), 300),   // options appear
      setTimeout(() => setStep(2), 1200),  // WhatsApp "sent"
      setTimeout(() => setSentIdx(0), 1200),
      setTimeout(() => setStep(3), 2200),  // Email "sent"
      setTimeout(() => setSentIdx(1), 2200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [active]);

  const channels = [
    { icon: '💬', label: 'WhatsApp', desc: 'Direkt an Kontakt teilen', color: '#25D366' },
    { icon: '✉️', label: 'E-Mail', desc: 'Mit Angebotsvorlage', color: '#ffffff' },
    { icon: '⬇️', label: 'Download', desc: 'PDF lokal speichern', color: '#ffffff' },
  ];

  return (
    <div className="space-y-3">
      {/* File preview */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#ffffff]/[0.03] border border-[#ffffff]/8">
        <div className="w-10 h-10 rounded-lg bg-[#8cc63f]/15 flex items-center justify-center">
          <FileText size={16} className="text-[#8cc63f]" />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-[#ffffff]">ANG-2026-00142.pdf</p>
          <p className="text-[10px] text-[#ffffff]/30">4 Artikel · € 4.280 · 2 Seiten</p>
        </div>
        <CheckCircle2 size={14} className="text-[#8cc63f]" />
      </div>

      {/* Send channels */}
      {step >= 1 && (
        <div className="space-y-2">
          {channels.map((ch, i) => (
            <button key={i} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-500 showcase-row-enter ${sentIdx >= i ? 'border-[#8cc63f]/30 bg-[#8cc63f]/5' : 'border-[#ffffff]/8 bg-[#ffffff]/[0.02] hover:bg-[#ffffff]/[0.04]'}`} style={{ animationDelay: `${i * 120}ms` }}>
              <span className="text-lg">{ch.icon}</span>
              <div className="flex-1 text-left">
                <p className="text-[11px] font-semibold text-[#ffffff]">{ch.label}</p>
                <p className="text-[9px] text-[#ffffff]/30">{ch.desc}</p>
              </div>
              {sentIdx >= i ? (
                <span className="text-[10px] font-semibold text-[#8cc63f] flex items-center gap-1 showcase-pop">
                  <CheckCircle2 size={12} /> Gesendet
                </span>
              ) : (
                <ArrowRight size={12} className="text-[#ffffff]/20" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Final status */}
      {step >= 3 && (
        <div className="flex items-center gap-2 pt-2 showcase-status-enter">
          <div className="w-1.5 h-1.5 rounded-full bg-[#8cc63f] animate-pulse-soft" />
          <span className="text-[11px] font-semibold text-[#8cc63f]">Angebot verschickt!</span>
        </div>
      )}
    </div>
  );
}

export default function Homepage() {
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const hero = useInView(0.1);
  const impact = useInView();
  const socialImpact = useInView();
  const problem = useInView();
  const how = useInView();
  const showcase = useInView();
  const tool = useInView();
  const why = useInView();

  // Showcase tab auto-rotation
  const [activeTab, setActiveTab] = useState(0);
  const [tabProgress, setTabProgress] = useState(0);
  const tabIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTabTimer = useCallback(() => {
    if (tabIntervalRef.current) clearInterval(tabIntervalRef.current);
    setTabProgress(0);
    let p = 0;
    tabIntervalRef.current = setInterval(() => {
      p += 2;
      setTabProgress(p);
      if (p >= 100) {
        setActiveTab(prev => (prev + 1) % SHOWCASE_TABS.length);
        p = 0;
        setTabProgress(0);
      }
    }, 80);
  }, []);

  useEffect(() => {
    if (showcase.inView) startTabTimer();
    return () => { if (tabIntervalRef.current) clearInterval(tabIntervalRef.current); };
  }, [showcase.inView, startTabTimer]);

  const handleTabClick = (i: number) => {
    setActiveTab(i);
    startTabTimer();
  };

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
    <div className="bg-[#ffffff] text-[#111113] overflow-x-hidden">

      {/* ═══════════════════════════════════════════════ */}
      {/* HERO — Big editorial serif, centered, minimal  */}
      {/* ═══════════════════════════════════════════════ */}
      <header ref={hero.ref} className="min-h-screen flex flex-col justify-center items-center text-center px-6 md:px-12 pt-28 pb-20 relative">
        <div className={`max-w-5xl mx-auto transition-all duration-1000 ease-out ${hero.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Eyebrow */}
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#9394a1] mb-8">
            Das Angebots-Tool für Sonderposten
          </p>

          {/* Main headline — serif display */}
          <h1 className="heading-display text-[clamp(3rem,8.5vw,7.5rem)] mb-8">
            Nicht nur deine Ware<br className="hidden md:block" /> hat ein <span className="text-[#8cc63f] font-extrabold">MHD.</span>
          </h1>

          {/* Subline */}
          <p className="text-lg md:text-xl text-[#5f5f6b] font-light leading-relaxed max-w-2xl mx-auto mb-12">
            Preisliste rein, PDF raus. Mach aus deiner Artikelliste in Sekunden ein professionelles Angebot — mit Marktpreisen, MHD-Bewertung und allem Papierkram.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
            <Link
              to="/angebot"
              className="group bg-[#111113] text-[#ffffff] px-8 py-4 rounded-lg font-semibold text-sm hover:bg-[#111113] transition-all duration-300 inline-flex items-center gap-3"
            >
              Angebot erstellen
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#so-gehts"
              className="group text-[#111113] px-8 py-4 rounded-lg font-semibold text-sm border border-[#e4e4e7] hover:border-[#111113]/40 transition-all duration-300 inline-flex items-center gap-3"
            >
              So funktioniert's
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>

            {/* Demo button */}
            <div className="relative">
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="group flex items-center gap-2 text-[#9394a1] px-6 py-4 rounded-lg font-medium text-sm hover:text-[#111113] transition-all duration-300"
              >
                <Play size={14} />
                Demo
                <ChevronDown size={12} className={`transition-transform duration-200 ${showDemoMenu ? 'rotate-180' : ''}`} />
              </button>
              {showDemoMenu && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-[#e4e4e7] rounded-2xl shadow-xl shadow-black/5 z-50 min-w-[240px] overflow-hidden">
                  {DEMO_USERS.map(du => (
                    <button
                      key={du.uid}
                      onClick={() => handleDemoLogin(du)}
                      className="w-full text-left px-5 py-4 hover:bg-[#ffffff] transition-colors border-b border-[#e4e4e7] last:border-0"
                    >
                      <p className="text-sm font-semibold text-[#111113]">{du.displayName}</p>
                      <p className="text-xs text-[#9394a1] mt-0.5">
                        {du.role === 'admin' ? 'Admin — Alle Rechte' : `Broker — ${du.email}`}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {loginError && <span className="text-red-500 text-xs">{loginError}</span>}
          <button onClick={handleLogin} disabled={isLoggingIn} className="text-xs font-medium text-[#9394a1] hover:text-[#111113] transition-colors disabled:opacity-50 underline underline-offset-4 decoration-[#111113]/10">
            {isLoggingIn ? '...' : 'Partner-Login'}
          </button>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <div className="w-[1px] h-8 bg-transparent0" />
        </div>
      </header>

      {/* ═══════════════════════════════════════════════ */}
      {/* NUMBERS — Clean row on dark strip               */}
      {/* ═══════════════════════════════════════════════ */}
      <section ref={impact.ref} className="px-6 md:px-12 py-16 md:py-20">
        <div className="max-w-7xl mx-auto bg-[#f7f7f8] border border-[#e4e4e7] rounded-xl px-6 md:px-12 py-12 md:py-16">
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 transition-all duration-700 ${impact.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            {[
              { value: <><CountUp target={30} />s</>, label: 'Bis dein Angebot fertig ist' },
              { value: <CountUp target={100} suffix="%" />, label: 'Automatische Preisrecherche' },
              { value: '0 €', label: 'Kostenlos nutzbar' },
              { value: 'PDF', label: 'Sofort versandfertig' },
            ].map((stat, i) => (
              <div
                key={i}
                className={`transition-all duration-500 ${impact.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <p className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111113] mb-2">{stat.value}</p>
                <p className="text-xs font-medium text-[#5f5f6b] leading-relaxed">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* MARQUEE — Quiet, editorial ticker                */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="py-5 border-b border-[#111113]/6 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, setIdx) => (
            <div key={setIdx} className="flex items-center gap-10 px-5 shrink-0">
              {[
                'Sonderposten', 'MHD-Ware', 'Überbestand', 'Retouren', 'Lebensmittel',
                'Getränke', 'Non-Food', 'Drogerie', 'Tiefkühl', 'B2B',
                'Kostenlos', 'Kein Login', 'KI-Bewertung', 'Automatisiert',
                'PDF-Angebot', 'WhatsApp', 'EAN-Lookup', 'Marktpreise', 'Nachhaltig',
              ].map((tag, i) => (
                <span key={`${setIdx}-${i}`} className="flex items-center gap-10">
                  <span className="text-xs font-medium tracking-[0.1em] text-[#9394a1] uppercase">{tag}</span>
                  <span className="text-[#111113]/10">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* SOCIAL IMPACT — Editorial two-column              */}
      {/* ═══════════════════════════════════════════════ */}
      <section ref={socialImpact.ref} className="bg-[#f7f7f8] py-24 md:py-40 px-6 md:px-12">
        <div className={`max-w-7xl mx-auto transition-all duration-700 ${socialImpact.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            {/* Left — Text */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#9394a1] mb-6">Warum wir das machen</p>

              <h2 className="heading-display text-[clamp(2.5rem,5vw,4.5rem)] mb-8">
                Gutes Essen gehört nicht in den <span className="text-[#8cc63f] font-extrabold">Müll.</span>
              </h2>

              <p className="text-base md:text-lg text-[#5f5f6b] font-light leading-relaxed mb-8">
                Jedes Jahr werden in Österreich hunderttausende Tonnen Lebensmittel entsorgt — nicht weil sie schlecht sind, sondern weil das MHD zu kurz ist oder die Palette nicht ins Sortiment passt.
              </p>

              <p className="text-base md:text-lg text-[#5f5f6b] font-light leading-relaxed mb-10">
                Sonderposten, die nicht mehr verkäuflich sind, gehören nicht in den Müll — sondern an Tafeln und Sozialmärkte. Dafür setzen wir uns ein.
              </p>

              <div className="flex items-start gap-5 p-6 bg-white/60 rounded-2xl border border-[#e4e4e7]">
                <div className="w-1 bg-[#8cc63f] rounded-full flex-shrink-0 min-h-[48px]" />
                <p className="text-base text-[#111113]/60 font-light italic leading-relaxed">
                  "Wenn eine Palette Nudeln kurz vor MHD steht, sind das nicht Abfall — das sind 200 warme Mahlzeiten."
                </p>
              </div>
            </div>

            {/* Right — Stats */}
            <div className="lg:pt-16">
              {(() => {
                const stats = getImpactStats();
                return (
                  <div className="space-y-6">
                    {[
                      { icon: Heart, value: <CountUp target={stats.totalMahlzeiten} />, label: 'Mahlzeiten weitergegeben', accent: '#8cc63f' },
                      { icon: Package, value: <><CountUp target={stats.totalGewichtKg} /> kg</>, label: 'Lebensmittel gerettet', accent: '#8cc63f' },
                      { icon: Users, value: <CountUp target={stats.partnerCount} />, label: 'Soziale Partner', accent: '#8cc63f' },
                      { icon: TrendingUp, value: <>€ <CountUp target={Math.round(stats.totalWert)} /></>, label: 'Warenwert gespendet', accent: '#8cc63f' },
                    ].map((stat, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-6 p-5 rounded-2xl border border-[#e4e4e7] bg-white/40 card-hover transition-all duration-500 ${socialImpact.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        style={{ transitionDelay: `${200 + i * 100}ms` }}
                      >
                        <div className="w-12 h-12 rounded-xl bg-[#f7f7f8] flex items-center justify-center flex-shrink-0">
                          <stat.icon size={20} className="text-[#111113]" />
                        </div>
                        <div className="flex-1">
                          <p className="heading-display text-3xl text-[#111113]">{stat.value}</p>
                          <p className="text-xs font-medium text-[#9394a1] mt-0.5">{stat.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* DAS PROBLEM — Dark, editorial                    */}
      {/* ═══════════════════════════════════════════════ */}
      <section ref={problem.ref} className="section-dark py-24 md:py-40 px-6 md:px-12">
        <div className={`max-w-7xl mx-auto transition-all duration-700 ${problem.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Section header */}
          <div className="mb-16 md:mb-24">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#9394a1] mb-6">Realität im Handel</p>
            <h2 className="heading-display text-[clamp(2.5rem,6vw,5.5rem)] text-[#ffffff]">
              Das geht auch <span className="text-[#8cc63f] font-extrabold">anders.</span>
            </h2>
          </div>

          {/* Problem cards — clean, no gradients */}
          <div className="grid md:grid-cols-3 gap-px bg-[#ffffff]/8 rounded-2xl overflow-hidden">
            {[
              { icon: Phone, title: 'Drei Tage telefonieren.', desc: 'Du hast 10 Paletten Nudeln übrig und rufst jeden an, den du kennst. Bis du eine brauchbare Rückmeldung hast, ist die halbe Woche um.' },
              { icon: Package, title: 'Jeder Tag kostet Marge.', desc: 'Während du auf Antworten wartest, tickt das MHD runter — und damit dein Preis. Was heute 70 % bringt, ist morgen bei 40 %.' },
              { icon: Handshake, title: 'Excel statt Angebot.', desc: 'Deine Preisliste ist eine Excel-Tabelle, die niemand lesen will. Professionelle Angebote kosten Stunden — wenn man sie manuell macht.' },
            ].map((item, i) => (
              <div
                key={i}
                className={`bg-[#111113] p-8 md:p-10 transition-all duration-500 ${problem.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${200 + i * 150}ms` }}
              >
                <item.icon size={24} className="text-[#ffffff]/20 mb-8" />
                <h3 className="heading-display text-2xl md:text-3xl text-[#ffffff] mb-4">{item.title}</h3>
                <p className="text-sm text-[#ffffff]/35 leading-relaxed font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* SO LÄUFT'S — Three steps, editorial               */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="so-gehts" ref={how.ref} className="py-24 md:py-40 px-6 md:px-12">
        <div className={`max-w-7xl mx-auto transition-all duration-700 ${how.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="mb-16 md:mb-24">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#9394a1] mb-6">Dein neuer Workflow</p>
            <h2 className="heading-display text-[clamp(2.5rem,6vw,5.5rem)]">
              So geht das <span className="text-[#8cc63f] font-extrabold">heute.</span>
            </h2>
          </div>

          <div className="space-y-0">
            {[
              { num: '01', title: 'Preisliste rein.', subtitle: 'Statt tagelang in Excel rechnen', desc: 'PDF, Excel oder einfach EAN eintippen. Du lädst deine Artikelliste hoch — kein Account nötig, kein Login, kein Setup.', icon: FileText },
              { num: '02', title: 'KI macht den Rest.', subtitle: 'Statt händisch kalkulieren', desc: 'EAN-Daten, Marktpreise, MHD-Bewertung — das Tool recherchiert alles automatisch und berechnet den optimalen Verkaufspreis.', icon: Zap },
              { num: '03', title: 'PDF raus, fertig.', subtitle: 'Statt Papierkram wälzen', desc: 'Professionelles Angebot als PDF — per WhatsApp oder E-Mail an deine Käufer verschicken. Alle Dokumente auf Knopfdruck.', icon: Handshake },
            ].map((step, i) => (
              <div
                key={i}
                className={`group grid md:grid-cols-12 gap-6 md:gap-8 py-10 md:py-14 border-t border-[#e4e4e7] transition-all duration-500 ${how.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${200 + i * 150}ms` }}
              >
                {/* Number */}
                <div className="md:col-span-1">
                  <span className="text-xs font-semibold text-[#9394a1]">{step.num}</span>
                </div>

                {/* Title */}
                <div className="md:col-span-4">
                  <h3 className="heading-display text-3xl md:text-4xl group-hover:text-[#111113] transition-colors duration-300">{step.title}</h3>
                  <p className="text-xs font-medium text-[#8cc63f] mt-2 uppercase tracking-[0.15em]">{step.subtitle}</p>
                </div>

                {/* Description */}
                <div className="md:col-span-6">
                  <p className="text-base text-[#5f5f6b] font-light leading-relaxed">{step.desc}</p>
                </div>

                {/* Arrow */}
                <div className="md:col-span-1 flex items-start justify-end">
                  <ArrowUpRight size={20} className="text-[#111113]/10 group-hover:text-[#8cc63f] transition-colors duration-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* WORKFLOW SHOWCASE — Dark, animated panels        */}
      {/* ═══════════════════════════════════════════════ */}
      <section ref={showcase.ref} className="section-dark py-24 md:py-40 px-6 md:px-12">
        <div className={`max-w-7xl mx-auto transition-all duration-700 ${showcase.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-16 md:mb-20">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#9394a1] mb-6">Live Workflow</p>
            <h2 className="heading-display text-[clamp(2rem,5vw,4rem)] text-[#ffffff]">
              So sieht das in <span className="text-[#8cc63f] font-extrabold">Aktion</span> aus.
            </h2>
            <p className="text-base text-[#ffffff]/30 font-light max-w-md mx-auto mt-4">Von der Preisliste zum versandfertigen Angebot — in unter 30 Sekunden.</p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-start">
            {/* Left — Tabs */}
            <div className="lg:col-span-2 space-y-1">
              {SHOWCASE_TABS.map((tab, i) => {
                const isActive = i === activeTab;
                const isDone = i < activeTab;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(i)}
                    className={`w-full text-left p-5 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                      isActive ? 'bg-[#ffffff]/5' : 'hover:bg-[#ffffff]/[0.02]'
                    }`}
                  >
                    {/* Progress bar */}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 h-[2px] bg-[#8cc63f] rounded-lg transition-none" style={{ width: `${tabProgress}%` }} />
                    )}

                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-[#8cc63f]/15' : isDone ? 'bg-[#8cc63f]/10' : 'bg-[#ffffff]/5'}`}>
                        {isDone ? (
                          <CheckCircle2 size={16} className="text-[#8cc63f]" />
                        ) : (
                          <TabIcon size={16} className={`transition-colors ${isActive ? 'text-[#8cc63f]' : 'text-[#ffffff]/20 group-hover:text-[#ffffff]/40'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium transition-colors ${isActive ? 'text-[#ffffff]' : isDone ? 'text-[#ffffff]/50' : 'text-[#ffffff]/30'}`}>
                          {tab.label}
                        </p>
                        <p className={`text-xs mt-0.5 transition-colors truncate ${isActive ? 'text-[#ffffff]/50' : 'text-[#ffffff]/15'}`}>
                          {tab.title}
                        </p>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 rounded-full bg-[#8cc63f] animate-pulse-soft shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Step counter */}
              <div className="flex items-center gap-3 px-5 pt-4">
                <div className="flex gap-1">
                  {SHOWCASE_TABS.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i <= activeTab ? 'w-6 bg-[#8cc63f]' : 'w-3 bg-[#ffffff]/10'}`} />
                  ))}
                </div>
                <span className="text-[10px] text-[#ffffff]/20 font-medium">{activeTab + 1}/{SHOWCASE_TABS.length}</span>
              </div>
            </div>

            {/* Right — Animated Mock UI */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-[#ffffff]/8 bg-[#171719] p-6 md:p-8 min-h-[400px] relative overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#ffffff]/5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                  <div className="flex-1" />
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${activeTab < 3 ? 'bg-[#8cc63f] animate-pulse-soft' : 'bg-[#8cc63f]'}`} />
                    <span className="text-[10px] font-semibold text-[#ffffff]/30">{SHOWCASE_TABS[activeTab].label}</span>
                  </div>
                </div>

                {/* Animated panel content */}
                <div key={activeTab} className="animate-tab-slide">
                  {activeTab === 0 && <UploadPanel active={showcase.inView} />}
                  {activeTab === 1 && <AnalyzePanel active={showcase.inView} />}
                  {activeTab === 2 && <OfferPanel active={showcase.inView} />}
                  {activeTab === 3 && <SendPanel active={showcase.inView} />}
                </div>

                {/* Scan line effect */}
                <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#8cc63f]/15 to-transparent showcase-scan-line pointer-events-none" />

                {/* Corner glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#8cc63f]/5 rounded-full blur-3xl pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* TOOL CTA — Warm, centered, confident             */}
      {/* ═══════════════════════════════════════════════ */}
      <section ref={tool.ref} className="bg-[#f7f7f8] py-24 md:py-40 px-6 md:px-12">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-700 ${tool.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#9394a1] mb-6">Quick Tool</p>

          <h2 className="heading-display text-[clamp(2.5rem,6vw,5rem)] mb-6">
            Schneller als jede <span className="text-[#8cc63f] font-extrabold">Tabelle.</span>
          </h2>

          <p className="text-base md:text-lg text-[#5f5f6b] font-light leading-relaxed max-w-xl mx-auto mb-12">
            Preisliste hochladen, EAN eingeben — fertig ist das Angebot als PDF. Marktpreise werden automatisch recherchiert, MHD-Abschläge berechnet.
          </p>

          {/* Features — simple row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-14">
            {[
              { icon: Upload, label: 'Datei hochladen' },
              { icon: Globe, label: 'Preise automatisch' },
              { icon: FileText, label: 'PDF fertig' },
              { icon: Shield, label: 'Kein Account nötig' },
            ].map((feat, i) => (
              <div
                key={i}
                className={`text-center transition-all duration-500 ${tool.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${200 + i * 80}ms` }}
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-transparent flex items-center justify-center">
                  <feat.icon size={20} className="text-[#111113]" />
                </div>
                <p className="text-sm font-medium text-[#111113]/60">{feat.label}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link
            to="/angebot"
            className="group inline-flex items-center gap-3 bg-[#8cc63f] text-[#111113] px-10 py-5 rounded-lg font-semibold text-sm hover:bg-[#7ab835] transition-all duration-300"
          >
            <FileText size={18} />
            Zum Quick-Tool
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-xs font-medium text-[#9394a1] mt-5">Kostenlos · Kein Login · Sofort nutzbar</p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* WARUM WIR — Editorial list                       */}
      {/* ═══════════════════════════════════════════════ */}
      <section ref={why.ref} className="py-24 md:py-40 px-6 md:px-12 border-t border-[#111113]/6">
        <div className={`max-w-7xl mx-auto transition-all duration-700 ${why.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 mb-16">
            <div>
              <h2 className="heading-display text-[clamp(2.5rem,6vw,5rem)]">
                Warum <span className="text-[#8cc63f] font-extrabold">wechseln.</span>
              </h2>
            </div>
            <div className="flex items-end">
              <p className="text-base text-[#9394a1] font-light leading-relaxed">
                Sonderposten-Angebote erstellen muss nicht kompliziert sein. Vier Gründe, warum Händler unser Tool nutzen.
              </p>
            </div>
          </div>

          <div className="space-y-0">
            {[
              { icon: Zap, title: 'Komplett kostenlos.', desc: 'Kein Account, kein Login, keine versteckten Gebühren. Du nutzt das Tool — fertig.' },
              { icon: Eye, title: 'Deine Ware verdient mehr als eine Excel-Zeile.', desc: 'Produktfotos, EAN-Daten, MHD-Bewertung, Marktpreisvergleich — das Tool macht aus deiner Liste ein Angebot, bei dem Käufer zugreifen.' },
              { icon: Clock, title: '30 Sekunden. Nicht 3 Stunden.', desc: 'Preisliste hochladen, Preise werden automatisch recherchiert, PDF ist fertig. Du sparst dir den ganzen manuellen Aufwand.' },
              { icon: Lock, title: 'Deine Daten bleiben bei dir.', desc: 'Nichts wird öffentlich. Kein Marktplatz, keine Plattform, kein Account. Dein Angebot gehört dir.' },
            ].map((item, i) => (
              <div
                key={i}
                className={`group grid md:grid-cols-12 gap-6 md:gap-8 py-8 md:py-10 border-t border-[#e4e4e7] transition-all duration-500 ${why.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="md:col-span-1">
                  <div className="w-10 h-10 rounded-full bg-[#f7f7f8] flex items-center justify-center group-hover:bg-[#8cc63f]/10 transition-colors duration-300">
                    <item.icon size={18} className="text-[#111113] group-hover:text-[#8cc63f] transition-colors duration-300" />
                  </div>
                </div>
                <div className="md:col-span-4">
                  <h3 className="text-lg font-semibold text-[#111113] group-hover:text-[#111113] transition-colors leading-tight">{item.title}</h3>
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
      {/* KONTAKT — Dark, editorial, centered              */}
      {/* ═══════════════════════════════════════════════ */}
      <section id="kontakt-section" className="section-dark py-24 md:py-40 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="heading-display text-[clamp(2.5rem,7vw,6rem)] text-[#ffffff] mb-6">
            Bereit für ein <span className="text-[#8cc63f] font-extrabold">Update?</span>
          </h2>

          <p className="text-base text-[#ffffff]/35 font-light max-w-xl mx-auto leading-relaxed mb-12">
            Dein nächster Sonderposten verdient ein professionelles Angebot. Probier das Tool aus — kostenlos, sofort, ohne Login.
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
              E-Mail schreiben
              <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
            <button
              onClick={() => handleDemoLogin()}
              className="group border border-[#ffffff]/15 text-[#ffffff] px-8 py-4 rounded-lg font-semibold text-sm hover:border-[#ffffff]/40 transition-all duration-300 flex items-center gap-3"
            >
              <Play size={14} />
              Demo ausprobieren
            </button>
          </div>

          {/* Trust line */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <div className="w-2 h-2 rounded-full bg-[#8cc63f] animate-pulse-soft" />
            <p className="text-xs font-medium text-[#ffffff]/25">Salzburg, Österreich — seit 2024 aktiv</p>
          </div>
        </div>
      </section>
    </div>
  );
}
