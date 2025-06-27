import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, DollarSign, Building, Phone, MapPin, Shield, Clock, Users, Volume2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useConsoles } from '../context/ConsoleContext';
import { useSessions } from '../context/SessionContext';
import type { Settings } from '../context/SettingsContext';
import toast, { Toaster } from 'react-hot-toast';

// Extend the Window interface to include the electron property
declare global {
  interface Window {
    electron: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on?: (channel: string, listener: (...args: any[]) => void) => void;
      removeListener?: (channel: string, listener: (...args: any[]) => void) => void;
    };
  }
}

const languageList = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "ar", name: "العربية" },
  { code: "es", name: "Español" },
  { code: "de", name: "Deutsch" },
];

const themeList = [
  { value: "auto", label: "Auto" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { consoles, updateConsole, fetchConsoles } = useConsoles();
  const { sessions, stopSession, fetchSessions } = useSessions();
  const [formData, setFormData] = useState(settings ?? {} as Settings);
  const [saved, setSaved] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<"idle"|"checking"|"available"|"downloading"|"downloaded"|"up-to-date"|"error">("idle");
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        ...settings,
        requireCustomerInfo: Number(settings.requireCustomerInfo) === 1,
        autoStopOnTimeUp: Number(settings.autoStopOnTimeUp) === 1,
        allowExtensions: Number(settings.allowExtensions) === 1,
        soundEffects: settings?.soundEffects ?? false,
        language: settings?.language || "en",
        theme: settings?.theme || "auto",
      });
    }
  }, [settings]);
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Play sound effect if enabled in settings
  const playSound = () => {
    if (formData.soundEffects) {
      const audio = new Audio('/sounds/click.mp3'); // Put your sound in /public/sounds/
      audio.play();
    }
  };

  // Save handler
  const handleSave = async () => {
    playSound();
    // convert boolean values to 0/1 before saving
    const payload = {
      ...formData,
      requireCustomerInfo: formData.requireCustomerInfo ? 1 : 0,
      autoStopOnTimeUp: formData.autoStopOnTimeUp ? 1 : 0,
      allowExtensions: formData.allowExtensions ? 1 : 0,
      soundEffects: formData.soundEffects ? 1 : 0,
    } as unknown as Settings;
    await updateSettings(payload);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  // Quick Actions
  const setAllConsolesToMaintenance = async () => {
    playSound();
    for (const c of consoles) {
      await updateConsole({ ...c, status: 'maintenance' });
    }
    await fetchConsoles();
    toast.success('All consoles set to maintenance mode');
    setSaved(true);
  };

  const setAllConsolesToAvailable = async () => {
    playSound();
    for (const c of consoles) {
      await updateConsole({ ...c, status: 'available' });
    }
    await fetchConsoles();
    toast.success('All consoles set to available mode');
    setSaved(true);
  };

  const stopAllActiveSessions = async () => {
    playSound();
    for (const s of sessions.filter(s => s.running)) {
      await stopSession(s.id, new Date().toISOString().slice(0, 19).replace('T', ' '), s.totalMinutes);
    }
    await fetchSessions();
    await fetchConsoles();
    toast.success('All active sessions stopped');
    setSaved(true);
  };
  
  // Listen for update events
  useEffect(() => {
    if (!window.electron?.on) return;
    const onAvailable = (_e: any, info: any) => {
      setUpdateStatus("available");
      setUpdateInfo(info);
      setShowUpdateModal(true);
    };
    const onProgress = (_e: any, progress: any) => {
      setUpdateStatus("downloading");
      setDownloadProgress(progress.percent || 0);
    };
    const onDownloaded = () => {
      setUpdateStatus("downloaded");
    };
    window.electron.on("update-available", onAvailable);
    window.electron.on("update-download-progress", onProgress);
    window.electron.on("update-downloaded", onDownloaded);
    return () => {
      window.electron.removeListener && window.electron.removeListener("update-available", onAvailable);
      window.electron.removeListener && window.electron.removeListener("update-download-progress", onProgress);
      window.electron.removeListener && window.electron.removeListener("update-downloaded", onDownloaded);
    };
  }, []);

  const checkForUpdate = async () => {
    setUpdateStatus("checking");
    try {
      const result = await window.electron.invoke("check-for-update");
      if (result?.error) {
        setUpdateStatus("error");
        toast.error("Update check failed: " + result.error);
      } else if (result?.version) {
        setUpdateStatus("available");
        setUpdateInfo(result);
        setShowUpdateModal(true);
      } else {
        setUpdateStatus("up-to-date");
        setShowUpdateModal(true);
      }
    } catch (err) {
      setUpdateStatus("error");
      toast.error("Error checking for updates");
    }
  };

  const startDownload = async () => {
    setUpdateStatus("downloading");
    await window.electron.invoke("start-update-download");
  };

  const restartToUpdate = async () => {
    await window.electron.invoke("restart-to-update");
  };

  return (
    <div className="space-y-6">
       {/* Notification */}
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <SettingsIcon className="w-6 h-6 mr-2 text-gray-400" />
          System Settings
        </h2>
        <button
          onClick={handleSave}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            saved 
              ? 'bg-green-600 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <Save className="w-4 h-4" />
          <span>{saved ? 'Saved!' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Information */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Building className="w-5 h-5 mr-2 text-blue-400" />
            Business Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Business Name</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={e => handleInputChange('businessName', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={formData.businessPhone}
                  onChange={e => handleInputChange('businessPhone', e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <textarea
                  value={formData.businessAddress}
                  onChange={e => handleInputChange('businessAddress', e.target.value)}
                  rows={3}
                  className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Settings */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-400" />
            Pricing Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Price per Hour</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.pricePerHour}
                  onChange={e => handleInputChange('pricePerHour', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="10"
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 pr-12 border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {formData.currency}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Currency</label>
              <select
                value={formData.currency}
                onChange={e => handleInputChange('currency', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="DA">DA (Algerian Dinar)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="MAD">MAD (Moroccan Dirham)</option>
                <option value="TND">TND (Tunisian Dinar)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tax Rate (%)</label>
              <input
                type="number"
                value={formData.taxRate * 100}
                onChange={e => handleInputChange('taxRate', (parseFloat(e.target.value) || 0) / 100)}
                min="0"
                max="100"
                step="0.1"
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* System Preferences */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-purple-400" />
            System Preferences & Fun
          </h3>
          <div className="space-y-4">
            {/* Language */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Language</label>
              <select
                value={formData.language}
                onChange={e => handleInputChange('language', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                {languageList.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
            {/* Theme */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Theme (Color Mode)</label>
              <select
                value={formData.theme}
                onChange={e => handleInputChange('theme', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                {themeList.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            {/* Sound Effects */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-white flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Enable Sound Effects (add/save/delete/edit)
              </label>
              <input
                type="checkbox"
                checked={!!formData.soundEffects}
                onChange={e => handleInputChange('soundEffects', e.target.checked)}
                className="h-5 w-5 text-blue-600 rounded"
              />
            </div>
            {/* Existing toggles */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white">Auto-stop on time up</label>
                <p className="text-xs text-gray-400">Automatically stop sessions when time expires</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoStopOnTimeUp}
                  onChange={e => handleInputChange('autoStopOnTimeUp', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white">Allow extensions</label>
                <p className="text-xs text-gray-400">Allow extending active sessions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowExtensions}
                  onChange={e => handleInputChange('allowExtensions', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white">Require customer info</label>
                <p className="text-xs text-gray-400">Require customer name before starting sessions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requireCustomerInfo}
                  onChange={e => handleInputChange('requireCustomerInfo', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-red-400" />
            Security & Backup
          </h3>
          <div className="space-y-4">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
              Export Data Backup
            </button>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
              Import Data Backup
            </button>
            <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors">
              Clear All Data
            </button>
            <div className="pt-4 border-t border-gray-600">
              <p className="text-xs text-gray-400">
                Data is automatically saved to your backend database. 
                Regular backups are recommended to prevent data loss.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-yellow-400" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            className="bg-yellow-600 hover:bg-yellow-700 text-white py-3 px-4 rounded-lg transition-colors"
            onClick={setAllConsolesToMaintenance}
          >
            Set All Consoles to Maintenance
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors"
            onClick={setAllConsolesToAvailable}
          >
            Set All Consoles to Available
          </button>
          <button
            className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors"
            onClick={stopAllActiveSessions}
          >
            Stop All Active Sessions
          </button>
          <button onClick={checkForUpdate} className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors">
            Check for Updates
          </button>
        </div>
      </div>

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 rounded-xl p-8 shadow-2xl w-full max-w-md text-center border border-blue-700">
            {updateStatus === "checking" && <div>Checking for updates...</div>}
            {updateStatus === "up-to-date" && (
              <>
                <div className="text-green-400 text-lg font-bold mb-2">You're up to date!</div>
                <button className="mt-4 px-4 py-2 bg-blue-600 rounded text-white" onClick={() => setShowUpdateModal(false)}>Close</button>
              </>
            )}
            {updateStatus === "available" && (
              <>
                <div className="text-yellow-400 text-lg font-bold mb-2">Update Available: v{updateInfo?.version}</div>
                <div className="mb-4 text-gray-300">{updateInfo?.releaseName || ""}</div>
                <button className="px-4 py-2 bg-green-600 rounded text-white" onClick={startDownload}>
                  Start Download
                </button>
                <button className="ml-2 px-4 py-2 bg-gray-700 rounded text-white" onClick={() => setShowUpdateModal(false)}>
                  Cancel
                </button>
              </>
            )}
            {updateStatus === "downloading" && (
              <>
                <div className="text-blue-400 text-lg font-bold mb-2">Downloading Update...</div>
                <div className="w-full bg-gray-700 rounded h-4 overflow-hidden mb-2">
                  <div className="bg-blue-500 h-4 transition-all" style={{ width: `${downloadProgress}%` }} />
                </div>
                <div className="text-gray-300 mb-2">{downloadProgress.toFixed(1)}%</div>
              </>
            )}
            {updateStatus === "downloaded" && (
              <>
                <div className="text-green-400 text-lg font-bold mb-2">Update Downloaded!</div>
                <button className="px-4 py-2 bg-blue-600 rounded text-white" onClick={restartToUpdate}>
                  Restart & Install
                </button>
              </>
            )}
            {updateStatus === "error" && (
              <>
                <div className="text-red-400 text-lg font-bold mb-2">Error checking for updates.</div>
                <button className="mt-4 px-4 py-2 bg-blue-600 rounded text-white" onClick={() => setShowUpdateModal(false)}>Close</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;