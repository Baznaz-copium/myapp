import { useRef, useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, X, Check, AlertTriangle, FileDown, Search, BarChart3, ShoppingCart, Gamepad2, Cookie, User, Trash } from 'lucide-react';
import { useMoneyLogs } from '../context/MoneyLogsContext';
import ReportsPage from './M_ReportsPage';
import toast, { Toaster } from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';


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
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [swipingId, setSwipingId] = useState<number | null>(null);
  const [swipeDelta, setSwipeDelta] = useState(0);
  const touchStartXRef = useRef(0);
  const { settings } = useSettings();

    useEffect(() => {
    if (confirm.show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [confirm.show]);

  // Play sound effect if enabled in settings
  const playSound = () => {
    if (settings?.soundEffects) {
      const audio = new Audio('/sounds/click.wav'); // Put your sound in /public/sounds/
      audio.play();
    }
  };
  // Play sound effect if enabled in settings
  const DeleteSound = () => {
    if (settings?.soundEffects) {
      const audio = new Audio('/sounds/delete.mp3'); // Put your sound in /public/sounds/
      audio.play();
    }
  };
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
  <>
    {/* Confirmation Modal */}      
    {confirm.show && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
        <div className="bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-700 w-full max-w-md flex flex-col items-center">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-100 mb-2">Are you sure?</h2>
          <p className="text-gray-300 mb-6 text-center">
            {confirm.ids.length === 1 ? (() => {
              const log = logs.find(l => l.id === confirm.ids[0]);
              if (!log) return null;
              const sign = log.type === 'income' ? '+' : '-';
              return (
                <>
                  You are about to delete <span className={log.type === 'income' ? 'text-green-400' : 'text-red-400'}>{sign}{Number(log.amount).toFixed(2)} DA</span>. This action cannot be undone.
                </>
              );
            })() : (
              <>
                You are about to delete <span className="font-bold">{confirm.ids.length}</span> logs. This action cannot be undone.
              </>
            )}
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
    {/* Main Content */}
    <div className="space-y-6 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      {/* Notification */}
      <Toaster position="top-right" />

      {/* Summary Cards */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-4 gap-6 min-w-[900px]">
          <SummaryCard label="Total Income" value={summaryIncome} color="green" icon={<ShoppingCart className="w-10 h-10 text-green-400" />} />
          <SummaryCard label="Total Outcome" value={summaryOutcome} color="red" icon={<Trash2 className="w-10 h-10 text-red-400" />} />
          <SummaryCard label="Net Total" value={netTotal} color={netTotal >= 0 ? "green" : "red"} icon={<BarChart3 className={`w-10 h-10 ${netTotal >= 0 ? "text-green-400" : "text-red-400"}`} />} />
          <SummaryCard label="Console Income" value={consoleIncome} color="blue" icon={<Gamepad2 className="w-10 h-10 text-blue-400" />} />
          <SummaryCard label="Consumation Income" value={consumationIncome} color="purple" icon={<Cookie className="w-10 h-10 text-purple-400" />} />
          <SummaryCard label="Shop Outcome" value={shopOutcome} color="orange" icon={<ShoppingCart className="w-10 h-10 text-orange-400" />} />
          <SummaryCard label="Worker Outcome" value={workerOutcome} color="pink" icon={<User className="w-10 h-10 text-pink-400" />} />
        </div>
      </div>

      {/* Top Actions */}
      {!showReports && (
        <div className="flex justify-between items-center w-full flex-wrap gap-3 bg-gray-900/60 p-4 rounded-xl border border-gray-700">
          {/* Left: Filters & Add */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(f => !f)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {showFilters ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              {showFilters ? "Hide Filters" : "Filters"}
            </button>
            <button
              onClick={() => setShowAddForm(f => !f)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAddForm ? "Hide Add" : "Add"}
            </button>
          </div>
          {/* Right: Export & Reports */}
          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg"
            >
              <FileDown className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowReports(true)}
              className="flex items-center gap-1 bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-lg"
            >
              <BarChart3 className="w-4 h-4" />
              Reports
            </button>
          </div>
            {/* Filters & Actions */}
            {!showReports && showFilters && (
              <div className="flex flex-wrap gap-3 bg-gray-900/60 p-4 rounded-xl border border-gray-700">
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
                </div>
              </div>
            )}
            {/* Add Log Form */}
            {!showReports && showAddForm && (
              <div className="flex flex-wrap gap-3 bg-gray-900/60 p-4 rounded-xl border border-gray-700">
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
                  onClick={() => { handleAddLog(); playSound(); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            )}
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
      {/* Bulk Actions */}
      {/* Logs Table */}
{/* Logs as Cards */}
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
  {paginatedLogs.map(log => {
    const isSelected = selectedIds.includes(log.id);

    // Choose icon based on source
    const sourceIcon =
      log.source === 'console' ? <Gamepad2 className="w-7 h-7 text-blue-400" /> :
      log.source === 'shop' ? <ShoppingCart className="w-7 h-7 text-orange-400" /> :
      log.source === 'consumation' ? <Cookie className="w-7 h-7 text-purple-400" /> :
      log.source === 'worker' ? <User className="w-7 h-7 text-pink-400" /> :
      <BarChart3 className="w-7 h-7 text-gray-400" />;

    // Swipe gesture handlers

    const handleTouchStart = (e: React.TouchEvent) => {
      setSwipingId(log.id);
      setSwipeDelta(0);
      touchStartXRef.current = e.changedTouches[0].screenX;
    };
    const handleTouchMove = (e: React.TouchEvent) => {
      if (swipingId === log.id) {
        const currentX = e.changedTouches[0].screenX;
        setSwipeDelta(currentX - touchStartXRef.current);
      }
    };
    const handleTouchEnd = () => {
      if (swipingId === log.id) {
        if (swipeDelta > 80) {
          setSwipingId(null);
          setSwipeDelta(0);
          handleEdit(log);
        } else if (swipeDelta < -80) {
          setSwipingId(null);
          setSwipeDelta(0);
          handleRemoveLog(log.id);
        } else {
          setSwipingId(null);
          setSwipeDelta(0);
        }
      }
    };

    // Edit mode
    if (editingId === log.id) {
      return (
        <div
          key={log.id}
          className="relative bg-blue-900/30 rounded-xl border border-blue-700 shadow p-4 flex flex-col gap-2 transition hover:scale-[1.02] z-10"
        >
          <div className="flex items-center gap-2 mb-2">
            {sourceIcon}
            <input
              type="number"
              value={editForm.amount}
              onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
              className="bg-gray-700 text-white rounded-lg px-2 py-1 border border-gray-600 w-24 font-bold text-lg"
            />
            <span className="ml-auto text-xs text-gray-400">{log.date && log.date.split('T')[0]}</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={editForm.type}
              onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
              className="bg-gray-700 text-white rounded-lg px-2 py-1 border border-gray-600"
            >
              <option value="income">Income</option>
              <option value="outcome">Outcome</option>
            </select>
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
            <input
              type="checkbox"
              checked={editForm.recurring}
              onChange={e => setEditForm(f => ({ ...f, recurring: e.target.checked }))}
              className="ml-2"
              id={`recurring-edit-${log.id}`}
            />
            <label htmlFor={`recurring-edit-${log.id}`} className="ml-1 text-gray-300 text-xs">Recurring</label>
          </div>
          <input
            type="text"
            value={editForm.note}
            onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))}
            className="bg-gray-700 text-white rounded-lg px-2 py-1 border border-gray-600 mt-2"
            placeholder="Note"
          />
          <div className="flex gap-2 justify-end mt-2">
            <button
              onClick={() => { handleSaveEdit(log.id); playSound(); }}
              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded flex items-center gap-1"
            >
              <Check className="w-4 h-4" /> Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded flex items-center gap-1"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      );
    }

    // Normal card
    return (
      <div
        key={log.id}
        className={`relative bg-gray-800/80 rounded-xl border border-gray-700 shadow p-4 flex flex-col gap-2 transition hover:scale-[1.02] cursor-pointer ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
        onClick={() => toggleSelect(log.id)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: swipingId === log.id && swipeDelta !== 0 ? `translateX(${swipeDelta}px)` : undefined,
          transition: swipeDelta === 0 ? 'transform 0.2s' : 'none',
          zIndex: swipingId === log.id ? 20 : 1,
        }}
      >
        {/* Swipe Action Overlay - OUTSIDE CARD */}
        {swipingId === log.id && swipeDelta > 40 && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 flex items-center px-4 py-2 bg-green-700 rounded-xl shadow-lg z-30">
            <Check className="w-6 h-6 text-white" />
            <span className="ml-2 text-white font-bold">Edit</span>
          </div>
        )}
        {swipingId === log.id && swipeDelta < -40 && (
          <div className="absolute right-full top-1/2 -translate-y-1/2 flex items-center px-4 py-2 bg-red-700 rounded-xl shadow-lg z-30">
            <Trash2 className="w-6 h-6 text-white" />
            <span className="ml-2 text-white font-bold">Delete</span>
          </div>
        )}
        <div className="flex items-center gap-2 mb-2">
          {sourceIcon}
          <span className={`font-bold text-lg ${log.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
            {log.type === 'income' ? '+' : '-'}{Number(log.amount).toFixed(2)} DA
          </span>
          <span className="ml-auto text-xs text-gray-400">{log.date && log.date.split('T')[0]}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="capitalize text-white font-semibold">{log.source}</span>
          <span className={`px-2 py-1 rounded text-xs font-bold ${log.type === 'income' ? 'bg-green-700 text-green-200' : 'bg-red-700 text-red-200'}`}>
            {log.type}
          </span>
          {log.recurring && <span className="ml-2 text-green-400">♻️</span>}
          <span className="flex gap-2 ml-auto">
            <button
              onClick={e => { e.stopPropagation(); handleEdit(log); }}
              className="text-blue-400 hover:text-blue-600"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); handleRemoveLog(log.id); DeleteSound(); }}
              className="text-red-400 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </span>
        </div>
        <div className="text-gray-300 text-sm">{log.note}</div>
      </div>
    );
  })}
  {paginatedLogs.length === 0 && (
    <div className="col-span-full text-center text-gray-400 py-8 bg-gray-800/60 rounded-xl">
      No logs found.
    </div>
  )}
</div>      
      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
        >
          Prev
        </button>
        <span className='text-white'>Page {page} of {totalPages}</span>
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
    {/* Bulk Delete Button on desktop */}
    {selectedIds.length > 0 && (
      <button
        className="fixed bottom-8 right-8 bg-red-700 hover:bg-red-800 text-white p-4 rounded-full shadow-lg flex items-center justify-center z-50 hidden md:flex"
        onClick={handleBulkDelete}
        title="Delete Selected"
      >
        <Trash2 className="w-7 h-7" />
        ({selectedIds.length})
      </button>
    )}
  </div>

    {/* Bulk Delete Button on mobile */}
      {selectedIds.length > 0 && (
      <button
        className="fixed bottom-10 right-10 bg-red-700 hover:bg-red-800 text-white p-4 rounded-full shadow-lg flex items-center justify-center z-50 md:hidden"
        onClick={() => { handleBulkDelete(); DeleteSound(); }}
        title="Delete Selected"
      >
        <Trash2 className="w-5 h-5" />
        ({selectedIds.length})
      </button>
    )}
    </>
);
}

function SummaryCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-600/10 border-green-500',
    red: 'bg-red-600/10 border-red-500',
    blue: 'bg-blue-600/10 border-blue-500',
    purple: 'bg-purple-600/10 border-purple-500',
    orange: 'bg-orange-600/10 border-orange-500',
    pink: 'bg-pink-600/10 border-pink-500',
  };
  return (
    <div className={`rounded-xl p-5 flex flex-col items-center border shadow ${colorMap[color] || ''}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-2xl font-bold text-white">{value} DA</span>
      </div>
      <div className="w-full">
        <div className="text-xs text-gray-200 uppercase tracking-widest text-center truncate">{label}</div>
      </div>
    </div>
  );
}

export default MoneyLogsPage;