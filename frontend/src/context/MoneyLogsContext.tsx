import React, { createContext, useContext, useEffect, useState } from 'react';

export type MoneyLog = {
  id: number;
  type: 'income' | 'outcome';
  source: string;
  amount: number;
  note: string;
  date: string;
  recurring?: boolean;
};


type MoneyLogsContextType = {
  logs: MoneyLog[];
  fetchLogs: () => Promise<void>;
  addLog: (log: Omit<MoneyLog, 'id'>) => Promise<void>;
  removeLog: (id: number) => Promise<void>;
  updateLog: (id: number, log: Partial<MoneyLog>) => Promise<void>;

};

const MoneyLogsContext = createContext<MoneyLogsContextType | undefined>(undefined);
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${API_BASE_URL}/api/money_logs`;

export const useMoneyLogs = () => {
  const ctx = useContext(MoneyLogsContext);
  if (!ctx) throw new Error('useMoneyLogs must be used within MoneyLogsProvider');
  return ctx;
};

export const MoneyLogsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<MoneyLog[]>([]);

  const fetchLogs = async () => {
    const res = await fetch(`${API_URL}`);
    const data = await res.json();
    setLogs(data);
  };

  const addLog = async (log: Omit<MoneyLog, 'id'>) => {
    // Format date as yyyy-MM-dd if present
    let formattedLog = { ...log };
    if (log.date && log.date.includes('T')) {
      formattedLog.date = log.date.split('T')[0];
    }
    const res = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedLog),
    });
    if (res.ok) await fetchLogs();
  };

  const removeLog = async (id: number) => {
    // Backend expects DELETE with body, not /:id
    const res = await fetch(`${API_URL}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) await fetchLogs();
  };

  const updateLog = async (id: number, log: Partial<MoneyLog>) => {
    // Format date as yyyy-MM-dd if present
    let formattedLog = { ...log, id };
    if (log.date && log.date.includes('T')) {
      formattedLog.date = log.date.split('T')[0];
    }
    const res = await fetch(`${API_URL}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedLog),
    });
    if (res.ok) await fetchLogs();
  };
  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <MoneyLogsContext.Provider value={{ logs, fetchLogs, addLog, removeLog, updateLog }}>
      {children}
    </MoneyLogsContext.Provider>
  );
};