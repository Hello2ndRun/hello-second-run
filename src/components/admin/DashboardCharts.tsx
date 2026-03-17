// ════════════════════════════════════════════════════════════
// Dashboard Charts — Pipeline Donut, Deal-Wert Bar, Provision
// ════════════════════════════════════════════════════════════

import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import type { Deal } from '../../types';
import { DEAL_STATUS_LABELS } from '../../types';
import type { DealStatus } from '../../types';
import { formatCurrency } from '../../lib/formatters';

interface Props {
  deals: Deal[];
}

// Brand colors for pipeline stages
const STATUS_COLORS: Record<string, string> = {
  draft: '#9ca3af',
  angebot_erstellt: '#3b82f6',
  angebot_gesendet: '#60a5fa',
  bestellt: '#f59e0b',
  bestaetigt: '#6366f1',
  bezahlt: '#10b981',
  rechnung_erstellt: '#8b5cf6',
  abgeholt: '#14b8a6',
  abgeschlossen: '#111113',
  storniert: '#ef4444',
};

// Custom tooltip with € formatting
function EuroTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#ffffff] border border-gray-200 shadow-lg px-3 py-2">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs font-mono font-bold" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function DashboardCharts({ deals }: Props) {
  // ═══ PIPELINE DONUT ═══
  const pipelineData = Object.entries(
    deals.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([status, count]) => ({
      name: DEAL_STATUS_LABELS[status as DealStatus] || status,
      value: count,
      color: STATUS_COLORS[status] || '#9ca3af',
    }))
    .sort((a, b) => b.value - a.value);

  // ═══ DEAL-WERT nach STATUS (Balken) ═══
  const valueByStatus = Object.entries(
    deals
      .filter(d => d.status !== 'storniert')
      .reduce((acc, d) => {
        const label = DEAL_STATUS_LABELS[d.status] || d.status;
        acc[label] = (acc[label] || 0) + d.subtotalNetto;
        return acc;
      }, {} as Record<string, number>)
  ).map(([name, dealwert]) => ({ name: name.length > 12 ? name.slice(0, 12) + '…' : name, dealwert }));

  // ═══ TOP PARTNER nach UMSATZ (Horizontal Bar) ═══
  // This needs partner names passed in, but we keep it simple with deal IDs
  const provisionByDeal = deals
    .filter(d => d.provisionAmount > 0 && d.status !== 'storniert')
    .sort((a, b) => b.provisionAmount - a.provisionAmount)
    .slice(0, 5)
    .map(d => ({
      name: d.id.replace('HSR-2026-', ''),
      provision: d.provisionAmount,
      dealwert: d.subtotalNetto,
    }));

  if (deals.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Pipeline Status Donut */}
      <div className="bg-[#ffffff] border border-gray-200 p-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#111113] mb-4">
          Pipeline-Verteilung
        </h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pipelineData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                paddingAngle={2}
                stroke="none"
              >
                {pipelineData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value} Deal${value > 1 ? 's' : ''}`, name]}
                contentStyle={{ fontSize: '11px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {pipelineData.map(entry => (
            <div key={entry.name} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-[9px] text-gray-500 font-bold">{entry.name} ({entry.value})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Deal-Wert nach Status */}
      <div className="bg-[#ffffff] border border-gray-200 p-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#111113] mb-4">
          Dealwert nach Status
        </h3>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={valueByStatus} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 9, fill: '#9ca3af' }} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9, fill: '#6b7280', fontWeight: 700 }} />
              <Tooltip content={<EuroTooltip />} />
              <Bar dataKey="dealwert" name="Dealwert" fill="#111113" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Deals nach Provision */}
      <div className="bg-[#ffffff] border border-gray-200 p-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#111113] mb-4">
          Top Deals — Provision
        </h3>
        {provisionByDeal.length === 0 ? (
          <p className="text-xs text-gray-400 mt-8 text-center">Keine Provisionen vorhanden</p>
        ) : (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={provisionByDeal} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 700 }} />
                <YAxis tickFormatter={(v) => `€${v}`} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                <Tooltip content={<EuroTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                <Bar dataKey="dealwert" name="Dealwert" fill="#111113" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="provision" name="Provision" fill="#8cc63f" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
