import type { Deal, DealArticle, Partner } from '../../types';
import { formatCurrency, formatDate, formatPercent } from '../../lib/formatters';
import { getMhdStatus, getMhdColor } from '../../lib/mhdCalculator';
import { getArticleStueck } from '../../lib/priceCalculator';

interface Props {
  deal: Deal;
  articles: DealArticle[];
  verkaeufer: Partner;
  kaeufer: Partner;
}

export default function VisualAngebotPreview({ deal, articles, verkaeufer, kaeufer }: Props) {
  return (
    <div className="bg-white text-gray-900 max-w-4xl mx-auto shadow-lg" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="px-10 pt-10 pb-6 border-b-2 border-[#1a472a]">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-[#1a472a] tracking-tight">{verkaeufer.firmenname}</h1>
            <p className="text-sm text-gray-500 mt-1">{verkaeufer.adresse}</p>
            <p className="text-sm text-gray-500">{verkaeufer.plz} {verkaeufer.ort}, {verkaeufer.land}</p>
            {verkaeufer.uidNummer && (
              <p className="text-xs text-gray-400 mt-1">UID: {verkaeufer.uidNummer}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Angebot</p>
            <p className="text-lg font-black font-mono text-[#1a472a] mt-1">{deal.angebotNr}</p>
            <p className="text-sm text-gray-500 mt-2">{formatDate(deal.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* An: Käufer */}
      <div className="px-10 py-6 bg-gray-50">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">An:</p>
        <p className="font-bold text-base">{kaeufer.firmenname}</p>
        <p className="text-sm text-gray-600">{kaeufer.kontaktperson}</p>
        <p className="text-sm text-gray-500">{kaeufer.adresse}</p>
        <p className="text-sm text-gray-500">{kaeufer.plz} {kaeufer.ort}, {kaeufer.land}</p>
        {kaeufer.uidNummer && (
          <p className="text-xs text-gray-400 mt-1">UID: {kaeufer.uidNummer}</p>
        )}
      </div>

      {/* Article Cards */}
      <div className="px-10 py-6 space-y-4">
        {articles.map((art, index) => {
          const mhdStatus = art.mhd ? getMhdStatus(art.mhd) : null;
          const mhdDotColor = mhdStatus ? getMhdColor(mhdStatus) : '#6c757d';
          const stueck = getArticleStueck(art);
          const rabattPct = art.uvp > 0 ? ((1 - art.vkPreis / art.uvp) * 100) : 0;

          return (
            <div key={art.id} className="flex gap-4 p-4 border border-gray-200 rounded">
              {/* Image placeholder */}
              <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                {art.imageData || art.imageUrl ? (
                  <img src={art.imageData || art.imageUrl} alt={art.artikelname} className="w-full h-full object-contain rounded" />
                ) : (
                  <span className="text-3xl text-gray-300">&#9744;</span>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-base">{art.artikelname}</h3>
                    {art.marke && <p className="text-sm text-gray-500">{art.marke}</p>}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {art.ean && <span className="font-mono">{art.ean}</span>}
                      {art.mhd && (
                        <span className="flex items-center gap-1">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: mhdDotColor }}
                          />
                          MHD: {formatDate(art.mhd)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {art.mengePaletten} Paletten{art.mengeKartons > 0 ? ` + ${art.mengeKartons} Kartons` : ''} = {stueck.toLocaleString('de-AT')} Stk
                    </p>
                  </div>

                  {/* Pricing */}
                  <div className="text-right flex-shrink-0">
                    {art.uvp > 0 && (
                      <p className="text-sm text-gray-400 line-through">{formatCurrency(art.uvp)}</p>
                    )}
                    <p className="text-xl font-black text-[#1a472a]">{formatCurrency(art.vkPreis)}</p>
                    {rabattPct > 0 && (
                      <p className="text-xs font-bold text-red-500 mt-0.5">
                        -{formatPercent(rabattPct)} vs. UVP
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Gesamt: {formatCurrency(art.vkPreis * stueck)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: Totals */}
      <div className="px-10 py-6 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Netto</span>
              <span className="font-mono font-bold">{formatCurrency(deal.subtotalNetto)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">MwSt ({formatPercent(deal.mwstRate * 100)})</span>
              <span className="font-mono">{formatCurrency(deal.mwstAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-300">
              <span>Brutto</span>
              <span className="font-mono text-[#1a472a]">{formatCurrency(deal.totalBrutto)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Zahlungsbedingung</p>
            <p>{deal.zahlungsbedingung}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Lieferbedingung</p>
            <p>{deal.lieferbedingung}</p>
          </div>
        </div>
      </div>

      {/* Small footer */}
      <div className="px-10 py-4 text-center border-t border-gray-100">
        <p className="text-[10px] text-gray-400">
          Erstellt via HELLO SECOND/RUN | Deal-ID: {deal.id}
        </p>
      </div>
    </div>
  );
}
