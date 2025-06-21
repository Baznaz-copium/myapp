import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calendar, Users, Clock, DollarSign } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { useConsoles } from '../context/ConsoleContext';
import { useSettings } from '../context/SettingsContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

function ReportsPage() {
  const { transactions } = useTransactions();
  const { consoles } = useConsoles();
  const { settings } = useSettings();
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const getFilteredTransactions = () => {
    const now = new Date();
    let startDate = new Date();

    switch (selectedPeriod) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return transactions.filter(t => new Date(t.createdAt) >= startDate);
  };

  const filteredTransactions = getFilteredTransactions();

  // Daily revenue data
  const getDailyRevenueData = () => {
    const days = 7;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate >= date && transactionDate < nextDay && t.status === 'completed';
      });

      const revenue = dayTransactions.reduce((sum, t) => sum + Number(t.amountPaid || 0), 0);

      data.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue: revenue,
        transactions: dayTransactions.length
      });
    }
    return data;
  };

  // Console usage data
  const getConsoleUsageData = () => {
    const consoleStats = consoles.map(console => {
      const consoleTransactions = filteredTransactions.filter(t => t.consoleId === console.id);
      const totalRevenue = consoleTransactions.reduce((sum, t) => sum + Number(t.amountPaid || 0), 0);
      const totalHours = consoleTransactions.reduce((sum, t) => sum + (t.duration / 60), 0);

      return {
        name: console.name,
        revenue: totalRevenue,
        hours: totalHours,
        sessions: consoleTransactions.length
      };
    });

    return consoleStats.sort((a, b) => b.revenue - a.revenue);
  };

  // Peak hours data
  const getPeakHoursData = () => {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      sessions: 0,
      revenue: 0
    }));

    filteredTransactions.forEach(transaction => {
      const hour = new Date(transaction.startTime).getHours();
      hourlyData[hour].sessions += 1;
      hourlyData[hour].revenue += Number(transaction.amountPaid || 0);
    });

    return hourlyData;
  };

  // Payment method distribution
  const getPaymentMethodData = () => {
    const cashTransactions = filteredTransactions.filter(t => t.paymentMethod === 'cash');
    const cardTransactions = filteredTransactions.filter(t => t.paymentMethod === 'card');

    return [
      { name: 'Cash', value: cashTransactions.length, revenue: cashTransactions.reduce((sum, t) => sum + Number(t.amountPaid || 0), 0) },
      { name: 'Card', value: cardTransactions.length, revenue: cardTransactions.reduce((sum, t) => sum + Number(t.amountPaid || 0), 0) }
    ];
  };

  const dailyRevenueData = getDailyRevenueData();
  const consoleUsageData = getConsoleUsageData();
  const peakHoursData = getPeakHoursData();
  const paymentMethodData = getPaymentMethodData();

  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + Number(t.amountPaid || 0), 0);
  const totalSessions = filteredTransactions.length;
  const averageSessionDuration = totalSessions > 0
    ? filteredTransactions.reduce((sum, t) => sum + Number(t.duration || 0), 0) / totalSessions
    : 0;
  const averageRevenue = totalSessions > 0 ? totalRevenue / totalSessions : 0;

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <BarChart3 className="w-6 h-6 mr-2 text-purple-400" />
          Reports & Analytics
        </h2>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last 3 Months</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-green-400">{totalRevenue.toFixed(0)} {settings?.currency}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Sessions</p>
              <p className="text-2xl font-bold text-blue-400">{totalSessions}</p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Session</p>
              <p className="text-2xl font-bold text-purple-400">
                {isNaN(averageSessionDuration) || !isFinite(averageSessionDuration) ? 0 : Math.round(averageSessionDuration)} min
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Revenue</p>
              <p className="text-2xl font-bold text-yellow-400">{averageRevenue.toFixed(0)} {settings?.currency}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Daily Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <Bar dataKey="revenue" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Hours Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Peak Hours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={peakHoursData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="hour" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
              <Line type="monotone" dataKey="sessions" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Console Performance */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Console Performance</h3>
          <div className="space-y-4">
            {consoleUsageData.slice(0, 6).map((console, index) => (
              <div key={console.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-white text-sm">{console.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">{console.revenue.toFixed(0)} {settings?.currency ?? ''}</div>
                  <div className="text-gray-400 text-xs">{console.sessions} sessions</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {paymentMethodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F3F4F6'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Console Stats Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">Detailed Console Statistics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Console</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sessions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Session</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Revenue/Hour</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {consoleUsageData.map((console) => (
                <tr key={console.name} className="hover:bg-gray-700/30">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {console.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {console.sessions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {console.hours.toFixed(1)}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-yellow-400">
                    {console.revenue.toFixed(0)} {settings?.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {console.sessions > 0 ? (console.hours * 60 / console.sessions).toFixed(0) : 0} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {console.hours > 0 ? (console.revenue / console.hours).toFixed(0) : 0} {settings?.currency}/h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;