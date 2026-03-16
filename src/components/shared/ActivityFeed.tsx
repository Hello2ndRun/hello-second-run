import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Handshake, UserPlus, FileText, Copy, Edit, X, Heart, CheckCircle } from 'lucide-react';
import { activitiesCollection, markAllActivitiesRead } from '../../lib/demoStore';
import type { ActivityEvent, ActivityType } from '../../types';

const ICON_MAP: Record<ActivityType, typeof Handshake> = {
  deal_created: Handshake,
  deal_status_changed: Edit,
  deal_cloned: Copy,
  partner_created: UserPlus,
  document_generated: FileText,
  partner_updated: UserPlus,
  donation_created: Heart,
  donation_completed: CheckCircle,
};

const COLOR_MAP: Record<ActivityType, string> = {
  deal_created: 'bg-blue-50 text-blue-600',
  deal_status_changed: 'bg-amber-50 text-amber-600',
  deal_cloned: 'bg-purple-50 text-purple-600',
  partner_created: 'bg-emerald-50 text-emerald-600',
  document_generated: 'bg-indigo-50 text-indigo-600',
  partner_updated: 'bg-teal-50 text-teal-600',
  donation_created: 'bg-pink-50 text-pink-600',
  donation_completed: 'bg-red-50 text-red-600',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return 'Gerade eben';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Vor ${diffMin} Min.`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `Vor ${diffHrs} Std.`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Gestern';
  if (diffDays < 7) return `Vor ${diffDays} Tagen`;
  return new Date(dateStr).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit' });
}

interface Props {
  collapsed?: boolean;
}

export default function ActivityFeed({ collapsed }: Props) {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return activitiesCollection.subscribe(null, setActivities);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const sorted = [...activities]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  const unreadCount = activities.filter(a => !a.read).length;

  const handleOpen = () => {
    setOpen(!open);
  };

  const handleMarkRead = () => {
    markAllActivitiesRead();
  };

  const handleClick = (activity: ActivityEvent) => {
    if (activity.dealId) {
      navigate(`/admin/deals/${activity.dealId}`);
    } else if (activity.partnerId) {
      navigate(`/admin/partners/${activity.partnerId}`);
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className={`relative flex items-center gap-2 px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 transition-all ${
          collapsed ? 'justify-center' : ''
        }`}
        title="Aktivitäten"
      >
        <Bell size={18} className="flex-shrink-0" />
        {!collapsed && <span className="text-[12px] font-bold">Aktivitäten</span>}
        {unreadCount > 0 && (
          <span className="absolute top-1 left-5 min-w-[16px] h-4 bg-[#8cc63f] text-[#1a472a] text-[9px] font-black rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-[340px] bg-white border border-gray-200 shadow-xl z-50 max-h-[480px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#1a472a]">Aktivitäten</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkRead}
                  className="text-[9px] font-bold text-[#8cc63f] hover:text-[#1a472a] uppercase tracking-wider transition-colors"
                >
                  Alle gelesen
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-300 hover:text-gray-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {sorted.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={24} className="mx-auto text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">Noch keine Aktivitäten</p>
              </div>
            ) : (
              sorted.map(activity => {
                const Icon = ICON_MAP[activity.type] || Bell;
                const colorClass = COLOR_MAP[activity.type] || 'bg-gray-50 text-gray-600';

                return (
                  <button
                    key={activity.id}
                    onClick={() => handleClick(activity)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                      !activity.read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className={`w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5 ${colorClass}`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 leading-snug">{activity.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">{activity.detail}</p>
                      <p className="text-[9px] text-gray-300 mt-1">{timeAgo(activity.createdAt)}</p>
                    </div>
                    {!activity.read && (
                      <div className="w-2 h-2 bg-[#8cc63f] rounded-full flex-shrink-0 mt-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
