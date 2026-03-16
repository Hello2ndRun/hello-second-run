import { useState, useEffect, useCallback } from 'react';

export default function ServerStatus() {
  const [isDown, setIsDown] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health', { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error('not ok');
      setIsDown(false);
    } catch {
      setIsDown(true);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const id = setInterval(checkHealth, 30_000);
    return () => clearInterval(id);
  }, [checkHealth]);

  if (!isDown || dismissed) return null;

  return (
    <div className="w-full bg-amber-100 border-b border-amber-300 px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-black uppercase tracking-wider text-[11px] text-amber-900">
            ⚡ Server offline — KI-Features (UVP-Suche, PDF-Extraktion, Chatbot) sind nicht verfügbar.
          </p>
          <p className="text-[10px] text-amber-700 mt-0.5 font-mono">
            Starte den Server: npm run server
          </p>
        </div>

        <button
          onClick={() => { setDismissed(false); checkHealth(); }}
          className="font-black uppercase tracking-wider text-[11px] text-amber-800 hover:text-amber-950 border border-amber-400 rounded px-2 py-0.5 hover:bg-amber-200 transition-colors shrink-0"
        >
          Erneut prüfen
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600 hover:text-amber-900 text-lg leading-none shrink-0 ml-1"
          aria-label="Schließen"
        >
          ×
        </button>
      </div>
    </div>
  );
}
