import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Handshake, TrendingUp, CheckCircle, Copy, Download, LayoutGrid, List, Trash2 } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/shared/DataTable';
import type { BulkAction } from '../../components/shared/DataTable';
import EmptyState from '../../components/shared/EmptyState';
import ConfirmModal from '../../components/shared/ConfirmModal';
import DealKanban from '../../components/admin/DealKanban';
import { dealsCollection, partnersCollection, dealArticlesCollection, logActivity } from '../../lib/demoStore';
import { exportDealsAsCsv, exportDealsDetailAsCsv } from '../../lib/csvExport';
import { useBrokerFilter } from '../../hooks/useBrokerFilter';
import { DEAL_STATUS_LABELS } from '../../types';
import type { Deal, DealArticle, DealStatus, Partner } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';

const STATUS_BADGE_COLORS: Record<DealStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  angebot_erstellt: 'bg-blue-50 text-blue-700',
  angebot_gesendet: 'bg-blue-50 text-blue-700',
  bestellt: 'bg-yellow-50 text-yellow-700',
  bestaetigt: 'bg-yellow-50 text-yellow-700',
  bezahlt: 'bg-green-50 text-green-700',
  rechnung_erstellt: 'bg-green-50 text-green-700',
  abgeholt: 'bg-emerald-50 text-emerald-700',
  abgeschlossen: 'bg-emerald-50 text-emerald-700',
  storniert: 'bg-red-50 text-red-700',
  gespendet: 'bg-pink-50 text-pink-700',
};

export default function Deals() {
  const navigate = useNavigate();
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [allArticles, setAllArticles] = useState<DealArticle[]>([]);
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; deals: Deal[] }>({ open: false, deals: [] });
  const { filterDeals } = useBrokerFilter();

  useEffect(() => {
    const unsub1 = dealsCollection.subscribe(null, setAllDeals);
    const unsub2 = partnersCollection.subscribe(null, setPartners);
    const unsub3 = dealArticlesCollection.subscribe(null, setAllArticles);
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  // Apply broker filter
  const deals = filterDeals(allDeals);

  const getPartnerName = (id: string): string => {
    return partners.find(p => p.id === id)?.firmenname ?? '—';
  };

  const filteredDeals = statusFilter === 'all'
    ? deals
    : deals.filter(d => d.status === statusFilter);

  // Stats (broker-filtered)
  const offeneCount = deals.filter(d => d.status !== 'abgeschlossen' && d.status !== 'storniert').length;
  const abgeschlossenCount = deals.filter(d => d.status === 'abgeschlossen').length;
  const provisionGesamt = deals.reduce((sum, d) => sum + d.provisionAmount, 0);

  const allStatuses: (DealStatus | 'all')[] = [
    'all', 'draft', 'angebot_erstellt', 'angebot_gesendet', 'bestellt',
    'bestaetigt', 'bezahlt', 'rechnung_erstellt', 'abgeholt', 'abgeschlossen', 'storniert',
  ];

  // ═══ Bulk Actions ═══
  const dealBulkActions: BulkAction<Deal>[] = [
    {
      label: 'CSV Export',
      icon: <Download size={12} />,
      onClick: (selected) => {
        exportDealsAsCsv(selected, getPartnerName);
      },
    },
    {
      label: 'Stornieren',
      icon: <Trash2 size={12} />,
      variant: 'danger',
      onClick: (selected) => {
        setConfirmModal({ open: true, deals: selected });
      },
    },
  ];

  const columns = [
    {
      key: 'id',
      label: 'Deal-ID',
      sortable: true,
      render: (deal: Deal) => (
        <span className="font-mono text-xs font-bold">{deal.id}</span>
      ),
    },
    {
      key: 'parties',
      label: 'Verkäufer → Käufer',
      render: (deal: Deal) => (
        <span className="text-sm">
          {getPartnerName(deal.verkaeuferId)} → {getPartnerName(deal.kaeuferId)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (deal: Deal) => (
        <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${STATUS_BADGE_COLORS[deal.status]}`}>
          {DEAL_STATUS_LABELS[deal.status]}
        </span>
      ),
    },
    {
      key: 'subtotalNetto',
      label: 'Dealwert',
      sortable: true,
      render: (deal: Deal) => (
        <span className="font-mono text-sm font-bold">{formatCurrency(deal.subtotalNetto)}</span>
      ),
    },
    {
      key: 'provisionAmount',
      label: 'Provision',
      sortable: true,
      render: (deal: Deal) => (
        <span className="font-mono text-sm text-[#1a472a]">{formatCurrency(deal.provisionAmount)}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Datum',
      sortable: true,
      render: (deal: Deal) => (
        <span className="text-sm text-gray-500">{formatDate(deal.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (deal: Deal) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate('/admin/deals/new', { state: { cloneFrom: deal.id } });
          }}
          className="p-1.5 text-gray-300 hover:text-[#1a472a] hover:bg-[#f7f9f7] transition-all"
          title="Deal duplizieren"
        >
          <Copy size={14} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Deals"
        subtitle={`${deals.length} Deals insgesamt`}
        breadcrumbs={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Deals' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative group">
              <button
                className="inline-flex items-center gap-2 border border-gray-200 text-gray-500 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] hover:border-[#1a472a] hover:text-[#1a472a] transition-all"
                onClick={() => exportDealsAsCsv(filteredDeals, getPartnerName)}
              >
                <Download size={13} />
                CSV
              </button>
              <button
                onClick={() => exportDealsDetailAsCsv(filteredDeals, allArticles, getPartnerName)}
                className="hidden group-hover:inline-flex absolute right-0 top-full mt-1 items-center gap-2 bg-white border border-gray-200 text-gray-500 px-4 py-2 text-[9px] font-bold whitespace-nowrap hover:border-[#1a472a] hover:text-[#1a472a] transition-all z-10 shadow-sm"
              >
                <Download size={11} />
                Mit Artikeldetails
              </button>
            </div>
            <Link
              to="/admin/deals/new"
              className="inline-flex items-center gap-2 bg-[#1a472a] text-white px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.1em] hover:bg-[#8cc63f] hover:text-[#1a472a] transition-all"
            >
              <Plus size={14} />
              Neuer Deal
            </Link>
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
            <Handshake size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Offene Deals</p>
            <p className="text-xl font-black font-mono">{offeneCount}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Abgeschlossen</p>
            <p className="text-xl font-black font-mono">{abgeschlossenCount}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-[#f7f9f7] rounded-full flex items-center justify-center flex-shrink-0">
            <TrendingUp size={18} className="text-[#1a472a]" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Provision gesamt</p>
            <p className="text-xl font-black font-mono text-[#1a472a]">{formatCurrency(provisionGesamt)}</p>
          </div>
        </div>
      </div>

      {/* Status Filter Pills + View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-wrap gap-2">
          {allStatuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                statusFilter === s
                  ? 'bg-[#1a472a] text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-[#1a472a] hover:text-[#1a472a]'
              }`}
            >
              {s === 'all' ? 'Alle' : DEAL_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex items-center border border-gray-200 bg-white flex-shrink-0 ml-4">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 transition-all ${viewMode === 'table' ? 'bg-[#1a472a] text-white' : 'text-gray-400 hover:text-[#1a472a]'}`}
            title="Tabellenansicht"
          >
            <List size={14} />
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 transition-all ${viewMode === 'kanban' ? 'bg-[#1a472a] text-white' : 'text-gray-400 hover:text-[#1a472a]'}`}
            title="Kanban-Ansicht"
          >
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      {/* Content: Table or Kanban */}
      {viewMode === 'kanban' ? (
        <DealKanban deals={filteredDeals} partners={partners} />
      ) : filteredDeals.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="Keine Deals"
          description="Es gibt noch keine Deals in dieser Kategorie."
          actionLabel="+ Neuer Deal"
          actionTo="/admin/deals/new"
        />
      ) : (
        <DataTable
          data={filteredDeals}
          columns={columns}
          searchable
          searchPlaceholder="Deals suchen (ID, Partner, Status)..."
          searchFields={['id', 'verkaeuferId', 'kaeuferId', 'angebotNr', 'notizen']}
          onRowClick={(deal) => navigate(`/admin/deals/${deal.id}`)}
          emptyMessage="Keine Deals gefunden."
          selectable
          bulkActions={dealBulkActions}
        />
      )}

      {/* Confirm Modal for Bulk Stornierung */}
      <ConfirmModal
        open={confirmModal.open}
        title="Deals stornieren"
        message={`${confirmModal.deals.length} Deal(s) wirklich stornieren? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmLabel="Stornieren"
        variant="danger"
        onConfirm={() => {
          confirmModal.deals.forEach(deal => {
            dealsCollection.update(deal.id, { status: 'storniert' as DealStatus });
            logActivity('deal_status_changed', `Deal ${deal.id} storniert (Bulk-Aktion)`, deal.id);
          });
          setConfirmModal({ open: false, deals: [] });
        }}
        onCancel={() => setConfirmModal({ open: false, deals: [] })}
      />
    </div>
  );
}
