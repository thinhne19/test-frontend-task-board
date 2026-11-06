import { useState } from 'react';
import { CheckSquare, Plus, Square, Trash2 } from 'lucide-react';
import type { Subtask } from '../types/task';

interface SubtaskChecklistProps {
  subtasks: Subtask[];
  onChange: (nextSubtasks: Subtask[]) => void;
  error?: string;
}

export function SubtaskChecklist({
  subtasks,
  onChange,
  error,
}: SubtaskChecklistProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const handleAddSubtask = () => {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    onChange([...subtasks, { id, title: trimmed.slice(0, 120), done: false }]);
    setNewSubtaskTitle('');
  };

  const handleToggle = (id: string) => {
    onChange(
      subtasks.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  };

  const handleEditTitle = (id: string, title: string) => {
    onChange(
      subtasks.map((s) => (s.id === id ? { ...s, title } : s))
    );
  };

  const handleDelete = (id: string) => {
    onChange(subtasks.filter((s) => s.id !== id));
  };

  const doneCount = subtasks.filter((s) => s.done).length;
  const totalCount = subtasks.length;
  const progress =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Checklist công việc phụ (Subtasks)
        </label>
        {totalCount > 0 && (
          <span className="text-xs font-semibold text-indigo-600">
            Hoàn thành {doneCount}/{totalCount} ({progress}%)
          </span>
        )}
      </div>

      {totalCount > 0 && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-indigo-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Danh sách subtask: hỗ trợ tick, sửa trực tiếp tiêu đề và xóa */}
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {subtasks.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2"
          >
            <button
              type="button"
              onClick={() => handleToggle(item.id)}
              aria-label={
                item.done ? 'Bỏ đánh dấu hoàn thành' : 'Đánh dấu hoàn thành'
              }
              className="text-indigo-600 hover:text-indigo-700 focus:outline-none"
            >
              {item.done ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4 text-slate-400" />
              )}
            </button>

            <input
              type="text"
              value={item.title}
              maxLength={120}
              onChange={(e) => handleEditTitle(item.id, e.target.value)}
              aria-label="Nội dung subtask"
              className={`flex-1 bg-transparent text-sm focus:outline-none ${
                item.done ? 'line-through text-slate-400' : 'text-slate-800'
              }`}
            />

            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              aria-label="Xóa subtask"
              className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Thêm subtask mới */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newSubtaskTitle}
          maxLength={120}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddSubtask();
            }
          }}
          placeholder="Nhập công việc con mới rồi nhấn Enter..."
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <button
          type="button"
          onClick={handleAddSubtask}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Thêm
        </button>
      </div>

      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
