import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "../layouts/Layout";
import DashboardPage from "../pages/dashboard";
import Cashier from "../pages/cashier";
import Transactions from "../pages/Transactions/Transactions";
import ProductPage from "../pages/Product/Product";
import CustomerPage from "../pages/Customer";
import CustomerLoyaltyPage from "../pages/CustomerLoyalty";
import MovementPage from "../pages/Movement";
import AuditTrailPage from "../pages/AuditTrail";
// import ProductPage from "../pages/Product";

// Placeholder components
const TransactionsPage = () => <div>📑 Transactions Page (placeholder)</div>;
// const ProductsPage = () => <div>📦 Products Page (placeholder)</div>;
const ReturnsPage = () => <div>↩️ Returns & Refunds Page (placeholder)</div>;

const CustomersListPage = () => <div>👥 Customer Directory (placeholder)</div>;
const LoyaltyPage = () => <div>🏆 Loyalty Program (placeholder)</div>;

const DailySalesPage = () => <div>📅 Daily Sales (placeholder)</div>;
const SalesReportsPage = () => <div>📊 Sales Reports (placeholder)</div>;

const UserManagementPage = () => <div>👤 User Management (placeholder)</div>;
// const AuditTrailPage = () => <div>📝 Audit Trail (placeholder)</div>;
const NotificationLogsPage = () => <div>🔔 Notification Logs (placeholder)</div>;

const PageNotFound = () => <div> Page Not Found</div>

function App() {
  return (
    <Routes>
      <>
        {/* Protected routes - wrap with ProtectedRoute */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Core POS */}
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="pos/cashier" element={<Cashier />} />
          <Route path="pos/transactions" element={<Transactions />} />
          <Route path="pos/products" element={<ProductPage />} />
          <Route path="pos/returns" element={<ReturnsPage />} />

          {/* Customers */}
          <Route path="customers/list" element={<CustomerPage />} />
          <Route path="customers/loyalty" element={<CustomerLoyaltyPage />} />

          <Route path="/inventory/movements" element={<MovementPage/>}/>

          {/* Sales */}
          <Route path="sales/daily" element={<DailySalesPage />} />
          <Route path="sales/reports" element={<SalesReportsPage />} />

          {/* System */}
          <Route path="system/audit" element={<AuditTrailPage />} />
          <Route path="notification-logs" element={<NotificationLogsPage />} />

          {/* 404 Page - Must be the last route */}
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </>
    </Routes>
  );
}

export default App;
