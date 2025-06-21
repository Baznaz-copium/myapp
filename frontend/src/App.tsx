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

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
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
                    </Routes>
                  </UserProvider>
                </MoneyLogsProvider>
              </ConsumationProvider>
            </SessionProvider>
          </ConsoleProvider>
        </TransactionProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;