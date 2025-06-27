import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface Session {
  id: number;
  consoleId: number;
  Player_1: string;
  Player_2: string;
  startTime: string;
  endTime: string;
  totalMinutes: number;
  running: boolean;
}

interface SessionContextType {
  sessions: Session[];
  fetchSessions: () => Promise<void>;
  startSession: (session: Omit<Session, 'id' | 'running'>) => Promise<void>;
  stopSession: (id: number, endTime: string, totalMinutes: number) => Promise<void>;
  extendSession: (id: number, endTime: string, totalMinutes: number) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSessions = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSessions must be used within SessionProvider');
  return ctx;
};

const API_URL = 'http://myapp.test/backend/api/sessions.php';

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<Session[]>([]);

  const fetchSessions = async () => {
    const res = await fetch(API_URL);
    setSessions(await res.json());
  };

  const startSession = async (session: Omit<Session, 'id' | 'running'>) => {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    await fetchSessions();
  };

  const extendSession = async (id: number, endTime: string, totalMinutes: number) => {
    // Use PUT (if PATCH keeps failing)
    await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, endTime, totalMinutes, running: 1 }),
    });
    await fetchSessions();
  };
  
  const stopSession = async (id: number, endTime: string, totalMinutes: number) => {
    await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, endTime, totalMinutes, running: 0 }),
    });
    await fetchSessions();
  };

  useEffect(() => { fetchSessions(); }, []);

  return (
    <SessionContext.Provider value={{ sessions, fetchSessions, startSession, stopSession, extendSession }}>
      {children}
    </SessionContext.Provider>
  );
};