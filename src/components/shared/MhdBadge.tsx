// ================================================================
// MhdBadge -- MHD (best-before date) indicator with colored status
// ================================================================

import { getMhdStatus, getMhdColorClasses } from '../../lib/mhdCalculator';
import { formatDate, formatRestlaufzeit } from '../../lib/formatters';

interface Props {
  mhd: string;
}

export default function MhdBadge({ mhd }: Props) {
  const status = getMhdStatus(mhd);
  const colors = getMhdColorClasses(status);
  const dateFormatted = formatDate(mhd);
  const restlaufzeit = formatRestlaufzeit(mhd);

  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold rounded ${colors.bg} ${colors.text}`}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
      <span>{dateFormatted}</span>
      <span className="opacity-60">·</span>
      <span className="opacity-80">{restlaufzeit}</span>
    </span>
  );
}
