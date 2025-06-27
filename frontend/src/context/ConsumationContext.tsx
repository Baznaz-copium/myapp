import React, { createContext, useContext, useEffect, useState } from "react";

export type Consumable = {
  id: number;
  name: string;
  type: "eatable" | "drinkable";
  stock: number;
  unit_price: number;
  total_cost: number;
  sell_price: number;
};

export type RevenueStats = {
  today: number;
  week: number;
  month: number;
};

type ConsumationContextType = {
  eatables: Consumable[];
  drinkables: Consumable[];
  fetchConsumables: () => void;
  addConsumable: (c: Omit<Consumable, "id">) => Promise<void>;
  sellConsumable: (id: number, amount: number, price: number) => Promise<void>;
  updateConsumable: (
    id: number,
    name: string,
    stock: number,
    unit_price: number,
    total_cost: number,
    sell_price: number
  ) => Promise<void>;
  searchConsumables: (q: string, type: string) => Promise<void>;
  revenue: RevenueStats;
  fetchRevenue: () => void;
  deleteConsumable: (id: number) => Promise<void>;
};

const ConsumationContext = createContext<ConsumationContextType>({} as any);

export const useConsumation = () => useContext(ConsumationContext);

const API_URL = 'http://myapp.test/backend/api/Consumation.php';

export const ConsumationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [eatables, setEatables] = useState<Consumable[]>([]);
  const [drinkables, setDrinkables] = useState<Consumable[]>([]);
  const [revenue, setRevenue] = useState<RevenueStats>({ today: 0, week: 0, month: 0 });

  const fetchConsumables = async () => {
    const res = await fetch(`${API_URL}?action=list`);
    const data: Consumable[] = await res.json();
    setEatables(Array.isArray(data) ? data.filter(d => d.type === "eatable") : []);
    setDrinkables(Array.isArray(data) ? data.filter(d => d.type === "drinkable") : []);
  };

  const addConsumable = async (c: Omit<Consumable, "id">) => {
    await fetch(`${API_URL}?action=add`, {
      method: "POST",
      body: JSON.stringify(c),
      headers: { "Content-Type": "application/json" },
    });
    fetchConsumables();
  };

  const sellConsumable = async (id: number, amount: number, sell_price: number) => {
    await fetch(`${API_URL}?action=sell`, {
      method: "POST",
      body: JSON.stringify({ id, amount, sell_price }),
      headers: { "Content-Type": "application/json" },
    });
    fetchConsumables();
    fetchRevenue();
  };

  const updateConsumable = async (
    id: number,
    name: string,
    stock: number,
    unit_price: number,
    total_cost: number,
    sell_price: number
  ) => {
    await fetch(`${API_URL}?action=update`, {
      method: "POST",
      body: JSON.stringify({ id, name, stock, unit_price, total_cost, sell_price }),
      headers: { "Content-Type": "application/json" },
    });
    fetchConsumables();
  };

  const deleteConsumable = async (id: number) => {
    await fetch(`${API_URL}?action=delete`, {
      method: "POST",
      body: JSON.stringify({ id }),
      headers: { "Content-Type": "application/json" },
    });
    fetchConsumables();
  };

  const fetchRevenue = async () => {
    const [today, week, month] = await Promise.all([
      fetch(`${API_URL}?action=revenue&period=today`).then(r => r.json()),
      fetch(`${API_URL}?action=revenue&period=week`).then(r => r.json()),
      fetch(`${API_URL}?action=revenue&period=month`).then(r => r.json()),
    ]);

    setRevenue({
      today: Number(today.revenue || 0),
      week: Number(week.revenue || 0),
      month: Number(month.revenue || 0),
    });
  };

  const searchConsumables = async (q: string, type: string) => {
    const res = await fetch(`${API_URL}?action=search&q=${encodeURIComponent(q)}&type=${type}`);
    const data = await res.json();
    setEatables(Array.isArray(data) ? data.filter((d: any) => d.type === "eatable") : []);
    setDrinkables(Array.isArray(data) ? data.filter((d: any) => d.type === "drinkable") : []);
  };

  useEffect(() => {
    fetchConsumables();
    fetchRevenue();
    // eslint-disable-next-line
  }, []);

  return (
    <ConsumationContext.Provider
      value={{
        eatables,
        drinkables,
        fetchConsumables,
        addConsumable,
        sellConsumable,
        updateConsumable,
        searchConsumables,
        revenue,
        fetchRevenue,
        deleteConsumable,
      }}
    >
      {children}
    </ConsumationContext.Provider>
  );
};