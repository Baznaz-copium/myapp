import { useMemo, useRef, useState } from 'react';
import { useMoneyLogs } from '../context/MoneyLogsContext';
import html2pdf from 'html2pdf.js';

import {
  PieChart as RPieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const GROUP_OPTIONS = [
  { value: 'day', label: 'By Day' },
  { value: 'week', label: 'By Week' },
  { value: 'month', label: 'By Month' },
  { value: 'source', label: 'By Source' },
] as const;

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#f87171', '#a78bfa', '#facc15', '#60a5fa', '#34d399'];

function formatDate(dateStr: string) {
  // Handles both '2025-07-20T23:00:00.000Z' and '2025-07-20'
  return dateStr ? dateStr.split('T')[0] : '';
}

function ReportsPage() {
  const { logs } = useMoneyLogs();
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'source'>('day');
  const [showCharts, setShowCharts] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  // Grouped stats for table
  const getWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const firstDay = new Date(year, 0, 1);
    const days = Math.floor((date.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((days + firstDay.getDay() + 1) / 7);
    return `${year}-W${String(week).padStart(2, '0')}`;
  };
  const getMonth = (dateStr: string) => dateStr.slice(0, 7);

  const groupedStats = useMemo(() => {
    const stats: Record<string, { income: number; outcome: number; net: number }> = {};
    logs.forEach(log => {
      let key = '';
      if (groupBy === 'day') key = formatDate(log.date);
      else if (groupBy === 'week') key = getWeek(log.date);
      else if (groupBy === 'month') key = getMonth(log.date);
      else if (groupBy === 'source') key = log.source;
      if (!stats[key]) stats[key] = { income: 0, outcome: 0, net: 0 };
      if (log.type === 'income') stats[key].income += log.amount;
      if (log.type === 'outcome') stats[key].outcome += log.amount;
      stats[key].net = stats[key].income - stats[key].outcome;
    });
    let entries = Object.entries(stats);
    entries = groupBy === 'source'
      ? entries.sort((a, b) => a[0].localeCompare(b[0]))
      : entries.sort((a, b) => b[0].localeCompare(a[0]));
    return entries.map(([key, stat]) => ({ key, ...stat }));
  }, [logs, groupBy]);

  // Pie chart data
  const pieData = useMemo(() => {
    const sources: Record<string, { income: number; outcome: number }> = {};
    logs.forEach(log => {
      if (!sources[log.source]) sources[log.source] = { income: 0, outcome: 0 };
      if (log.type === 'income') sources[log.source].income += log.amount;
      if (log.type === 'outcome') sources[log.source].outcome += log.amount;
    });
    return Object.entries(sources).map(([source, v]) => ({
      name: source,
      value: v.income + v.outcome,
    }));
  }, [logs]);

  // Bar chart data
  const barData = useMemo(() => {
    const months: Record<string, number> = {};
    logs.forEach(log => {
      const m = getMonth(log.date);
      if (!months[m]) months[m] = 0;
      months[m] += log.type === 'income' ? log.amount : -log.amount;
    });
    return Object.entries(months)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, net]) => ({ month, net }));
  }, [logs]);

  // Line chart data
  const lineData = useMemo(() => {
    let sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    let total = 0;
    return sorted.map(log => {
      total += log.type === 'income' ? log.amount : -log.amount;
      return { date: formatDate(log.date), net: total };
    });
  }, [logs]);

  // Summary
  const summaryIncome = logs.filter(l => l.type === 'income').reduce((sum, l) => sum + l.amount, 0);
  const summaryOutcome = logs.filter(l => l.type === 'outcome').reduce((sum, l) => sum + l.amount, 0);
  const netTotal = summaryIncome - summaryOutcome;

  // PDF Download
  const handleDownloadPDF = () => {
    if (reportRef.current) {
      html2pdf().from(reportRef.current).set({
        margin: 0.5,
        filename: 'financial-report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      }).save();
    }
  };

  return (
    <div className="space-y-10 px-2 sm:px-4 pb-16">
      {/* Header & Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-purple-300">📊 Financial Reports</h1>
        <div className="flex gap-2 flex-wrap">
          {GROUP_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setGroupBy(opt.value)}
              className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-100 ${
                groupBy === opt.value
                  ? 'bg-purple-700 text-white shadow'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={handleDownloadPDF}
            className="bg-blue-700 hover:bg-blue-800 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm"
          >
            📄 Download PDF
          </button>
          <button
            className="sm:hidden bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg font-semibold text-xs"
            onClick={() => setShowCharts(v => !v)}
          >
            {showCharts ? 'Hide Charts' : 'Show Charts'}
          </button>
        </div>
      </div>

      <div ref={reportRef}>
        {/* Summary Bar */}
        <div className="flex flex-wrap gap-4 justify-center mb-4">
          <div className="bg-green-800/80 text-green-200 px-4 py-2 rounded-lg font-bold text-xs sm:text-base">Total Income: {summaryIncome.toFixed(2)} DA</div>
          <div className="bg-red-800/80 text-red-200 px-4 py-2 rounded-lg font-bold text-xs sm:text-base">Total Outcome: {summaryOutcome.toFixed(2)} DA</div>
          <div className={`px-4 py-2 rounded-lg font-bold text-xs sm:text-base ${netTotal >= 0 ? 'bg-green-700/80 text-green-100' : 'bg-red-700/80 text-red-100'}`}>
            Net: {netTotal.toFixed(2)} DA
          </div>
        </div>

        {/* Charts Section */}
        {showCharts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-900/70 p-4 sm:p-6 rounded-xl shadow-xl border border-gray-700">
            <h2 className="text-lg font-bold text-white mb-4 text-center">🥧 Income vs Outcome by Source</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RPieChart>
                <Pie dataKey="value" data={pieData} outerRadius={100} label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </RPieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-900/70 p-4 sm:p-6 rounded-xl shadow-xl border border-gray-700">
            <h2 className="text-lg font-bold text-white mb-4 text-center">📈 Net by Month</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="net" fill="#38bdf8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}

        {/* Line Chart */}
        {showCharts && (
        <div className="bg-gray-900/70 p-4 sm:p-6 rounded-xl shadow-xl border border-gray-700 mt-8">
          <h2 className="text-lg font-bold text-white mb-4 text-center">📊 Cumulative Net Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Line type="monotone" dataKey="net" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        )}

        {/* Table Section */}
        <div className="bg-gray-900/70 p-4 sm:p-6 rounded-xl shadow-xl border border-gray-700 overflow-x-auto mt-8">
          <h2 className="text-lg font-bold text-white mb-4">📅 Grouped Summary</h2>
          <table className="w-full min-w-[600px] text-left text-xs sm:text-sm text-white">
            <thead>
              <tr className="bg-gray-800 text-purple-300">
                <th className="px-2 sm:px-4 py-2 capitalize">
                  {groupBy === 'source' ? 'Source' : groupBy}
                </th>
                <th className="px-2 sm:px-4 py-2">Income</th>
                <th className="px-2 sm:px-4 py-2">Outcome</th>
                <th className="px-2 sm:px-4 py-2">Net</th>
              </tr>
            </thead>
            <tbody>
              {groupedStats.length > 0 ? (
                groupedStats.map(stat => (
                  <tr key={stat.key} className="border-b border-gray-700 hover:bg-gray-800/40">
                    <td className="px-2 sm:px-4 py-2">
                      {groupBy === 'day' || groupBy === 'week' || groupBy === 'month'
                        ? stat.key
                        : <span className="inline-block px-2 py-1 rounded bg-blue-900 text-blue-200 font-bold">{stat.key}</span>
                      }
                    </td>
                    <td className="px-2 sm:px-4 py-2 text-green-400">{stat.income.toFixed(2)} DA</td>
                    <td className="px-2 sm:px-4 py-2 text-red-400">{stat.outcome.toFixed(2)} DA</td>
                    <td className={`px-2 sm:px-4 py-2 font-bold ${stat.net >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {stat.net.toFixed(2)} DA <span>{stat.net >= 0 ? '📈' : '📉'}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-6">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;