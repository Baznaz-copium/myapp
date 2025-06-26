import { useState, useEffect, useRef } from 'react';
import { Gamepad2, DollarSign, Mail, Settings as SettingsIcon, Monitor, Play, Square, User , Clock, LogOut, BarChart3, Tv, Plus, AlertTriangle, Trash2, Edit3, Save, X, ShoppingCart } from 'lucide-react';
import { useConsoles } from '../context/ConsoleContext';
import { useSettings } from '../context/SettingsContext';
import { useTransactions } from '../context/TransactionContext';
import { useSessions } from '../context/SessionContext';
import CashManagement from './CashManagement';
import SettingsPage from './SettingsPage';
import ProfilePage from './ProfilePage';
import ConsumationPage from './ConsumationPage';
import MoneyLogsPage from './MoneyLogsPage';
import AdminUsersPage from './UserManagement/UserManagement';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useConsumation } from '../context/ConsumationContext';

function AdminDashboard() {
  const { consoles, addConsole, updateConsole, deleteConsole, fetchConsoles } = useConsoles();
  const { settings } = useSettings();
  const { addTransaction } = useTransactions();
  const { sessions, startSession, stopSession,extendSession, fetchSessions } = useSessions();
  const { transactions } = useTransactions();
  const [confirm, setConfirm] = useState<{ ids: number[]; show: boolean }>({ ids: [], show: false });

  // UI state
  const [activeTab, setActiveTab] = useState<'consoles' | 'users' | 'mlogs' | 'settings' | 'cash' |  'consumation' | 'profile'>('consoles');
  const [selectedConsole, setSelectedConsole] = useState<number | null>(null);
  const [editingConsole, setEditingConsole] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [player_1, setPlayer_1] = useState('');
  const [player_2, setPlayer_2] = useState('');
  const [pendingMinutes, setPendingMinutes] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileOpen]);

  // Helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'rented': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };
  const getStatusColorborder = (status: string) => {
    switch (status) {
      case 'available': return 'border-green-500';
      case 'rented': return 'border-red-500';
      case 'maintenance': return 'border-yellow-500';
      default: return 'border-gray-500';
    }
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'rented': return 'In Use';
      case 'maintenance': return 'Maintenance';
      default: return 'Unknown';
    }
  };

  // Stats
  const selectedConsoleData = consoles.find(c => c.id === selectedConsole);
  const availableCount = consoles.filter(c => c.status === 'available').length;
  const rentedCount = consoles.filter(c => c.status === 'rented').length;
  const maintenanceCount = consoles.filter(c => c.status === 'maintenance').length;

  // Session helpers
  const session = sessions.find(s => s.consoleId === selectedConsole && s.running);

  // Console editing
  const handleEditConsole = (consoleId: number, name: string) => {
    setEditingConsole(consoleId);
    setEditName(name);
  };
  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      if (editingConsole && editName.trim()) {
        await updateConsole({ id: editingConsole, name: editName.trim(), status: selectedConsoleData?.status || 'available', pricePerHour: selectedConsoleData?.pricePerHour || 350 });
        setEditingConsole(null);
        setEditName('');
        toast.success(`Console #${editingConsole} updated to ${editName.trim()}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Add console
const handleAddConsole = async () => {
  setLoading(true);
  try {
    await addConsole({
      name: `#${consoles.length + 1}`,
      status: 'available',
      pricePerHour: settings?.pricePerHour || 350,
    });
  } finally {
    setLoading(false);
  }
};
  // Start session
const handleStartSession = async (minutes: number) => {
  const requireCustomerInfo = !!Number(settings?.requireCustomerInfo);

  // Show customer info modal if required and not provided
if (requireCustomerInfo && !player_1.trim() && !player_2.trim()) {
  setPendingMinutes(minutes);
  setShowCustomerForm(true);
  return;
}


  setLoading(true);
  try {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const startTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const end = new Date(now.getTime() + minutes * 60000);
    const endTime = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())} ${pad(end.getHours())}:${pad(end.getMinutes())}:${pad(end.getSeconds())}`;

    if (selectedConsole === null) {
      throw new Error("No console selected");
    }
    await startSession({
      consoleId: selectedConsole,
      player_1: player_1.trim(),
      player_2: player_2.trim(),
      startTime: startTime,
      endTime: endTime,
      totalMinutes: minutes,
    });

    await updateConsole({
      id: selectedConsole,
      name: selectedConsoleData?.name || '',
      status: 'rented',
      pricePerHour: selectedConsoleData?.pricePerHour || 350,
    });

    await fetchConsoles();
    await fetchSessions();

    setPlayer_1('');
    setPlayer_2('');
    setShowCustomerForm(false);
    setPendingMinutes(null);
  } finally {
    setLoading(false);
    toast.success(`Console ${selectedConsoleData?.name || 'Console'} rented for ${minutes} minutes!`);

  }
};

// Stop session
const handleStopSession = async () => {
  if (!selectedConsole || !session) return;
  setLoading(true);
  try {
    const now = new Date();
    // Calculate actual duration in minutes
    const startTime = new Date(session.startTime);
    const usedMs = now.getTime() - startTime.getTime();
    const usedMinutes = Math.round(usedMs / 60000);

    // Use the lesser of planned or actual duration for price calculation
    const duration = Math.min(session.totalMinutes, usedMinutes);
    const price = ((duration / 60) * (selectedConsoleData?.pricePerHour || 350));

    // Format now as endTime
    const pad = (n: number) => n.toString().padStart(2, '0');
    const endTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    await addTransaction({
      consoleId: selectedConsole,
      consoleName: selectedConsoleData?.name || '',
      player_1: session.player_1,
      player_2: session.player_2,
      startTime: session.startTime,
      endTime: endTime,
      duration, // Actual or planned duration in minutes
      amountPaid: price,
      amountDue: 0,
      totalAmount: price,
      paymentMethod: 'cash',
      status: 'completed',
      createdAt: now.toISOString().slice(0, 19).replace('T', ' ')
    });
    await stopSession(session.id, endTime, duration);
    await updateConsole({ id: selectedConsole, name: selectedConsoleData?.name || '', status: 'available', pricePerHour: selectedConsoleData?.pricePerHour || 350 });
    await fetchConsoles();
    await fetchSessions();
    toast.success(`Console ${selectedConsoleData?.name || 'Console'} stopped!`);
  } finally {
    setLoading(false);
  }
};

const handleExtendSession = async (minutes: number) => {
  if (!selectedConsole || !session) return;
  setLoading(true);
  try {
    // Use the current session endTime as the base for extension
    const currentEnd = new Date(session.endTime);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const newEnd = new Date(currentEnd.getTime() + Number(minutes) * 60000);
    const newEndTime = `${newEnd.getFullYear()}-${pad(newEnd.getMonth() + 1)}-${pad(newEnd.getDate())} ${pad(newEnd.getHours())}:${pad(newEnd.getMinutes())}:${pad(newEnd.getSeconds())}`;
    const newTotalMinutes = Number(session.totalMinutes) + Number(minutes);

    await extendSession(
      session.id,
      newEndTime,
      newTotalMinutes
    );
    await fetchConsoles();
    await fetchSessions();
    toast.success(`Console ${selectedConsoleData?.name || 'Console'} extended by ${minutes} minutes!`);
  } finally {
    setLoading(false);
  }
};

const handleReduceSession = async (minutes: number) => {
  if (!selectedConsole || !session) return;
  setLoading(true);
  try {
    // Use the current session endTime as the base for extension
    const currentEnd = new Date(session.endTime);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const newEnd = new Date(currentEnd.getTime() - Number(minutes) * 60000);
    const newEndTime = `${newEnd.getFullYear()}-${pad(newEnd.getMonth() + 1)}-${pad(newEnd.getDate())} ${pad(newEnd.getHours())}:${pad(newEnd.getMinutes())}:${pad(newEnd.getSeconds())}`;
    const newTotalMinutes = Number(session.totalMinutes) - Number(minutes);

    await extendSession(
      session.id,
      newEndTime,
      newTotalMinutes
    );
    await fetchConsoles();
    await fetchSessions();
    toast.success(`Console ${selectedConsoleData?.name || 'Console'} reversed by ${minutes} minutes!`);
  } finally {
    setLoading(false);
  }
};

  // Timer display helpers
  const getSessionInfo = (session: any) => {
    if (!session) return null;
    const now = new Date();
    const start = new Date(session.startTime);
    const end = new Date(session.endTime);
    const used = Math.floor((now.getTime() - start.getTime()) / 1000);
    const remaining = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
    const usedStr = `${Math.floor(used / 3600).toString().padStart(2, '0')}:${Math.floor((used % 3600) / 60).toString().padStart(2, '0')}:${(used % 60).toString().padStart(2, '0')}`;
    const remainingStr = `${Math.floor(remaining / 3600).toString().padStart(2, '0')}:${Math.floor((remaining % 3600) / 60).toString().padStart(2, '0')}:${(remaining % 60).toString().padStart(2, '0')}`;
    return {
      ...session,
      usedStr,
      remainingStr,
      price: ((session.totalMinutes / 60) * (selectedConsoleData?.pricePerHour || 350)).toFixed(0),
      progress: Math.min(100, (used / (session.totalMinutes * 60)) * 100)
    };
  };

  // Customer form submit
const handleCustomerFormSubmit = async () => {
  if (pendingMinutes && selectedConsole) {
    await handleStartSession(pendingMinutes);
    setShowCustomerForm(false); // <-- Ensure modal closes
    setPlayer_1('');
    setPlayer_2('');
    setPendingMinutes(null);
  }
};
  const [alerted, setAlerted] = useState(false);
  const sessionInfo = getSessionInfo(session);

  useEffect(() => {
    if (session && sessionInfo && sessionInfo.remainingStr === "00:00:00" && !alerted) {
      setAlerted(true);
      handleStopSession().then(() => {
        const consoleData = consoles.find(c => c.id === session.consoleId);
        toast.success(`Console ${consoleData?.name || 'Console'} is now free!`);
      });
    }
    // Reset alert when session changes
    if (!session && alerted) setAlerted(false);
  }, [session, sessionInfo?.remainingStr]);


  // Open client display
  const openClientDisplay = () => {
    window.open('/client-display', '_blank', 'fullscreen=yes');
  };

const now = new Date();
const pad = (n: number) => n.toString().padStart(2, '0');
const today =
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`; // 'YYYY-MM-DD'

// Only include completed transactions
const { revenue } = useConsumation();
const todayRevenue = transactions
  .filter(t => t.createdAt && t.createdAt.startsWith(today) && t.status === 'completed')
  .reduce((sum, t) => sum + Number(t.amountPaid || 0), 0);

const todayTotalRevenue = revenue.today + todayRevenue

  // Auto-stop any expired session, even if not on consoles tab
  useEffect(() => {
    const interval = setInterval(() => {
      sessions.forEach(async (session) => {
        if (session.running) {
          const end = new Date(session.endTime);
          if (new Date() >= end) {
            await handleStopSessionForId(session.id, session.consoleId);
          }
        }
      });
    }, 10000); // check every 10 seconds

    return () => clearInterval(interval);
  }, [sessions]);

  // Helper to stop session by id (does not depend on selectedConsole)
  const handleStopSessionForId = async (sessionId: number, consoleId: number) => {
    const sessionToStop = sessions.find(s => s.id === sessionId);
    const consoleData = consoles.find(c => c.id === consoleId);
    if (!sessionToStop || !consoleData) return;
    setLoading(true);
    try {
      const now = new Date();
      const duration = sessionToStop.totalMinutes;
      const price = ((duration / 60) * (consoleData.pricePerHour || 350));
      await addTransaction({
        consoleId: consoleId,
        consoleName: consoleData.name || '',
        player_1: sessionToStop.player_1,
        player_2: sessionToStop.player_2,
        startTime: sessionToStop.startTime,
        endTime: now.toISOString().slice(0, 19).replace('T', ' '),
        duration,
        amountPaid: price,
        amountDue: 0,
        totalAmount: price,
        paymentMethod: 'cash',
        status: 'completed',
        createdAt: now.toISOString().slice(0, 19).replace('T', ' ')
      });
      await stopSession(sessionId, now.toISOString().slice(0, 19).replace('T', ' '), duration);
      await updateConsole({ id: consoleId, name: consoleData.name || '', status: 'available', pricePerHour: consoleData.pricePerHour || 350 });
      await fetchConsoles();
      await fetchSessions();
      toast.custom((t) => (
        <div className="bg-green-700 text-white px-4 py-2 rounded shadow flex items-center justify-between gap-4">
          <span>Console #{consoleData.name} is now free!</span>
          <button onClick={() => toast.dismiss(t.id)} className="text-white hover:text-gray-300 text-sm font-bold">
            ❌
          </button>
        </div>
      ), { duration: Infinity });
    } finally {
      setLoading(false);
    }
  };

    // Confirm delete action
  const confirmDelete = async () => {
    setLoading(true);
    try {
      for (const id of confirm.ids) {
        await deleteConsole(id);
        if (selectedConsole === id) {
          setSelectedConsole(null);
        }
      }
    } finally {
      setLoading(false);
      setConfirm({ ids: [], show: false });
    }
  };

  // Cancel delete
  const cancelDelete = () => setConfirm({ ids: [], show: false });
  const [notifOpen, setNotifOpen] = useState(false);

  //lowStockItems notification
  const { eatables, drinkables } = useConsumation();
  const LOW_STOCK_THRESHOLD = 3;
  const lowStockItems = [
    ...eatables.filter(item => item.stock <= LOW_STOCK_THRESHOLD),
    ...drinkables.filter(item => item.stock <= LOW_STOCK_THRESHOLD)
  ];
  const lowStockCount = lowStockItems.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Loading Spinner */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
        </div>
      )}
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

    <nav className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 z-40 relative">
      <div className="mx-auto px-4 sm:px-6 lg:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Gamepad2 className="w-8 h-8 text-blue-400" />
              <span className="text-xl font-bold text-white">{settings?.businessName || 'Baznaz Gaming'}</span>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('consoles')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'consoles' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>PS4 Consoles</span>
              </button>
              <button
                onClick={() => setActiveTab('consumation')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'consumation' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Consumation</span>
              </button>
              {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('mlogs')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'mlogs' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>M.logs</span>
              </button>
              )}
              {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Users</span>
              </button>
              )}
              {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Settings</span>
              </button>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={openClientDisplay}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Tv className="w-4 h-4" />
              <span>Client Display</span>
            </button>
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <span>Today: {todayTotalRevenue.toFixed(2)} {settings?.currency || 'DA'}</span>
            </div>
            <div className="text-sm text-gray-300">
              {currentTime.toLocaleTimeString()}
            </div>

            {/* Lowstock notification */}    
            <div className="relative">
              <button onClick={() => setNotifOpen(v => !v)} className="relative" aria-label="Notifications">
                <Mail className="w-7 h-7 text-blue-300" />
                {lowStockCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-600 text-white rounded-full text-xs px-1">
                    {lowStockCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-50 p-4">
                  <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                    <AlertTriangle className="text-yellow-400 w-5 h-5" /> Low Stock Items
                  </h4>
                  {lowStockItems.length === 0 ? (
                    <p className="text-gray-400 text-sm">All items sufficiently stocked!</p>
                  ) : (
                    <ul className="divide-y divide-gray-700 max-h-56 overflow-y-auto">
                      {lowStockItems.map(item => (
                        <li key={item.id} className="py-2 flex justify-between items-center">
                          <span className="text-white">{item.name}</span>
                          <span className="text-red-400 font-bold">Stock: {item.stock}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button className="mt-3 bg-gray-700 text-white text-sm px-3 py-1 rounded w-full"
                    onClick={() => setNotifOpen(false)}>
                    Close
                  </button>
                </div>
              )}
            </div>
            {/* Profile dropdown */}
            <div className="relative z-10 overflow-visible"  ref={dropdownRef}>
              <button
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                onClick={() => setProfileOpen((v) => !v)}
                aria-label="Profile menu"
              >
                <User className="w-6 h-6 text-blue-300" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-[9999] overflow-visible border border-gray-700">
                <div className="px-4 py-3 border-b border-gray-700">
                  <div className="font-semibold text-white">{user?.username}</div>
                  <div className="text-xs text-gray-400">{user?.email}</div>
                </div>
                <button
                  className="flex w-full items-center px-4 py-2 text-gray-300 hover:bg-gray-700 text-sm"
                  onClick={() => {
                    setProfileOpen(false);
                    setActiveTab('profile');
                  }}
                >
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  Profile
                </button>
                <button
                  className="flex w-full items-center px-4 py-2 text-gray-300 hover:bg-gray-700 text-sm"
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2 text-gray-400" />
                  Logout
                </button>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  

    {/* Player Info Form Modal */}
    {showCustomerForm && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-xl p-6 w-96 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Player Information</h3>
          <div className="space-y-4">
            {/* Player 1 */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Player 1 Name *</label>
              <input
                type="text"
                value={player_1}
                onChange={(e) => setPlayer_1(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Enter Player 1 name"
              />
            </div>
            {/* Player 2 */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Player 2 Name (optional)</label>
              <input
                type="text"
                value={player_2}
                onChange={(e) => setPlayer_2(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Enter Player 2 name"
              />
            </div>
          </div>
          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleCustomerFormSubmit}
              disabled={!player_1.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 rounded-lg transition-colors"
            >
              Start Session
            </button>
            <button
              onClick={() => {
                setShowCustomerForm(false);
                setPendingMinutes(null);
                setPlayer_1('');
                setPlayer_2('');
              }}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'consoles' && (
          <>
            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Available</p>
                    <p className="text-2xl font-bold text-green-400">{availableCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Monitor className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">In Use</p>
                    <p className="text-2xl font-bold text-red-400">{rentedCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <Play className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </div>
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Maintenance</p>
                    <p className="text-2xl font-bold text-yellow-400">{maintenanceCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <SettingsIcon className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Console Grid - Left Side (65%) */}
              <div className="lg:w-2/3">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <Gamepad2 className="w-5 h-5 mr-2 text-blue-400" />
                      PS4 Consoles
                    </h2>
                    <div className='flex space-x-2'>
                    {user?.role === 'admin' && (
                    <button
                      onClick={() => setActiveTab('cash')}
                      className="flex items-center space-x-2 bg-purple-700 hover:bg-purple-800 text-white px-3 py-2 rounded-lg transition-colors"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Cash</span>
                    </button>
                    )} 
                    {user?.role === 'admin' && (
                    <button
                      onClick={handleAddConsole}
                      className="flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Console</span>
                    </button>
                    )} 
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {consoles.map((console) => (
                      <div
                        key={console.id}
                        onClick={() => setSelectedConsole(console.id)}
                        className={`${getStatusColorborder(console.status)} rounded-lg p-4 cursor-pointer transition-all duration-200 border-2 hover:bg-gray-700/70 ${
                          selectedConsole === console.id 
                            ? 'border-blue-500 bg-blue-500/10' 
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(console.status)}`} />
                          <div className="flex space-x-1">
                            {user?.role === 'admin' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditConsole(console.id, console.name);
                              }}
                              className="text-blue-400 hover:text-blue-600 transition-colors"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            )}
                            {user?.role === 'admin' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirm({ ids: [console.id], show: true });
                              }}
                              className="text-red-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            )}
                          </div>
                        </div>
                        <div className="mb-3">
                          <Gamepad2 className="w-8 h-8 text-blue-400 mx-auto" />
                        </div>
                        {editingConsole === console.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-gray-600 text-white text-sm rounded px-2 py-1 border border-gray-500 focus:border-blue-500 focus:outline-none"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveEdit();
                                }}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 rounded transition-colors"
                              >
                                <Save className="w-3 h-3 mx-auto" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingConsole(null);
                                  setEditName('');
                                }}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-xs py-1 rounded transition-colors"
                              >
                                <X className="w-3 h-3 mx-auto" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-sm font-medium text-white text-center mb-2">
                              {console.name}
                            </h3>
                            <p className="text-xs text-gray-400 text-center">
                              {console.pricePerHour} {settings?.currency || 'DA'}/hour
                            </p>
                                {sessions.find(s => s.consoleId === console.id && s.running) && (() => {
                                  const s = sessions.find(s => s.consoleId === console.id && s.running)!;
                                  const name1 = s.Player_1?.trim() || '';
                                  const name2 = s.Player_2?.trim() || '';
                                  const playerNames = [name1, name2].filter(Boolean).join(' & ') || 'Anonymous';
                                  const now = new Date();
                                  const start = new Date(s.startTime);
                                  const used = Math.floor((now.getTime() - start.getTime()) / 1000);
                                  const total = s.totalMinutes * 60;
                                  const progress = Math.min(100, (used / total) * 100);
                                  
                                  return (
                                    <div className="mt-3 pt-3 border-t border-gray-600">
                                      <p className="text-xs text-gray-400 text-center">
                                          {playerNames}
                                      </p>
                                      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                                        <div 
                                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-1000"
                                          style={{ width: `${progress}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })()}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Timer Panel - Right Side (35%) */}
              <div className="lg:w-1/3">
                <div className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border ${getStatusColorborder(selectedConsoleData?.status || 'default')} border-gray-700`}>
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-400" />
                    Timer Control
                  </h2>
                  {selectedConsole ? (
                    <>
                      <div className="mb-6">
                        <h3 className="text-lg font-medium text-white mb-2">
                          {selectedConsoleData?.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedConsoleData?.status || 'available')}`} />
                          <span className="text-sm text-gray-400">
                            {getStatusText(selectedConsoleData?.status || 'available')}
                          </span>
                        </div>
                      </div>
                      {/* Time Display */}
                      {session ? (
                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Start Time:</span>
                            <span className="text-sm font-mono text-white">{new Date(session.startTime).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">End Time:</span>
                            <span className="text-sm font-mono text-white">{new Date(session.endTime).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Used Time:</span>
                            <span className="text-sm font-mono text-green-400">{getSessionInfo(session)?.usedStr}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Remaining:</span>
                            <span className="text-sm font-mono text-blue-400">{getSessionInfo(session)?.remainingStr}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-600">
                            <span className="text-sm text-gray-400">Price:</span>
                            <span className="text-lg font-bold text-yellow-400">{getSessionInfo(session)?.price} {settings?.currency || 'DA'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 py-12">
                          <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No session running</p>
                        </div>
                      )}
                      {/* Progress Bar */}
                      {session && (
                        <div className="mb-6">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{getSessionInfo(session)?.progress.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${getSessionInfo(session)?.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {/* Time Buttons */}
                      {!session && (
                        <div className="mb-6">
                          <p className="text-sm text-gray-400 mb-3">Quick Time Selection</p>
                          <div className="grid grid-cols-3 gap-2">
                            {[30, 60, 90, 120, 150, 180].map((minutes) => (
                              <button
                                key={minutes}
                                onClick={() =>
                                  selectedConsoleData?.status === 'available'
                                    ? handleStartSession(minutes)
                                    : handleExtendSession(minutes)
                                }
                                disabled={selectedConsoleData?.status === 'maintenance'}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white text-sm py-2 px-3 rounded-lg transition-colors font-medium"
                              >
                                {minutes}m
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Control Buttons */}
                        <div className="space-y-2">
                          {selectedConsoleData?.status === 'rented' && (
                            <>
                              <button
                                onClick={handleStopSession}
                                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                              >
                                <Square className="w-4 h-4" />
                                <span>Stop Session</span>
                              </button>
                              {settings?.allowExtensions && (
                                <div className="flex gap-4 flex-wrap">
                                  {/* Reduce time -30min */}
                                  <button
                                    onClick={() => handleReduceSession(30)}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                                    disabled={Number(session?.totalMinutes || 0) <= 30}
                                  >
                                    <Clock className="w-4 h-4" />
                                    <span>-30min</span>
                                  </button>
                                  {/* Reduce time -60min */}
                                  <button
                                    onClick={() => handleReduceSession(60)}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                                    disabled={Number(session?.totalMinutes || 0) <= 60}
                                  >
                                    <Clock className="w-4 h-4" />
                                    <span>-60min</span>
                                  </button>
                                  {/* Extend time +30min */}
                                  <button
                                    onClick={() => handleExtendSession(30)}
                                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                                  >
                                    <Clock className="w-4 h-4" />
                                    <span>+30min</span>
                                  </button>
                                  {/* Extend time +60min */}
                                  <button
                                    onClick={() => handleExtendSession(60)}
                                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                                  >
                                    <Clock className="w-4 h-4" />
                                    <span>+60min</span>
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-400 py-12">
                      <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select a console to manage timer</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        {activeTab === 'cash' && <CashManagement />}
        {activeTab === 'consumation' && <ConsumationPage />}
        {activeTab === 'settings' && <SettingsPage />}
        {activeTab === 'mlogs' && <MoneyLogsPage />}
        {activeTab === 'users' && <AdminUsersPage />}
        {activeTab === 'profile' && <ProfilePage />}
      </div>
    </div>
  );
}

export default AdminDashboard;

