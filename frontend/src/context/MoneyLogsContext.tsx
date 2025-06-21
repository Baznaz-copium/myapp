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
const API_URL = 'http://myapp.test/backend/api/money_logs.php';

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
    const res = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    if (res.ok) await fetchLogs();
  };

  const removeLog = async (id: number) => {
    const res = await fetch(`${API_URL}?id=${id}`, { method: 'DELETE' });
    if (res.ok) await fetchLogs();
  };

  const updateLog = async (id: number, log: Partial<MoneyLog>) => {
    const res = await fetch(`${API_URL}?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
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