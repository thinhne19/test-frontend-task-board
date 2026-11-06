import { AlertCircle, CheckCircle2, Info, RotateCcw, X } from 'lucide-react';
import { useTaskStore } from '@/features/tasks/store/useTaskStore';

export function ToastContainer() {
  const toasts = useTaskStore((s) => s.toasts);
  const dismissToast = useTaskStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[100] flex max-w-md flex-col gap-2.5"
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';

        return (
          <div
            key={toast.id}
            role="status"
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md transition-all ${
              isError
                ? 'border-rose-200 bg-rose-950/95 text-rose-50'
                : isSuccess
                  ? 'border-emerald-200 bg-slate-900/95 text-white'
                  : 'border-slate-700 bg-slate-900/95 text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 text-sm font-medium">
              {isError ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              ) : isSuccess ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <Info className="h-4 w-4 shrink-0 text-indigo-400" />
              )}
              <span>{toast.message}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {toast.actionLabel && toast.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    toast.onAction?.();
                    dismissToast(toast.id);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {toast.actionLabel}
                </button>
              )}

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Đóng thông báo"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
