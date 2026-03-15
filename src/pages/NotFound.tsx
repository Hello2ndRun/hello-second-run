import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="mb-8">
          <span className="text-[120px] font-black text-gray-100 leading-none block">404</span>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight mb-4">Page not found</h1>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-3 bg-[#1a472a] text-white px-8 py-4 font-black uppercase tracking-[0.1em] text-[11px] hover:bg-[#8cc63f] hover:text-[#1a472a] transition-all"
        >
          <ArrowLeft size={14} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
