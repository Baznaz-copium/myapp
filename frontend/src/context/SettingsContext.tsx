import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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
  language: string;          
  theme: string;             
  soundEffects: boolean;     
}

interface SettingsContextType {
  settings: Settings | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};

const API_URL = 'http://myapp.test/backend/api/settings.php';

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings | null>(null);

  const fetchSettings = async () => {
    const res = await fetch(API_URL);
    setSettings(await res.json());
  };

  const updateSettings = async (settings: Settings) => {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    await fetchSettings();
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, fetchSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};