import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import Chatbot from '../Chatbot';
import GlobalSearch from '../shared/GlobalSearch';
import { Menu } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f7f7f8]">
      {/* Mobile Header Bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-[#111113] flex items-center px-4 gap-3 z-30 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-[#ffffff]/70 hover:text-[#ffffff] transition-colors"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#8cc63f] rounded-sm flex items-center justify-center">
            <span className="text-[#111113] font-bold text-[10px]">H</span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
            HELLO <span className="text-[#8cc63f]">SECOND/RUN</span>
          </span>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar: Desktop = normal, Mobile = overlay */}
      <div className={`
        lg:block
        ${mobileOpen ? 'block' : 'hidden'}
        lg:relative
        fixed inset-y-0 left-0 z-50
      `}>
        <AdminSidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onMobileClose={() => setMobileOpen(false)}
          isMobile={mobileOpen}
        />
      </div>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'} ml-0`}>
        <div className="p-4 pt-18 lg:p-8 lg:pt-8">
          {children}
        </div>
      </main>
      <Chatbot />
      <GlobalSearch />
    </div>
  );
}
