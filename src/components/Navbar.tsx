import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Menu, X, User, LogOut, LayoutDashboard, Handshake, Users, Play, FileText, Lightbulb } from 'lucide-react';

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
        scrolled ? 'glass border-b border-[#e4e4e7] shadow-sm' : 'bg-[#ffffff] border-b border-[#e4e4e7]/30'
      }`}>
        <div className="flex items-center gap-3">
          <Link to="/" className="font-black text-xl md:text-2xl flex-shrink-0 tracking-tighter leading-[1.1] uppercase text-black group">
            HELLO<br />SECOND<br /><span className="text-[#8cc63f] group-hover:text-[#111113] transition-colors">/</span>RUN.
          </Link>
          {isDemo && (
            <span className="bg-amber-400 text-amber-900 text-[8px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 self-start mt-1">
              Demo
            </span>
          )}
        </div>

        {/* Desktop Navigation (Logged Out) */}
        {!user && (
          <div className="hidden lg:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
            <Link to="/angebot" className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${isActive('/angebot') ? 'text-[#111113] font-semibold' : 'text-[#5f5f6b] hover:text-[#111113]'}`}>
              <FileText size={14} />
              Quick Angebot
            </Link>
            <Link to="/about" className={`text-sm font-medium transition-colors ${location.pathname === '/about' ? 'text-[#111113] font-semibold' : 'text-[#5f5f6b] hover:text-[#111113]'}`}>So funktioniert's</Link>
            <a href="/#kontakt-section" className="text-sm font-medium text-[#5f5f6b] hover:text-[#111113] transition-colors">Kontakt</a>
          </div>
        )}

        {/* Desktop Navigation (Logged In) */}
        {user && (
          <div className="hidden lg:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <Link to="/admin/dashboard" className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
              location.pathname.startsWith('/admin/dashboard') ? 'text-[#111113] bg-[#8cc63f]/10' : 'text-gray-600 hover:text-[#111113]'
            }`}>
              <LayoutDashboard size={14} />
              Dashboard
            </Link>
            <Link to="/admin/deals" className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
              location.pathname.startsWith('/admin/deals') ? 'text-[#111113] bg-[#8cc63f]/10' : 'text-gray-600 hover:text-[#111113]'
            }`}>
              <Handshake size={14} />
              Deals
            </Link>
            <Link to="/admin/partners" className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
              location.pathname.startsWith('/admin/partners') ? 'text-[#111113] bg-[#8cc63f]/10' : 'text-gray-600 hover:text-[#111113]'
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
                  <div className="w-8 h-8 bg-[#8cc63f]/10 rounded-lg flex items-center justify-center">
                    <User size={16} className="text-[#111113]" />
                  </div>
                )}
                <span className="text-sm font-medium text-[#5f5f6b]">{user.displayName?.split(' ')[0]}</span>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-2 bg-[#111113] text-[#ffffff] px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#8cc63f] hover:text-[#111113] transition-all">
                <LogOut size={12} />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={handleDemoLogin} className="flex items-center gap-2 bg-[#8cc63f] text-[#111113] px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#111113] hover:text-[#ffffff] transition-all">
                <Play size={12} />
                Demo
              </button>
              <button onClick={handleLogin} disabled={isLoggingIn} className="bg-[#111113] text-[#ffffff] px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#8cc63f] hover:text-[#111113] transition-all disabled:opacity-50">
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
      <div className={`fixed top-0 right-0 w-80 max-w-[85vw] h-full z-50 bg-[#ffffff] shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#111113]">Menu</span>
              {isDemo && <span className="bg-amber-400 text-amber-900 text-[8px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5">Demo</span>}
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
              <X size={20} />
            </button>
          </div>

          {!user ? (
            <div className="space-y-6 flex-grow">
              <Link to="/angebot" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-medium text-black py-2">
                <FileText size={16} className="text-[#8cc63f]" />
                Quick Angebot
              </Link>
              <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-medium text-black py-2">
                <Handshake size={16} className="text-[#8cc63f]" />
                So funktioniert's
              </Link>
              <a href="/#kontakt-section" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-medium text-black py-2 pl-7">Kontakt</a>
              <div className="pt-6 border-t border-gray-100 space-y-3">
                <button onClick={() => { handleDemoLogin(); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-center gap-2 bg-[#8cc63f] text-[#111113] px-8 py-3.5 rounded-lg font-semibold text-sm hover:bg-[#111113] hover:text-[#ffffff] transition-all">
                  <Play size={12} />
                  Demo starten
                </button>
                <button onClick={handleLogin} disabled={isLoggingIn} className="w-full bg-[#111113] text-[#ffffff] px-8 py-3.5 rounded-lg font-semibold text-sm hover:bg-[#8cc63f] hover:text-[#111113] transition-all disabled:opacity-50">
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
                  <div className="w-12 h-12 bg-[#8cc63f]/10 rounded-lg flex items-center justify-center">
                    <User size={20} className="text-[#111113]" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-[#111113]">{user.displayName}</p>
                  <p className="text-[10px] font-bold text-gray-400">{user.email}</p>
                </div>
              </div>
              <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-medium text-black py-2">
                <LayoutDashboard size={16} className="text-[#8cc63f]" />
                Dashboard
              </Link>
              <Link to="/admin/deals" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-medium text-black py-2">
                <Handshake size={16} className="text-[#8cc63f]" />
                Deals
              </Link>
              <Link to="/admin/partners" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-medium text-black py-2">
                <Users size={16} className="text-[#8cc63f]" />
                Partner
              </Link>
              <div className="pt-6 border-t border-gray-100 mt-auto">
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-[#111113] text-[#ffffff] px-8 py-3.5 rounded-lg font-semibold text-sm hover:bg-[#8cc63f] hover:text-[#111113] transition-all">
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
