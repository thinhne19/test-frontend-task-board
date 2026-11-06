import { create } from 'zustand';
import { taskService } from '../services/taskService';
import type {
  CreateTaskInput,
  DeadlineFilter,
  SortOption,
  Task,
  TaskFilterState,
  TaskPriority,
  TaskStatus,
  UpdateTaskInput,
  ViewMode,
} from '../types/task';

const FILTER_STORAGE_KEY = 'task_board_pro_filters_v1';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

const DEFAULT_FILTERS: TaskFilterState = {
  search: '',
  statuses: [],
  priorities: [],
  tag: '',
  deadlineRange: 'all',
  sortBy: 'deadline_asc',
  viewMode: 'list',
};

function loadInitialFilters(): TaskFilterState {
  if (typeof window === 'undefined') return DEFAULT_FILTERS;
  try {
    const raw = window.localStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) return DEFAULT_FILTERS;
    const parsed = JSON.parse(raw) as Partial<TaskFilterState>;
    return {
      ...DEFAULT_FILTERS,
      ...parsed,
    };
  } catch {
    return DEFAULT_FILTERS;
  }
}

function persistFilters(filters: TaskFilterState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // Ignore storage quota errors
  }
}

interface TaskStoreState {
  tasks: Task[];
  isLoading: boolean;
  isInitialized: boolean;
  filters: TaskFilterState;
  toasts: ToastItem[];
  simulateError: boolean;
  lastFocusedTaskId: string | null;

  // Lifecycle & Multi-tab sync
  initialize: () => Promise<void>;
  setTasksFromExternal: (tasks: Task[]) => void;
  setLastFocusedTaskId: (id: string | null) => void;
  toggleSimulateError: () => void;

  // Toast actions
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  dismissToast: (id: string) => void;

  // Filter actions
  setSearch: (search: string) => void;
  toggleStatusFilter: (status: TaskStatus) => void;
  togglePriorityFilter: (priority: TaskPriority) => void;
  setTagFilter: (tag: string) => void;
  setDeadlineRange: (range: DeadlineFilter) => void;
  setSortBy: (sortBy: SortOption) => void;
  setViewMode: (viewMode: ViewMode) => void;
  setFiltersBulk: (partial: Partial<TaskFilterState>) => void;
  resetFilters: () => void;

  // CRUD & Kanban actions (with Optimistic Updates & Rollback)
  addTask: (input: CreateTaskInput) => Promise<Task | null>;
  editTask: (id: string, patch: UpdateTaskInput) => Promise<boolean>;
  removeTaskWithUndo: (id: string) => Promise<boolean>;
  moveTaskInKanban: (
    activeId: string,
    targetStatus: TaskStatus,
    targetIndex: number
  ) => Promise<void>;
  seedTasks: (count?: number) => Promise<void>;
  importValidatedTasks: (
    importedTasks: Task[],
    mode: 'replace' | 'merge'
  ) => Promise<void>;
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  tasks: [],
  isLoading: false,
  isInitialized: false,
  filters: loadInitialFilters(),
  toasts: [],
  simulateError: false,
  lastFocusedTaskId: null,

  initialize: async () => {
    if (get().isInitialized) return;
    set({ isLoading: true });
    try {
      const data = await taskService.getAllTasks();
      set({ tasks: data, isLoading: false, isInitialized: true });
    } catch (err) {
      set({ isLoading: false, isInitialized: true });
      get().addToast({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Không thể tải danh sách công việc',
      });
    }
  },

  setTasksFromExternal: (tasks) => {
    set({ tasks });
  },

  setLastFocusedTaskId: (id) => {
    set({ lastFocusedTaskId: id });
  },

  toggleSimulateError: () => {
    const next = !get().simulateError;
    taskService.setSimulateNetworkError(next);
    set({ simulateError: next });
    get().addToast({
      type: next ? 'info' : 'success',
      message: next
        ? 'Đã bật chế độ giả lập lỗi API (Test Optimistic Rollback)'
        : 'Đã tắt chế độ giả lập lỗi API (Hoạt động bình thường)',
    });
  },

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const duration = toast.durationMs ?? 4500;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    setTimeout(() => {
      get().dismissToast(id);
    }, duration);

    return id;
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  setSearch: (search) => {
    const next = { ...get().filters, search };
    persistFilters(next);
    set({ filters: next });
  },

  toggleStatusFilter: (status) => {
    const current = get().filters.statuses;
    const statuses = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    const next = { ...get().filters, statuses };
    persistFilters(next);
    set({ filters: next });
  },

  togglePriorityFilter: (priority) => {
    const current = get().filters.priorities;
    const priorities = current.includes(priority)
      ? current.filter((p) => p !== priority)
      : [...current, priority];
    const next = { ...get().filters, priorities };
    persistFilters(next);
    set({ filters: next });
  },

  setTagFilter: (tag) => {
    const next = {
      ...get().filters,
      tag: get().filters.tag === tag ? '' : tag,
    };
    persistFilters(next);
    set({ filters: next });
  },

  setDeadlineRange: (deadlineRange) => {
    const next = { ...get().filters, deadlineRange };
    persistFilters(next);
    set({ filters: next });
  },

  setSortBy: (sortBy) => {
    const next = { ...get().filters, sortBy };
    persistFilters(next);
    set({ filters: next });
  },

  setViewMode: (viewMode) => {
    const next = { ...get().filters, viewMode };
    persistFilters(next);
    set({ filters: next });
  },

  setFiltersBulk: (partial) => {
    const next = { ...get().filters, ...partial };
    persistFilters(next);
    set({ filters: next });
  },

  resetFilters: () => {
    const next: TaskFilterState = {
      ...DEFAULT_FILTERS,
      viewMode: get().filters.viewMode,
    };
    persistFilters(next);
    set({ filters: next });
  },

  addTask: async (input) => {
    const previousTasks = get().tasks;
    const nowIso = new Date().toISOString();
    const tempId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `temp-${Date.now()}`;

    const sameStatus = previousTasks.filter((t) => t.status === input.status);
    const maxOrder =
      sameStatus.length > 0 ? Math.max(...sameStatus.map((t) => t.order)) : -1;

    const optimisticTask: Task = {
      id: tempId,
      title: input.title.trim(),
      description: input.description,
      deadline: new Date(input.deadline).toISOString(),
      status: input.status,
      priority: input.priority,
      tags: input.tags.map((t) => t.trim()).filter(Boolean),
      subtasks: input.subtasks,
      order: maxOrder + 1,
      createdAt: nowIso,
      updatedAt: nowIso,
      completedAt: input.status === 'done' ? nowIso : null,
    };

    // Optimistic UI update
    set({ tasks: [optimisticTask, ...previousTasks] });

    try {
      const saved = await taskService.createTask(input);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === tempId ? saved : t)),
      }));
      get().addToast({
        type: 'success',
        message: `Đã tạo công việc "${saved.title}"`,
      });
      return saved;
    } catch (err) {
      // Rollback
      set({ tasks: previousTasks });
      get().addToast({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Lỗi khi tạo công việc mới',
      });
      return null;
    }
  },

  editTask: async (id, patch) => {
    const previousTasks = get().tasks;
    const target = previousTasks.find((t) => t.id === id);
    if (!target) return false;

    const nowIso = new Date().toISOString();
    const nextStatus = patch.status ?? target.status;
    let nextCompletedAt = target.completedAt;
    if (nextStatus === 'done' && target.status !== 'done') {
      nextCompletedAt = nowIso;
    } else if (nextStatus !== 'done') {
      nextCompletedAt = null;
    }

    const optimisticUpdated: Task = {
      ...target,
      ...patch,
      title: patch.title !== undefined ? patch.title.trim() : target.title,
      deadline:
        patch.deadline !== undefined
          ? new Date(patch.deadline).toISOString()
          : target.deadline,
      status: nextStatus,
      updatedAt: nowIso,
      completedAt: nextCompletedAt,
    };

    // Optimistic update
    set({
      tasks: previousTasks.map((t) => (t.id === id ? optimisticUpdated : t)),
    });

    try {
      const saved = await taskService.updateTask(id, patch);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? saved : t)),
      }));
      return true;
    } catch (err) {
      // Rollback
      set({ tasks: previousTasks });
      get().addToast({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Không thể lưu thay đổi',
      });
      return false;
    }
  },

  removeTaskWithUndo: async (id) => {
    const previousTasks = get().tasks;
    const deletedTask = previousTasks.find((t) => t.id === id);
    if (!deletedTask) return false;

    // Optimistic removal
    set({
      tasks: previousTasks.filter((t) => t.id !== id),
    });

    try {
      await taskService.deleteTask(id);

      get().addToast({
        type: 'info',
        message: `Đã xóa "${deletedTask.title}"`,
        actionLabel: 'Hoàn tác (Undo)',
        durationMs: 5000,
        onAction: async () => {
          const snapshotBeforeRestore = get().tasks;
          set({ tasks: [deletedTask, ...snapshotBeforeRestore] });
          try {
            await taskService.restoreTask(deletedTask);
            get().addToast({
              type: 'success',
              message: `Đã khôi phục "${deletedTask.title}"`,
            });
          } catch (restoreErr) {
            set({ tasks: snapshotBeforeRestore });
            get().addToast({
              type: 'error',
              message:
                restoreErr instanceof Error
                  ? restoreErr.message
                  : 'Không thể hoàn tác xóa',
            });
          }
        },
      });

      return true;
    } catch (err) {
      // Rollback
      set({ tasks: previousTasks });
      get().addToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể xóa công việc',
      });
      return false;
    }
  },

  moveTaskInKanban: async (activeId, targetStatus, targetIndex) => {
    const previousTasks = get().tasks;
    const activeTask = previousTasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    const nowIso = new Date().toISOString();
    let completedAt = activeTask.completedAt;
    if (targetStatus === 'done' && activeTask.status !== 'done') {
      completedAt = nowIso;
    } else if (targetStatus !== 'done') {
      completedAt = null;
    }

    const updatedActive: Task = {
      ...activeTask,
      status: targetStatus,
      updatedAt: nowIso,
      completedAt,
    };

    // Tách các cột để tính lại order chuẩn xác
    const targetColumnTasks = previousTasks
      .filter((t) => t.status === targetStatus && t.id !== activeId)
      .sort((a, b) => a.order - b.order);

    const clampedIndex = Math.max(
      0,
      Math.min(targetIndex, targetColumnTasks.length)
    );
    targetColumnTasks.splice(clampedIndex, 0, updatedActive);

    const reorderedTargetIds = new Map<string, number>();
    targetColumnTasks.forEach((t, idx) => {
      reorderedTargetIds.set(t.id, idx);
    });

    const nextTasks = previousTasks.map((t) => {
      if (t.id === activeId) {
        return {
          ...updatedActive,
          order: reorderedTargetIds.get(activeId) ?? 0,
        };
      }
      if (reorderedTargetIds.has(t.id)) {
        return {
          ...t,
          order: reorderedTargetIds.get(t.id)!,
        };
      }
      return t;
    });

    // Optimistic update
    set({ tasks: nextTasks });

    try {
      await taskService.saveBatchTasks(nextTasks);
    } catch (err) {
      // Rollback
      set({ tasks: previousTasks });
      get().addToast({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Lỗi khi cập nhật vị trí Kanban',
      });
    }
  },

  seedTasks: async (count = 50) => {
    const previousTasks = get().tasks;
    set({ isLoading: true });
    try {
      const seeded = await taskService.seedSampleTasks(count);
      set({ tasks: seeded, isLoading: false });
      get().addToast({
        type: 'success',
        message: `Đã nạp thành công ${seeded.length} công việc mẫu!`,
      });
    } catch (err) {
      set({ tasks: previousTasks, isLoading: false });
      get().addToast({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Không thể nạp dữ liệu mẫu',
      });
    }
  },

  importValidatedTasks: async (importedTasks, mode) => {
    const previousTasks = get().tasks;
    let nextTasks: Task[];

    if (mode === 'replace') {
      nextTasks = importedTasks;
    } else {
      const importedMap = new Map(importedTasks.map((t) => [t.id, t]));
      const kept = previousTasks.filter((t) => !importedMap.has(t.id));
      nextTasks = [...importedTasks, ...kept];
    }

    set({ tasks: nextTasks });

    try {
      await taskService.saveBatchTasks(nextTasks);
      get().addToast({
        type: 'success',
        message: `Đã nhập thành công ${importedTasks.length} công việc!`,
      });
    } catch (err) {
      set({ tasks: previousTasks });
      get().addToast({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Lỗi khi lưu dữ liệu nhập JSON',
      });
    }
  },
}));
