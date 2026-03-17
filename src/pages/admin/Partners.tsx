// ================================================================
// Partners -- Partner list page with role filter
// ================================================================

import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Users, Download, Upload } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable, { type Column } from '../../components/shared/DataTable';
import EmptyState from '../../components/shared/EmptyState';
import { partnersCollection, logActivity } from '../../lib/demoStore';
import { exportPartnersAsCsv } from '../../lib/csvExport';
import { parsePartnersCsv } from '../../lib/csvImport';
import { useBrokerFilter } from '../../hooks/useBrokerFilter';
import { useToast } from '../../components/shared/Toast';
import type { Partner } from '../../types';

type RoleFilter = 'alle' | 'verkaeufer' | 'kaeufer' | 'beides';

const ROLE_LABELS: Record<Partner['rolle'], string> = {
  verkaeufer: 'Verkäufer',
  kaeufer: 'Käufer',
  beides: 'Beides',
};

const ROLE_STYLES: Record<Partner['rolle'], string> = {
  verkaeufer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  kaeufer: 'bg-blue-50 text-blue-700 border-blue-200',
  beides: 'bg-purple-50 text-purple-700 border-purple-200',
};

const FILTER_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: 'alle', label: 'Alle' },
  { value: 'verkaeufer', label: 'Verkäufer' },
  { value: 'kaeufer', label: 'Käufer' },
  { value: 'beides', label: 'Beides' },
];

export default function Partners() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('alle');
  const { filterPartners } = useBrokerFilter();
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const { partners: parsed, errors } = parsePartnersCsv(text);
      if (errors.length > 0) {
        addToast(`Import-Fehler: ${errors[0]}`, 'error');
      }
      if (parsed.length > 0) {
        parsed.forEach(p => {
          const id = partnersCollection.add(p as Omit<Partner, 'id'>);
          logActivity('partner_created', `Partner importiert: ${p.firmenname}`, id);
        });
        addToast(`${parsed.length} Partner erfolgreich importiert`, 'success');
      } else if (errors.length === 0) {
        addToast('Keine Partner in der CSV gefunden', 'info');
      }
    };
    reader.readAsText(file, 'UTF-8');
    // Reset input so same file can be re-imported
    e.target.value = '';
  };

  useEffect(() => {
    return partnersCollection.subscribe(null, setAllPartners);
  }, []);

  // Apply broker filter first, then role filter
  const partners = filterPartners(allPartners);
  const filtered = roleFilter === 'alle'
    ? partners
    : partners.filter((p) => p.rolle === roleFilter);

  const columns: Column<Partner>[] = [
    {
      key: 'firmenname',
      label: 'Firma',
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-bold">{p.firmenname}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{p.uidNummer || '---'}</p>
        </div>
      ),
    },
    {
      key: 'kontaktperson',
      label: 'Kontaktperson',
      sortable: true,
      render: (p) => <span className="text-sm">{p.kontaktperson}</span>,
    },
    {
      key: 'ort',
      label: 'Ort / Land',
      sortable: true,
      width: '160px',
      render: (p) => (
        <div className="flex items-center gap-2">
          <span className="text-sm">{p.plz} {p.ort}</span>
          <span className="text-[10px] font-bold text-gray-400">{p.land}</span>
        </div>
      ),
    },
    {
      key: 'rolle',
      label: 'Rolle',
      sortable: true,
      width: '120px',
      render: (p) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] border ${
            ROLE_STYLES[p.rolle]
          }`}
        >
          {ROLE_LABELS[p.rolle]}
        </span>
      ),
    },
    {
      key: 'email',
      label: 'E-Mail',
      render: (p) => <span className="text-sm text-gray-600">{p.email}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Partner"
        subtitle={`${filtered.length} Partner`}
        breadcrumbs={[
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Partner' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => csvInputRef.current?.click()}
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-500 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] hover:border-[#111113] hover:text-[#111113] transition-all"
            >
              <Upload size={13} />
              Import
            </button>
            <input ref={csvInputRef} type="file" accept=".csv,.txt" onChange={handleCsvImport} className="hidden" />
            <button
              onClick={() => exportPartnersAsCsv(filtered)}
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-500 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] hover:border-[#111113] hover:text-[#111113] transition-all"
            >
              <Download size={13} />
              CSV
            </button>
            <Link
              to="/admin/partners/new"
              className="inline-flex items-center gap-2 bg-[#111113] text-[#ffffff] px-5 py-2.5 font-black uppercase tracking-[0.1em] text-[11px] hover:bg-[#8cc63f] hover:text-[#111113] transition-all"
            >
              <Plus size={14} />
              Neuer Partner
            </Link>
          </div>
        }
      />

      {/* Role filter pills */}
      <div className="flex items-center gap-2 mb-6">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRoleFilter(opt.value)}
            className={`px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition-all ${
              roleFilter === opt.value
                ? 'bg-[#111113] text-[#ffffff]'
                : 'bg-[#ffffff] border border-gray-200 text-gray-500 hover:border-[#111113] hover:text-[#111113]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Keine Partner vorhanden"
          description="Lege deinen ersten Partner an."
          actionLabel="Partner anlegen"
          actionTo="/admin/partners/new"
        />
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          searchable
          searchPlaceholder="Partner suchen (Firma, Name, Ort, E-Mail)..."
          searchFields={['firmenname', 'kontaktperson', 'ort', 'land', 'email']}
          onRowClick={(p) => navigate(`/admin/partners/${p.id}`)}
        />
      )}
    </div>
  );
}
