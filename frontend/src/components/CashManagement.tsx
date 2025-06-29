import { useState, useRef } from 'react';
import { DollarSign, TrendingUp, Calendar, Download, BarChart3, Save, X, Pencil, Trash2 } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { useSettings } from '../context/SettingsContext';
import ReportsPage from './ReportsPage';
import {handleExportPDF} from '../hooks/ExportPDF';

function CashManagement() {
  const { transactions, updateTransaction, deleteTransaction } = useTransactions();
  const { settings } = useSettings();
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [showReports, setShowReports] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Helper for local date string
  const pad = (n: number) => n.toString().padStart(2, '0');
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  // Revenue calculations
  const todayRevenue = transactions
    .filter(t => t.createdAt && t.createdAt.startsWith(todayStr))
    .reduce((sum, t) => sum + Number(t.amountPaid || 0), 0);

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekRevenue = transactions
    .filter(t => t.createdAt && new Date(t.createdAt) >= weekStart)
    .reduce((sum, t) => sum + Number(t.amountPaid || 0), 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthRevenue = transactions
    .filter(t => t.createdAt && new Date(t.createdAt) >= monthStart)
    .reduce((sum, t) => sum + Number(t.amountPaid || 0), 0);

  // --- Filter Logic Extracted ---
  function filterTransactions() {
    return transactions.filter(transaction => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        (transaction.consoleName && transaction.consoleName.toLowerCase().includes(search)) ||
        (transaction.player_1 && transaction.player_1.toLowerCase().includes(search)) ||
        (transaction.player_2 && transaction.player_2.toLowerCase().includes(search));
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      const matchesPaymentMethod = paymentMethodFilter === 'all' || transaction.paymentMethod === paymentMethodFilter;

      let matchesPeriod = true;
      const transactionDate = new Date(transaction.createdAt);

      switch (selectedPeriod) {
        case 'today': {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          matchesPeriod = transactionDate >= today && transactionDate < tomorrow;
          break;
        }
        case 'week': {
          matchesPeriod = transactionDate >= weekStart;
          break;
        }
        case 'month': {
          matchesPeriod = transactionDate >= monthStart;
          break;
        }
        case 'range': {
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            matchesPeriod = transactionDate >= start && transactionDate <= end;
          }
          break;
        }
        default:
          break;
      }

      return matchesSearch && matchesStatus && matchesPaymentMethod && matchesPeriod;
    });
  }

  const filteredTransactions = filterTransactions();

  const totalRevenue = filteredTransactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amountPaid || 0), 0);

  const totalTransactions = filteredTransactions.length;
  const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Console', 'Customer', 'Duration', 'Amount', 'Payment Method', 'Status'].join(','),
      ...filteredTransactions.map(t => [
        new Date(t.createdAt).toLocaleDateString(),
        t.consoleName,
        t.player_1 || 'Anonymous',
        t.player_2 || 'Anonymous',
        formatDuration(t.duration),
        `${t.amountPaid} ${settings?.currency ?? ''}`,
        t.paymentMethod,
        t.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${selectedPeriod}_${todayStr}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // --- UI ---
  return (
    <div className="space-y-8 max-w-full mx-auto px-2 py-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" ref={exportRef}>
        <SummaryCard
          label="Today's Revenue"
          value={todayRevenue}
          color="green"
          icon={<TrendingUp className="w-6 h-6 text-green-400" />}
          currency={settings?.currency}
        />
        <SummaryCard
          label="This Week"
          value={weekRevenue}
          color="blue"
          icon={<Calendar className="w-6 h-6 text-blue-400" />}
          currency={settings?.currency}
        />
        <SummaryCard
          label="This Month"
          value={monthRevenue}
          color="purple"
          icon={<DollarSign className="w-6 h-6 text-purple-400" />}
          currency={settings?.currency}
        />
      </div>

<div className="flex flex-wrap gap-3 bg-gray-900/60 p-4 rounded-xl border border-gray-700 mb-8">
  {/* Period Button Group */}
  <div className="flex flex-col lg:flex-row lg:justify-between w-full space-y-4 lg:space-y-0">
    <div className="flex gap-1">
      {[
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
        { value: 'all', label: 'All Time' }
      ].map(btn => (
        <button
          key={btn.value}
          className={`px-3 py-1 rounded-lg text-sm font-semibold ${
            selectedPeriod === btn.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
          onClick={() => setSelectedPeriod(btn.value)}
        >
          {btn.label}
        </button>
      ))}
    </div>
  </div>

  {/* Filters and Actions */}
  <div className="flex flex-wrap gap-2 w-full">
    {/* Search */}
    <input
      type="text"
      placeholder="Search transactions"
      className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
    />

    {/* Type Filter (example, adjust options as needed) */}
    <select
      className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
      value={statusFilter}
      onChange={e => setStatusFilter(e.target.value)}
    >
      <option value="all">All Status</option>
      <option value="completed">Completed</option>
      <option value="ongoing">Ongoing</option>
      <option value="cancelled">Cancelled</option>
    </select>

    {/* Source Filter (example, adjust options as needed) */}
    <select
      className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
      value={paymentMethodFilter}
      onChange={e => setPaymentMethodFilter(e.target.value)}
    >
      <option value="all">Payment</option>
      <option value="cash">Cash</option>
      <option value="card">Card</option>
    </select>

    {/* Date Range */}
    <input
      type="date"
      className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
      value={customStartDate}
      onChange={e => {
        setCustomStartDate(e.target.value);
        setSelectedPeriod('range');
      }}
    />
    <input
      type="date"
      className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
      value={customEndDate}
      onChange={e => {
        setCustomEndDate(e.target.value);
        setSelectedPeriod('range');
      }}
    />

    {/* Clear Button */}
    <button
      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
      onClick={() => {
        setSearchTerm('');
        setStatusFilter('all');
        setPaymentMethodFilter('all');
        setCustomStartDate('');
        setCustomEndDate('');
        setSelectedPeriod('all');
      }}
    >
      Clear
    </button>

    {/* Reports Button */}
    <button
      className="flex items-center gap-1 bg-purple-700 hover:bg-purple-800 text-white px-3 py-2 rounded-lg"
      onClick={() => setShowReports((prev) => !prev)}
    >
      <BarChart3 className="w-4 h-4" />
      Reports
    </button>
    {/* Export Button */}
<div className="relative">
  <button
    className="flex items-center gap-1 bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-lg"
    onClick={() => setShowExportMenu((v) => !v)}
    type="button"
  >
    <Download className="w-4 h-4" />
    Export
  </button>
  {showExportMenu && (
    <div className="absolute right-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
      <button
        className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
        onClick={() => {
          setShowExportMenu(false);
          exportTransactions(); // CSV export 
        }}
      >
        Export CSV
      </button>
      <button
        className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
            onClick={() => {
              setShowExportMenu(false);
              if (exportRef.current) {
                handleExportPDF(
                  exportRef.current,
                  `transactions_${new Date().toISOString().slice(0, 10)}.pdf`
                );
        }
      }}
      >
        Export PDF
      </button>
    </div>
  )}
</div>
  </div>
</div>

      {/* Conditional Report Section */}
      {showReports && (
        <div className="mt-6">
          <ReportsPage />
        </div>
      )}
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" ref={exportRef}>
        <SummaryStat label="Total Revenue" value={totalRevenue} color="yellow" currency={settings?.currency} />
        <SummaryStat label="Total Transactions" value={totalTransactions} color="blue" />
        <SummaryStat label="Average Transaction" value={averageTransaction} color="green" currency={settings?.currency} />
      </div>

      {/* Transactions Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden" ref={exportRef}>
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-400" />
            Transaction History
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] whitespace-nowrap">
            <thead className="bg-gray-700/50">
              <tr>
                <TableHeader label="Date" />
                <TableHeader label="Console" />
                <TableHeader label="Player 1" />
                <TableHeader label="Player 2" />
                <TableHeader label="Duration" />
                <TableHeader label="Amount" />
                <TableHeader label="Payment" />
                <TableHeader label="Status" />
                <TableHeader label="Actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-700/30">
                  {editingId === transaction.id ? (
                    <EditRow
                      editValues={editValues}
                      setEditValues={setEditValues}
                      onSave={async () => {
                        await updateTransaction(transaction.id, {
                          createdAt: editValues.createdAt,
                          consoleName: editValues.consoleName,
                          player_1: editValues.player_1,
                          player_2: editValues.player_2,
                          duration: editValues.duration,
                          amountPaid: editValues.amountPaid,
                          paymentMethod: editValues.paymentMethod,
                          status: editValues.status,
                          id: transaction.id
                        });
                        setEditingId(null);
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <DisplayRow
                      transaction={transaction}
                      formatDuration={formatDuration}
                      settings={settings}
                      onEdit={() => {
                        setEditingId(transaction.id);
                        setEditValues(transaction);
                      }}
                      onDelete={() => setDeleteId(transaction.id)}
                    />
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-500 opacity-50" />
              <p className="text-gray-400">No transactions found for the selected filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <DeleteModal
          onDelete={async () => {
            if (deleteTransaction) {
              await deleteTransaction(deleteId);
            }
            setDeleteId(null);
          }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

// --- UI Helper Components ---
type SummaryStatColor = 'yellow' | 'blue' | 'green';

interface SummaryStatProps {
  label: string;
  value: number;
  color: SummaryStatColor;
  currency?: string;
}

type SummaryCardColor = 'green' | 'blue' | 'purple';

interface SummaryCardProps {
  label: string;
  value: number;
  color: SummaryCardColor;
  icon: React.ReactNode;
  currency?: string;
}

function SummaryCard({ label, value, color, icon, currency }: SummaryCardProps) {
  const colorClass = {
    green: 'text-green-400 bg-green-500/20',
    blue: 'text-blue-400 bg-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/20'
  }[color] || '';
  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className={`text-3xl font-bold ${colorClass}`}>{Number(value).toFixed(0)} {currency}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}



function SummaryStat({ label, value, color, currency }: SummaryStatProps) {
  const colorClassMap: Record<SummaryStatColor, string> = {
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
    green: 'text-green-400'
  };
  const colorClass = colorClassMap[color] || '';
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
      <div className="text-center">
        <p className="text-sm text-gray-400">{label}</p>
        <p className={`text-2xl font-bold ${colorClass}`}>{Number(value).toFixed(0)} {currency}</p>
      </div>
    </div>
  );
}

function TableHeader({ label }: any) {
  return (
    <th className="px-4 sm:px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">{label}</th>
  );
}

function EditRow({ editValues, setEditValues, onSave, onCancel }: any) {
  return (
    <>
      <td className="px-4 sm:px-6 py-4" >
        <input
          type="datetime-local"
          value={
            editValues.createdAt
              ? new Date(editValues.createdAt).toISOString().slice(0, 16)
              : ''
          }
          onChange={e =>
            setEditValues({
              ...editValues,
              createdAt: new Date(e.target.value).toISOString().slice(0, 19).replace('T', ' ')
            })
          }
          className="bg-gray-700 text-white rounded px-2 py-1 w-full"
        />
      </td>
      <td className="px-4 sm:px-6 py-4">
        <input
          type="text"
          value={editValues.consoleName}
          onChange={e => setEditValues({ ...editValues, consoleName: e.target.value })}
          className="bg-gray-700 text-white rounded px-2 py-1 w-full"
        />
      </td>
      <td className="px-4 sm:px-6 py-4">
        <input
          type="text"
          value={editValues.player_1}
          onChange={e => setEditValues({ ...editValues, player_1: e.target.value })}
          className="bg-gray-700 text-white rounded px-2 py-1 w-full"
        />
      </td>
      <td className="px-4 sm:px-6 py-4">
        <input
          type="text"
          value={editValues.player_2}
          onChange={e => setEditValues({ ...editValues, player_2: e.target.value })}
          className="bg-gray-700 text-white rounded px-2 py-1 w-full"
        />
      </td>
      <td className="px-4 sm:px-6 py-4">
        <input
          type="number"
          min={1}
          value={editValues.duration}
          onChange={e => setEditValues({ ...editValues, duration: Number(e.target.value) })}
          className="bg-gray-700 text-white rounded px-2 py-1 w-full"
        />
      </td>
      <td className="px-4 sm:px-6 py-4">
        <input
          type="number"
          min={0}
          value={editValues.amountPaid}
          onChange={e => setEditValues({ ...editValues, amountPaid: Number(e.target.value) })}
          className="bg-gray-700 text-white rounded px-2 py-1 w-full"
        />
      </td>
      <td className="px-4 sm:px-6 py-4">
        <select
          value={editValues.paymentMethod}
          onChange={e => setEditValues({ ...editValues, paymentMethod: e.target.value })}
          className="bg-gray-700 text-white rounded px-2 py-1 w-full"
        >
          <option value="">....</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
        </select>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <select
          value={editValues.status}
          onChange={e => setEditValues({ ...editValues, status: e.target.value })}
          className="bg-gray-700 text-white rounded px-2 py-1 w-full"
        >
          <option value="completed">Completed</option>
          <option value="ongoing">Ongoing</option>
          <option value="stopped">Stopped</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </td>
      <td className="px-4 sm:px-6 py-4 flex gap-2">
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded"
          onClick={onSave}
        >
          <Save className="w-3 h-3 mx-auto" />
        </button>
        <button
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded"
          onClick={onCancel}
        >
          <X className="w-3 h-3 mx-auto " />
        </button>
      </td>
    </>
  );
}

function DisplayRow({ transaction, formatDuration, settings, onEdit, onDelete }: any) {
  return (
    <>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {new Date(transaction.createdAt).toLocaleDateString()}
        <br />
        <span className="text-xs text-gray-500">
          {new Date(transaction.createdAt).toLocaleTimeString()}
        </span>
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-white">
        {transaction.consoleName}
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {transaction.player_1 || 'Anonymous'}
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {transaction.player_2 || 'Anonymous'}
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {formatDuration(transaction.duration)}
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-yellow-400">
        {Number(transaction.amountPaid).toFixed(0)} {settings?.currency}
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        <span className={`px-2 py-1 rounded-full text-xs ${
          transaction.paymentMethod === 'cash'
            ? 'bg-green-500/20 text-green-400'
            : 'bg-blue-500/20 text-blue-400'
        }`}>
          {transaction.paymentMethod?.toUpperCase()}
        </span>
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
        <span className={`px-2 py-1 rounded-full text-xs ${
          transaction.status === 'completed'
            ? 'bg-green-500/20 text-green-400'
            : transaction.status === 'ongoing'
            ? 'bg-yellow-500/20 text-yellow-400'
            : 'bg-red-500/20 text-red-400'
        }`}>
          {transaction.status?.toUpperCase()}
        </span>
      </td>
      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm flex gap-2">
        <button
          className="text-blue-400 hover:text-blue-600"
          onClick={onEdit}
          title="Edit"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          className="text-red-400 hover:text-red-600"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </>
  );
}

function DeleteModal({ onDelete, onCancel }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-96 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Delete Transaction</h3>
        <p className="text-gray-300 mb-6">Are you sure you want to delete this transaction?</p>
        <div className="flex gap-3">
          <button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
            onClick={onDelete}
          >
            Delete
          </button>
          <button
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default CashManagement;