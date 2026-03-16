import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="py-12 md:py-20 px-5 md:px-8 bg-[#0a1a0f] text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-16 mb-16">
          <div>
            <div className="font-black text-3xl text-white mb-4 tracking-tighter leading-tight uppercase">
              HELLO<br />SECOND<br /><span className="text-[#8cc63f]">/</span>RUN.
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/60 max-w-xs">
              Sonderposten-Vermittlung aus Salzburg
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-[11px] font-black uppercase tracking-widest">
            <div className="space-y-4">
              <p className="text-white/50 mb-2">Plattform</p>
              {user ? (
                <>
                  <Link to="/admin/dashboard" className="block text-white/70 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1a0f]">Dashboard</Link>
                  <Link to="/admin/deals" className="block text-white/70 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1a0f]">Deals</Link>
                  <Link to="/admin/partners" className="block text-white/70 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1a0f]">Partner</Link>
                </>
              ) : (
                <>
                  <Link to="/" className="block text-white/70 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1a0f]">Quick Angebot</Link>
                  <Link to="/about" className="block text-white/70 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1a0f]">Über Uns</Link>
                  <a href="/about#kontakt" className="block text-white/70 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1a0f]">Kontakt</a>
                </>
              )}
            </div>
            <div className="space-y-4">
              <p className="text-white/50 mb-2">Rechtliches</p>
              <Link to="/impressum" className="block text-white/70 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1a0f]">Impressum</Link>
              <Link to="/datenschutz" className="block text-white/70 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1a0f]">Datenschutz</Link>
              <Link to="/agb" className="block text-white/70 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1a0f]">AGB</Link>
            </div>
            <div className="space-y-4">
              <p className="text-white/50 mb-2">Kontakt</p>
              <a href="#" className="block text-white/70 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1a0f]">LinkedIn</a>
              <a href="#" className="block text-white/70 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1a0f]">Instagram</a>
              <a href="mailto:info@hello2ndrun.com" className="block text-white/70 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1a0f]">E-Mail</a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">
            Salzburg, Austria | {new Date().getFullYear()}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">
            Built with purpose
          </p>
        </div>
      </div>
    </footer>
  );
}
