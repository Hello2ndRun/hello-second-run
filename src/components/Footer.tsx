import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="py-12 md:py-20 px-6 md:px-12 bg-[#111113] text-[#ffffff]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-16 mb-16">
          <div>
            <div className="font-black text-3xl text-[#ffffff] mb-4 tracking-tighter leading-tight uppercase">
              HELLO<br />SECOND<br /><span className="text-[#8cc63f]">/</span>RUN.
            </div>
            <p className="text-xs font-medium text-[#ffffff]/40 max-w-xs">
              Das Angebots-Tool für Sonderposten
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-sm">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30 mb-2">Tool</p>
              {user ? (
                <>
                  <Link to="/admin/dashboard" className="block text-[#ffffff]/50 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113]">Dashboard</Link>
                  <Link to="/admin/deals" className="block text-[#ffffff]/50 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113]">Deals</Link>
                  <Link to="/admin/partners" className="block text-[#ffffff]/50 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113]">Partner</Link>
                </>
              ) : (
                <>
                  <Link to="/angebot" className="block text-[#ffffff]/50 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113]">Quick Angebot</Link>
                  <Link to="/about" className="block text-[#ffffff]/50 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113]">So funktioniert's</Link>
                  <a href="/#kontakt-section" className="block text-[#ffffff]/50 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113]">Kontakt</a>
                </>
              )}
            </div>
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30 mb-2">Rechtliches</p>
              <Link to="/impressum" className="block text-[#ffffff]/50 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113]">Impressum</Link>
              <Link to="/datenschutz" className="block text-[#ffffff]/50 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113]">Datenschutz</Link>
              <Link to="/agb" className="block text-[#ffffff]/50 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113]">AGB</Link>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/30 mb-2">Kontakt</p>
              <a href="#" className="block text-[#ffffff]/50 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113]">LinkedIn</a>
              <a href="#" className="block text-[#ffffff]/50 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113]">Instagram</a>
              <a href="mailto:info@hello2ndrun.com" className="block text-[#ffffff]/50 hover:text-[#8cc63f] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8cc63f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111113]">E-Mail</a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#ffffff]/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-medium text-white/30">
            Salzburg, Austria · {new Date().getFullYear()}
          </p>
          <p className="text-xs font-medium text-white/30">
            Built with purpose
          </p>
        </div>
      </div>
    </footer>
  );
}
