import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io } from "socket.io-client";

export interface Transaction {
  id: number;
  consoleId: number;
  consoleName: string;
  player_1?: string;
  player_2?: string;
  startTime: string;
  endTime: string;
  duration: number;
  amountPaid: number;
  amountDue: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

interface TransactionContextType {
  transactions: Transaction[];
  fetchTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<number | undefined>;
  updateTransaction: (id: number, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction?: (id: number) => Promise<void>; // Optional for now
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactions = () => {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error('useTransactions must be used within TransactionProvider');
  return ctx;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${API_BASE_URL}/api/transactions`;

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Fetch transaction
  const fetchTransactions = async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    setTransactions(
      data.map((t: any) => ({
        ...t,
        player_1: t.player_1 ?? t.Player_1,
        player_2: t.player_2 ?? t.Player_2,
      }))
    );
  };

  // Insert transaction (returns new id)
  const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<number | undefined> => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    const result = await res.json();
    await fetchTransactions();
    return result?.id;
  };
  // Update transaction
  const updateTransaction = async (id: number, updates: Partial<Transaction>) => {
    await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    await fetchTransactions();
  };

  // Delete transaction
  const deleteTransaction = async (id: number) => {
    await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    await fetchTransactions();
  };

  useEffect(() => {
    fetchTransactions();
  }, []);
      
    useEffect(() => {
      const socket = io(API_BASE_URL, {
        transports: ["websocket"],
      });

      socket.on("transactions-updated", () => {
        fetchTransactions();
      });
    
      return () => {
        socket.disconnect();
      };
    }, []);
  
  return (
    <TransactionContext.Provider value={{ transactions, fetchTransactions, addTransaction, updateTransaction , deleteTransaction  }}>
      {children}
    </TransactionContext.Provider>
  );
};