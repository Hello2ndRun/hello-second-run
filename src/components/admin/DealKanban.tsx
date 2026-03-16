// ════════════════════════════════════════════════════════════
// Deal Kanban Board — Drag-free Pipeline-Ansicht
// ════════════════════════════════════════════════════════════

import { useNavigate } from 'react-router-dom';
import { Handshake } from 'lucide-react';
import { DEAL_STATUS_LABELS, DEAL_STATUS_ORDER } from '../../types';
import type { Deal, DealStatus, Partner } from '../../types';
import { formatCurrency } from '../../lib/formatters';

interface Props {
  deals: Deal[];
  partners: Partner[];
}

const COLUMN_COLORS: Record<DealStatus, string> = {
  draft: 'border-t-gray-400',
  angebot_erstellt: 'border-t-blue-500',
  angebot_gesendet: 'border-t-blue-400',
  bestellt: 'border-t-amber-500',
  bestaetigt: 'border-t-indigo-500',
  bezahlt: 'border-t-emerald-500',
  rechnung_erstellt: 'border-t-purple-500',
  abgeholt: 'border-t-teal-500',
  abgeschlossen: 'border-t-green-700',
  storniert: 'border-t-red-500',
  gespendet: 'border-t-pink-500',
};

const CARD_HOVER: Record<DealStatus, string> = {
  draft: 'hover:border-gray-300',
  angebot_erstellt: 'hover:border-blue-300',
  angebot_gesendet: 'hover:border-blue-300',
  bestellt: 'hover:border-amber-300',
  bestaetigt: 'hover:border-indigo-300',
  bezahlt: 'hover:border-emerald-300',
  rechnung_erstellt: 'hover:border-purple-300',
  abgeholt: 'hover:border-teal-300',
  abgeschlossen: 'hover:border-green-300',
  storniert: 'hover:border-red-300',
  gespendet: 'hover:border-pink-300',
};

export default function DealKanban({ deals, partners }: Props) {
  const navigate = useNavigate();

  const getPartnerName = (id: string): string =>
    partners.find(p => p.id === id)?.firmenname ?? '—';

  // Only show statuses that have deals + always show first few pipeline stages
  const visibleStatuses = DEAL_STATUS_ORDER.filter(
    status => deals.some(d => d.status === status)
  );

  // If storniert has deals, add it at the end
  if (deals.some(d => d.status === 'storniert')) {
    visibleStatuses.push('storniert');
  }

  // Ensure at least draft through bestaetigt are shown for context
  const minStatuses: DealStatus[] = ['draft', 'angebot_erstellt', 'angebot_gesendet', 'bestellt', 'bestaetigt'];
  for (const s of minStatuses) {
    if (!visibleStatuses.includes(s)) {
      const idx = DEAL_STATUS_ORDER.indexOf(s);
      visibleStatuses.splice(idx, 0, s);
    }
  }

  // Deduplicate while preserving order
  const uniqueStatuses = [...new Set(visibleStatuses)];

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3" style={{ minWidth: `${uniqueStatuses.length * 220}px` }}>
        {uniqueStatuses.map(status => {
          const columnDeals = deals.filter(d => d.status === status);
          const columnTotal = columnDeals.reduce((sum, d) => sum + d.subtotalNetto, 0);

          return (
            <div
              key={status}
              className={`flex-1 min-w-[200px] max-w-[260px] bg-gray-50/50 border-t-[3px] ${COLUMN_COLORS[status]} rounded-sm`}
            >
              {/* Column Header */}
              <div className="px-3 py-2.5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-600">
                    {DEAL_STATUS_LABELS[status]}
                  </h4>
                  <span className="text-[9px] font-bold text-gray-400 bg-white px-1.5 py-0.5 rounded-sm">
                    {columnDeals.length}
                  </span>
                </div>
                {columnTotal > 0 && (
                  <p className="text-[10px] font-mono font-bold text-gray-400 mt-0.5">
                    {formatCurrency(columnTotal)}
                  </p>
                )}
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 min-h-[100px]">
                {columnDeals.length === 0 ? (
                  <div className="flex items-center justify-center h-16 text-gray-300">
                    <Handshake size={16} />
                  </div>
                ) : (
                  columnDeals.map(deal => (
                    <button
                      key={deal.id}
                      onClick={() => navigate(`/admin/deals/${deal.id}`)}
                      className={`w-full text-left bg-white border border-gray-100 p-3 transition-all cursor-pointer shadow-sm hover:shadow-md ${CARD_HOVER[status]}`}
                    >
                      <p className="text-[10px] font-mono font-bold text-gray-500">{deal.id}</p>
                      <p className="text-xs font-bold text-gray-900 mt-1 truncate">
                        {getPartnerName(deal.verkaeuferId)}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        → {getPartnerName(deal.kaeuferId)}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-mono font-bold text-[#1a472a]">
                          {formatCurrency(deal.subtotalNetto)}
                        </span>
                        <span className="text-[9px] font-bold text-gray-300">
                          {formatCurrency(deal.provisionAmount)}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
