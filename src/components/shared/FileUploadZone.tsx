// ════════════════════════════════════════════════════════════
// FileUploadZone — Drag & Drop for PDF/Excel/Images
// ════════════════════════════════════════════════════════════

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface Props {
  accept?: string;
  maxSizeMb?: number;
  onFile: (file: File) => void;
  label?: string;
  hint?: string;
  currentFile?: { name: string } | null;
  onRemove?: () => void;
}

export default function FileUploadZone({
  accept = '.pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg',
  maxSizeMb = 10,
  onFile,
  label = 'Datei hochladen',
  hint = 'PDF, Excel oder Bild — max. 10 MB',
  currentFile,
  onRemove,
}: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError('');
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`Datei zu groß (max. ${maxSizeMb} MB)`);
      return;
    }
    onFile(file);
  }, [maxSizeMb, onFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  if (currentFile) {
    return (
      <div className="flex items-center gap-3 bg-[#f7f9f7] border border-[#8cc63f]/30 p-4">
        <FileText size={20} className="text-[#1a472a] flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate">{currentFile.name}</p>
          <p className="text-[10px] text-gray-400">Datei ausgewählt</p>
        </div>
        {onRemove && (
          <button onClick={onRemove} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-[#8cc63f] bg-[#8cc63f]/5'
            : 'border-gray-200 hover:border-[#1a472a]/30 bg-white'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        <Upload size={28} className={`mx-auto mb-3 ${dragOver ? 'text-[#8cc63f]' : 'text-gray-300'}`} />
        <p className="text-sm font-black uppercase tracking-tight mb-1">{label}</p>
        <p className="text-[10px] text-gray-400">{hint}</p>
      </div>
      {error && (
        <p className="text-red-500 text-[11px] font-bold mt-2">{error}</p>
      )}
    </div>
  );
}
