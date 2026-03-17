// ================================================================
// DealStatusFlow -- Horizontal pipeline bar for 10 deal stages
// ================================================================

import { DEAL_STATUS_LABELS, DEAL_STATUS_ORDER, type DealStatus } from '../../types';

interface Props {
  currentStatus: DealStatus;
  onStatusChange?: (status: DealStatus) => void;
}

export default function DealStatusFlow({ currentStatus, onStatusChange }: Props) {
  const isStorniert = currentStatus === 'storniert';
  const isGespendet = currentStatus === 'gespendet';
  const currentIndex = DEAL_STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="space-y-3">
      {/* Main pipeline (9 stages, excluding storniert) */}
      <div className="flex items-stretch gap-0.5">
        {DEAL_STATUS_ORDER.map((status, index) => {
          const isFinal = isStorniert || isGespendet;
          const isCompleted = !isFinal && index < currentIndex;
          const isCurrent = !isFinal && status === currentStatus;
          const isFuture = !isFinal && index > currentIndex;

          let bgColor = 'bg-gray-200';
          let textColor = 'text-gray-400';
          if (isCompleted) {
            bgColor = 'bg-[#8cc63f]';
            textColor = 'text-[#111113]';
          } else if (isCurrent) {
            bgColor = 'bg-[#111113]';
            textColor = 'text-white';
          } else if (isFinal) {
            bgColor = isGespendet ? 'bg-pink-100' : 'bg-gray-100';
            textColor = isGespendet ? 'text-pink-300' : 'text-gray-300';
          }

          const clickable = onStatusChange && !isFinal;

          return (
            <button
              key={status}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStatusChange(status)}
              className={`flex-1 py-2 px-1 text-center transition-all ${bgColor} ${
                clickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
              } ${index === 0 ? 'rounded-l' : ''} ${
                index === DEAL_STATUS_ORDER.length - 1 ? 'rounded-r' : ''
              }`}
              title={DEAL_STATUS_LABELS[status]}
            >
              <span
                className={`block text-[8px] font-semibold uppercase tracking-[0.08em] leading-tight ${textColor}`}
              >
                {DEAL_STATUS_LABELS[status]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Storniert / Gespendet indicators */}
      <div className="flex items-center gap-2">
        {isGespendet && (
          <span className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] rounded bg-pink-500 text-white">
            ❤️ {DEAL_STATUS_LABELS.gespendet}
          </span>
        )}
        {isGespendet && (
          <span className="text-[10px] text-pink-500 font-semibold">
            Ware wurde an eine gemeinnützige Organisation gespendet
          </span>
        )}
        <button
          type="button"
          disabled={!onStatusChange}
          onClick={() => onStatusChange?.('storniert')}
          className={`px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] rounded transition-all ${
            isStorniert
              ? 'bg-red-600 text-white'
              : 'bg-red-50 text-red-400 border border-red-200'
          } ${onStatusChange ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
        >
          {DEAL_STATUS_LABELS.storniert}
        </button>
        {isStorniert && (
          <span className="text-[10px] text-red-500 font-semibold">
            Dieser Deal wurde storniert
          </span>
        )}
      </div>
    </div>
  );
}
