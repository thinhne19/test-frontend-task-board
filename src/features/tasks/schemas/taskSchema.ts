import { z } from 'zod';
import type { Task } from '../types/task';

export const taskStatusSchema = z.enum(['todo', 'in_progress', 'done']);
export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const subtaskSchema = z.object({
  id: z.string().min(1, 'ID subtask không hợp lệ'),
  title: z
    .string()
    .trim()
    .min(1, 'Nội dung subtask không được để trống')
    .max(120, 'Subtask tối đa 120 ký tự'),
  done: z.boolean(),
});

export const baseTaskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Tiêu đề phải từ 3 đến 120 ký tự')
    .max(120, 'Tiêu đề không quá 120 ký tự'),
  description: z
    .string()
    .max(2000, 'Mô tả tối đa 2000 ký tự'),
  deadline: z
    .string()
    .min(1, 'Vui lòng chọn deadline')
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: 'Thời gian deadline không hợp lệ',
    }),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Tag không được để trống')
        .max(20, 'Mỗi tag tối đa 20 ký tự')
    )
    .max(5, 'Tối đa 5 tag'),
  subtasks: z.array(subtaskSchema),
});

export type TaskFormValues = z.infer<typeof baseTaskFormSchema>;

interface SchemaContextOptions {
  existingTasks: Task[];
  currentTaskId?: string;
  isCreateMode: boolean;
  initialDeadline?: string;
}

export function buildTaskFormSchema({
  existingTasks,
  currentTaskId,
  isCreateMode,
  initialDeadline,
}: SchemaContextOptions) {
  return baseTaskFormSchema.superRefine((data, ctx) => {
    const normalizedTitle = data.title.trim().toLowerCase();

    const duplicateActiveTask = existingTasks.find(
      (t) =>
        t.id !== currentTaskId &&
        t.status !== 'done' &&
        t.title.trim().toLowerCase() === normalizedTitle
    );

    if (duplicateActiveTask) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['title'],
        message: 'Tiêu đề này đã trùng với một task chưa hoàn thành khác',
      });
    }

    const parsedDeadline = new Date(data.deadline).getTime();
    const isDeadlineChanged =
      !initialDeadline ||
      new Date(initialDeadline).getTime() !== parsedDeadline;

    if ((isCreateMode || isDeadlineChanged) && parsedDeadline < Date.now() - 60_000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['deadline'],
        message: 'Deadline không được ở trong quá khứ',
      });
    }
  });
}

export const taskEntitySchema = z.object({
  id: z.string().min(1, 'Thiếu id'),
  title: z
    .string()
    .trim()
    .min(3, 'Tiêu đề phải từ 3-120 ký tự')
    .max(120, 'Tiêu đề phải từ 3-120 ký tự'),
  description: z.string().max(2000, 'Mô tả tối đa 2000 ký tự'),
  deadline: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), 'deadline không đúng chuẩn ISO'),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  tags: z
    .array(z.string().trim().min(1).max(20, 'Mỗi tag tối đa 20 ký tự'))
    .max(5, 'Tối đa 5 tag'),
  subtasks: z.array(subtaskSchema),
  order: z.number().finite(),
  createdAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), 'createdAt không hợp lệ'),
  updatedAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), 'updatedAt không hợp lệ'),
  completedAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), 'completedAt không hợp lệ')
    .nullable(),
});
