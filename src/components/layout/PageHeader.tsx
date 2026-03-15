import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface Breadcrumb {
  label: string;
  to?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  backTo?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, breadcrumbs, backTo, actions }: Props) {
  return (
    <div className="mb-8">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 mb-4">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-gray-300 text-xs">/</span>}
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#1a472a] transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#1a472a]">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Back link */}
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-[#1a472a] transition-colors mb-4 text-[10px] font-black uppercase tracking-widest"
        >
          <ArrowLeft size={12} />
          Zurück
        </Link>
      )}

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">{title}</h1>
          {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
