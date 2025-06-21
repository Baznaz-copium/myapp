import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, DollarSign, Building, Phone, MapPin, Shield, Clock, Users } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useConsoles } from '../context/ConsoleContext';
import { useSessions } from '../context/SessionContext';
import type { Settings } from '../context/SettingsContext';
import toast, { Toaster } from 'react-hot-toast';

function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { consoles, updateConsole, fetchConsoles } = useConsoles();
  const { sessions, stopSession, fetchSessions } = useSessions();
  const [formData, setFormData] = useState(settings ?? {} as Settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        ...settings,
        requireCustomerInfo: Number(settings.requireCustomerInfo) === 1,
        autoStopOnTimeUp: Number(settings.autoStopOnTimeUp) === 1,
        allowExtensions: Number(settings.allowExtensions) === 1,
      });
    }
  }, [settings]);
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Save handler
  const handleSave = async () => {
    // convert boolean values to 0/1 before saving
    const payload = {
      ...formData,
      requireCustomerInfo: formData.requireCustomerInfo ? 1 : 0,
      autoStopOnTimeUp: formData.autoStopOnTimeUp ? 1 : 0,
      allowExtensions: formData.allowExtensions ? 1 : 0,
    } as unknown as Settings;
    await updateSettings(payload);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  // Quick Actions
  const setAllConsolesToMaintenance = async () => {
    for (const c of consoles) {
      await updateConsole({ ...c, status: 'maintenance' });
    }
    await fetchConsoles();
    toast.success('All consoles set to maintenance mode');
    setSaved(true);
  };

  const setAllConsolesToAvailable = async () => {
    for (const c of consoles) {
      await updateConsole({ ...c, status: 'available' });
    }
    await fetchConsoles();
    toast.success('All consoles set to available mode');
    setSaved(true);
  };

  const stopAllActiveSessions = async () => {
    for (const s of sessions.filter(s => s.running)) {
      await stopSession(s.id, new Date().toISOString().slice(0, 19).replace('T', ' '), s.totalMinutes);
    }
    await fetchSessions();
    await fetchConsoles();
    toast.success('All active sessions stopped');
    setSaved(true);
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
                onChange={(e) => handleInputChange('businessName', e.target.value)}
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
                  onChange={(e) => handleInputChange('businessPhone', e.target.value)}
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
                  onChange={(e) => handleInputChange('businessAddress', e.target.value)}
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
                  onChange={(e) => handleInputChange('pricePerHour', parseFloat(e.target.value) || 0)}
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
                onChange={(e) => handleInputChange('currency', e.target.value)}
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
                onChange={(e) => handleInputChange('taxRate', (parseFloat(e.target.value) || 0) / 100)}
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
            System Preferences
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-white">Auto-stop on time up</label>
                <p className="text-xs text-gray-400">Automatically stop sessions when time expires</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoStopOnTimeUp}
                  onChange={(e) => handleInputChange('autoStopOnTimeUp', e.target.checked)}
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
                  onChange={(e) => handleInputChange('allowExtensions', e.target.checked)}
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
                  onChange={(e) => handleInputChange('requireCustomerInfo', e.target.checked)}
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
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;