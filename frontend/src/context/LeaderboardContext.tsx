import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Types
export type Leader = {
  id: number;
  name: string;
  score: number;
  rank: number;
  avatar?: string;
  achievements: string[];
  stats: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    [key: string]: any;
  };
};

type LeaderboardContextType = {
  leaders: Leader[];
  addLeader: (leader: Omit<Leader, "id" | "rank">) => Promise<void>;
  updateLeader: (id: number, data: Partial<Leader>) => Promise<void>;
  removeLeader: (id: number) => Promise<void>;
  refresh: () => void;
};

const LeaderboardContext = createContext<LeaderboardContextType | undefined>(
  undefined
);

export function useLeaderboard() {
  const ctx = useContext(LeaderboardContext);
  if (!ctx) throw new Error("useLeaderboard must be used within the provider");
  return ctx;
}

const API_URL = 'http://myapp.test/backend/api/leaderboard.php';

function calcRanks(leaders: Leader[]): Leader[] {
  return [...leaders]
    .sort((a, b) => b.score - a.score)
    .map((leader, i) => ({ ...leader, rank: i + 1 }));
}

export const LeaderboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [leaders, setLeaders] = useState<Leader[]>([]);

  // Fetch leaders from API and set state
  async function refresh() {
    try {
      const res = await fetch(API_URL, { method: "GET" });
      if (!res.ok) throw new Error("Failed to fetch leaders");
      const data = await res.json();
      // Normalize data (parse JSON fields)
      const parsed = data.map((l: any) => ({
        ...l,
        id: Number(l.id),
        score: Number(l.score),
        rank: Number(l.rank ?? 0),
        achievements: Array.isArray(l.achievements)
          ? l.achievements
          : (l.achievements ? JSON.parse(l.achievements) : []),
        stats: typeof l.stats === "object"
          ? l.stats
          : (l.stats ? JSON.parse(l.stats) : { gamesPlayed: 0, wins: 0, losses: 0 }),
      }));
      setLeaders(calcRanks(parsed));
    } catch (e) {
      setLeaders([]);
    }
  }

  useEffect(() => {
    refresh();
    // Optionally: poll every N seconds for live updates
    // const interval = setInterval(refresh, 10000);
    // return () => clearInterval(interval);
  }, []);

  async function addLeader(leader: Omit<Leader, "id" | "rank">) {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(leader),
    });
    await refresh();
  }

  async function updateLeader(id: number, data: Partial<Leader>) {
    await fetch(`${API_URL}?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await refresh();
  }

  async function removeLeader(id: number) {
    await fetch(`${API_URL}?id=${id}`, {
      method: "DELETE",
    });
    await refresh();
  }

  return (
    <LeaderboardContext.Provider
      value={{ leaders, addLeader, updateLeader, removeLeader, refresh }}
    >
      {children}
    </LeaderboardContext.Provider>
  );
};