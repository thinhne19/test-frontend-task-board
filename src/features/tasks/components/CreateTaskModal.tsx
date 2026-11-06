import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, X } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useFocusTrap } from '../hooks/useFocusTrap';
import {
  buildTaskFormSchema,
  type TaskFormValues,
} from '../schemas/taskSchema';
import { useTaskStore } from '../store/useTaskStore';
import { TaskFormFields } from './TaskFormFields';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const tasks = useTaskStore((s) => s.tasks);
  const addTask = useTaskStore((s) => s.addTask);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const schema = useMemo(
    () =>
      buildTaskFormSchema({
        existingTasks: tasks,
        isCreateMode: true,
      }),
    [tasks]
  );

  const defaultDeadline = useMemo(
    () => new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    []
  );

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      deadline: defaultDeadline,
      status: 'todo',
      priority: 'medium',
      tags: [],
      subtasks: [],
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = form;

  const handleRequestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    reset();
    onClose();
  };

  useFocusTrap(modalRef, {
    isOpen: isOpen && !showDiscardConfirm,
    onEscape: handleRequestClose,
  });

  if (!isOpen) return null;

  const onSubmit = async (values: TaskFormValues) => {
    const created = await addTask(values);
    if (created) {
      reset({
        title: '',
        description: '',
        deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        status: 'todo',
        priority: 'medium',
        tags: [],
        subtasks: [],
      });
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
          aria-labelledby="create-task-modal-title"
          className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div>
                <h2
                  id="create-task-modal-title"
                  className="text-base font-bold text-slate-900"
                >
                  Tạo công việc mới
                </h2>
                <p className="text-xs text-slate-500">
                  Điền đầy đủ thông tin bên dưới. Hệ thống tự động kiểm tra trùng
                  lặp tiêu đề và hạn chót.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRequestClose}
              aria-label="Đóng hộp thoại"
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto px-6 py-5"
          >
            <TaskFormFields form={form} />

            {/* Footer */}
            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleRequestClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Đang lưu...' : 'Tạo công việc'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="Hủy thay đổi chưa lưu?"
        description="Bạn đang có thông tin công việc mới chưa được lưu. Bạn có chắc chắn muốn đóng cửa sổ này không?"
        confirmLabel="Đóng và bỏ thay đổi"
        cancelLabel="Tiếp tục chỉnh sửa"
        variant="warning"
        onConfirm={() => {
          setShowDiscardConfirm(false);
          reset();
          onClose();
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </>
  );
}
