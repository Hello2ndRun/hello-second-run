import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="mb-8">
          <span className="text-[120px] font-black text-gray-100 leading-none block">404</span>
        </div>
        <h1 className="heading-display text-3xl mb-4">Seite nicht gefunden</h1>
        <p className="text-[#5f5f6b] mb-8">
          Die Seite die du suchst existiert nicht oder wurde verschoben.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-3 bg-[#111113] text-[#ffffff] px-8 py-3.5 rounded-lg font-semibold text-sm hover:bg-[#8cc63f] hover:text-[#111113] transition-all"
        >
          <ArrowLeft size={14} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
