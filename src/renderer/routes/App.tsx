import { Navigate, Route, Routes } from 'react-router-dom';
import PageNotFound from '../components/Shared/PageNotFound';
import Layout from '../layouts/Layout';
import ProtectedRoute from '../app/ProtectedRoute';
import { useEffect, useState } from 'react';
import userAPI from '../api/user';
import POSLogin from '../pages/Login';
import DashboardPage from '../pages/dashboard';
import FirstRunSetup from '../pages/Setup';
import CashierSalePage from '../pages/CashierSale';
import ProductPage from '../pages/Product/Table';
import { TransactionPage } from '../pages/Transaction';
import { TransactionProvider } from '../pages/Transaction/context/TransactionContext';
import ReturnsPage from '../pages/Return';
import { CustomerDirectoryPage } from '../pages/customer';
import { LoyaltyProgramPage } from '../pages/Loyalty';
import { UserProvider } from '../user/context/UserContext';
import { UserManagementPage } from '../user';


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

            {/* Core POS */}
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="pos/cashier" element={<CashierSalePage />} />
            <Route path='/pos/products' element={<ProductPage />} />
            <Route path="pos/transactions" element={<TransactionProvider>
              <TransactionPage />
            </TransactionProvider>} />
            <Route path="pos/returns" element={<ReturnsPage />} />

            {/* Products */}
            <Route path="products/list" element={<div>Product Catalog</div>} />
            <Route path="products/categories" element={<div>Categories</div>} />
            <Route path="products/inventory" element={<div>Inventory</div>} />
            <Route path="products/pricing" element={<div>Pricing</div>} />
            <Route path="products/barcode" element={<div>Barcode Manager</div>} />

            {/* Customers */}
            <Route path="customers/list" element={<CustomerDirectoryPage/>} />
            <Route path="customers/loyalty" element={<LoyaltyProgramPage/>} />
            <Route path="customers/groups" element={<div>Customer Groups</div>} />
            <Route path="customers/credit" element={<div>Credit Accounts</div>} />
            <Route path="customers/feedback" element={<div>Customer Feedback</div>} />

            {/* Suppliers */}
            <Route path="suppliers/list" element={<div>Supplier List</div>} />
            <Route path="suppliers/orders" element={<div>Purchase Orders</div>} />
            <Route path="suppliers/payments" element={<div>Supplier Payments</div>} />
            <Route path="suppliers/returns" element={<div>Supplier Returns</div>} />

            {/* Sales */}
            <Route path="sales/daily" element={<div>Daily Sales</div>} />
            <Route path="sales/reports" element={<div>Sales Reports</div>} />
            <Route path="sales/orders" element={<div>Order Management</div>} />
            <Route path="sales/discounts" element={<div>Discounts & Promos</div>} />
            <Route path="sales/quotations" element={<div>Quotations</div>} />

            {/* Analytics */}
            <Route path="analytics/sales" element={<div>Sales Analytics</div>} />
            <Route path="analytics/inventory" element={<div>Inventory Reports</div>} />
            <Route path="analytics/customers" element={<div>Customer Insights</div>} />
            <Route path="analytics/financial" element={<div>Financial Reports</div>} />
            <Route path="analytics/export" element={<div>Export Data</div>} />

            {/* System */}
            <Route path="users" element={<UserManagementPage />} />
            <Route path="settings/general" element={<div>General Settings</div>} />
            <Route path="settings/payments" element={<div>Payment Methods</div>} />
            <Route path="settings/tax" element={<div>Tax Settings</div>} />
            <Route path="settings/receipt" element={<div>Receipt Settings</div>} />
            <Route path="system/audit" element={<div>Audit Trail</div>} />
            <Route path="notification-logs" element={<div>Notification Logs</div>} />
            <Route path="system/backup" element={<div>Backup & Restore</div>} />




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