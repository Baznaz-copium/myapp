import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

export type Consumable = {
  id: number;
  name: string;
  type: "eatable" | "drinkable";
  stock: number;
  unit_price: number;
  total_cost: number;
  sell_price: number;
  barcode?: string;
};

export type Sale = {
  id: number;
  sale_id: number;
  consumable_id: number;
  amount: number;
  sell_price: number;
  name: string;
  type: string;
  created_at: string;
  unit_price?: number;
};

export type StockMove = {
  date: string;
  name: string;
  type: string;
  change: number;
  reason: string;
};

type ConsumationContextType = {
  eatables: Consumable[];
  drinkables: Consumable[];
  fetchConsumables: () => void;
  addConsumable: (c: Omit<Consumable, "id">) => Promise<void>;
  sellConsumable: (id: number, amount: number, price: number) => Promise<void>;
  multiSellConsumable: (scannedItems: { id: number; _qty?: number; _price?: number; sell_price: number }[]) => Promise<void>;
  updateConsumable: (
    id: number,
    name: string,
    stock: number,
    unit_price: number,
    total_cost: number,
    sell_price: number
  ) => Promise<void>;
  searchConsumables: (q: string, type: string) => Promise<void>;
  deleteConsumable: (id: number) => Promise<void>;
  // Report data
  sales: Sale[];
  stockMoves: StockMove[];
  revenue: number;
  profit: number;
  fetchReport: () => Promise<void>;
};

const ConsumationContext = createContext<ConsumationContextType>({} as any);

export const useConsumation = () => useContext(ConsumationContext);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${API_BASE_URL}/api/consumation`;

export const ConsumationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [eatables, setEatables] = useState<Consumable[]>([]);
  const [drinkables, setDrinkables] = useState<Consumable[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stockMoves, setStockMoves] = useState<StockMove[]>([]);
  const [revenue, setRevenue] = useState<number>(0);
  const [profit, setProfit] = useState<number>(0);

  // Fetch consumables for POS
  const fetchConsumables = async () => {
    const res = await fetch(`${API_URL}/list`);
    const data: Consumable[] = await res.json();
    setEatables(Array.isArray(data) ? data.filter(d => d.type === "eatable") : []);
    setDrinkables(Array.isArray(data) ? data.filter(d => d.type === "drinkable") : []);
  };

  // Add new consumable
  const addConsumable = async (c: Omit<Consumable, "id">) => {
    await fetch(`${API_URL}/add`, {
      method: "POST",
      body: JSON.stringify(c),
      headers: { "Content-Type": "application/json" },
    });
    fetchConsumables();
  };

  // Sell single consumable
  const sellConsumable = async (id: number, amount: number, sell_price: number) => {
    await fetch(`${API_URL}/sell`, {
      method: "POST",
      body: JSON.stringify({ id, amount, sell_price }),
      headers: { "Content-Type": "application/json" },
    });
    fetchConsumables();
    fetchReport();
  };

  // Sell multiple consumables
  const multiSellConsumable = async (scannedItems: { id: number; _qty?: number; _price?: number; sell_price: number }[]) => {
    await fetch(`${API_URL}/multi-sell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: scannedItems.map(item => ({
          consumable_id: item.id,
          amount: item._qty || 1,
          sell_price: item._price ?? item.sell_price
        }))
      })
    });
    fetchConsumables();
    fetchReport();
  };

  // Update consumable
  const updateConsumable = async (
    id: number,
    name: string,
    stock: number,
    unit_price: number,
    total_cost: number,
    sell_price: number
  ) => {
    await fetch(`${API_URL}/update`, {
      method: "PUT",
      body: JSON.stringify({ id, name, stock, unit_price, total_cost, sell_price }),
      headers: { "Content-Type": "application/json" },
    });
    fetchConsumables();
  };

  // Delete consumable
  const deleteConsumable = async (id: number) => {
    await fetch(`${API_URL}/delete`, {
      method: "DELETE",
      body: JSON.stringify({ id }),
      headers: { "Content-Type": "application/json" },
    });
    fetchConsumables();
  };

  // Search consumables
  const searchConsumables = async (q: string, type: string) => {
    const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}&type=${type}`);
    const data = await res.json();
    setEatables(Array.isArray(data) ? data.filter((d: any) => d.type === "eatable") : []);
    setDrinkables(Array.isArray(data) ? data.filter((d: any) => d.type === "drinkable") : []);
  };

  // Fetch all report data (sales, stock moves, revenue, profit)
  const fetchReport = async () => {
    const res = await fetch(`${API_URL}/report`);
    const data = await res.json();
    setSales(data.sales || []);
    setStockMoves(data.stock_moves || []);
    setRevenue(Number(data.revenue || 0));
    setProfit(Number(data.profit || 0));
  };

  // Initial load
  useEffect(() => {
    fetchConsumables();
    fetchReport();
    // eslint-disable-next-line
  }, []);

  // WebSocket for real-time updates
  useEffect(() => {
    const socket = io(API_BASE_URL, {
      transports: ["websocket"],
    });

    socket.on("consumables-updated", () => {
      fetchConsumables();
      fetchReport();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <ConsumationContext.Provider
      value={{
        eatables,
        drinkables,
        fetchConsumables,
        addConsumable,
        sellConsumable,
        multiSellConsumable,
        updateConsumable,
        searchConsumables,
        deleteConsumable,
        sales,
        stockMoves,
        revenue,
        profit,
        fetchReport,
      }}
    >
      {children}
    </ConsumationContext.Provider>
  );
};