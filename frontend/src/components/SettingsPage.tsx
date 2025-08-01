import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, DollarSign, Building, Phone, MapPin, Shield, Clock, Users, Volume2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useConsoles } from '../context/ConsoleContext';
import { useSessions } from '../context/SessionContext';
import type { Settings } from '../context/SettingsContext';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import i18n from '../types/i18n';
import { saveAs } from 'file-saver';


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
  const { t } = useTranslation();

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

  useEffect(() => {
  if (formData.language) {
    i18n.changeLanguage(formData.language);
  }
}, [formData.language]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Play sound effect if enabled in settings
  const playSound = () => {
    if (formData.soundEffects) {
      const audio = new Audio('/sounds/click.wav'); // Put your sound in /public/sounds/
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

  // --- Security & Backup Logic ---

  // Export data backup
  const handleExportBackup = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/backup/export`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to export backup');
      const blob = await res.blob();
      saveAs(blob, `backup-${new Date().toISOString().slice(0,10)}.json`);
      toast.success('Backup exported successfully!');
    } catch (err) {
      toast.error('Failed to export backup');
    }
  };

  // Import data backup
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('backup', file);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/backup/import`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to import backup');
      toast.success('Backup imported successfully!');
      // Optionally reload data here
    } catch (err) {
      toast.error('Failed to import backup');
    }
  };

  // Clear all data
  const handleClearAllData = async () => {
    if (!window.confirm('Are you sure you want to clear all data? This cannot be undone.')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/backup/clear`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to clear data');
      toast.success('All data cleared!');
      // Optionally reload data here
    } catch (err) {
      toast.error('Failed to clear data');
    }
  };

  return (
    <div className="space-y-6">
       {/* Notification */}
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <SettingsIcon className="w-6 h-6 mr-2 text-gray-400" />
          {t('system_settings')}
        </h2>
        <button
          onClick={() => {
            playSound();
            handleSave();
          }}
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
            {t('business_information')}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('business_name')}</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={e => handleInputChange('businessName', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('business_phone')}</label>
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
              <label className="block text-sm text-gray-400 mb-1">{t('business_address')}</label>
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
            {t('pricing_settings')}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('price_per_hour')}</label>
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
              <label className="block text-sm text-gray-400 mb-1">{t('currency')}</label>
              <select
                value={formData.currency}
                onChange={e => handleInputChange('currency', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="DA">{t('DA (Dinar Algérien)')}</option>
                <option value="USD">{t('USD (Dollar Américain)')}</option>
                <option value="EUR">{t('EUR (Euro)')}</option>
                <option value="MAD">{t('MAD (Dirham Marocain)')}</option>
                <option value="TND">{t('TND (Dinar Tunisien)')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('tax_rate')}</label>
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
            {t('system preferences')} 
          </h3>
          <div className="space-y-4">
            {/* Language */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('language')}</label>
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
              <label className="block text-sm text-gray-400 mb-1">{t('theme')}</label>
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
                {t('enable_sound_effects')}
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
                <label className="text-sm text-white">{t('auto_stop')}</label>
                <p className="text-xs text-gray-400">{t('auto_stop_description')}</p>
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
                <label className="text-sm text-white">{t('allow_extensions')}</label>
                <p className="text-xs text-gray-400">{t('allow_extensions_description')}</p>
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
                <label className="text-sm text-white">{t('require_customer_info')}</label>
                <p className="text-xs text-gray-400">{t('require_customer_info_description')}</p>
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
            {t('security_and_backup')}
          </h3>
          <div className="space-y-4">
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              onClick={handleExportBackup}
            >
              {t('export_data_backup')}
            </button>
            
            {/* Improved Import Backup Button */}
            <div className="relative w-full">
              <input
                id="import-backup"
                type="file"
                accept=".json"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleImportBackup}
                tabIndex={-1}
              />
              <label
                htmlFor="import-backup"
                className="w-full inline-block bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors text-center cursor-pointer"
                style={{ position: 'relative', zIndex: 1 }}
              >
                {t('import_data_backup')}
              </label>
            </div>

            <button
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
              onClick={handleClearAllData}
            >
              {t('clear_all_data')}
            </button>
            <div className="pt-4 border-t border-gray-600">
              <p className="text-xs text-gray-400">
                {(t('data_backup_description'))}
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
            {t('set_all_maintenance')}
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors"
            onClick={setAllConsolesToAvailable}
          >
            {t('set_all_available')}
          </button>
          <button
            className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors"
            onClick={stopAllActiveSessions}
          >
            {t('stop_all_sessions')}
          </button>
          <button onClick={checkForUpdate} className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors">
            {t('check_update')}
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