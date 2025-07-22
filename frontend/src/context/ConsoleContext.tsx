import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface Console {
  id: number;
  name: string;
  status: string;
  pricePerHour: number;
}

interface ConsoleContextType {
  consoles: Console[];
  fetchConsoles: () => Promise<void>;
  addConsole: (console: Omit<Console, 'id'>) => Promise<void>;
  updateConsole: (console: Console) => Promise<void>;
  deleteConsole: (id: number) => Promise<void>;
}

const ConsoleContext = createContext<ConsoleContextType | undefined>(undefined);

export const useConsoles = () => {
  const ctx = useContext(ConsoleContext);
  if (!ctx) throw new Error('useConsoles must be used within ConsoleProvider');
  return ctx;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const API_URL = `${API_BASE_URL}/api/consoles`;
export const ConsoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [consoles, setConsoles] = useState<Console[]>([]);

  const fetchConsoles = async () => {
    const res = await fetch(API_URL);
    setConsoles(await res.json());
  };

  const addConsole = async (console: Omit<Console, 'id'>) => {
    await fetch(API_URL, {
      method: 'POST',
      headers: {'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' },
      body: JSON.stringify(console),
    });
    await fetchConsoles();
  };

  const updateConsole = async (console: Console) => {
    await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(console),
    });
    await fetchConsoles();
  };

  const deleteConsole = async (id: number) => {
      await fetch(API_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `id=${id}`,
      });
    await fetchConsoles();
  };

  useEffect(() => {
    fetchConsoles();
  }, []);

  return (
    <ConsoleContext.Provider value={{ consoles, fetchConsoles, addConsole, updateConsole, deleteConsole }}>
      {children}
    </ConsoleContext.Provider>
  );
};