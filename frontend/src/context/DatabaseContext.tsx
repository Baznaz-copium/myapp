import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { openDB } from 'idb';

export interface Console {
  id: number;
  name: string;
  status: 'available' | 'rented' | 'maintenance';
  pricePerHour: number;
  currentSession?: {
    id: number;
    startTime: Date;
    endTime: Date;
    totalMinutes: number;
    customerName?: string;
    customerPhone?: string;
    amountPaid: number;
    amountDue: number;
  };
}

export interface Transaction {
  id: number;
  consoleId: number;
  consoleName: string;
  customerName?: string;
  customerPhone?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  amountPaid: number;
  amountDue: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'card';
  status: 'completed' | 'ongoing' | 'cancelled';
  createdAt: Date;
}

export interface Settings {
  pricePerHour: number;
  currency: string;
  businessName: string;
  businessPhone: string;
  businessAddress: string;
  taxRate: number;
  autoStopOnTimeUp: boolean;
  allowExtensions: boolean;
  requireCustomerInfo: boolean;
}

interface DatabaseContextType {
  consoles: Console[];
  transactions: Transaction[];
  settings: Settings;
  addConsole: (console: Omit<Console, 'id'>) => void;
  updateConsole: (id: number, updates: Partial<Console>) => void;
  deleteConsole: (id: number) => void;
  startSession: (consoleId: number, minutes: number, customerName?: string, customerPhone?: string) => void;
  stopSession: (consoleId: number) => void;
  extendSession: (consoleId: number, additionalMinutes: number) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateSettings: (updates: Partial<Settings>) => void;
  getTodayRevenue: () => number;
  getWeekRevenue: () => number;
  getMonthRevenue: () => number;
  setConsoles: React.Dispatch<React.SetStateAction<Console[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) throw new Error('useDatabase must be used within a DatabaseProvider');
  return context;
};

const DB_NAME = 'ps4-management';
const DB_VERSION = 1;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('consoles')) db.createObjectStore('consoles');
      if (!db.objectStoreNames.contains('transactions')) db.createObjectStore('transactions');
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
    },
  });
}

async function saveToDB(key: string, value: any) {
  const db = await getDB();
  await db.put(key, value, 'data');
}

async function loadFromDB(key: string) {
  const db = await getDB();
  return db.get(key, 'data');
}

export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [consoles, setConsoles] = useState<Console[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<Settings>({
    pricePerHour: 350,
    currency: 'DA',
    businessName: 'PS4 Gaming Center',
    businessPhone: '+213 XXX XXX XXX',
    businessAddress: 'Algiers, Algeria',
    taxRate: 0,
    autoStopOnTimeUp: true,
    allowExtensions: true,
    requireCustomerInfo: false,
  });

  // Load from IndexedDB on mount
  useEffect(() => {
    (async () => {
      const c = await loadFromDB('consoles');
      const t = await loadFromDB('transactions');
      const s = await loadFromDB('settings');
      if (c) setConsoles(c.map((console: any) => ({
        ...console,
        currentSession: console.currentSession
          ? {
              ...console.currentSession,
              startTime: new Date(console.currentSession.startTime),
              endTime: new Date(console.currentSession.endTime),
            }
          : undefined,
      })));
      if (t) setTransactions(t.map((transaction: any) => ({
        ...transaction,
        startTime: new Date(transaction.startTime),
        endTime: new Date(transaction.endTime),
        createdAt: new Date(transaction.createdAt),
      })));
      if (s) setSettings(s);
    })();
  }, []);

  // Save to IndexedDB on change
  useEffect(() => { saveToDB('consoles', consoles); }, [consoles]);
  useEffect(() => { saveToDB('transactions', transactions); }, [transactions]);
  useEffect(() => { saveToDB('settings', settings); }, [settings]);

  // CRUD and session logic
  const addConsole = (console: Omit<Console, 'id'>) => {
    setConsoles(prev => [
      ...prev,
      { ...console, id: Date.now(), status: 'available' },
    ]);
  };

  const updateConsole = (id: number, updates: Partial<Console>) => {
    setConsoles(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const deleteConsole = (id: number) => {
    setConsoles(prev => prev.filter(c => c.id !== id));
  };

  const startSession = (
    consoleId: number,
    minutes: number,
    customerName?: string,
    customerPhone?: string
  ) => {
    setConsoles(prev =>
      prev.map(c =>
        c.id === consoleId
          ? {
              ...c,
              status: 'rented',
              currentSession: {
                id: Date.now(),
                startTime: new Date(),
                endTime: new Date(Date.now() + minutes * 60000),
                totalMinutes: minutes,
                customerName,
                customerPhone,
                amountPaid: 0,
                amountDue: (minutes / 60) * c.pricePerHour,
              },
            }
          : c
      )
    );
  };

  const stopSession = (consoleId: number) => {
    setConsoles(prev =>
      prev.map(c =>
        c.id === consoleId
          ? { ...c, status: 'available', currentSession: undefined }
          : c
      )
    );
  };

  const extendSession = (consoleId: number, additionalMinutes: number) => {
    setConsoles(prev =>
      prev.map(c => {
        if (c.id === consoleId && c.currentSession) {
          const newEnd = new Date(
            c.currentSession.endTime.getTime() + additionalMinutes * 60000
          );
          return {
            ...c,
            currentSession: {
              ...c.currentSession,
              endTime: newEnd,
              totalMinutes: c.currentSession.totalMinutes + additionalMinutes,
              amountDue:
                ((c.currentSession.totalMinutes + additionalMinutes) / 60) *
                c.pricePerHour,
            },
          };
        }
        return c;
      })
    );
  };

  const addTransaction = (
    transaction: Omit<Transaction, 'id' | 'createdAt'>
  ) => {
    setTransactions(prev => [
      ...prev,
      {
        ...transaction,
        id: Date.now(),
        createdAt: new Date(),
      },
    ]);
  };

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  // Revenue helpers
  const getTodayRevenue = () => {
    const today = new Date();
    return transactions
      .filter(
        t =>
          t.createdAt.toDateString() === today.toDateString() &&
          t.status === 'completed'
      )
      .reduce((sum, t) => sum + t.totalAmount, 0);
  };

  const getWeekRevenue = () => {
    const now = new Date();
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    return transactions
      .filter(
        t =>
          t.createdAt >= weekAgo &&
          t.createdAt <= now &&
          t.status === 'completed'
      )
      .reduce((sum, t) => sum + t.totalAmount, 0);
  };

  const getMonthRevenue = () => {
    const now = new Date();
    return transactions
      .filter(
        t =>
          t.createdAt.getMonth() === now.getMonth() &&
          t.createdAt.getFullYear() === now.getFullYear() &&
          t.status === 'completed'
      )
      .reduce((sum, t) => sum + t.totalAmount, 0);
  };

  return (
    <DatabaseContext.Provider
      value={{
        consoles,
        transactions,
        settings,
        addConsole,
        updateConsole,
        deleteConsole,
        startSession,
        stopSession,
        extendSession,
        addTransaction,
        updateSettings,
        getTodayRevenue,
        getWeekRevenue,
        getMonthRevenue,
        setConsoles,
        setTransactions,
        setSettings,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};