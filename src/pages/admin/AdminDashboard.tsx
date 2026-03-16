import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
  Handshake, Users, FileText, TrendingUp,
  AlertTriangle, CheckCircle, ArrowRight, Heart,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DashboardCharts from '../../components/admin/DashboardCharts';
import { dealsCollection, partnersCollection, dealArticlesCollection } from '../../lib/demoStore';
import { getImpactStats } from '../../lib/donationService';
import { useBrokerFilter } from '../../hooks/useBrokerFilter';
import type { Deal, Partner } from '../../types';
import { DEAL_STATUS_LABELS } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';

interface DealStats {
  activeDeals: number;
  totalPartners: number;
  openOffers: number;
  revenueMediated: number;
  commissionEarned: number;
  mhdWarnings: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { filterDeals, filterPartners, isBroker, currentBrokerUser } = useBrokerFilter();
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  const [mhdWarnings, setMhdWarnings] = useState(0);

  useEffect(() => {
    const unsubs = [
      dealsCollection.subscribe(null, setAllDeals),
      partnersCollection.subscribe(null, setAllPartners),
      dealArticlesCollection.subscribe(null, (allArticles) => {
        setMhdWarnings(allArticles.filter(a => a.mhdStatus === 'red').length);
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  // Apply broker filter
  const deals = filterDeals(allDeals);
  const partners = filterPartners(allPartners);

  // Calculate stats from broker-filtered data
  const closedStatuses = new Set(['abgeschlossen', 'storniert']);
  const offerStatuses = new Set(['angebot_erstellt', 'angebot_gesendet']);
  const stats: DealStats = {
    activeDeals: deals.filter(d => !closedStatuses.has(d.status)).length,
    totalPartners: partners.length,
    openOffers: deals.filter(d => offerStatuses.has(d.status)).length,
    revenueMediated: deals.filter(d => d.status === 'abgeschlossen').reduce((sum, d) => sum + d.subtotalNetto, 0),
    commissionEarned: deals.filter(d => d.status === 'abgeschlossen').reduce((sum, d) => sum + d.provisionAmount, 0),
    mhdWarnings,
  };

  const getPartnerName = (id: string): string => {
    const p = partners.find(partner => partner.id === id);
    return p ? p.firmenname : id;
  };

  const getStatusBadgeStyle = (status: string): string => {
    switch (status) {
      case 'draft': return 'bg-gray-50 text-gray-500 border-gray-200';
      case 'angebot_erstellt': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'angebot_gesendet': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'bestellt': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'bestaetigt': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'bezahlt': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rechnung_erstellt': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'abgeholt': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'abgeschlossen': return 'bg-green-50 text-green-700 border-green-200';
      case 'storniert': return 'bg-red-50 text-red-600 border-red-200';
      case 'gespendet': return 'bg-pink-50 text-pink-600 border-pink-200';
      default: return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  // Pipeline value = sum of all non-closed deals
  const pipelineValue = deals
    .filter(d => d.status !== 'abgeschlossen' && d.status !== 'storniert')
    .reduce((sum, d) => sum + d.subtotalNetto, 0);

  // Average provision rate across all deals
  const avgProvisionRate = deals.length > 0
    ? deals.reduce((sum, d) => sum + d.provisionRate, 0) / deals.length
    : 0;

  const statCards = [
    {
      label: 'Aktive Deals',
      value: stats.activeDeals,
      icon: Handshake,
      color: 'text-[#1a472a]',
      bg: 'bg-[#1a472a]/10',
    },
    {
      label: 'Pipeline-Wert',
      value: formatCurrency(pipelineValue),
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Offene Angebote',
      value: stats.openOffers,
      icon: FileText,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Umsatz vermittelt',
      value: formatCurrency(stats.revenueMediated),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Provision verdient',
      value: formatCurrency(stats.commissionEarned),
      icon: CheckCircle,
      color: 'text-[#8cc63f]',
      bg: 'bg-[#8cc63f]/10',
    },
    {
      label: 'MHD-Warnungen',
      value: stats.mhdWarnings,
      icon: AlertTriangle,
      color: stats.mhdWarnings > 0 ? 'text-red-600' : 'text-gray-400',
      bg: stats.mhdWarnings > 0 ? 'bg-red-50' : 'bg-gray-50',
    },
  ];

  const recentDeals = [...deals]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const activeOffers = deals.filter(
    d => d.status === 'angebot_erstellt' || d.status === 'angebot_gesendet'
  );

  const getDaysUntilAbholtermin = (deal: Deal): string => {
    if (!deal.abholtermin) return '--';
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(deal.abholtermin);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Überfällig';
    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return '1 Tag';
    return `${diffDays} Tage`;
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={isBroker && currentBrokerUser ? `Hallo ${currentBrokerUser.name} — Dein Bereich` : 'Willkommen im HELLO SECOND/RUN Vermittler-Bereich'}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map(card => (
          <div
            key={card.label}
            className="bg-white border border-gray-200 p-4 hover:border-[#1a472a]/20 transition-all group"
          >
            <div className={`w-9 h-9 ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon size={18} className={card.color} />
            </div>
            <p className="text-2xl font-black">{card.value}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mt-1 group-hover:text-[#1a472a] transition-colors">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts deals={deals} />

      {/* Social Impact Banner */}
      {(() => {
        const impact = getImpactStats();
        if (impact.totalDonations === 0) return null;
        return (
          <Link
            to="/admin/spenden"
            className="block mb-6 bg-gradient-to-r from-red-50 via-pink-50 to-white border border-red-100 p-5 hover:border-red-200 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-200 transition-colors">
                  <Heart size={22} className="text-red-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#0a1a0f] uppercase tracking-tight">Social Impact</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className="font-bold text-red-500">{impact.totalMahlzeiten.toLocaleString('de-AT')} Mahlzeiten</span> gerettet
                    · {impact.totalGewichtKg.toLocaleString('de-AT')} kg gespendet
                    · {impact.totalDonations} Spenden an {impact.partnerCount} Partner
                  </p>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-300 group-hover:text-red-400 transition-colors" />
            </div>
          </Link>
        );
      })()}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Letzte Deals */}
        <div className="bg-white border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-sm font-black uppercase tracking-tight">Letzte Deals</h2>
            <Link
              to="/admin/deals"
              className="text-[10px] font-bold text-[#1a472a] hover:text-[#8cc63f] flex items-center gap-1 uppercase tracking-widest"
            >
              Alle <ArrowRight size={10} />
            </Link>
          </div>
          {recentDeals.length === 0 ? (
            <p className="p-6 text-gray-400 text-sm text-center">Keine Deals vorhanden.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentDeals.map(deal => (
                <div
                  key={deal.id}
                  onClick={() => navigate(`/admin/deals/${deal.id}`)}
                  className="flex items-center gap-4 p-4 hover:bg-[#f7f9f7] transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Handshake size={16} className="text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono text-gray-500 mb-0.5">{deal.id}</p>
                    <p className="text-sm font-bold truncate">
                      {getPartnerName(deal.verkaeuferId)} → {getPartnerName(deal.kaeuferId)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {formatDate(deal.createdAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`inline-flex items-center border font-black uppercase tracking-widest px-2 py-0.5 text-[9px] ${getStatusBadgeStyle(deal.status)}`}
                    >
                      {DEAL_STATUS_LABELS[deal.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Aktive Angebote */}
        <div className="bg-white border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-sm font-black uppercase tracking-tight">Aktive Angebote</h2>
            <Link
              to="/admin/deals"
              className="text-[10px] font-bold text-[#1a472a] hover:text-[#8cc63f] flex items-center gap-1 uppercase tracking-widest"
            >
              Alle <ArrowRight size={10} />
            </Link>
          </div>
          {activeOffers.length === 0 ? (
            <p className="p-6 text-gray-400 text-sm text-center">Keine aktiven Angebote.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {activeOffers.map(deal => (
                <div
                  key={deal.id}
                  onClick={() => navigate(`/admin/deals/${deal.id}`)}
                  className="flex items-center gap-4 p-4 hover:bg-[#f7f9f7] transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-amber-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono text-gray-500 mb-0.5">{deal.angebotNr || deal.id}</p>
                    <p className="text-sm font-bold truncate">
                      {getPartnerName(deal.kaeuferId)}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {formatCurrency(deal.subtotalNetto)} netto
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    <span
                      className={`inline-flex items-center border font-black uppercase tracking-widest px-2 py-0.5 text-[9px] ${getStatusBadgeStyle(deal.status)}`}
                    >
                      {DEAL_STATUS_LABELS[deal.status]}
                    </span>
                    {deal.abholtermin && (
                      <p className="text-[10px] text-gray-400">
                        Abholung: {getDaysUntilAbholtermin(deal)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
