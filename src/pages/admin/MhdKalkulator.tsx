import { useState, useMemo } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import MhdBadge from '../../components/shared/MhdBadge';
import { calculateMhdPrice, getMhdStatus, getMhdColorClasses } from '../../lib/mhdCalculator';
import { formatCurrency, formatPercent } from '../../lib/formatters';

export default function MhdKalkulator() {
  const [ek, setEk] = useState<number>(0.59);
  const [uvp, setUvp] = useState<number>(1.49);
  const [mhd, setMhd] = useState<string>('');

  const result = useMemo(() => {
    if (!mhd || ek <= 0 || uvp <= 0) return null;
    return calculateMhdPrice(ek, uvp, mhd);
  }, [ek, uvp, mhd]);

  const activeStatus = mhd ? getMhdStatus(mhd) : null;

  // Tier definitions for display
  const tiers = [
    { key: 'green' as const, label: 'Gruen', range: '180+ Tage', pctRange: '40-50% vom UVP', minPct: 0.40, maxPct: 0.50 },
    { key: 'yellow' as const, label: 'Gelb', range: '60-179 Tage', pctRange: '25-40% vom UVP', minPct: 0.25, maxPct: 0.40 },
    { key: 'red' as const, label: 'Rot', range: '<60 Tage', pctRange: '15-25% vom UVP', minPct: 0.15, maxPct: 0.25 },
  ];

  // Editable VK
  const [customVk, setCustomVk] = useState<number | null>(null);
  const effectiveVk = customVk ?? (result?.suggestedVkMid ?? 0);
  const customMarginEur = Math.round((effectiveVk - ek) * 100) / 100;
  const customMarginPct = effectiveVk > 0 ? Math.round((customMarginEur / effectiveVk) * 10000) / 100 : 0;
  const rabattVsUvp = uvp > 0 ? Math.round((1 - effectiveVk / uvp) * 10000) / 100 : 0;

  // Reset custom VK when result changes
  const prevMid = result?.suggestedVkMid;
  if (customVk !== null && prevMid !== undefined && Math.abs(customVk - prevMid) < 0.001) {
    // keep custom
  }

  return (
    <div>
      <PageHeader
        title="MHD-Kalkulator"
        subtitle="Preisempfehlung basierend auf Mindesthaltbarkeitsdatum"
        breadcrumbs={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'MHD-Kalkulator' },
        ]}
        actions={
          <div className="flex items-center gap-2 text-[#1a472a]">
            <Calculator size={20} />
          </div>
        }
      />

      {/* Input Fields */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-[#1a472a] mb-2">
              Einkaufspreis (EK)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={ek}
              onChange={e => setEk(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-50 border border-gray-200 py-2.5 px-3 text-lg font-mono font-bold focus:border-[#1a472a] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-[#1a472a] mb-2">
              UVP (Unverb. Preisempfehlung)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={uvp}
              onChange={e => setUvp(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-50 border border-gray-200 py-2.5 px-3 text-lg font-mono font-bold focus:border-[#1a472a] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-[#1a472a] mb-2">
              MHD (Mindesthaltbarkeit)
            </label>
            <input
              type="date"
              value={mhd}
              onChange={e => { setMhd(e.target.value); setCustomVk(null); }}
              className="w-full bg-gray-50 border border-gray-200 py-2.5 px-3 text-lg font-mono font-bold focus:border-[#1a472a] focus:outline-none"
            />
            {mhd && (
              <div className="mt-2">
                <MhdBadge mhd={mhd} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tier Zones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {tiers.map(tier => {
          const isActive = activeStatus === tier.key;
          const colors = getMhdColorClasses(tier.key);
          const vkMin = Math.max(Math.round(uvp * tier.minPct * 100) / 100, ek);
          const vkMax = Math.round(uvp * tier.maxPct * 100) / 100;

          return (
            <div
              key={tier.key}
              className={`border-2 p-5 transition-all ${
                isActive
                  ? `${colors.bg} border-current ${colors.text} ring-2 ring-offset-1`
                  : 'bg-white border-gray-200'
              }`}
              style={isActive ? { borderColor: tier.key === 'green' ? '#2E8B57' : tier.key === 'yellow' ? '#E8A317' : '#DC3545' } : undefined}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-3 h-3 rounded-full ${colors.dot}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {tier.label} — {tier.range}
                </span>
                {isActive && (
                  <span className="ml-auto text-[9px] font-black uppercase bg-white/60 px-2 py-0.5 rounded">
                    Aktiv
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-2">{tier.pctRange}</p>
              <p className="text-sm font-bold">
                VK-Spanne: {formatCurrency(vkMin)} – {formatCurrency(vkMax)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Result Section */}
      {result && mhd && (
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-[#1a472a]" />
            <h2 className="text-sm font-black uppercase tracking-widest text-[#1a472a]">Kalkulation</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">VK-Empfehlung</p>
              <p className="text-lg font-black font-mono">
                {formatCurrency(result.suggestedVkMin)} – {formatCurrency(result.suggestedVkMax)}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">VK (editierbar)</p>
              <input
                type="number"
                step="0.01"
                min="0"
                value={customVk ?? result.suggestedVkMid}
                onChange={e => setCustomVk(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-50 border border-gray-200 py-2 px-3 text-lg font-mono font-bold focus:border-[#1a472a] focus:outline-none"
              />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Marge</p>
              <p className={`text-lg font-black font-mono ${customMarginEur >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(customMarginEur)} ({formatPercent(customMarginPct)})
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Rabatt vs. UVP</p>
              <p className="text-lg font-black font-mono text-[#1a472a]">
                {formatPercent(rabattVsUvp)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
