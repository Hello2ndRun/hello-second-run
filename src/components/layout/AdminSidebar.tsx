import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import {
  LayoutDashboard, Handshake, PlusCircle, Calculator,
  Users, UserCog, FileText, Settings,
  ChevronLeft, ChevronRight, LogOut, X,
  Heart,
} from 'lucide-react';
import ActivityFeed from '../shared/ActivityFeed';

interface Props {
  open: boolean;
  onToggle: () => void;
  onMobileClose?: () => void;
  isMobile?: boolean;
}

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  adminOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Übersicht',
    items: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Vermittlung',
    items: [
      { to: '/admin/deals', icon: Handshake, label: 'Deals' },
      { to: '/admin/deals/new', icon: PlusCircle, label: 'Neuer Deal' },
      { to: '/admin/kalkulator', icon: Calculator, label: 'MHD-Kalkulator' },
    ],
  },
  {
    label: 'Netzwerk',
    items: [
      { to: '/admin/partners', icon: Users, label: 'Partner' },
    ],
  },
  {
    label: 'Social Impact',
    items: [
      { to: '/admin/spenden', icon: Heart, label: 'Spenden' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/team', icon: UserCog, label: 'Team', adminOnly: true },
      { to: '/admin/documents', icon: FileText, label: 'Dokumente' },
      { to: '/admin/settings', icon: Settings, label: 'Einstellungen', adminOnly: true },
    ],
  },
];

export default function AdminSidebar({ open, onToggle, onMobileClose, isMobile }: Props) {
  const { user, userRole, logout, isDemo } = useAuth();
  const navigate = useNavigate();
  const isAdmin = userRole === 'admin';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className={`fixed top-0 left-0 h-screen bg-[#1a472a] text-white z-40 transition-all duration-300 flex flex-col ${isMobile ? 'w-72' : open ? 'w-64' : 'w-16'}`}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/10">
        {open ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#8cc63f] rounded-sm flex items-center justify-center">
                <span className="text-[#1a472a] font-black text-xs">H</span>
              </div>
              <div className="leading-none">
                <span className="text-[11px] font-black uppercase tracking-[0.15em]">HELLO</span>
                <br />
                <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#8cc63f]">SECOND/RUN</span>
              </div>
            </div>
            {isMobile && onMobileClose && (
              <button onClick={onMobileClose} className="p-1.5 text-white/50 hover:text-white transition-colors">
                <X size={18} />
              </button>
            )}
          </div>
        ) : (
          <div className="w-8 h-8 bg-[#8cc63f] rounded-sm flex items-center justify-center mx-auto">
            <span className="text-[#1a472a] font-black text-xs">H</span>
          </div>
        )}
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto py-4">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(item => !item.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;
          return (
          <div key={group.label} className="mb-4">
            {open && (
              <p className="px-4 mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                {group.label}
              </p>
            )}
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-[12px] font-bold transition-all ${
                    isActive
                      ? 'bg-[#8cc63f]/20 text-[#8cc63f] border-r-2 border-[#8cc63f]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  } ${!open ? 'justify-center' : ''}`
                }
                title={!open ? item.label : undefined}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {open && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
          );
        })}
      </nav>

      {/* Activity Feed */}
      <div className="border-t border-white/10 px-1 py-2">
        <ActivityFeed collapsed={!open} />
      </div>

      {/* User + Toggle */}
      <div className="border-t border-white/10 p-3">
        {open && user && (
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-8 h-8 bg-[#8cc63f]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[#8cc63f] font-black text-[10px]">
                {user.displayName?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold truncate">{user.displayName}</p>
              {isDemo && <p className="text-[9px] text-[#8cc63f] font-bold uppercase tracking-widest">Demo Broker</p>}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 text-white/40 hover:text-white transition-colors py-2 px-2 rounded text-[11px] font-bold ${!open ? 'mx-auto' : ''}`}
            title="Abmelden"
          >
            <LogOut size={16} />
            {open && <span>Abmelden</span>}
          </button>
          <button
            onClick={onToggle}
            className="ml-auto p-2 text-white/40 hover:text-white transition-colors"
            title={open ? 'Minimieren' : 'Erweitern'}
          >
            {open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
