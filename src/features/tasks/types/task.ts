export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO string
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  subtasks: Subtask[];
  order: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  completedAt: string | null; // ISO string | null
}

export type ViewMode = 'list' | 'kanban';

export type SortOption =
  | 'deadline_asc'
  | 'created_desc'
  | 'priority_desc'
  | 'updated_desc';

export type DeadlineFilter = 'all' | 'today' | 'this_week' | 'overdue';

export interface TaskFilterState {
  search: string;
  statuses: TaskStatus[];
  priorities: TaskPriority[];
  tag: string;
  deadlineRange: DeadlineFilter;
  sortBy: SortOption;
  viewMode: ViewMode;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  deadline: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  subtasks: Subtask[];
}

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  order?: number;
};

export interface ImportValidationResult {
  validTasks: Task[];
  errors: Array<{
    index: number;
    id?: string;
    title?: string;
    messages: string[];
  }>;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Cần làm',
  in_progress: 'Đang thực hiện',
  done: 'Hoàn thành',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn cấp',
};

export const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};
