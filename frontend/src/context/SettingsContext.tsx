import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { saveAs } from 'file-saver';

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
  exportBackup: () => Promise<Blob>;
  importBackup: (file: File) => Promise<any>;
  clearBackup: () => Promise<any>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_URL = `${API_BASE_URL}/api/settings`;
const backup_api_url = `${API_BASE_URL}/api/backup`;

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

  // Export backup (download JSON)
  const exportBackup = async () => {
  const res = await fetch(`${backup_api_url}/export`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to export backup');
  const blob = await res.blob();
  // Use FileSaver or similar to save the file
  saveAs(blob, `backup-${new Date().toISOString().slice(0,10)}.json`);
  return blob;
};

// Import backup (upload JSON)
 const importBackup = async (file: File) => {
  const formData = new FormData();
  formData.append('backup', file);
  const res = await fetch(`${backup_api_url}/import`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to import backup');
  return await res.json();
};

// Clear all data
 const clearBackup = async () => {
  const res = await fetch(`${backup_api_url}/clear`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to clear data');
  return await res.json();
};

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, fetchSettings, updateSettings, exportBackup, importBackup, clearBackup }}>
      {children}
    </SettingsContext.Provider>
  );
};