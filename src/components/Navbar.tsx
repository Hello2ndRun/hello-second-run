import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Menu, X, User, LogOut, LayoutDashboard, Handshake, Users, Play } from 'lucide-react';

export default function Navbar() {
  const { user, isDemo, login, loginDemo, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setLoginError('');
    try {
      await login();
      navigate('/admin/dashboard');
    } catch (error: any) {
      if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
        setLoginError('Login failed. Try Demo Mode.');
      } else {
        setLoginError('Popup closed. Try Demo Mode.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDemoLogin = () => {
    loginDemo();
    navigate('/admin/dashboard');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className={`fixed w-full z-50 px-6 md:px-12 py-3 flex justify-between items-center transition-all duration-300 ${
        scrolled ? 'glass border-b border-gray-200/50 shadow-sm' : 'bg-white border-b border-gray-100'
      }`}>
        <div className="flex items-center gap-3">
          <Link to="/" className="font-black text-xl md:text-2xl flex-shrink-0 tracking-tighter leading-[1.1] uppercase text-black group">
            HELLO<br />SECOND<br /><span className="text-[#8cc63f] group-hover:text-[#1a472a] transition-colors">/</span>RUN.
          </Link>
          {isDemo && (
            <span className="bg-amber-400 text-amber-900 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 self-start mt-1">
              Demo
            </span>
          )}
        </div>

        {/* Desktop Navigation (Logged Out) */}
        {!user && (
          <div className="hidden lg:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
            <a href="/#vision" className="font-black text-[11px] uppercase tracking-[0.15em] text-black hover:text-[#8cc63f] transition-colors">Vision</a>
            <a href="/#how" className="font-black text-[11px] uppercase tracking-[0.15em] text-black hover:text-[#8cc63f] transition-colors">So funktioniert's</a>
            <a href="/#kontakt" className="font-black text-[11px] uppercase tracking-[0.15em] text-black hover:text-[#8cc63f] transition-colors">Kontakt</a>
          </div>
        )}

        {/* Desktop Navigation (Logged In) */}
        {user && (
          <div className="hidden lg:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <Link to="/admin/dashboard" className={`flex items-center gap-2 px-4 py-2 font-black text-[11px] uppercase tracking-[0.15em] transition-all ${
              location.pathname.startsWith('/admin/dashboard') ? 'text-[#1a472a] bg-[#8cc63f]/10' : 'text-gray-600 hover:text-[#1a472a]'
            }`}>
              <LayoutDashboard size={14} />
              Dashboard
            </Link>
            <Link to="/admin/deals" className={`flex items-center gap-2 px-4 py-2 font-black text-[11px] uppercase tracking-[0.15em] transition-all ${
              location.pathname.startsWith('/admin/deals') ? 'text-[#1a472a] bg-[#8cc63f]/10' : 'text-gray-600 hover:text-[#1a472a]'
            }`}>
              <Handshake size={14} />
              Deals
            </Link>
            <Link to="/admin/partners" className={`flex items-center gap-2 px-4 py-2 font-black text-[11px] uppercase tracking-[0.15em] transition-all ${
              location.pathname.startsWith('/admin/partners') ? 'text-[#1a472a] bg-[#8cc63f]/10' : 'text-gray-600 hover:text-[#1a472a]'
            }`}>
              <Users size={14} />
              Partner
            </Link>
          </div>
        )}

        {/* Desktop Right Actions */}
        <div className="hidden lg:flex items-center gap-x-6">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full ring-2 ring-[#8cc63f]/30" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 bg-[#8cc63f]/10 rounded-full flex items-center justify-center">
                    <User size={16} className="text-[#1a472a]" />
                  </div>
                )}
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-600">{user.displayName?.split(' ')[0]}</span>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-2 bg-[#1a472a] text-white px-6 py-3 font-black uppercase tracking-[0.1em] text-[11px] hover:bg-[#8cc63f] hover:text-[#1a472a] transition-all">
                <LogOut size={12} />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={handleDemoLogin} className="flex items-center gap-2 bg-[#8cc63f] text-[#1a472a] px-6 py-3.5 font-black uppercase tracking-[0.1em] text-[11px] hover:bg-[#1a472a] hover:text-white transition-all">
                <Play size={12} />
                Demo
              </button>
              <button onClick={handleLogin} disabled={isLoggingIn} className="bg-[#1a472a] text-white px-6 py-3.5 font-black uppercase tracking-[0.1em] text-[11px] hover:bg-[#8cc63f] hover:text-[#1a472a] transition-all disabled:opacity-50">
                {isLoggingIn ? '...' : 'Login'}
              </button>
              {loginError && <span className="text-red-500 text-[10px] absolute top-full mt-1 right-12">{loginError}</span>}
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden p-2 text-black"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Slide-out Menu */}
      <div className={`fixed top-0 right-0 w-80 max-w-[85vw] h-full z-50 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm uppercase tracking-widest text-[#1a472a]">Menu</span>
              {isDemo && <span className="bg-amber-400 text-amber-900 text-[8px] font-black uppercase tracking-widest px-2 py-0.5">Demo</span>}
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
              <X size={20} />
            </button>
          </div>

          {!user ? (
            <div className="space-y-6 flex-grow">
              <a href="/#vision" onClick={() => setIsMobileMenuOpen(false)} className="block font-black text-[13px] uppercase tracking-[0.15em] text-black py-2">Vision</a>
              <a href="/#how" onClick={() => setIsMobileMenuOpen(false)} className="block font-black text-[13px] uppercase tracking-[0.15em] text-black py-2">So funktioniert's</a>
              <a href="/#kontakt" onClick={() => setIsMobileMenuOpen(false)} className="block font-black text-[13px] uppercase tracking-[0.15em] text-black py-2">Kontakt</a>
              <div className="pt-6 border-t border-gray-100 space-y-3">
                <button onClick={() => { handleDemoLogin(); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-center gap-2 bg-[#8cc63f] text-[#1a472a] px-8 py-4 font-black uppercase tracking-[0.1em] text-[11px] hover:bg-[#1a472a] hover:text-white transition-all">
                  <Play size={12} />
                  Demo starten
                </button>
                <button onClick={handleLogin} disabled={isLoggingIn} className="w-full bg-[#1a472a] text-white px-8 py-4 font-black uppercase tracking-[0.1em] text-[11px] hover:bg-[#8cc63f] hover:text-[#1a472a] transition-all disabled:opacity-50">
                  {isLoggingIn ? '...' : 'Google Login'}
                </button>
                {loginError && <span className="text-red-500 text-[10px] block mt-2 text-center">{loginError}</span>}
              </div>
            </div>
          ) : (
            <div className="space-y-6 flex-grow flex flex-col">
              <div className="flex items-center gap-3 pb-6 border-b border-gray-100">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-12 h-12 rounded-full ring-2 ring-[#8cc63f]/30" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 bg-[#8cc63f]/10 rounded-full flex items-center justify-center">
                    <User size={20} className="text-[#1a472a]" />
                  </div>
                )}
                <div>
                  <p className="text-[13px] font-black uppercase tracking-widest text-black">{user.displayName}</p>
                  <p className="text-[10px] font-bold text-gray-400">{user.email}</p>
                </div>
              </div>
              <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 font-black text-[13px] uppercase tracking-[0.15em] text-black py-2">
                <LayoutDashboard size={16} className="text-[#8cc63f]" />
                Dashboard
              </Link>
              <Link to="/admin/deals" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 font-black text-[13px] uppercase tracking-[0.15em] text-black py-2">
                <Handshake size={16} className="text-[#8cc63f]" />
                Deals
              </Link>
              <Link to="/admin/partners" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 font-black text-[13px] uppercase tracking-[0.15em] text-black py-2">
                <Users size={16} className="text-[#8cc63f]" />
                Partner
              </Link>
              <div className="pt-6 border-t border-gray-100 mt-auto">
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-[#1a472a] text-white px-8 py-4 font-black uppercase tracking-[0.1em] text-[11px] hover:bg-[#8cc63f] hover:text-[#1a472a] transition-all">
                  <LogOut size={12} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
