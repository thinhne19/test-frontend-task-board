import { memo } from 'react';
import { CheckSquare, GripVertical } from 'lucide-react';
import {
  TASK_STATUS_LABELS,
  type Task,
} from '../types/task';
import { getDeadlineUrgency } from '../utils/dateUtils';
import { DeadlineBadge } from './DeadlineBadge';
import { HighlightText } from './HighlightText';
import { PriorityBadge } from './PriorityBadge';

interface TaskCardProps {
  task: Task;
  searchQuery: string;
  nowMs: number;
  onOpenDetail: (taskId: string) => void;
  onTagClick?: (tag: string) => void;
  isKanbanCard?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

const STATUS_BADGE_STYLE = {
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-sky-100 text-sky-800',
  done: 'bg-emerald-100 text-emerald-800',
} as const;

export const TaskCard = memo(function TaskCard({
  task,
  searchQuery,
  nowMs,
  onOpenDetail,
  onTagClick,
  isKanbanCard = false,
  dragHandleProps,
}: TaskCardProps) {
  const urgency = getDeadlineUrgency(task.deadline, task.status, nowMs);
  const completedSubtasks = task.subtasks.filter((s) => s.done).length;
  const totalSubtasks = task.subtasks.length;
  const subtaskPercent =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <article
      data-task-card-id={task.id}
      tabIndex={0}
      role="button"
      aria-label={`Mở chi tiết công việc ${task.title}`}
      onClick={() => onOpenDetail(task.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetail(task.id);
        }
      }}
      className={`group relative flex flex-col justify-between rounded-xl border bg-white p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
        urgency === 'overdue'
          ? 'border-rose-300 bg-rose-50/20 hover:border-rose-400 hover:shadow-md'
          : urgency === 'due_soon'
            ? 'border-amber-300/90 hover:border-amber-400 hover:shadow-md'
            : 'border-slate-200/90 hover:border-indigo-300 hover:shadow-md'
      }`}
    >
      <div>
        {/* Top Row: Priority, Status (in list view), Drag Handle (in Kanban) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <PriorityBadge priority={task.priority} />
            {!isKanbanCard && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE_STYLE[task.status]}`}
              >
                {TASK_STATUS_LABELS[task.status]}
              </span>
            )}
          </div>

          {dragHandleProps && (
            <div
              {...dragHandleProps}
              onClick={(e) => e.stopPropagation()}
              aria-label="Kéo thả để sắp xếp"
              className="cursor-grab rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Title with search highlight */}
        <h3
          className={`mt-2.5 text-sm font-semibold leading-snug text-slate-900 group-hover:text-indigo-600 ${
            task.status === 'done' ? 'line-through text-slate-500' : ''
          }`}
        >
          <HighlightText text={task.title} highlight={searchQuery} />
        </h3>

        {/* Description preview with search highlight */}
        {task.description && (
          <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs leading-relaxed text-slate-600">
            <HighlightText text={task.description} highlight={searchQuery} />
          </p>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {task.tags.map((tag) => (
              <span
                key={tag}
                onClick={(e) => {
                  if (onTagClick) {
                    e.stopPropagation();
                    onTagClick(tag);
                  }
                }}
                className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Row: Deadline & Subtask Progress */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
        <DeadlineBadge
          deadline={task.deadline}
          status={task.status}
          nowMs={nowMs}
        />

        {totalSubtasks > 0 && (
          <div
            title={`Đã hoàn thành ${completedSubtasks}/${totalSubtasks} subtask (${subtaskPercent}%)`}
            className="flex items-center gap-2 text-xs font-medium text-slate-600"
          >
            <span className="inline-flex items-center gap-1">
              <CheckSquare className="h-3.5 w-3.5 text-indigo-500" />
              {completedSubtasks}/{totalSubtasks}
            </span>
            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full transition-all ${
                  completedSubtasks === totalSubtasks
                    ? 'bg-emerald-500'
                    : 'bg-indigo-500'
                }`}
                style={{ width: `${subtaskPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </article>
  );
});
