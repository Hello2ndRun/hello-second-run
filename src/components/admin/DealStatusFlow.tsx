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
  const currentIndex = DEAL_STATUS_ORDER.indexOf(currentStatus);

  return (
    <div className="space-y-3">
      {/* Main pipeline (9 stages, excluding storniert) */}
      <div className="flex items-stretch gap-0.5">
        {DEAL_STATUS_ORDER.map((status, index) => {
          const isCompleted = !isStorniert && index < currentIndex;
          const isCurrent = !isStorniert && status === currentStatus;
          const isFuture = !isStorniert && index > currentIndex;

          let bgColor = 'bg-gray-200';
          let textColor = 'text-gray-400';
          if (isCompleted) {
            bgColor = 'bg-[#8cc63f]';
            textColor = 'text-[#1a472a]';
          } else if (isCurrent) {
            bgColor = 'bg-[#1a472a]';
            textColor = 'text-white';
          } else if (isStorniert) {
            bgColor = 'bg-gray-100';
            textColor = 'text-gray-300';
          }

          const clickable = onStatusChange && !isStorniert;

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
                className={`block text-[8px] font-black uppercase tracking-wider leading-tight ${textColor}`}
              >
                {DEAL_STATUS_LABELS[status]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Storniert indicator (shown separately) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!onStatusChange}
          onClick={() => onStatusChange?.('storniert')}
          className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded transition-all ${
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
