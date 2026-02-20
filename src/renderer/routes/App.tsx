import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "../layouts/Layout";
import DashboardPage from "../pages/Analytics/dashboard";
import Cashier from "../pages/CashierSale";
import Transactions from "../pages/Transactions";
import ProductPage from "../pages/Product";
import CustomerPage from "../pages/Customer";
import CustomerLoyaltyPage from "../pages/CustomerLoyalty";
import MovementPage from "../pages/Movement";
import AuditTrailPage from "../pages/AuditTrail";
import SupplierPage from "../pages/supplier/Supplier";
import CategoryPage from "../pages/category";
import PurchasePage from "../pages/purchase/Purchase";
import ReorderPage from "../pages/reorder/Reorder";
import StockLevelsPage from "../pages/stock/StockLevels";
import CustomerInsights from "../pages/Analytics/Customer";
import DailySalesPage from "../pages/Analytics/DailySales";
import FinancialReportsPage from "../pages/Analytics/FinancialReports";
import InventoryReportsPage from "../pages/Analytics/InventoryReports";
import ReturnRefundReportsPage from "../pages/Analytics/ReturnRefundReports";
import SalesReportsPage from "../pages/Analytics/SalesReports";
import NotificationLogPage from "../pages/NotificationLog";
import SettingsPage from "../pages/Settings";
import DeviceManagerPage from "../pages/DeviceManager";

// Placeholder components
// const ReturnsPage = () => <div>↩️ Returns & Refunds Page (placeholder)</div>;
const CustomersListPage = () => <div>👥 Customer Directory (placeholder)</div>;
const LoyaltyPage = () => <div>🏆 Loyalty Program (placeholder)</div>;
// const DailySalesPage = () => <div>📅 Daily Sales (placeholder)</div>;
// const SalesReportsPage = () => <div>📊 Sales Reports (placeholder)</div>;
// const NotificationLogsPage = () => (
//   <div>🔔 Notification Logs (placeholder)</div>
// );

// Inventory placeholders
// const StockLevelsPage = () => <div>📦 Stock Levels (placeholder)</div>;
// const ReorderPage = () => <div>🚚 Reorder & Vendors (placeholder)</div>;
const PurchasesPage = () => <div>📝 Purchases (placeholder)</div>;
const CategoriesPage = () => <div>🏷️ Categories (placeholder)</div>;

// Reports placeholders
// const FinancialReportsPage = () => (
//   <div>💰 Financial Reports (placeholder)</div>
// );
// const InventoryReportsPage = () => (
//   <div>📋 Inventory Reports (placeholder)</div>
// );
const CustomerInsightsPage = () => (
  <div>🔍 Customer Insights (placeholder)</div>
);

// System placeholders
const SystemSettingsPage = () => <div>⚙️ System Settings (placeholder)</div>;
const ApplicationLogsPage = () => <div>📄 Application Logs (placeholder)</div>;

const PageNotFound = () => <div> Page Not Found</div>;

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Core POS */}
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="pos/cashier" element={<Cashier />} />
        <Route path="pos/transactions" element={<Transactions />} />
        <Route path="pos/products" element={<ProductPage />} />

        {/* Customers */}
        <Route path="customers/list" element={<CustomerPage />} />
        <Route path="customers/loyalty" element={<CustomerLoyaltyPage />} />

        {/* Sales */}
        <Route path="sales/daily" element={<DailySalesPage />} />
        <Route path="sales/reports" element={<SalesReportsPage />} />
        <Route path="sales/returns" element={<ReturnRefundReportsPage />} />

        {/* Inventory */}
        <Route path="inventory/stock" element={<StockLevelsPage />} />
        <Route path="inventory/movements" element={<MovementPage />} />
        <Route path="inventory/reorder" element={<ReorderPage />} />
        <Route path="inventory/purchases" element={<PurchasePage />} />
        <Route path="inventory/suppliers" element={<SupplierPage />} />
        <Route path="inventory/categories" element={<CategoryPage />} />

        {/* Reports */}
        <Route path="reports/financial" element={<FinancialReportsPage />} />
        <Route path="reports/inventory" element={<InventoryReportsPage />} />
        <Route path="reports/customer" element={<CustomerInsights />} />

        {/* System */}
        <Route path="system/audit" element={<AuditTrailPage />} />
        <Route path="notification-logs" element={<NotificationLogPage />} />
        <Route path="system/settings" element={<SettingsPage />} />
        <Route path="/devices" element={<DeviceManagerPage />} />
        <Route path="system/logs" element={<ApplicationLogsPage />} />

        {/* 404 Page */}
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
