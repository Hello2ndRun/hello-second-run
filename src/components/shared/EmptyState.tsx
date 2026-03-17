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
      <div className="w-16 h-16 bg-[#f7f7f8] rounded-lg flex items-center justify-center mb-5">
        <Icon size={28} className="text-[#9394a1]" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && <p className="text-[#9394a1] text-sm max-w-md mb-6">{description}</p>}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex items-center gap-2 bg-[#111113] text-[#ffffff] px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#8cc63f] hover:text-[#111113] transition-all"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-[#111113] text-[#ffffff] px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#8cc63f] hover:text-[#111113] transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
