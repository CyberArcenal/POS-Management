import { Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from '../components/Shared/PageNotFound';
import Layout from '../layouts/Layout';
import ProtectedRoute from '../app/ProtectedRoute';
import { useEffect, useState } from 'react';
import userAPI from '../api/user';
import POSLogin from '../pages/Login';
import DashboardPage from '../pages/dashboard';
import FirstRunSetup from '../pages/Setup';


function App() {
  const [setupRequired, setSetupRequired] = useState<boolean | null>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const response = await userAPI.getAllUsers();
      console.log(response)
      const hasUsers = response.data && response.data.length > 0;
      setSetupRequired(!hasUsers);
    } catch (error) {
      console.error('Error checking setup:', error);
      setSetupRequired(true); // Default to setup required on error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background-color)'
      }}>
        <div className="text-center">
          <div style={{
            animation: 'spin 1s linear infinite',
            borderRadius: '50%',
            width: '3rem',
            height: '3rem',
            border: '3px solid transparent',
            borderTop: '3px solid var(--primary-color)',
            margin: '0 auto 1rem auto'
          }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }
  return (
    <Routes>
      {/* Setup route - only accessible when no users exist */}
      {setupRequired && (
        <Route path="*" element={<FirstRunSetup />} />
      )}

      {!setupRequired && (
        <>
          {/* Public routes */}
          <Route path="/login" element={<POSLogin />} />

          {/* Protected routes - wrap with ProtectedRoute */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage/>} />
            <Route path="products" element={<div>Products</div>} />
            <Route path="orders" element={<div>Orders</div>} />
            <Route path="customers" element={<div>Customers</div>} />
            <Route path="reports" element={<div>Reports</div>} />
            <Route path="settings" element={<div>Settings</div>} />
            {/* Define protected routes here */}

            {/* Default redirect */}
            <Route path="/" element={
              setupRequired ? <Navigate to="/setup" replace /> : <Navigate to="/login" replace />
            } />

            {/* 404 Page - Must be the last route */}
            <Route path="*" element={<PageNotFound />} />
          </Route>

          {/* Fallback redirect for unauthenticated */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </>
      )}

    </Routes>
  );
}

export default App;