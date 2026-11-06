import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  TASK_STATUS_LABELS,
  type Task,
  type TaskStatus,
} from '../types/task';
import { TaskCard } from './TaskCard';

interface SortableKanbanItemProps {
  task: Task;
  searchQuery: string;
  nowMs: number;
  onOpenDetail: (taskId: string) => void;
  onTagClick?: (tag: string) => void;
}

function SortableKanbanItem({
  task,
  searchQuery,
  nowMs,
  onOpenDetail,
  onTagClick,
}: SortableKanbanItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-35 scale-[0.99]' : ''}
    >
      <TaskCard
        task={task}
        searchQuery={searchQuery}
        nowMs={nowMs}
        onOpenDetail={onOpenDetail}
        onTagClick={onTagClick}
        isKanbanCard
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  searchQuery: string;
  nowMs: number;
  onOpenDetail: (taskId: string) => void;
  onTagClick?: (tag: string) => void;
}

const COLUMN_HEADER_THEME: Record<
  TaskStatus,
  { badge: string; border: string; dot: string }
> = {
  todo: {
    badge: 'bg-slate-200/80 text-slate-800',
    border: 'border-t-slate-400',
    dot: 'bg-slate-500',
  },
  in_progress: {
    badge: 'bg-sky-100 text-sky-800',
    border: 'border-t-sky-500',
    dot: 'bg-sky-500',
  },
  done: {
    badge: 'bg-emerald-100 text-emerald-800',
    border: 'border-t-emerald-500',
    dot: 'bg-emerald-500',
  },
};

export function KanbanColumn({
  status,
  tasks,
  searchQuery,
  nowMs,
  onOpenDetail,
  onTagClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: {
      type: 'Column',
      status,
    },
  });

  const theme = COLUMN_HEADER_THEME[status];

  return (
    <div
      ref={setNodeRef}
      className={`flex h-[calc(100vh-330px)] min-h-[480px] flex-col rounded-2xl border border-slate-200/90 border-t-4 bg-slate-100/70 transition ${
        theme.border
      } ${isOver ? 'ring-2 ring-indigo-500 bg-indigo-50/40' : ''}`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 py-3 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${theme.dot}`} />
          <h3 className="text-sm font-bold text-slate-900">
            {TASK_STATUS_LABELS[status]}
          </h3>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${theme.badge}`}
        >
          {tasks.length}
        </span>
      </div>

      {/* Column Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/50 p-4 text-center text-xs text-slate-400">
              Kéo thả Card vào cột {TASK_STATUS_LABELS[status]}
            </div>
          ) : (
            tasks.map((task) => (
              <SortableKanbanItem
                key={task.id}
                task={task}
                searchQuery={searchQuery}
                nowMs={nowMs}
                onOpenDetail={onOpenDetail}
                onTagClick={onTagClick}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
