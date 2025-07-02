import { Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Login from './components/Auth/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import ClientDisplay from './components/ClientDisplay';
import { ConsoleProvider } from './context/ConsoleContext';
import { TransactionProvider } from './context/TransactionContext';
import { SettingsProvider } from './context/SettingsContext';
import { SessionProvider } from './context/SessionContext';
import { ConsumationProvider } from './context/ConsumationContext'; 
import ConsumationPage from './components/ConsumationPage'; 
import ProfilePage from './components/ProfilePage'; 
import { MoneyLogsProvider } from './context/MoneyLogsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LeaderboardProvider } from "./context/LeaderboardContext";
import LiveBoard from "./components/Leaderboard/LiveBoard";
import './types/i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from './types/i18n';
import { useEffect, useState } from "react";


const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <svg
            className="animate-spin h-10 w-10 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          <p className="text-gray-700 text-lg font-semibold">Loading, please wait...</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  const [showExitModal, setShowExitModal] = useState(false);

useEffect(() => {
  const handler = () => {
    console.log('show-exit-modal received in renderer');
    setShowExitModal(true);
  };
  window.electron.on("show-exit-modal", handler);
  return () => {
    window.electron.removeListener("show-exit-modal", handler);
  };
}, []);

  const handleExit = () => {
    window.electron.send("force-close");
  };

  return (
    <AuthProvider>  
      <I18nextProvider i18n={i18n}>
      <LeaderboardProvider>
      <SettingsProvider>
        <TransactionProvider>
          <ConsoleProvider>
            <SessionProvider>
              <ConsumationProvider>
                <MoneyLogsProvider>
                  <UserProvider>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute>
                            <AdminDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/client-display"
                        element={
                          <ProtectedRoute>
                            <ClientDisplay />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/consumation"
                        element={
                          <ProtectedRoute>
                            <ConsumationPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <ProfilePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/liveboard" 
                        element={
                          <ProtectedRoute>
                            <LiveBoard />
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                    {/* Exit Modal */}
                    {showExitModal && (
                      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
                          <h2 className="text-xl font-bold mb-4 text-gray-800">Confirm Exit</h2>
                          <p className="mb-6 text-gray-600">Are you sure you want to exit PS4 Rental Management?</p>
                          <div className="flex justify-end gap-2">
                            <button
                              className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                              onClick={() => setShowExitModal(false)}
                            >
                              Cancel
                            </button>
                            <button
                              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                              onClick={handleExit}
                            >
                              Exit
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </UserProvider>
                </MoneyLogsProvider>
              </ConsumationProvider>
            </SessionProvider>
          </ConsoleProvider>
        </TransactionProvider>
      </SettingsProvider>
      </LeaderboardProvider>
      </I18nextProvider>
    </AuthProvider>
  );
}

export default App;