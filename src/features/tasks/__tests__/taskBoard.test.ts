import { describe, expect, it } from 'vitest';
import { buildTaskFormSchema } from '../schemas/taskSchema';
import { taskService } from '../services/taskService';
import type { Task } from '../types/task';
import { getDeadlineUrgency } from '../utils/dateUtils';
import { computeTaskStats, filterAndSortTasks } from '../utils/taskFilters';

const NOW = new Date('2026-11-07T08:00:00.000Z').getTime();

const SAMPLE_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Tối ưu hóa hiệu năng React',
    description: 'Áp dụng TanStack Virtual cho danh sách 1000 dòng',
    deadline: new Date(NOW - 3600_000).toISOString(), // Quá hạn 1 giờ
    status: 'todo',
    priority: 'urgent',
    tags: ['performance', 'react'],
    subtasks: [{ id: 's1', title: 'Cài đặt thư viện', done: true }],
    order: 0,
    createdAt: new Date(NOW - 86400_000 * 2).toISOString(),
    updatedAt: new Date(NOW - 3600_000 * 5).toISOString(),
    completedAt: null,
  },
  {
    id: 'task-2',
    title: 'Viết tài liệu kiến trúc hệ thống',
    description: 'Bổ sung sơ đồ luồng dữ liệu và ADR',
    deadline: new Date(NOW + 3600_000 * 6).toISOString(), // Còn 6 giờ (< 24h)
    status: 'in_progress',
    priority: 'medium',
    tags: ['docs'],
    subtasks: [],
    order: 0,
    createdAt: new Date(NOW - 86400_000).toISOString(),
    updatedAt: new Date(NOW - 1800_000).toISOString(),
    completedAt: null,
  },
  {
    id: 'task-3',
    title: 'Thiết lập CI/CD GitHub Actions',
    description: 'Chạy lint, test và build tự động',
    deadline: new Date(NOW - 3600_000 * 10).toISOString(),
    status: 'done',
    priority: 'high',
    tags: ['devops'],
    subtasks: [],
    order: 0,
    createdAt: new Date(NOW - 86400_000 * 3).toISOString(),
    updatedAt: new Date(NOW - 3600_000 * 2).toISOString(),
    completedAt: new Date(NOW - 3600_000 * 2).toISOString(),
  },
];

describe('Task Schema & Validation', () => {
  it('chặn tiêu đề trùng với Task chưa hoàn thành khác', () => {
    const schema = buildTaskFormSchema({
      existingTasks: SAMPLE_TASKS,
      isCreateMode: true,
    });

    const result = schema.safeParse({
      title: '  tối ưu hóa hiệu năng react ',
      description: 'Test duplicate',
      deadline: new Date(Date.now() + 86400_000).toISOString(),
      status: 'todo',
      priority: 'high',
      tags: ['react'],
      subtasks: [],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('trùng');
    }
  });

  it('cho phép trùng tiêu đề với Task đã hoàn thành (done)', () => {
    const schema = buildTaskFormSchema({
      existingTasks: SAMPLE_TASKS,
      isCreateMode: true,
    });

    const result = schema.safeParse({
      title: 'Thiết lập CI/CD GitHub Actions',
      description: 'Tạo lại công việc định kỳ',
      deadline: new Date(Date.now() + 86400_000).toISOString(),
      status: 'todo',
      priority: 'high',
      tags: ['devops'],
      subtasks: [],
    });

    expect(result.success).toBe(true);
  });

  it('chặn tạo mới khi Deadline nằm ở trong quá khứ', () => {
    const schema = buildTaskFormSchema({
      existingTasks: SAMPLE_TASKS,
      isCreateMode: true,
    });

    const result = schema.safeParse({
      title: 'Công việc hợp lệ nhưng hạn quá khứ',
      description: '',
      deadline: new Date(Date.now() - 3600_000 * 5).toISOString(),
      status: 'todo',
      priority: 'low',
      tags: [],
      subtasks: [],
    });

    expect(result.success).toBe(false);
  });
});

describe('Deadline Urgency & Stats', () => {
  it('phân loại chính xác overdue, due_soon và completed', () => {
    expect(
      getDeadlineUrgency(SAMPLE_TASKS[0]!.deadline, SAMPLE_TASKS[0]!.status, NOW)
    ).toBe('overdue');
    expect(
      getDeadlineUrgency(SAMPLE_TASKS[1]!.deadline, SAMPLE_TASKS[1]!.status, NOW)
    ).toBe('due_soon');
    expect(
      getDeadlineUrgency(SAMPLE_TASKS[2]!.deadline, SAMPLE_TASKS[2]!.status, NOW)
    ).toBe('completed');
  });

  it('tính toán đúng thống kê nhanh đầu trang', () => {
    const stats = computeTaskStats(SAMPLE_TASKS, NOW);
    expect(stats.total).toBe(3);
    expect(stats.todo).toBe(1);
    expect(stats.inProgress).toBe(1);
    expect(stats.done).toBe(1);
    expect(stats.overdue).toBe(1);
    expect(stats.completionRate).toBe(33);
  });
});

describe('Filter, Sort & Import JSON Validation', () => {
  it('lọc kết hợp nhiều điều kiện và sắp xếp theo Priority', () => {
    const result = filterAndSortTasks(
      SAMPLE_TASKS,
      {
        search: '',
        statuses: ['todo', 'in_progress'],
        priorities: ['urgent', 'medium'],
        tag: '',
        deadlineRange: 'all',
        sortBy: 'priority_desc',
      },
      NOW
    );

    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe('task-1');
    expect(result[1]?.id).toBe('task-2');
  });

  it('kiểm duyệt file JSON import và báo rõ bản ghi lỗi', () => {
    const payload = JSON.stringify([
      SAMPLE_TASKS[0],
      {
        id: 'invalid-task',
        title: 'A', // Quá ngắn (< 3 ký tự)
        description: '',
        deadline: 'not-a-date',
        status: 'todo',
        priority: 'high',
        tags: ['1', '2', '3', '4', '5', '6'], // Vượt quá 5 tags
        subtasks: [],
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
      },
    ]);

    const validation = taskService.validateImportPayload(payload);
    expect(validation.validTasks).toHaveLength(1);
    expect(validation.errors).toHaveLength(1);
    expect(validation.errors[0]?.index).toBe(1);
    expect(validation.errors[0]?.messages.length).toBeGreaterThanOrEqual(2);
  });
});
