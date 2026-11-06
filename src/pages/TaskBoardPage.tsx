import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Bug,
  CheckSquare,
  Database,
  FileJson,
  Plus,
  Zap,
} from 'lucide-react';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { CreateTaskModal } from '@/features/tasks/components/CreateTaskModal';
import { FilterBar } from '@/features/tasks/components/FilterBar';
import { ImportExportModal } from '@/features/tasks/components/ImportExportModal';
import { KanbanBoard } from '@/features/tasks/components/KanbanBoard';
import { StatsHeader } from '@/features/tasks/components/StatsHeader';
import { TaskDetailModal } from '@/features/tasks/components/TaskDetailModal';
import { VirtualTaskList } from '@/features/tasks/components/VirtualTaskList';
import { useNowTick } from '@/features/tasks/hooks/useNowTick';
import { useUrlSync } from '@/features/tasks/hooks/useUrlSync';
import { taskService } from '@/features/tasks/services/taskService';
import { useTaskStore } from '@/features/tasks/store/useTaskStore';
import {
  computeTaskStats,
  filterAndSortTasks,
} from '@/features/tasks/utils/taskFilters';

export function TaskBoardPage() {
  const { id: routeTaskId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const tasks = useTaskStore((s) => s.tasks);
  const filters = useTaskStore((s) => s.filters);
  const simulateError = useTaskStore((s) => s.simulateError);
  const initialize = useTaskStore((s) => s.initialize);
  const setTasksFromExternal = useTaskStore((s) => s.setTasksFromExternal);
  const setLastFocusedTaskId = useTaskStore((s) => s.setLastFocusedTaskId);
  const toggleSimulateError = useTaskStore((s) => s.toggleSimulateError);
  const seedTasks = useTaskStore((s) => s.seedTasks);
  const addToast = useTaskStore((s) => s.addToast);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  const nowMs = useNowTick(60_000);

  useUrlSync();

  useEffect(() => {
    void initialize();

    const unsubscribe = taskService.subscribeExternalChanges((updatedTasks) => {
      setTasksFromExternal(updatedTasks);
      addToast({
        type: 'info',
        message: 'Dữ liệu vừa được cập nhật từ tab khác',
        durationMs: 2500,
      });
    });

    return unsubscribe;
  }, [initialize, setTasksFromExternal, addToast]);

  const stats = useMemo(() => computeTaskStats(tasks, nowMs), [tasks, nowMs]);

  const filteredTasks = useMemo(
    () => filterAndSortTasks(tasks, filters, nowMs),
    [tasks, filters, nowMs]
  );

  const handleOpenDetail = (taskId: string) => {
    setLastFocusedTaskId(taskId);
    navigate({
      pathname: `/tasks/${taskId}`,
      search: location.search,
    });
  };

  const handleCloseDetail = () => {
    navigate({
      pathname: '/',
      search: location.search,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">
                Task Board
              </h1>
              <p className="text-xs text-slate-500">
                Quản lý và theo dõi tiến độ công việc
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleSimulateError}
              title="Bật/tắt giả lập lỗi service để test rollback"
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                simulateError
                  ? 'border-rose-300 bg-rose-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bug className="h-3.5 w-3.5" />
              {simulateError ? 'Đang bật lỗi service' : 'Test lỗi service'}
            </button>

            <button
              type="button"
              onClick={() => void seedTasks(50)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Database className="h-3.5 w-3.5 text-indigo-600" />
              Nạp dữ liệu mẫu (50)
            </button>

            <button
              type="button"
              onClick={() => void seedTasks(1000)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Test 1.000 tasks
            </button>

            <button
              type="button"
              onClick={() => setIsImportExportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <FileJson className="h-3.5 w-3.5 text-indigo-600" />
              Xuất / Nhập JSON
            </button>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4" />
              Tạo công việc
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6">
        <StatsHeader stats={stats} />

        <FilterBar
          filteredCount={filteredTasks.length}
          totalCount={tasks.length}
        />

        {filters.viewMode === 'list' ? (
          <VirtualTaskList
            tasks={filteredTasks}
            totalCount={tasks.length}
            searchQuery={filters.search}
            nowMs={nowMs}
            onOpenDetail={handleOpenDetail}
            onOpenCreate={() => setIsCreateOpen(true)}
          />
        ) : (
          <KanbanBoard
            tasks={filteredTasks}
            searchQuery={filters.search}
            nowMs={nowMs}
            onOpenDetail={handleOpenDetail}
          />
        )}
      </main>

      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <TaskDetailModal
        taskId={routeTaskId ?? null}
        nowMs={nowMs}
        onClose={handleCloseDetail}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
      />

      <ToastContainer />
    </div>
  );
}
