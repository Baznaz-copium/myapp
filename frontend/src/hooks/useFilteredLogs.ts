import { useMemo } from 'react';
import { MoneyLog } from '../types';

interface FilterParams {
  logs: MoneyLog[];
  search: string;
  filterType: string;
  filterSource: string;
  dateFrom: string;
  dateTo: string;
  period: 'all' | 'today' | 'week' | 'month';
}

export function useFilteredLogs({ logs, search, filterType, filterSource, dateFrom, dateTo, period }: FilterParams) {
  const now = new Date();
  let periodFrom = '';
  if (period === 'today') {
    periodFrom = now.toISOString().slice(0, 10);
  } else if (period === 'week') {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    periodFrom = weekStart.toISOString().slice(0, 10);
  } else if (period === 'month') {
    periodFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }

  return useMemo(() => {
    return logs.filter(log => {
      const matchesType = filterType === 'all' || log.type === filterType;
      const matchesSource = filterSource === 'all' || log.source === filterSource;
      const matchesSearch = !search || log.note.toLowerCase().includes(search.toLowerCase());
      const matchesDateFrom = !dateFrom || log.date >= dateFrom;
      const matchesDateTo = !dateTo || log.date <= dateTo;
      const matchesPeriod =
        period === 'all' ||
        (period === 'today' && log.date === periodFrom) ||
        (period === 'week' && log.date >= periodFrom) ||
        (period === 'month' && log.date >= periodFrom);

      return matchesType && matchesSource && matchesSearch && matchesDateFrom && matchesDateTo && matchesPeriod;
    });
  }, [logs, search, filterType, filterSource, dateFrom, dateTo, period]);
}
