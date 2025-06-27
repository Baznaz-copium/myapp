import { useState } from 'react';
import { Plus, Trash2, Pencil, X, Check, AlertTriangle, FileDown, BarChart3 } from 'lucide-react';
import { useMoneyLogs } from '../context/MoneyLogsContext';
import ReportsPage from './M_ReportsPage';
import toast, { Toaster } from 'react-hot-toast';


function MoneyLogsPage() {
  const { logs, addLog, removeLog, updateLog } = useMoneyLogs();
  const [form, setForm] = useState({ type: 'income', source: 'console', amount: '', note: '', recurring: false });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ type: 'income', source: 'console', amount: '', note: '', recurring: false });
  const [confirm, setConfirm] = useState<{ ids: number[]; show: boolean }>({ ids: [], show: false });
  const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showReports, setShowReports] = useState(false);


  // Add log
  const handleAddLog = async () => {
    if (!form.amount) return;
    await addLog({
      type: form.type as 'income' | 'outcome',
      source: form.source,
      amount: Number(form.amount),
      note: form.note,
      date: new Date().toISOString().slice(0, 10),
      recurring: form.recurring,
    });
    setForm({ type: 'income', source: 'console', amount: '', note: '', recurring: false });
    toast.success('Log added!');

  };

  // Remove log (with confirmation)
  const handleRemoveLog = (id: number) => {
    setConfirm({ ids: [id], show: true });
  };

  // Remove multiple logs (with confirmation)
  const handleBulkDelete = () => {
    setConfirm({ ids: [...selectedIds], show: true });
  };

  // Confirm delete action
  const confirmDelete = async () => {
    for (const id of confirm.ids) {
      const backup = logs.find(log => log.id === id);
      await removeLog(id);
      toast(
        t => (
          <span>
            Log deleted.
            <button
              onClick={async () => {
                if (backup) await addLog(backup);
                toast.dismiss(t.id);
              }}
              className="ml-2 underline text-blue-600"
            >
              Undo
            </button>
          </span>
        ),
        { duration: 4000 }
      );
    }
    setSelectedIds(ids => ids.filter(id => !confirm.ids.includes(id)));
    setConfirm({ ids: [], show: false });
    toast.error(
      confirm.ids.length > 1 ? 'Selected logs deleted!' : 'Log deleted!'
    );
  };

  // Cancel delete
  const cancelDelete = () => setConfirm({ ids: [], show: false });

  // Start editing
  const handleEdit = (log: any) => {
    setEditingId(log.id);
    setEditForm({
      type: log.type,
      source: log.source,
      amount: String(log.amount),
      note: log.note,
      recurring: !!log.recurring,
    });
  };

  // Save edit
  const handleSaveEdit = async (id: number) => {
    await updateLog(id, {
      ...editForm,
      type: editForm.type as 'income' | 'outcome',
      amount: Number(editForm.amount),
    });
    setEditingId(null);
    toast('Log updated!', { icon: '✏️' });
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
  };

  // Row selection
  const toggleSelect = (id: number) => {
    setSelectedIds(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    );
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Source', 'Amount', 'Note', 'Recurring'];
    const rows = filteredLogs.map(log => [
      log.date,
      log.type,
      log.source,
      log.amount,
      log.note,
      log.recurring ? 'Yes' : '',
    ]);
    const csvContent =
      [headers, ...rows]
        .map(row => row.map(String).map(v => `"${v.replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'money_logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Period filter logic
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

  // Filtering
  const filteredLogs = logs.filter(log => {
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

  // Pagination
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  // Summary (always use filteredLogs)
  const summaryIncome = filteredLogs.filter(l => l.type === 'income').reduce((sum, l) => sum + l.amount, 0);
  const summaryOutcome = filteredLogs.filter(l => l.type === 'outcome').reduce((sum, l) => sum + l.amount, 0);
  const netTotal = summaryIncome - summaryOutcome;
  const consoleIncome = filteredLogs.filter(l => l.type === 'income' && l.source === 'console').reduce((sum, l) => sum + l.amount, 0);
  const consumationIncome = filteredLogs.filter(l => l.type === 'income' && l.source === 'consumation').reduce((sum, l) => sum + l.amount, 0);
  const shopOutcome = filteredLogs.filter(l => l.type === 'outcome' && l.source === 'shop').reduce((sum, l) => sum + l.amount, 0);
  const workerOutcome = filteredLogs.filter(l => l.type === 'outcome' && l.source === 'worker').reduce((sum, l) => sum + l.amount, 0);
  // Clear filters
  const clearFilters = () => {
    setSearch('');
    setFilterType('all');
    setFilterSource('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };



  return (
    <div className="space-y-6">
      {/* Notification */}
      <Toaster position="top-right" />
      {/* Confirmation Modal */}
      {confirm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-700 w-full max-w-md flex flex-col items-center">
            <AlertTriangle className="w-12 h-12 text-yellow-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-100 mb-2">Are you sure?</h2>
            <p className="text-gray-300 mb-6">
              {confirm.ids.length > 1
                ? `You are about to delete ${confirm.ids.length} logs. This action cannot be undone.`
                : 'You are about to delete this log. This action cannot be undone.'}
            </p>
            <div className="flex gap-4">
              <button
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-semibold shadow"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={cancelDelete}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-semibold"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SummaryCard label="Total Income" value={summaryIncome} color="green" />
        <SummaryCard label="Total Outcome" value={summaryOutcome} color="red" />
        <SummaryCard label="Net Total" value={netTotal} color={netTotal >= 0 ? "green" : "red"} />
        <SummaryCard label="Console Income" value={consoleIncome} color="blue" />
        <SummaryCard label="Consumation Income" value={consumationIncome} color="purple" />
        <SummaryCard label="Shop Outcome" value={shopOutcome} color="orange" />
        <SummaryCard label="Worker Outcome" value={workerOutcome} color="pink" />
      </div>

      {/* Filters & Actions */}
      {!showReports && (
        <div className="flex flex-wrap  gap-3 bg-gray-900/60 p-4 rounded-xl border border-gray-700">
          {/* Left: Period + Actions */}
          <div className="flex flex-col lg:flex-row  lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex gap-1">
              <button
                onClick={() => setPeriod('all')}
                className={`px-3 py-1 rounded-lg text-sm font-semibold ${period === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
              >All Time</button>
              <button
                onClick={() => setPeriod('today')}
                className={`px-3 py-1 rounded-lg text-sm font-semibold ${period === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
              >Today</button>
              <button
                onClick={() => setPeriod('week')}
                className={`px-3 py-1 rounded-lg text-sm font-semibold ${period === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
              >Week</button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-3 py-1 rounded-lg text-sm font-semibold ${period === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
              >Month</button>
            </div>

          </div>
          {/* Right: Filters */}
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search note"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
            />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="outcome">Outcome</option>
            </select>
            <select
              value={filterSource}
              onChange={e => setFilterSource(e.target.value)}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
            >
              <option value="all">All Sources</option>
              <option value="console">Console</option>
              <option value="consumation">Consumation</option>
              <option value="shop">Shop</option>
              <option value="worker">Worker</option>
              <option value="expense">Expense</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
            />
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
            />
            <button
              onClick={clearFilters}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Clear
            </button>
            <button
              onClick={() => setShowReports(true)}
              className="flex items-center gap-1 bg-purple-700 hover:bg-purple-800 text-white px-3 py-2 rounded-lg"
            >
              <BarChart3 className="w-4 h-4" />
              Reports
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1 bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-lg"
            >
              <FileDown className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {showReports ? (
        <div className="bg-gray-900/80 border border-purple-700 rounded-xl p-6 mt-2">
          <button
            onClick={() => setShowReports(false)}
            className="mb-6 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
          >
            ← Back to Logs
          </button>
          <ReportsPage />
        </div>
      ) : (
        <>
          {/* Add Log Form */}
          <div className="flex flex-wrap  gap-3 bg-gray-900/60 p-4 rounded-xl border border-gray-700">
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
            >
              <option value="income">Income</option>
              <option value="outcome">Outcome</option>
            </select>
            <select
              value={form.source}
              onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
            >
              <option value="console">Console</option>
              <option value="consumation">Consumation</option>
              <option value="shop">Shop</option>
              <option value="worker">Worker</option>
              <option value="expense">Expense</option>
            </select>
            <input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
            />
            <input
              type="text"
              placeholder="Note"
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 flex-1"
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.recurring || false}
                onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))}
                className="ml-2"
                id="recurring"
              />
              <label htmlFor="recurring" className="ml-1 text-gray-300">Recurring</label>
            </div>
            <button
              onClick={handleAddLog}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>

          {/* Logs Table */}
          <div className="bg-gray-800/60 rounded-xl border border-gray-700 overflow-x-auto shadow">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-900/80 text-gray-300">
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Source</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Note</th>
                  <th className="px-4 py-2">Recurring</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map(log => {
                  const isSelected = selectedIds.includes(log.id);
                  return editingId === log.id ? (
                    <tr key={log.id} className="border-b border-gray-700 bg-blue-900/30">
                      <td className="px-4 py-2">
                        <input
                          type="date"
                          value={log.date}
                          disabled
                          className="bg-gray-700 text-white rounded-lg px-2 py-1 border border-gray-600"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={editForm.type}
                          onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
                          className="bg-gray-700 text-white rounded-lg px-2 py-1 border border-gray-600"
                        >
                          <option value="income">Income</option>
                          <option value="outcome">Outcome</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={editForm.source}
                          onChange={e => setEditForm(f => ({ ...f, source: e.target.value }))}
                          className="bg-gray-700 text-white rounded-lg px-2 py-1 border border-gray-600"
                        >
                          <option value="console">Console</option>
                          <option value="consumation">Consumation</option>
                          <option value="shop">Shop</option>
                          <option value="worker">Worker</option>
                          <option value="expense">Expense</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={editForm.amount}
                          onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                          className="bg-gray-700 text-white rounded-lg px-2 py-1 border border-gray-600"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editForm.note}
                          onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))}
                          className="bg-gray-700 text-white rounded-lg px-2 py-1 border border-gray-600"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={editForm.recurring}
                          onChange={e => setEditForm(f => ({ ...f, recurring: e.target.checked }))}
                        />
                      </td>
                      <td className="px-4 py-2 flex gap-2 justify-center">
                        <button
                          onClick={() => handleSaveEdit(log.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" /> 
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded flex items-center gap-1"
                        >
                          <X className="w-4 h-4" /> 
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr
                      key={log.id}
                      className={`border-b border-gray-700 hover:bg-blue-900/30 cursor-pointer transition-colors duration-100 ${isSelected ? 'bg-blue-700/40' : ''}`}
                      onClick={() => toggleSelect(log.id)}
                    >
                      <td className="px-4 py-2">{log.date}</td>
                      <td className={`px-4 py-2 font-bold ${log.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{log.type}</td>
                      <td className="px-4 py-2 capitalize">{log.source}</td>
                      <td className="px-4 py-2">{log.amount} DA</td>
                      <td className="px-4 py-2">{log.note}</td>
                      <td className="px-4 py-2">{log.recurring ? '♻️' : ''}</td>
                      <td className="px-4 py-2 flex gap-2 justify-center" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(log)}
                          className="text-blue-400 hover:text-blue-600"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveLog(log.id)}
                          className="text-red-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {paginatedLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 py-8">No logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bulk Delete Button */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow"
            >
              Delete Selected ({selectedIds.length})
            </button>
          )}

          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
            >
              Prev
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// SummaryCard component for cleaner code
function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-600/10 border-green-500 text-green-400',
    red: 'bg-red-600/10 border-red-500 text-red-400',
    blue: 'bg-blue-600/10 border-blue-500 text-blue-400',
    purple: 'bg-purple-600/10 border-purple-500 text-purple-400',
    orange: 'bg-orange-600/10 border-orange-500 text-orange-400',
    pink: 'bg-pink-600/10 border-pink-500 text-pink-400',
  };
  return (
    <div className={`rounded-xl p-4 text-center border shadow ${colorMap[color] || ''}`}>
      <div className="text-lg font-bold">{label}</div>
      <div className="text-2xl font-mono">{value} DA</div>
    </div>
  );
}

export default MoneyLogsPage;