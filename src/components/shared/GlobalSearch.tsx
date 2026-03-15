// ================================================================
// GlobalSearch — Ctrl+K powered cross-entity search overlay
// ================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Handshake, Users, FileText, ArrowRight, Command } from 'lucide-react';
import { dealsCollection, partnersCollection, documentsCollection } from '../../lib/demoStore';
import { DEAL_STATUS_LABELS } from '../../types';
import type { Deal, Partner, GeneratedDocument } from '../../types';
import { formatCurrency } from '../../lib/formatters';

interface SearchResult {
  type: 'deal' | 'partner' | 'document';
  id: string;
  title: string;
  subtitle: string;
  path: string;
}

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ═══ Ctrl+K listener ═══
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // ═══ Search logic ═══
  const getResults = useCallback((): SearchResult[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search deals
    const deals = dealsCollection.getAll();
    deals.forEach((d: Deal) => {
      const seller = partnersCollection.getById(d.verkaeuferId);
      const buyer = partnersCollection.getById(d.kaeuferId);
      const searchable = `${d.id} ${seller?.firmenname || ''} ${buyer?.firmenname || ''} ${d.angebotNr || ''} ${DEAL_STATUS_LABELS[d.status]}`.toLowerCase();
      if (searchable.includes(q)) {
        results.push({
          type: 'deal',
          id: d.id,
          title: `${d.id} — ${formatCurrency(d.subtotalNetto)}`,
          subtitle: `${seller?.firmenname || '—'} → ${buyer?.firmenname || '—'} · ${DEAL_STATUS_LABELS[d.status]}`,
          path: `/admin/deals/${d.id}`,
        });
      }
    });

    // Search partners
    const partners = partnersCollection.getAll();
    partners.forEach((p: Partner) => {
      const searchable = `${p.firmenname} ${p.kontaktperson} ${p.email} ${p.ort} ${p.uidNummer}`.toLowerCase();
      if (searchable.includes(q)) {
        results.push({
          type: 'partner',
          id: p.id,
          title: p.firmenname,
          subtitle: `${p.kontaktperson} · ${p.ort}, ${p.land}`,
          path: `/admin/partners/${p.id}`,
        });
      }
    });

    // Search documents
    const docs = documentsCollection.getAll();
    docs.forEach((d: GeneratedDocument) => {
      const searchable = `${d.nr} ${d.ausstellerName} ${d.empfaengerName} ${d.dealId} ${d.type}`.toLowerCase();
      if (searchable.includes(q)) {
        results.push({
          type: 'document',
          id: d.id,
          title: `${d.nr} — ${d.type.toUpperCase()}`,
          subtitle: `${d.ausstellerName} → ${d.empfaengerName}`,
          path: `/admin/documents`,
        });
      }
    });

    return results.slice(0, 10);
  }, [query]);

  const results = getResults();

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    navigate(result.path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const ICONS = {
    deal: Handshake,
    partner: Users,
    document: FileText,
  };

  const TYPE_LABELS = {
    deal: 'Deal',
    partner: 'Partner',
    document: 'Dokument',
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Search Panel */}
      <div className="relative w-full max-w-xl mx-4 bg-white shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <Search size={18} className="text-gray-300 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Deals, Partner, Dokumente suchen..."
            className="flex-1 text-sm outline-none placeholder:text-gray-300"
            autoComplete="off"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-[10px] font-mono font-bold text-gray-400 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {query.trim() && (
          <div className="max-h-[50vh] overflow-y-auto">
            {results.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-gray-400">Keine Ergebnisse für &ldquo;{query}&rdquo;</p>
              </div>
            ) : (
              <div className="py-2">
                {results.map((result, i) => {
                  const Icon = ICONS[result.type];
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-all ${
                        i === selectedIndex ? 'bg-[#f7f9f7]' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${
                        result.type === 'deal' ? 'bg-blue-50 text-blue-600' :
                        result.type === 'partner' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-purple-50 text-purple-600'
                      }`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{result.title}</p>
                        <p className="text-[11px] text-gray-400 truncate">{result.subtitle}</p>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-300 flex-shrink-0">
                        {TYPE_LABELS[result.type]}
                      </span>
                      {i === selectedIndex && <ArrowRight size={12} className="text-[#1a472a] flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer hint */}
        {!query.trim() && (
          <div className="px-5 py-6 text-center">
            <p className="text-xs text-gray-300">Tippe um zu suchen — Deals, Partner, Dokumente</p>
          </div>
        )}
      </div>
    </div>
  );
}
