// ════════════════════════════════════════════════════════════
// EmptyState — Reusable empty state with icon + CTA
// ════════════════════════════════════════════════════════════

import { LucideIcon, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon = Package,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-5">
        <Icon size={28} className="text-gray-300" />
      </div>
      <h3 className="text-lg font-black uppercase tracking-tight mb-2">{title}</h3>
      {description && <p className="text-gray-400 text-sm max-w-md mb-6">{description}</p>}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex items-center gap-2 bg-[#1a472a] text-white px-6 py-3 font-black uppercase tracking-[0.1em] text-[11px] hover:bg-[#8cc63f] hover:text-[#1a472a] transition-all"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-[#1a472a] text-white px-6 py-3 font-black uppercase tracking-[0.1em] text-[11px] hover:bg-[#8cc63f] hover:text-[#1a472a] transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
