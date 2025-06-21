import React, { useState, useEffect } from 'react';
import { Gamepad2, Clock, DollarSign, Wifi, WifiOff } from 'lucide-react';
import { useConsoles } from '../context/ConsoleContext';
import { useSettings } from '../context/SettingsContext';
import { useSessions } from '../context/SessionContext';

function ClientDisplay() {
  const { consoles } = useConsoles();
  const { settings } = useSettings();
  const { sessions, fetchSessions } = useSessions();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const fetchSessionsRef = React.useRef(fetchSessions);

  useEffect(() => {
    fetchSessionsRef.current = fetchSessions;
  }, [fetchSessions]);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Poll sessions every 10 seconds for live updates
    const sessionInterval = setInterval(() => {
      fetchSessionsRef.current();
    }, 10000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(sessionInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchSessions]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds: number): string => {
    const s = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // For each console, find its running session (if any)
  const getConsoleSession = (consoleId: number) =>
    sessions.find(s => s.consoleId === consoleId && s.running);

  const getConsoleStatus = (console: any) => {
    const session = getConsoleSession(console.id);
    if (!session) return null;

    const now = currentTime;
    const start = new Date(session.startTime.replace(' ', 'T'));
    const end = new Date(session.endTime.replace(' ', 'T'));
    const usedSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);
    const totalSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    const remainingSeconds = Math.max(0, totalSeconds - usedSeconds);
    const progress = totalSeconds > 0 ? Math.min(100, (usedSeconds / totalSeconds) * 100) : 0;

    return {
      usedTime: formatDuration(usedSeconds),
      remainingTime: formatDuration(remainingSeconds),
      progress,
      isActive: now < end,
      session,
      startTime: start,
    };
  };

  const activeConsoles = consoles.filter(c =>
    sessions.some(s => s.consoleId === c.id && s.running)
  );
  const availableConsoles = consoles.filter(c =>
    !sessions.some(s => s.consoleId === c.id && s.running) && c.status === 'available'
  );

  return (
    <div className="min-h-screen h-screen w-full bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-gray-700/50 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500/20 p-3 rounded-xl">
                <Gamepad2 className="w-10 h-10 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{settings?.businessName}</h1>
                <p className="text-blue-300">{settings?.businessAddress}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-4xl font-mono font-bold text-white mb-1">
                {formatTime(currentTime)}
              </div>
              <div className="text-lg text-gray-300">
                {formatDate(currentTime)}
              </div>
              <div className="flex items-center justify-end mt-2 space-x-2">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-400" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-400" />
                )}
                <span className="text-sm text-gray-400">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-8 py-2 flex-1 flex flex-col overflow-hidden">
          {/* Pricing Info */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-4 sm:p-8 mb-4 border border-blue-500/30">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <DollarSign className="w-8 h-8 text-yellow-400" />
                <h2 className="text-3xl font-bold text-white">Pricing</h2>
              </div>
              <div className="text-6xl font-bold text-yellow-400 mb-2">
                {settings?.pricePerHour} {settings?.currency}
              </div>
              <div className="text-2xl text-gray-300">per hour</div>
            </div>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-8 overflow-hidden">
            {/* Available Consoles */}
            <div className="flex-1 min-w-0 flex flex-col bg-black/20 backdrop-blur-sm rounded-2xl p-2 sm:p-4 border border-green-500/30">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className="text-2xl font-bold text-green-400">Available Consoles</h3>
                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-lg font-semibold">
                  {availableConsoles.length}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center">
                {availableConsoles.map((console) => (
                  <div
                    key={console.id}
                    className="flex-1 min-w-[120px] max-w-[180px] bg-green-500/10 rounded-xl p-2 border border-green-500/20 m-1"
                    style={{ flexBasis: '140px' }}
                  >
                    <div className="text-center">
                      <Gamepad2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                      <h4 className="text-lg font-semibold text-white mb-1">{console.name}</h4>
                      <div className="text-green-400 font-medium">Ready to Play</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {availableConsoles.length === 0 && (
                <div className="text-center py-12">
                  <Gamepad2 className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
                  <p className="text-xl text-gray-400">All consoles are currently in use</p>
                </div>
              )}
            </div>

            {/* Active Sessions */}
            <div className="flex-1 min-w-0 flex flex-col bg-black/20 backdrop-blur-sm rounded-2xl p-2 sm:p-4 border border-red-500/30">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                <h3 className="text-2xl font-bold text-red-400">Active Sessions</h3>
                <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-lg font-semibold">
                  {activeConsoles.length}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center">
                {activeConsoles.map((console) => {
                  const status = getConsoleStatus(console);
                  if (!status) return null;
                  return (
                    <div
                      key={console.id}
                      className="flex-1 min-w-[140px] max-w-[200px] bg-red-500/10 rounded-xl p-2 border border-red-500/20 m-1"
                      style={{ flexBasis: '160px' }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Gamepad2 className="w-8 h-8 text-red-400" />
                          <div>
                            <h4 className="text-lg font-semibold text-white">{console.name}</h4>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-mono text-yellow-400">
                            {status.remainingTime}
                          </div>
                          <div className="text-sm text-gray-400">remaining</div>
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <div className="flex justify-between text-sm text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{status.progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-red-500 to-yellow-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${status.progress}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Used: {status.usedTime}</span>
                        <span className="text-gray-400">
                          Started: {status.startTime.toLocaleTimeString('en-US', { hour12: false })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {activeConsoles.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
                  <p className="text-xl text-gray-400">No active sessions</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center flex-shrink-0">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-2 sm:p-4 border border-gray-700/30">
              <p className="text-gray-400 text-xs sm:text-base">
                Contact us: {settings?.businessPhone} | Visit us at {settings?.businessAddress}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientDisplay;