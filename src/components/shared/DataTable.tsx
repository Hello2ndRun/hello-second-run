// ════════════════════════════════════════════════════════════
// DataTable — Sortable/filterable table with optional bulk selection
// ════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, CheckSquare, Square, MinusSquare } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (item: T) => React.ReactNode;
}

export interface BulkAction<T> {
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
  onClick: (selectedItems: T[]) => void;
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  keyField?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFields?: string[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  selectable?: boolean;
  bulkActions?: BulkAction<T>[];
}

type SortDir = 'asc' | 'desc';

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyField = 'id',
  searchable = false,
  searchPlaceholder = 'Suchen...',
  searchFields,
  onRowClick,
  emptyMessage = 'Keine Daten vorhanden.',
  selectable = false,
  bulkActions = [],
}: Props<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    const fields = searchFields || columns.map(c => c.key);
    return data.filter(item =>
      fields.some(field => {
        const val = item[field];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, searchFields, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal), 'de-AT');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // ═══ Selection logic ═══
  const showSelection = selectable && bulkActions.length > 0;
  const allVisibleIds = sorted.map(item => item[keyField] as string);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedIds.has(id));
  const someSelected = allVisibleIds.some(id => selectedIds.has(id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allVisibleIds));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedItems = sorted.filter(item => selectedIds.has(item[keyField]));

  return (
    <div>
      {/* Search */}
      {searchable && (
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#e4e4e7] rounded-lg text-sm focus:border-[#111113] focus:ring-2 focus:ring-[#111113]/10 focus:outline-none transition-all"
          />
        </div>
      )}

      {/* Bulk Actions Bar */}
      {showSelection && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-[#111113] text-[#ffffff] px-4 py-2.5 mb-2 transition-all">
          <span className="text-xs font-medium">
            {selectedIds.size} ausgewählt
          </span>
          <div className="flex-1" />
          {bulkActions.map((action, i) => (
            <button
              key={i}
              onClick={() => {
                action.onClick(selectedItems);
                setSelectedIds(new Set());
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all ${
                action.variant === 'danger'
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-white/60 hover:text-white text-xs font-medium ml-2"
          >
            Abbrechen
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-[#e4e4e7] rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {showSelection && (
                <th className="px-3 py-3 w-10">
                  <button onClick={toggleAll} className="text-gray-400 hover:text-[#111113] transition-colors">
                    {allSelected ? (
                      <CheckSquare size={16} className="text-[#111113]" />
                    ) : someSelected ? (
                      <MinusSquare size={16} className="text-[#111113]" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.08em] text-[#9394a1] ${
                    col.sortable ? 'cursor-pointer hover:text-[#111113] select-none' : ''
                  }`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (showSelection ? 1 : 0)} className="px-4 py-12 text-center text-gray-400 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sorted.map(item => {
                const itemId = item[keyField] as string;
                const isSelected = selectedIds.has(itemId);

                return (
                  <tr
                    key={itemId}
                    className={`border-b border-gray-50 last:border-0 transition-colors ${
                      isSelected ? 'bg-[#f7f7f8]' : ''
                    } ${onRowClick ? 'cursor-pointer hover:bg-[#f7f7f8]' : ''}`}
                    onClick={() => onRowClick?.(item)}
                  >
                    {showSelection && (
                      <td className="px-3 py-3 w-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOne(itemId);
                          }}
                          className="text-gray-400 hover:text-[#111113] transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-[#111113]" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>
                    )}
                    {columns.map(col => (
                      <td key={col.key} className="px-4 py-3 text-sm">
                        {col.render ? col.render(item) : item[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Count */}
      <p className="text-xs text-[#9394a1] mt-3 font-medium">
        {sorted.length} von {data.length} Einträgen
      </p>
    </div>
  );
}
