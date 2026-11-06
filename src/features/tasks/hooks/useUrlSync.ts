import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTaskStore } from '../store/useTaskStore';
import type {
  DeadlineFilter,
  SortOption,
  TaskFilterState,
  TaskPriority,
  TaskStatus,
  ViewMode,
} from '../types/task';

const VALID_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done'];
const VALID_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
const VALID_DEADLINES: DeadlineFilter[] = [
  'all',
  'today',
  'this_week',
  'overdue',
];
const VALID_SORTS: SortOption[] = [
  'deadline_asc',
  'created_desc',
  'priority_desc',
  'updated_desc',
];
const VALID_VIEWS: ViewMode[] = ['list', 'kanban'];

export function useUrlSync(): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useTaskStore((s) => s.filters);
  const setFiltersBulk = useTaskStore((s) => s.setFiltersBulk);
  const isHydratedRef = useRef(false);

  useEffect(() => {
    if (isHydratedRef.current) return;
    isHydratedRef.current = true;

    const hasUrlParams = Array.from(searchParams.keys()).length > 0;
    if (!hasUrlParams) return;

    const patch: Partial<TaskFilterState> = {};

    const q = searchParams.get('q');
    if (q !== null) patch.search = q;

    const statusParam = searchParams.get('status');
    if (statusParam) {
      const parsed = statusParam
        .split(',')
        .filter((s): s is TaskStatus => VALID_STATUSES.includes(s as TaskStatus));
      patch.statuses = parsed;
    }

    const priorityParam = searchParams.get('priority');
    if (priorityParam) {
      const parsed = priorityParam
        .split(',')
        .filter((p): p is TaskPriority =>
          VALID_PRIORITIES.includes(p as TaskPriority)
        );
      patch.priorities = parsed;
    }

    const tagParam = searchParams.get('tag');
    if (tagParam !== null) patch.tag = tagParam;

    const deadlineParam = searchParams.get('deadline');
    if (
      deadlineParam &&
      VALID_DEADLINES.includes(deadlineParam as DeadlineFilter)
    ) {
      patch.deadlineRange = deadlineParam as DeadlineFilter;
    }

    const sortParam = searchParams.get('sort');
    if (sortParam && VALID_SORTS.includes(sortParam as SortOption)) {
      patch.sortBy = sortParam as SortOption;
    }

    const viewParam = searchParams.get('view');
    if (viewParam && VALID_VIEWS.includes(viewParam as ViewMode)) {
      patch.viewMode = viewParam as ViewMode;
    }

    if (Object.keys(patch).length > 0) {
      setFiltersBulk(patch);
    }
  }, [searchParams, setFiltersBulk]);

  useEffect(() => {
    if (!isHydratedRef.current) return;

    const nextParams = new URLSearchParams();

    if (filters.viewMode !== 'list') {
      nextParams.set('view', filters.viewMode);
    }
    if (filters.search.trim()) {
      nextParams.set('q', filters.search.trim());
    }
    if (filters.statuses.length > 0) {
      nextParams.set('status', filters.statuses.join(','));
    }
    if (filters.priorities.length > 0) {
      nextParams.set('priority', filters.priorities.join(','));
    }
    if (filters.tag.trim()) {
      nextParams.set('tag', filters.tag.trim());
    }
    if (filters.deadlineRange !== 'all') {
      nextParams.set('deadline', filters.deadlineRange);
    }
    if (filters.sortBy !== 'deadline_asc') {
      nextParams.set('sort', filters.sortBy);
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [filters, searchParams, setSearchParams]);
}
