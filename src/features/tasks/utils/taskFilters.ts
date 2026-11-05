import {
  PRIORITY_WEIGHT,
  type SortOption,
  type Task,
  type TaskFilterState,
} from '../types/task';
import { matchesDeadlineRange } from './dateUtils';

export function filterAndSortTasks(
  tasks: Task[],
  filters: Omit<TaskFilterState, 'viewMode'>,
  nowMs: number = Date.now()
): Task[] {
  const query = filters.search.trim().toLowerCase();
  const selectedTag = filters.tag.trim().toLowerCase();

  const filtered = tasks.filter((task) => {
    if (query) {
      const matchTitle = task.title.toLowerCase().includes(query);
      const matchDesc = task.description.toLowerCase().includes(query);
      if (!matchTitle && !matchDesc) return false;
    }

    if (
      filters.statuses.length > 0 &&
      !filters.statuses.includes(task.status)
    ) {
      return false;
    }

    if (
      filters.priorities.length > 0 &&
      !filters.priorities.includes(task.priority)
    ) {
      return false;
    }

    if (
      selectedTag &&
      !task.tags.some((t) => t.toLowerCase() === selectedTag)
    ) {
      return false;
    }

    if (!matchesDeadlineRange(task, filters.deadlineRange, nowMs)) {
      return false;
    }

    return true;
  });

  return sortTasks(filtered, filters.sortBy);
}

export function sortTasks(tasks: Task[], sortBy: SortOption): Task[] {
  return [...tasks].sort((a, b) => {
    switch (sortBy) {
      case 'deadline_asc':
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case 'created_desc':
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'priority_desc': {
        const diff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
        if (diff !== 0) return diff;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      case 'updated_desc':
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      default:
        return a.order - b.order;
    }
  });
}

export interface TaskBoardStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
  completionRate: number;
}

export function computeTaskStats(
  tasks: Task[],
  nowMs: number = Date.now()
): TaskBoardStats {
  const total = tasks.length;
  let todo = 0;
  let inProgress = 0;
  let done = 0;
  let overdue = 0;

  for (const task of tasks) {
    if (task.status === 'todo') todo++;
    else if (task.status === 'in_progress') inProgress++;
    else if (task.status === 'done') done++;

    if (
      task.status !== 'done' &&
      new Date(task.deadline).getTime() < nowMs
    ) {
      overdue++;
    }
  }

  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  return {
    total,
    todo,
    inProgress,
    done,
    overdue,
    completionRate,
  };
}
