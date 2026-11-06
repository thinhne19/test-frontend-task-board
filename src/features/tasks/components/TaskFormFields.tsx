import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import type { TaskFormValues } from '../schemas/taskSchema';
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from '../types/task';
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from '../utils/dateUtils';
import { SubtaskChecklist } from './SubtaskChecklist';

interface TaskFormFieldsProps {
  form: UseFormReturn<TaskFormValues>;
}

const STATUS_OPTIONS: TaskStatus[] = ['todo', 'in_progress', 'done'];
const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export function TaskFormFields({ form }: TaskFormFieldsProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState<string | null>(null);

  const tags = watch('tags') ?? [];
  const subtasks = watch('subtasks') ?? [];
  const deadlineIso = watch('deadline') ?? '';
  const description = watch('description') ?? '';

  const handleAddTag = () => {
    setTagError(null);
    const cleaned = tagInput.trim().replace(/^#/, '');
    if (!cleaned) return;

    if (cleaned.length > 20) {
      setTagError('Mỗi tag tối đa 20 ký tự');
      return;
    }
    if (tags.length >= 5) {
      setTagError('Tối đa 5 tag cho mỗi công việc');
      return;
    }
    if (tags.some((t) => t.toLowerCase() === cleaned.toLowerCase())) {
      setTagError('Tag này đã tồn tại');
      return;
    }

    setValue('tags', [...tags, cleaned], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTagError(null);
    setValue(
      'tags',
      tags.filter((t) => t !== tagToRemove),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  return (
    <div className="space-y-5">
      {/* Tiêu đề */}
      <div>
        <label
          htmlFor="task-title-input"
          className="block text-xs font-bold uppercase tracking-wider text-slate-600"
        >
          Tiêu đề công việc <span className="text-rose-500">*</span>
        </label>
        <input
          id="task-title-input"
          type="text"
          {...register('title')}
          placeholder="Nhập tiêu đề công việc (3–120 ký tự)..."
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        {errors.title && (
          <p className="mt-1 text-xs font-medium text-rose-600">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Trạng thái, Mức ưu tiên, Deadline */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="task-status-select"
            className="block text-xs font-bold uppercase tracking-wider text-slate-600"
          >
            Trạng thái
          </label>
          <select
            id="task-status-select"
            {...register('status')}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {TASK_STATUS_LABELS[st]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="task-priority-select"
            className="block text-xs font-bold uppercase tracking-wider text-slate-600"
          >
            Mức ưu tiên
          </label>
          <select
            id="task-priority-select"
            {...register('priority')}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {PRIORITY_OPTIONS.map((pr) => (
              <option key={pr} value={pr}>
                {TASK_PRIORITY_LABELS[pr]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="task-deadline-input"
            className="block text-xs font-bold uppercase tracking-wider text-slate-600"
          >
            Hạn chót (Deadline) <span className="text-rose-500">*</span>
          </label>
          <input
            id="task-deadline-input"
            type="datetime-local"
            value={toDatetimeLocalValue(deadlineIso)}
            onChange={(e) => {
              const iso = fromDatetimeLocalValue(e.target.value);
              setValue('deadline', iso, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          {errors.deadline && (
            <p className="mt-1 text-xs font-medium text-rose-600">
              {errors.deadline.message}
            </p>
          )}
        </div>
      </div>

      {/* Mô tả chi tiết */}
      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="task-desc-textarea"
            className="block text-xs font-bold uppercase tracking-wider text-slate-600"
          >
            Mô tả công việc
          </label>
          <span className="text-xs text-slate-400">
            {description.length}/2000 ký tự
          </span>
        </div>
        <textarea
          id="task-desc-textarea"
          rows={4}
          {...register('description')}
          placeholder="Mô tả chi tiết yêu cầu, tài liệu đính kèm (hỗ trợ xuống dòng)..."
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        {errors.description && (
          <p className="mt-1 text-xs font-medium text-rose-600">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Tags (tối đa 5 tag, mỗi tag tối đa 20 ký tự) */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Nhãn phân loại (Tags)
          </label>
          <span className="text-xs text-slate-400">{tags.length}/5 tags</span>
        </div>

        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                aria-label={`Xóa tag ${tag}`}
                className="rounded-xs p-0.5 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <input
            type="text"
            value={tagInput}
            maxLength={20}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Nhập tag (tối đa 20 ký tự) rồi nhấn Enter..."
            disabled={tags.length >= 5}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100"
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={tags.length >= 5}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Thêm Tag
          </button>
        </div>

        {(tagError || errors.tags) && (
          <p className="mt-1 text-xs font-medium text-rose-600">
            {tagError ?? errors.tags?.message}
          </p>
        )}
      </div>

      {/* Checklist Subtasks */}
      <SubtaskChecklist
        subtasks={subtasks}
        onChange={(next) =>
          setValue('subtasks', next, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        error={errors.subtasks?.message}
      />
    </div>
  );
}
