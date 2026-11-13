import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileWarning,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useFocusTrap } from '../hooks/useFocusTrap';
import {
  buildTaskFormSchema,
  type TaskFormValues,
} from '../schemas/taskSchema';
import { useTaskStore } from '../store/useTaskStore';
import {
  formatExactDateTime,
  getDeadlineUrgency,
} from '../utils/dateUtils';
import { DeadlineBadge } from './DeadlineBadge';
import { TaskFormFields } from './TaskFormFields';

interface TaskDetailModalProps {
  taskId: string | null;
  nowMs: number;
  onClose: () => void;
}

export function TaskDetailModal({
  taskId,
  nowMs,
  onClose,
}: TaskDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const tasks = useTaskStore((s) => s.tasks);
  const isInitialized = useTaskStore((s) => s.isInitialized);
  const editTask = useTaskStore((s) => s.editTask);
  const removeTaskWithUndo = useTaskStore((s) => s.removeTaskWithUndo);
  const addToast = useTaskStore((s) => s.addToast);

  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const task = useMemo(
    () => (taskId ? tasks.find((t) => t.id === taskId) : undefined),
    [tasks, taskId]
  );

  const schema = useMemo(
    () =>
      buildTaskFormSchema({
        existingTasks: tasks,
        currentTaskId: task?.id,
        isCreateMode: false,
        initialDeadline: task?.deadline,
      }),
    [tasks, task?.id, task?.deadline]
  );

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      deadline: task?.deadline ?? new Date().toISOString(),
      status: task?.status ?? 'todo',
      priority: task?.priority ?? 'medium',
      tags: task?.tags ?? [],
      subtasks: task?.subtasks ?? [],
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = form;

  // Đồng bộ dữ liệu vào form khi mở task hoặc khi nhận đồng bộ từ tab khác (nếu user chưa sửa dở)
  useEffect(() => {
    if (task && !isDirty) {
      reset({
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        status: task.status,
        priority: task.priority,
        tags: task.tags,
        subtasks: task.subtasks,
      });
    }
  }, [task, reset, isDirty]);

  const handleRequestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    onClose();
  };

  useFocusTrap(modalRef, {
    isOpen: Boolean(taskId) && !showDiscardConfirm && !showDeleteConfirm,
    onEscape: handleRequestClose,
    restoreFocusSelector: taskId ? `[data-task-card-id="${taskId}"]` : null,
  });

  if (!taskId) return null;

  // Trường hợp URL /tasks/:id nhưng Task không tồn tại
  if (isInitialized && !task) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-not-found-title"
          className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <FileWarning className="h-6 w-6" />
          </div>
          <h2
            id="task-not-found-title"
            className="mt-4 text-base font-bold text-slate-900"
          >
            Không tìm thấy công việc
          </h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Công việc với mã{' '}
            <code className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-800">
              {taskId}
            </code>{' '}
            không tồn tại hoặc đã bị xóa trước đó.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Quay lại bảng công việc
          </button>
        </div>
      </div>
    );
  }

  if (!task) return null;

  const urgency = getDeadlineUrgency(task.deadline, task.status, nowMs);

  const onSubmit = async (values: TaskFormValues) => {
    const ok = await editTask(task.id, values);
    if (ok) {
      reset(values);
      addToast({
        type: 'success',
        message: 'Đã lưu thay đổi công việc',
      });
      onClose();
    }
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    const deleted = await removeTaskWithUndo(task.id);
    if (deleted) {
      onClose();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) handleRequestClose();
        }}
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-detail-modal-title"
          className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="task-detail-modal-title"
                  className="text-base font-bold text-slate-900"
                >
                  Chi tiết & Chỉnh sửa công việc
                </h2>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-500">
                  ID: {task.id.slice(0, 8)}
                </span>
                {isDirty && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                    Chưa lưu thay đổi
                  </span>
                )}
              </div>

              <DeadlineBadge
                deadline={task.deadline}
                status={task.status}
                nowMs={nowMs}
                showExactInline
              />
            </div>

            <button
              type="button"
              onClick={handleRequestClose}
              aria-label="Đóng cửa sổ chi tiết"
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cảnh báo Quá hạn nổi bật trên Modal */}
          {urgency === 'overdue' && (
            <div className="flex items-center gap-2.5 border-b border-rose-200 bg-rose-50 px-6 py-2.5 text-xs font-semibold text-rose-800">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>
                Cảnh báo: Công việc này đã quá hạn hoàn thành nhưng chưa được
                đánh dấu Done!
              </span>
            </div>
          )}

          {/* Body */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto px-6 py-5"
          >
            {/* Metadata: createdAt, updatedAt, completedAt */}
            <div className="mb-5 grid grid-cols-1 gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs sm:grid-cols-3">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <div>
                  <span className="block text-[11px] text-slate-400">
                    Ngày tạo (createdAt)
                  </span>
                  <strong className="font-semibold text-slate-800">
                    {formatExactDateTime(task.createdAt)}
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                <div>
                  <span className="block text-[11px] text-slate-400">
                    Cập nhật cuối (updatedAt)
                  </span>
                  <strong className="font-semibold text-slate-800">
                    {formatExactDateTime(task.updatedAt)}
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <div>
                  <span className="block text-[11px] text-slate-400">
                    Hoàn thành (completedAt)
                  </span>
                  <strong className="font-semibold text-slate-800">
                    {formatExactDateTime(task.completedAt)}
                  </strong>
                </div>
              </div>
            </div>

            <TaskFormFields form={form} />

            {/* Footer Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
              >
                <Trash2 className="h-4 w-4" />
                Xóa công việc
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleRequestClose}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Cảnh báo khi đóng Modal mà còn thay đổi chưa lưu */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="Cảnh báo thay đổi chưa được lưu"
        description="Bạn đã chỉnh sửa thông tin công việc nhưng chưa nhấn Lưu. Nếu đóng bây giờ, các thay đổi sẽ bị mất."
        confirmLabel="Bỏ thay đổi & Đóng"
        cancelLabel="Ở lại chỉnh sửa"
        variant="warning"
        onConfirm={() => {
          setShowDiscardConfirm(false);
          reset();
          onClose();
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />

      {/* Hộp thoại xác nhận Xóa (sau khi xóa có Toast Hoàn tác 5 giây) */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Xác nhận xóa công việc"
        description={
          task.subtasks.length > 0
          ? `Bạn có chắc muốn xoá "${task.title}"? công việc này đang có ${task.subtasks.length} subtask chưa hoàn thành.`
          : `Bạn có chắc muốn xoá "${task.title}"? không?`
        }
        confirmLabel="Xóa công việc"
        cancelLabel="Hủy bỏ"
        variant="danger"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
