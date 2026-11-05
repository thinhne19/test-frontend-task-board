import type { DeadlineFilter, Task, TaskStatus } from '../types/task';

export type DeadlineUrgency = 'completed' | 'overdue' | 'due_soon' | 'normal';

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export function getDeadlineUrgency(
  deadlineIso: string,
  status: TaskStatus,
  nowMs: number = Date.now()
): DeadlineUrgency {
  if (status === 'done') {
    return 'completed';
  }
  const diff = new Date(deadlineIso).getTime() - nowMs;
  if (diff < 0) {
    return 'overdue';
  }
  if (diff <= MS_PER_DAY) {
    return 'due_soon';
  }
  return 'normal';
}

export function formatRelativeDeadline(
  deadlineIso: string,
  nowMs: number = Date.now()
): string {
  const targetMs = new Date(deadlineIso).getTime();
  if (Number.isNaN(targetMs)) return 'Không xác định';

  const diff = targetMs - nowMs;
  const absDiff = Math.abs(diff);

  if (absDiff < MS_PER_MINUTE) {
    return diff >= 0 ? 'còn dưới 1 phút' : 'vừa quá hạn';
  }

  if (absDiff < MS_PER_HOUR) {
    const minutes = Math.round(absDiff / MS_PER_MINUTE);
    return diff >= 0 ? `còn ${minutes} phút` : `quá hạn ${minutes} phút`;
  }

  if (absDiff < MS_PER_DAY) {
    const hours = Math.floor(absDiff / MS_PER_HOUR);
    const minutes = Math.floor((absDiff % MS_PER_HOUR) / MS_PER_MINUTE);
    const timeStr = minutes > 0 ? `${hours} giờ ${minutes}p` : `${hours} giờ`;
    return diff >= 0 ? `còn ${timeStr}` : `quá hạn ${timeStr}`;
  }

  const days = Math.floor(absDiff / MS_PER_DAY);
  const hours = Math.floor((absDiff % MS_PER_DAY) / MS_PER_HOUR);
  const dayStr = hours > 0 && days < 7 ? `${days} ngày ${hours}h` : `${days} ngày`;
  return diff >= 0 ? `còn ${dayStr}` : `quá hạn ${dayStr}`;
}

export function formatExactDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function fromDatetimeLocalValue(localValue: string): string {
  if (!localValue) return '';
  const parsed = new Date(localValue);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString();
}

export function matchesDeadlineRange(
  task: Task,
  range: DeadlineFilter,
  nowMs: number = Date.now()
): boolean {
  if (range === 'all') return true;

  const deadlineDate = new Date(task.deadline);
  const deadlineMs = deadlineDate.getTime();
  if (Number.isNaN(deadlineMs)) return false;

  const now = new Date(nowMs);

  if (range === 'overdue') {
    return task.status !== 'done' && deadlineMs < nowMs;
  }

  if (range === 'today') {
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    ).getTime();
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    ).getTime();
    return deadlineMs >= startOfDay && deadlineMs <= endOfDay;
  }

  if (range === 'this_week') {
    const dayOfWeek = now.getDay(); // 0 (Sun) -> 6 (Sat)
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + diffToMonday,
      0,
      0,
      0,
      0
    ).getTime();
    const sunday = monday + 7 * MS_PER_DAY - 1;
    return deadlineMs >= monday && deadlineMs <= sunday;
  }

  return true;
}
