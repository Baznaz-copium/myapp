import { useState } from 'react';
import { DollarSign, TrendingUp, Calendar, Search, Download, BarChart3, Save, X, Pencil, Trash2 } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { useSettings } from '../context/SettingsContext';
import ReportsPage from './ReportsPage'; 

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

  // Helper for local date string
  const pad = (n: number) => n.toString().padStart(2, '0');
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  // Revenue calculations
  const todayRevenue = transactions
    .filter(t => t.createdAt && t.createdAt.startsWith(todayStr))
    .reduce((sum, t) => sum + Number(t.amountPaid || 0), 0);

  // Week revenue (from last Sunday)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekRevenue = transactions
    .filter(t => t.createdAt && new Date(t.createdAt) >= weekStart)
    .reduce((sum, t) => sum + Number(t.amountPaid || 0), 0);

  // Month revenue (from 1st of month)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthRevenue = transactions
    .filter(t => t.createdAt && new Date(t.createdAt) >= monthStart)
    .reduce((sum, t) => sum + Number(t.amountPaid || 0), 0);

  // Filtering
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = !searchTerm ||
      transaction.consoleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.player_1 && transaction.player_1.toLowerCase().includes(searchTerm.toLowerCase()));
      (transaction.player_2 && transaction.player_2.toLowerCase().includes(searchTerm.toLowerCase()));
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
    }

    return matchesSearch && matchesStatus && matchesPaymentMethod && matchesPeriod;
  });

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

  return (
    <div className="space-y-6 max-w-full mx-auto px-2 py-4">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Today's Revenue</p>
              <p className="text-3xl font-bold text-green-400">{todayRevenue.toFixed(0)} {settings?.currency}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">This Week</p>
              <p className="text-3xl font-bold text-blue-400">{weekRevenue.toFixed(0)} {settings?.currency}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">This Month</p>
              <p className="text-3xl font-bold text-purple-400">{monthRevenue.toFixed(0)} {settings?.currency}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

{/* Filters and Controls */}
<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    
    {/* Filters */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-4">
      {/* Search */}
      <div className="relative w-full lg:w-auto">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Period */}
      <select
        value={selectedPeriod}
        onChange={(e) => setSelectedPeriod(e.target.value)}
        className="w-full lg:w-auto px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
      >
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="all">All Time</option>
      </select>

      {/* Status */}
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-full lg:w-auto px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
      >
        <option value="all">All Status</option>
        <option value="completed">Completed</option>
        <option value="ongoing">Ongoing</option>
        <option value="cancelled">Cancelled</option>
      </select>

      {/* Payment Method */}
      <select
        value={paymentMethodFilter}
        onChange={(e) => setPaymentMethodFilter(e.target.value)}
        className="w-full lg:w-auto px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
      >
        <option value="all">All Payment Methods</option>
        <option value="cash">Cash</option>
        <option value="card">Card</option>
      </select>
    </div>

    {/* Buttons */}
    <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
      <button
        onClick={() => setShowReports((prev) => !prev)}
        className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <BarChart3 className="w-4 h-4" />
        <span>Reports</span>
      </button>
      <button
        onClick={exportTransactions}
        className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <Download className="w-4 h-4" />
        <span>Export CSV</span>
      </button>
    </div>
  </div>

  {/* Show ReportsPage below filter bar if toggled */}
  {showReports && (
    <div className="mt-6">
      <ReportsPage />
    </div>
  )}
</div>


      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-400">Total Revenue</p>
            <p className="text-2xl font-bold text-yellow-400">{totalRevenue.toFixed(0)} {settings?.currency}</p>
          </div>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-400">Total Transactions</p>
            <p className="text-2xl font-bold text-blue-400">{totalTransactions}</p>
          </div>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-400">Average Transaction</p>
            <p className="text-2xl font-bold text-green-400">{averageTransaction.toFixed(0)} {settings?.currency}</p>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
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
                <th className="px-4 sm:px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 sm:px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Console</th>
                <th className="px-4 sm:px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Player 1</th>
                <th className='px-4 sm:px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider'>Player 2</th>
                <th className="px-4 sm:px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Duration</th>
                <th className="px-4 sm:px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 sm:px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Payment</th>
                <th className="px-4 sm:px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 sm:px-6 py-3 text-left text-sm font-medium text-gray-400 uppercase tracking-wider">Actions</th>              
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-700/30">
                  {editingId === transaction.id ? (
                    <>
                      {/* Date */}
                      <td className="px-4 sm:px-6 py-4">
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
                      {/* Console */}
                      <td className="px-4 sm:px-6 py-4">
                        <input
                          type="text"
                          value={editValues.consoleName}
                          onChange={e => setEditValues({ ...editValues, consoleName: e.target.value })}
                          className="bg-gray-700 text-white rounded px-2 py-1 w-full"
                        />
                      </td>
                      {/* Player 1 */}
                      <td className="px-4 sm:px-6 py-4">
                        <input
                          type="text"
                          value={editValues.player_1}
                          onChange={e => setEditValues({ ...editValues, player_1: e.target.value })}
                          className="bg-gray-700 text-white rounded px-2 py-1 w-full"
                        />
                      </td>
                      {/* Player 2 */}
                      <td className="px-4 sm:px-6 py-4">
                        <input
                          type="text"
                          value={editValues.player_2}
                          onChange={e => setEditValues({ ...editValues, player_2: e.target.value })}
                          className="bg-gray-700 text-white rounded px-2 py-1 w-full"
                        />
                      </td>
                      {/* Duration */}
                      <td className="px-4 sm:px-6 py-4">
                        <input
                          type="number"
                          min={1}
                          value={editValues.duration}
                          onChange={e => setEditValues({ ...editValues, duration: Number(e.target.value) })}
                          className="bg-gray-700 text-white rounded px-2 py-1 w-full"
                        />
                      </td>
                      {/* Amount */}
                      <td className="px-4 sm:px-6 py-4">
                        <input
                          type="number"
                          min={0}
                          value={editValues.amountPaid}
                          onChange={e => setEditValues({ ...editValues, amountPaid: Number(e.target.value) })}
                          className="bg-gray-700 text-white rounded px-2 py-1 w-full"
                        />
                      </td>
                      {/* Payment */}
                      <td className="px-4 sm:px-6 py-4">
                        <select
                          value={editValues.paymentMethod}
                          onChange={e => setEditValues({ ...editValues, paymentMethod: e.target.value })}
                          className="bg-gray-700 text-white rounded px-2 py-1 w-full"
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                        </select>
                      </td>
                      {/* Status */}
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
                      {/* Actions */}
                      <td className="px-4 sm:px-6 py-4 flex gap-2">
                        <button
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded"
                          onClick={async () => {
                            await updateTransaction(transaction.id, editValues);
                            setEditingId(null);
                          }}
                        >
                        <Save className="w-3 h-3 mx-auto" />
                        </button>
                        <button
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded"
                          onClick={() => setEditingId(null)}
                        >
                        <X className="w-3 h-3 mx-auto " />
                        </button>
                      </td>
                    </>
                  ) : (
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
                          onClick={() => {
                            setEditingId(transaction.id);
                            setEditValues(transaction);
                          }}
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="text-red-400 hover:text-red-600"
                          onClick={() => setDeleteId(transaction.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-96 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Transaction</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to delete this transaction?</p>
            <div className="flex gap-3">
              <button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
                onClick={async () => {
                  await deleteTransaction(deleteId);
                  setDeleteId(null);
                }}
              >
                Delete
              </button>
              <button
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg"
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CashManagement;