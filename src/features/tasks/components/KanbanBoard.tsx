import { useMemo, useState } from 'react';
import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useTaskStore } from '../store/useTaskStore';
import type { Task, TaskStatus } from '../types/task';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  tasks: Task[];
  searchQuery: string;
  nowMs: number;
  onOpenDetail: (taskId: string) => void;
}

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done'];

export function KanbanBoard({
  tasks,
  searchQuery,
  nowMs,
  onOpenDetail,
}: KanbanBoardProps) {
  const moveTaskInKanban = useTaskStore((s) => s.moveTaskInKanban);
  const setTagFilter = useTaskStore((s) => s.setTagFilter);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Nhóm task theo từng cột Status, ưu tiên sắp xếp theo order trong cột
  const tasksByColumn = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    for (const task of tasks) {
      grouped[task.status].push(task);
    }
    for (const status of COLUMNS) {
      grouped[status].sort((a, b) => a.order - b.order);
    }
    return grouped;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === String(event.active.id));
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const draggedTask = tasks.find((t) => t.id === activeId);
    if (!draggedTask) return;

    // Kiểm tra nếu thả trực tiếp vào vùng trống của cột
    if (overId.startsWith('column-')) {
      const targetStatus = overId.replace('column-', '') as TaskStatus;
      const targetColumnList = tasksByColumn[targetStatus];
      if (
        draggedTask.status === targetStatus &&
        draggedTask.order === targetColumnList.length - 1
      ) {
        return;
      }
      void moveTaskInKanban(activeId, targetStatus, targetColumnList.length);
      return;
    }

    // Thả lên một Card khác
    const overTask = tasks.find((t) => t.id === overId);
    if (!overTask) return;

    const targetStatus = overTask.status;
    const targetList = tasksByColumn[targetStatus].filter(
      (t) => t.id !== activeId
    );
    const overIndex = tasksByColumn[targetStatus].findIndex(
      (t) => t.id === overId
    );

    if (draggedTask.id === overTask.id && draggedTask.status === targetStatus) {
      return;
    }

    const insertIndex = overIndex >= 0 ? overIndex : targetList.length;
    void moveTaskInKanban(activeId, targetStatus, insertIndex);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByColumn[status]}
            searchQuery={searchQuery}
            nowMs={nowMs}
            onOpenDetail={onOpenDetail}
            onTagClick={(tag) => setTagFilter(tag)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2 scale-105 shadow-2xl">
            <TaskCard
              task={activeTask}
              searchQuery={searchQuery}
              nowMs={nowMs}
              onOpenDetail={() => {}}
              isKanbanCard
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
