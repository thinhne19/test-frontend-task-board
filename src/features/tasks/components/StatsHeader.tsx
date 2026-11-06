import { memo } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  Clock4,
  Layers,
  ListTodo,
  TrendingUp,
} from 'lucide-react';
import type { TaskBoardStats } from '../utils/taskFilters';

interface StatsHeaderProps {
  stats: TaskBoardStats;
}

export const StatsHeader = memo(function StatsHeader({ stats }: StatsHeaderProps) {
  const cards = [
    {
      label: 'Tổng công việc',
      value: stats.total,
      icon: Layers,
      accent: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      label: 'Cần làm (Todo)',
      value: stats.todo,
      icon: ListTodo,
      accent: 'text-slate-700 bg-slate-100 border-slate-200',
    },
    {
      label: 'Đang thực hiện',
      value: stats.inProgress,
      icon: Clock4,
      accent: 'text-sky-700 bg-sky-50 border-sky-100',
    },
    {
      label: 'Hoàn thành',
      value: stats.done,
      icon: CheckCircle2,
      accent: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    },
    {
      label: 'Quá hạn',
      value: stats.overdue,
      icon: AlertOctagon,
      accent:
        stats.overdue > 0
          ? 'text-rose-700 bg-rose-50 border-rose-200'
          : 'text-slate-600 bg-slate-50 border-slate-200',
    },
    {
      label: 'Tỉ lệ hoàn thành',
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      accent: 'text-violet-700 bg-violet-50 border-violet-100',
    },
  ];

  return (
    <section
      aria-label="Thống kê nhanh"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
    >
      {cards.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs transition hover:border-slate-300"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.accent}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-500">
                {item.label}
              </p>
              <p className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">
                {item.value}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
});
