import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Database, FolderSearch, Plus, Zap } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import type { Task } from '../types/task';
import { TaskCard } from './TaskCard';

interface VirtualTaskListProps {
  tasks: Task[];
  totalCount: number;
  searchQuery: string;
  nowMs: number;
  onOpenDetail: (taskId: string) => void;
  onOpenCreate: () => void;
}

export function VirtualTaskList({
  tasks,
  totalCount,
  searchQuery,
  nowMs,
  onOpenDetail,
  onOpenCreate,
}: VirtualTaskListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const seedTasks = useTaskStore((s) => s.seedTasks);
  const resetFilters = useTaskStore((s) => s.resetFilters);
  const setTagFilter = useTaskStore((s) => s.setTagFilter);

  const rowVirtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 148,
    overscan: 8,
  });

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Database className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900">
          Danh sách công việc đang trống
        </h3>
        <p className="mt-1.5 max-w-md text-sm text-slate-500">
          Bạn có thể tạo công việc mới hoặc nạp dữ liệu mẫu để kiểm tra các chức năng lọc, kéo thả và thống kê.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => void seedTasks(50)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            <Database className="h-4 w-4" />
            Nạp dữ liệu mẫu
          </button>
          <button
            type="button"
            onClick={() => void seedTasks(1000)}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100"
          >
            <Zap className="h-4 w-4 text-amber-600" />
            Nạp 1.000 Tasks
          </button>
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Tạo công việc mới
          </button>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <FolderSearch className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-base font-bold text-slate-900">
          Không tìm thấy công việc phù hợp
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Thử đổi từ khóa tìm kiếm hoặc xóa bớt các bộ lọc đang chọn.
        </p>
        <button
          type="button"
          onClick={resetFilters}
          className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          Xóa bộ lọc
        </button>
      </div>
    );
  }

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 text-xs text-slate-500">
        <span>
          Danh sách công việc ({tasks.length} bản ghi)
        </span>
        <span>Cuộn để xem thêm</span>
      </div>

      <div
        ref={parentRef}
        className="h-[calc(100vh-330px)] min-h-[460px] overflow-y-auto px-4 py-3"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const task = tasks[virtualRow.index];
            if (!task) return null;

            return (
              <div
                key={task.id}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="pb-3"
              >
                <TaskCard
                  task={task}
                  searchQuery={searchQuery}
                  nowMs={nowMs}
                  onOpenDetail={onOpenDetail}
                  onTagClick={(tag) => setTagFilter(tag)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
