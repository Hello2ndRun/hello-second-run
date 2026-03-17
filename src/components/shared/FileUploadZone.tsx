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
      <div className="flex items-center gap-3 bg-[#8cc63f]/5 border border-[#8cc63f]/20 p-4 rounded-xl">
        <FileText size={20} className="text-[#111113] flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{currentFile.name}</p>
          <p className="text-[10px] text-[#9394a1]">Datei ausgewählt</p>
        </div>
        {onRemove && (
          <button onClick={onRemove} className="p-1 hover:bg-[#f7f7f8] rounded-lg transition-colors">
            <X size={16} className="text-[#9394a1]" />
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
        className={`relative border-2 border-dashed p-8 text-center cursor-pointer transition-all rounded-2xl ${
          dragOver
            ? 'border-[#8cc63f] bg-[#8cc63f]/5'
            : 'border-[#e4e4e7] hover:border-[#8cc63f] bg-[#ffffff]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        <Upload size={28} className={`mx-auto mb-3 ${dragOver ? 'text-[#8cc63f]' : 'text-[#9394a1]'}`} />
        <p className="text-sm font-semibold mb-1">{label}</p>
        <p className="text-[10px] text-[#9394a1]">{hint}</p>
      </div>
      {error && (
        <p className="text-red-500 text-[11px] font-bold mt-2">{error}</p>
      )}
    </div>
  );
}
