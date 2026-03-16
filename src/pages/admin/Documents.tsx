import { useState, useEffect } from 'react';
import { FileText, Download, Eye } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/shared/DataTable';
import EmptyState from '../../components/shared/EmptyState';
import { documentsCollection } from '../../lib/demoStore';
import type { GeneratedDocument, DocumentType } from '../../types';
import { formatDate } from '../../lib/formatters';

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  angebot: 'Angebot',
  bestellbestaetigung: 'Bestellbestätigung',
  auftragsbestaetigung: 'Auftragsbestätigung',
  lieferschein: 'Lieferschein',
  rechnung: 'Rechnung',
  provisionsrechnung: 'Provisionsrechnung',
};

const DOC_TYPE_COLORS: Record<DocumentType, string> = {
  angebot: 'bg-blue-50 text-blue-700',
  bestellbestaetigung: 'bg-amber-50 text-amber-700',
  auftragsbestaetigung: 'bg-indigo-50 text-indigo-700',
  lieferschein: 'bg-teal-50 text-teal-700',
  rechnung: 'bg-purple-50 text-purple-700',
  provisionsrechnung: 'bg-emerald-50 text-emerald-700',
};

type FilterKey = 'all' | DocumentType;

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'angebot', label: 'Angebot' },
  { key: 'bestellbestaetigung', label: 'BE' },
  { key: 'auftragsbestaetigung', label: 'AB' },
  { key: 'rechnung', label: 'Rechnung' },
  { key: 'provisionsrechnung', label: 'Provision' },
];

export default function Documents() {
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [typeFilter, setTypeFilter] = useState<FilterKey>('all');

  useEffect(() => {
    const unsub = documentsCollection.subscribe(null, setDocuments);
    return () => unsub();
  }, []);

  const filtered = typeFilter === 'all'
    ? documents
    : documents.filter(d => d.type === typeFilter);

  const dataUriToBlob = (dataUri: string): Blob => {
    // Handle both raw base64 and full data URI
    let base64 = dataUri;
    let mimeType = 'application/pdf';
    if (dataUri.startsWith('data:')) {
      const [header, data] = dataUri.split(',');
      base64 = data;
      const match = header.match(/data:([^;]+)/);
      if (match) mimeType = match[1];
    }
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
  };

  const openDocument = (doc: GeneratedDocument) => {
    if (doc.fileData) {
      try {
        const blob = dataUriToBlob(doc.fileData);
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } catch {
        // Fallback: open data URI directly
        window.open(doc.fileData, '_blank');
      }
    }
  };

  const downloadDocument = (doc: GeneratedDocument) => {
    if (doc.fileData) {
      try {
        const blob = dataUriToBlob(doc.fileData);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.fileName;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch {
        // Fallback
        const link = document.createElement('a');
        link.href = doc.fileData;
        link.download = doc.fileName;
        link.click();
      }
    }
  };

  const columns = [
    {
      key: 'type',
      label: 'Typ',
      sortable: true,
      width: '140px',
      render: (item: GeneratedDocument) => (
        <span className="inline-flex items-center gap-1.5">
          <FileText size={12} className="text-gray-400 flex-shrink-0" />
          <span
            className={`inline-block px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
              DOC_TYPE_COLORS[item.type] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {DOC_TYPE_LABELS[item.type] || item.type}
          </span>
        </span>
      ),
    },
    {
      key: 'nr',
      label: 'Nr.',
      sortable: true,
      render: (item: GeneratedDocument) => (
        <span className="font-mono text-sm">{item.nr}</span>
      ),
    },
    {
      key: 'ausstellerName',
      label: 'Aussteller',
      sortable: true,
      render: (item: GeneratedDocument) => (
        <span className="font-bold text-sm">{item.ausstellerName}</span>
      ),
    },
    {
      key: 'empfaengerName',
      label: 'Empfänger',
      sortable: true,
      render: (item: GeneratedDocument) => (
        <span className="text-sm">{item.empfaengerName}</span>
      ),
    },
    {
      key: 'dealId',
      label: 'Deal-ID',
      sortable: true,
      render: (item: GeneratedDocument) => (
        <span className="font-mono text-[10px] text-gray-400">{item.dealId}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Datum',
      sortable: true,
      render: (item: GeneratedDocument) => (
        <span className="text-sm text-gray-500">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Aktionen',
      render: (item: GeneratedDocument) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDocument(item);
            }}
            className="p-1.5 text-gray-400 hover:text-[#1a472a] transition-colors"
            title="Vorschau"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadDocument(item);
            }}
            className="p-1.5 text-gray-400 hover:text-[#1a472a] transition-colors"
            title="Download"
          >
            <Download size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dokumente"
        subtitle={`${documents.length} generierte Dokumente`}
      />

      {/* Type Filter Pills */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {FILTER_OPTIONS.map(option => (
          <button
            key={option.key}
            onClick={() => setTypeFilter(option.key)}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
              typeFilter === option.key
                ? 'bg-[#1a472a] text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-[#1a472a]/30'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Noch keine Dokumente"
          description="Noch keine Dokumente erstellt. Dokumente werden automatisch bei Deal-Aktionen generiert."
        />
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-sm">Keine Dokumente dieses Typs vorhanden.</p>
        </div>
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          searchable
          searchPlaceholder="Dokumente durchsuchen..."
          searchFields={['nr', 'ausstellerName', 'empfaengerName', 'dealId']}
          emptyMessage="Keine Dokumente gefunden."
        />
      )}
    </div>
  );
}
