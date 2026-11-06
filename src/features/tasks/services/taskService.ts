import { taskEntitySchema } from '../schemas/taskSchema';
import type {
  CreateTaskInput,
  ImportValidationResult,
  Task,
  UpdateTaskInput,
} from '../types/task';
import { generateSeedTasks } from './seedData';

const STORAGE_KEY = 'task_board_pro_tasks_v1';
const INITIALIZED_KEY = 'task_board_pro_initialized_v1';
const BROADCAST_CHANNEL_NAME = 'task_board_pro_sync_channel';

export interface SyncMessage {
  type: 'TASKS_UPDATED';
  timestamp: number;
  sourceTabId: string;
}

const TAB_ID =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

class TaskService {
  private channel: BroadcastChannel | null = null;
  private simulateNetworkError = false;
  private latencyMs = 120;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      } catch {
        this.channel = null;
      }
    }
  }

  public setSimulateNetworkError(enabled: boolean): void {
    this.simulateNetworkError = enabled;
  }

  public getSimulateNetworkError(): boolean {
    return this.simulateNetworkError;
  }

  private async delay(): Promise<void> {
    if (this.latencyMs <= 0) return;
    await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    if (this.simulateNetworkError) {
      throw new Error(
        'Lỗi kết nối máy chủ giả lập (Simulated API Failure). Đã tự động rollback dữ liệu!'
      );
    }
  }

  private readFromStorage(): Task[] {
    if (typeof window === 'undefined') return [];
    const initialized = window.localStorage.getItem(INITIALIZED_KEY);
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!initialized && !raw) {
      const seeded = generateSeedTasks(50);
      this.writeToStorage(seeded, false);
      window.localStorage.setItem(INITIALIZED_KEY, 'true');
      return seeded;
    }

    if (!raw) return [];

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed as Task[];
    } catch {
      return [];
    }
  }

  private writeToStorage(tasks: Task[], broadcast = true): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    window.localStorage.setItem(INITIALIZED_KEY, 'true');

    if (broadcast && this.channel) {
      const msg: SyncMessage = {
        type: 'TASKS_UPDATED',
        timestamp: Date.now(),
        sourceTabId: TAB_ID,
      };
      this.channel.postMessage(msg);
    }
  }

  public subscribeExternalChanges(onUpdate: (tasks: Task[]) => void): () => void {
    const handleBroadcast = (event: MessageEvent<SyncMessage>) => {
      if (
        event.data?.type === 'TASKS_UPDATED' &&
        event.data.sourceTabId !== TAB_ID
      ) {
        onUpdate(this.readFromStorage());
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        onUpdate(this.readFromStorage());
      }
    };

    this.channel?.addEventListener('message', handleBroadcast);
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
    }

    return () => {
      this.channel?.removeEventListener('message', handleBroadcast);
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
      }
    };
  }

  public async getAllTasks(): Promise<Task[]> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    return this.readFromStorage();
  }

  public async createTask(input: CreateTaskInput): Promise<Task> {
    await this.delay();
    const tasks = this.readFromStorage();
    const nowIso = new Date().toISOString();

    const sameStatusTasks = tasks.filter((t) => t.status === input.status);
    const maxOrder =
      sameStatusTasks.length > 0
        ? Math.max(...sameStatusTasks.map((t) => t.order))
        : -1;

    const newTask: Task = {
      id:
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
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

    const nextTasks = [newTask, ...tasks];
    this.writeToStorage(nextTasks);
    return newTask;
  }

  public async updateTask(id: string, patch: UpdateTaskInput): Promise<Task> {
    await this.delay();
    const tasks = this.readFromStorage();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error('Không tìm thấy công việc cần cập nhật');
    }

    const current = tasks[index]!;
    const nowIso = new Date().toISOString();
    const nextStatus = patch.status ?? current.status;

    let nextCompletedAt = current.completedAt;
    if (nextStatus === 'done' && current.status !== 'done') {
      nextCompletedAt = nowIso;
    } else if (nextStatus !== 'done') {
      nextCompletedAt = null;
    }

    const updated: Task = {
      ...current,
      ...patch,
      title: patch.title !== undefined ? patch.title.trim() : current.title,
      deadline:
        patch.deadline !== undefined
          ? new Date(patch.deadline).toISOString()
          : current.deadline,
      status: nextStatus,
      updatedAt: nowIso,
      completedAt: nextCompletedAt,
    };

    const nextTasks = [...tasks];
    nextTasks[index] = updated;
    this.writeToStorage(nextTasks);
    return updated;
  }

  public async deleteTask(id: string): Promise<void> {
    await this.delay();
    const tasks = this.readFromStorage();
    const nextTasks = tasks.filter((t) => t.id !== id);
    this.writeToStorage(nextTasks);
  }

  public async restoreTask(task: Task): Promise<Task> {
    await this.delay();
    const tasks = this.readFromStorage();
    const exists = tasks.some((t) => t.id === task.id);
    const nextTasks = exists
      ? tasks.map((t) => (t.id === task.id ? task : t))
      : [task, ...tasks];
    this.writeToStorage(nextTasks);
    return task;
  }

  public async saveBatchTasks(nextTasks: Task[]): Promise<Task[]> {
    await this.delay();
    this.writeToStorage(nextTasks);
    return nextTasks;
  }

  public async seedSampleTasks(count = 50): Promise<Task[]> {
    await this.delay();
    const seeded = generateSeedTasks(count);
    this.writeToStorage(seeded);
    return seeded;
  }

  public validateImportPayload(rawJson: string): ImportValidationResult {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      throw new Error('File JSON không đúng cú pháp (Syntax Error)');
    }

    if (!Array.isArray(parsed)) {
      throw new Error('Dữ liệu JSON phải là một mảng các Task ([...])');
    }

    const validTasks: Task[] = [];
    const errors: ImportValidationResult['errors'] = [];
    const activeTitles = new Set<string>();
    const seenIds = new Set<string>();

    parsed.forEach((item, index) => {
      const result = taskEntitySchema.safeParse(item);
      const recordObj =
        typeof item === 'object' && item !== null
          ? (item as Record<string, unknown>)
          : {};
      const recordId =
        typeof recordObj.id === 'string' ? recordObj.id : undefined;
      const recordTitle =
        typeof recordObj.title === 'string' ? recordObj.title : undefined;

      if (!result.success) {
        errors.push({
          index,
          id: recordId,
          title: recordTitle,
          messages: result.error.issues.map(
            (issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`
          ),
        });
        return;
      }

      const task = result.data;
      const customErrors: string[] = [];

      if (seenIds.has(task.id)) {
        customErrors.push(`Trùng lặp ID "${task.id}" trong file nhập`);
      }

      const normalizedTitle = task.title.trim().toLowerCase();
      if (task.status !== 'done') {
        if (activeTitles.has(normalizedTitle)) {
          customErrors.push(
            `Tiêu đề "${task.title}" bị trùng với một Task chưa hoàn thành khác`
          );
        } else {
          activeTitles.add(normalizedTitle);
        }
      }

      if (customErrors.length > 0) {
        errors.push({
          index,
          id: task.id,
          title: task.title,
          messages: customErrors,
        });
        return;
      }

      seenIds.add(task.id);
      validTasks.push({
        ...task,
        completedAt:
          task.status === 'done'
            ? task.completedAt ?? new Date().toISOString()
            : null,
      });
    });

    return { validTasks, errors };
  }
}

export const taskService = new TaskService();
