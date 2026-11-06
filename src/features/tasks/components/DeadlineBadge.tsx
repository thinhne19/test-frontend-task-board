import { memo } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Flame } from 'lucide-react';
import type { TaskStatus } from '../types/task';
import {
  formatExactDateTime,
  formatRelativeDeadline,
  getDeadlineUrgency,
} from '../utils/dateUtils';

interface DeadlineBadgeProps {
  deadline: string;
  status: TaskStatus;
  nowMs: number;
  showExactInline?: boolean;
}

export const DeadlineBadge = memo(function DeadlineBadge({
  deadline,
  status,
  nowMs,
  showExactInline = false,
}: DeadlineBadgeProps) {
  const urgency = getDeadlineUrgency(deadline, status, nowMs);
  const relativeText = formatRelativeDeadline(deadline, nowMs);
  const exactText = formatExactDateTime(deadline);

  if (urgency === 'overdue') {
    return (
      <div
        title={`Hạn chót chính xác: ${exactText}`}
        className="inline-flex flex-wrap items-center gap-1.5"
      >
        <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase shadow-xs">
          <AlertTriangle className="h-3 w-3" />
          Quá hạn
        </span>
        <span className="text-xs font-semibold text-rose-700">
          ({relativeText}{showExactInline ? ` • ${exactText}` : ''})
        </span>
      </div>
    );
  }

  if (urgency === 'due_soon') {
    return (
      <div
        title={`Hạn chót chính xác: ${exactText}`}
        className="inline-flex flex-wrap items-center gap-1.5"
      >
        <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
          <Flame className="h-3 w-3 text-amber-600" />
          Sắp hết hạn
        </span>
        <span className="text-xs font-medium text-amber-800">
          ({relativeText}{showExactInline ? ` • ${exactText}` : ''})
        </span>
      </div>
    );
  }

  if (urgency === 'completed') {
    return (
      <span
        title={`Hạn chót chính xác: ${exactText}`}
        className="inline-flex items-center gap-1 text-xs text-emerald-700"
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        <span>Đã xong (Hạn: {exactText})</span>
      </span>
    );
  }

  return (
    <span
      title={`Hạn chót chính xác: ${exactText}`}
      className="inline-flex items-center gap-1 text-xs text-slate-600"
    >
      <Clock className="h-3.5 w-3.5 text-slate-400" />
      <span>
        {relativeText}
        {showExactInline ? ` (${exactText})` : ''}
      </span>
    </span>
  );
});
