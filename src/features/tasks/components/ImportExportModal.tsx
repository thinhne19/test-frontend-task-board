import { type ChangeEvent, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileJson,
  Upload,
  X,
} from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { taskService } from '../services/taskService';
import { useTaskStore } from '../store/useTaskStore';
import type { ImportValidationResult } from '../types/task';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportExportModal({ isOpen, onClose }: ImportExportModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tasks = useTaskStore((s) => s.tasks);
  const importValidatedTasks = useTaskStore((s) => s.importValidatedTasks);
  const addToast = useTaskStore((s) => s.addToast);

  const [rawJson, setRawJson] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [validationResult, setValidationResult] =
    useState<ImportValidationResult | null>(null);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);

  useFocusTrap(modalRef, {
    isOpen,
    onEscape: onClose,
  });

  if (!isOpen) return null;

  const handleExportJson = () => {
    const jsonString = JSON.stringify(tasks, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `task-board-export-${dateStamp}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      message: `Đã xuất ${tasks.length} công việc ra file JSON`,
    });
  };

  const runValidation = (content: string) => {
    setSyntaxError(null);
    setValidationResult(null);
    if (!content.trim()) return;

    try {
      const result = taskService.validateImportPayload(content);
      setValidationResult(result);
    } catch (err) {
      setSyntaxError(
        err instanceof Error ? err.message : 'Dữ liệu JSON không hợp lệ'
      );
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setRawJson(text);
      runValidation(text);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!validationResult || validationResult.validTasks.length === 0) return;
    await importValidatedTasks(validationResult.validTasks, importMode);
    setRawJson('');
    setValidationResult(null);
    onClose();
  };

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
        aria-labelledby="import-export-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FileJson className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="import-export-title"
                className="text-base font-bold text-slate-900"
              >
                Xuất / Nhập dữ liệu JSON
              </h2>
              <p className="text-xs text-slate-500">
                Sao lưu toàn bộ Task ra file JSON hoặc nhập lại kèm kiểm duyệt
                schema từng bản ghi.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Khu vực Xuất JSON */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Xuất dữ liệu hiện tại (Export JSON)
              </h3>
              <p className="text-xs text-slate-600">
                Tải xuống toàn bộ <strong>{tasks.length}</strong> công việc hiện
                có trong bảng thành file JSON chuẩn.
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              <Download className="h-4 w-4" />
              Xuất file JSON ({tasks.length})
            </button>
          </div>

          {/* Khu vực Nhập JSON */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Nhập dữ liệu từ JSON (Import & Validate)
              </h3>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Chọn file .json
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={rawJson}
              onChange={(e) => {
                setRawJson(e.target.value);
                runValidation(e.target.value);
              }}
              placeholder='Dán nội dung mảng JSON vào đây (ví dụ: [{"id": "...", "title": "..."}]) hoặc tải file lên...'
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 p-3 font-mono text-xs text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />

            {/* Chế độ nhập */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
              <span className="font-semibold">Chế độ ghi dữ liệu:</span>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                />
                <span>Gộp vào danh sách hiện tại (Merge theo ID)</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                />
                <span>Ghi đè toàn bộ (Replace)</span>
              </label>
            </div>

            {/* Báo lỗi cú pháp JSON */}
            {syntaxError && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <strong className="font-semibold">Lỗi định dạng file:</strong>{' '}
                  {syntaxError}
                </div>
              </div>
            )}

            {/* Kết quả kiểm duyệt từng bản ghi */}
            {validationResult && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      Bản ghi hợp lệ: {validationResult.validTasks.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      Bản ghi lỗi: {validationResult.errors.length}
                    </span>
                  </div>
                </div>

                {validationResult.errors.length > 0 && (
                  <div className="max-h-44 overflow-y-auto space-y-2 rounded-lg border border-rose-200 bg-white p-3">
                    <p className="text-xs font-bold text-rose-800">
                      Chi tiết các bản ghi không hợp lệ (sẽ bị bỏ qua khi nhập):
                    </p>
                    {validationResult.errors.map((err) => (
                      <div
                        key={err.index}
                        className="rounded-lg bg-rose-50/70 p-2 text-xs text-rose-900"
                      >
                        <div className="font-semibold">
                          • Bản ghi #{err.index + 1}
                          {err.title ? ` ("${err.title}")` : ''}
                          {err.id ? ` [ID: ${err.id}]` : ''}:
                        </div>
                        <ul className="mt-1 list-disc pl-5 space-y-0.5 text-[11px] text-rose-700">
                          {err.messages.map((msg, i) => (
                            <li key={i}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={
              !validationResult || validationResult.validTasks.length === 0
            }
            onClick={() => void handleConfirmImport()}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-40"
          >
            Nhập {validationResult?.validTasks.length ?? 0} bản ghi hợp lệ
          </button>
        </div>
      </div>
    </div>
  );
}
