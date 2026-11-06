import { memo } from 'react';
import {
  TASK_PRIORITY_LABELS,
  type TaskPriority,
} from '../types/task';

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-700 border-slate-200',
  medium: 'bg-sky-50 text-sky-700 border-sky-200',
  high: 'bg-amber-50 text-amber-800 border-amber-200',
  urgent: 'bg-rose-50 text-rose-700 border-rose-200',
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: 'bg-slate-400',
  medium: 'bg-sky-500',
  high: 'bg-amber-500',
  urgent: 'bg-rose-600',
};

interface PriorityBadgeProps {
  priority: TaskPriority;
}

export const PriorityBadge = memo(function PriorityBadge({
  priority,
}: PriorityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${PRIORITY_STYLES[priority]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[priority]}`} />
      {TASK_PRIORITY_LABELS[priority]}
    </span>
  );
});
