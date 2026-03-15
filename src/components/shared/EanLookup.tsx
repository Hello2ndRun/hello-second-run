// ================================================================
// EanLookup -- EAN barcode input with Open Food Facts API lookup
// ================================================================

import { useState } from 'react';
import { Search, Loader2, Package } from 'lucide-react';
import { lookupEan } from '../../lib/eanLookup';
import type { EanProduct } from '../../types';

interface Props {
  onProductFound: (product: EanProduct) => void;
}

export default function EanLookup({ onProductFound }: Props) {
  const [ean, setEan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [foundProduct, setFoundProduct] = useState<EanProduct | null>(null);

  const handleSearch = async () => {
    const trimmed = ean.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setFoundProduct(null);

    try {
      const product = await lookupEan(trimmed);
      if (product) {
        setFoundProduct(product);
        onProductFound(product);
      } else {
        setError('Produkt nicht gefunden');
      }
    } catch {
      setError('Fehler bei der Suche. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            value={ean}
            onChange={(e) => setEan(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="EAN eingeben (z.B. 8076800195057)"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 text-sm focus:border-[#1a472a] focus:outline-none transition-all"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !ean.trim()}
          className="inline-flex items-center gap-2 bg-[#1a472a] text-white px-5 py-2.5 font-black uppercase tracking-[0.1em] text-[11px] hover:bg-[#8cc63f] hover:text-[#1a472a] transition-all disabled:opacity-30"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Suchen
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          <Package size={16} />
          <span>{error}</span>
        </div>
      )}

      {foundProduct && (
        <div className="flex items-start gap-4 p-4 bg-white border border-gray-200">
          {foundProduct.imageUrl ? (
            <img
              src={foundProduct.imageUrl}
              alt={foundProduct.produktname}
              className="w-16 h-16 object-contain rounded bg-gray-50 flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-50 flex items-center justify-center flex-shrink-0 rounded">
              <Package size={24} className="text-gray-300" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{foundProduct.produktname}</p>
            {foundProduct.marke && (
              <p className="text-xs text-gray-500 mt-0.5">{foundProduct.marke}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
              {foundProduct.gewicht && <span>{foundProduct.gewicht}</span>}
              <span className="font-mono">{foundProduct.ean}</span>
              <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[9px] uppercase font-bold">
                {foundProduct.quelle}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
