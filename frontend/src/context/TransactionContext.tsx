import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  // Add update/delete if needed
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactions = () => {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error('useTransactions must be used within TransactionProvider');
  return ctx;
};

const API_URL = 'http://myapp.test/backend/api/transactions.php';

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchTransactions = async () => {
    const res = await fetch(API_URL);
    setTransactions(await res.json());
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    await fetchTransactions();
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <TransactionContext.Provider value={{ transactions, fetchTransactions, addTransaction }}>
      {children}
    </TransactionContext.Provider>
  );
};