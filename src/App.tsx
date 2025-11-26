import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { TransactionProvider } from './contexts/TransactionContext';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Chat from './pages/Chat';
import History from './pages/History';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Subscription from './pages/Subscription';
import Receipts from './pages/Receipts';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Reminders from './pages/Reminders';

function App() {
  const { initAuth, user } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <TransactionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/chat" replace />} />
            <Route path="chat" element={<Chat />} />
            <Route path="history" element={<History />} />
            <Route path="reports" element={<Reports />} />
            <Route path="receipts" element={<Receipts />} />
            <Route path="budgets" element={<Budgets />} />
            <Route path="goals" element={<Goals />} />
            <Route path="reminders" element={<Reminders />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="subscription" element={<Subscription />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TransactionProvider>
  );
}

export default App;
