import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  CalendarClock,
  FilterX,
  Kanban,
  LayoutList,
  Search,
  Tag,
  X,
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { useTaskStore } from '../store/useTaskStore';
import {
  type DeadlineFilter,
  type SortOption,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from '../types/task';

interface FilterBarProps {
  filteredCount: number;
  totalCount: number;
}

const ALL_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];
const ALL_PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];

const DEADLINE_OPTIONS: Array<{ value: DeadlineFilter; label: string }> = [
  { value: 'all', label: 'Mọi thời hạn' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'this_week', label: 'Tuần này' },
  { value: 'overdue', label: 'Quá hạn' },
];

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'deadline_asc', label: 'Deadline gần nhất' },
  { value: 'created_desc', label: 'Mới tạo nhất' },
  { value: 'priority_desc', label: 'Priority (Urgent → Low)' },
  { value: 'updated_desc', label: 'Cập nhật gần nhất' },
];

export function FilterBar({ filteredCount, totalCount }: FilterBarProps) {
  const tasks = useTaskStore((s) => s.tasks);
  const filters = useTaskStore((s) => s.filters);
  const setSearch = useTaskStore((s) => s.setSearch);
  const toggleStatusFilter = useTaskStore((s) => s.toggleStatusFilter);
  const togglePriorityFilter = useTaskStore((s) => s.togglePriorityFilter);
  const setTagFilter = useTaskStore((s) => s.setTagFilter);
  const setDeadlineRange = useTaskStore((s) => s.setDeadlineRange);
  const setSortBy = useTaskStore((s) => s.setSortBy);
  const setViewMode = useTaskStore((s) => s.setViewMode);
  const resetFilters = useTaskStore((s) => s.resetFilters);

  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 300);

  // Đồng bộ khi filters.search bị thay đổi từ URL hoặc nút Xóa bộ lọc
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  // Đẩy giá trị sau debounce 300ms vào store
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setSearch(debouncedSearch);
    }
  }, [debouncedSearch, filters.search, setSearch]);

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const task of tasks) {
      for (const t of task.tags) {
        tagSet.add(t);
      }
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.statuses.length > 0 ||
    filters.priorities.length > 0 ||
    filters.tag.trim().length > 0 ||
    filters.deadlineRange !== 'all' ||
    filters.sortBy !== 'deadline_asc';

  return (
    <section
      aria-label="Bộ lọc và tìm kiếm"
      className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-4"
    >
      {/* Hàng 1: Search, Sort, View Mode Switcher */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Ô tìm kiếm có debounce 300ms */}
        <div className="relative flex-1 max-w-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm theo tiêu đề hoặc mô tả..."
            aria-label="Tìm kiếm công việc"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearch('');
              }}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort + Chuyển đổi chế độ xem Danh sách / Kanban */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5">
            <ArrowUpDown className="h-4 w-4 text-slate-500" />
            <label htmlFor="sort-select" className="text-xs font-medium text-slate-500">
              Sắp xếp:
            </label>
            <select
              id="sort-select"
              value={filters.sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div
            role="group"
            aria-label="Chế độ hiển thị"
            className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1"
          >
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filters.viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              Danh sách
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filters.viewMode === 'kanban'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Hàng 2: Bộ lọc kết hợp (Multi-Status, Multi-Priority, Deadline, Tag) */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-100 pt-3">
        {/* Lọc nhiều Status cùng lúc */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1">
            Trạng thái:
          </span>
          {ALL_STATUSES.map((status) => {
            const active = filters.statuses.includes(status);
            return (
              <button
                key={status}
                type="button"
                onClick={() => toggleStatusFilter(status)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                  active
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {TASK_STATUS_LABELS[status]}
              </button>
            );
          })}
        </div>

        {/* Lọc nhiều Priority cùng lúc */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1">
            Mức ưu tiên:
          </span>
          {ALL_PRIORITIES.map((priority) => {
            const active = filters.priorities.includes(priority);
            return (
              <button
                key={priority}
                type="button"
                onClick={() => togglePriorityFilter(priority)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                  active
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {TASK_PRIORITY_LABELS[priority]}
              </button>
            );
          })}
        </div>

        {/* Lọc theo khoảng Deadline */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 mr-1">
            <CalendarClock className="h-3.5 w-3.5" />
            Thời hạn:
          </span>
          {DEADLINE_OPTIONS.map((item) => {
            const active = filters.deadlineRange === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setDeadlineRange(item.value)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                  active
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Lọc theo Tag */}
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
            <Tag className="h-3.5 w-3.5" />
            Tag:
          </span>
          <select
            aria-label="Lọc theo tag"
            value={filters.tag}
            onChange={(e) => setTagFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Tất cả tag</option>
            {availableTags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hàng 3: Số lượng kết quả & Nút Xóa bộ lọc */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
        <div>
          Hiển thị{' '}
          <span className="font-bold text-slate-900">{filteredCount}</span> /{' '}
          <span className="font-semibold text-slate-800">{totalCount}</span> công
          việc
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              resetFilters();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            <FilterX className="h-3.5 w-3.5" />
            Xóa bộ lọc
          </button>
        )}
      </div>
    </section>
  );
}
