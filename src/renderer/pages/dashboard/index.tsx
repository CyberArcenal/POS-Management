// src/renderer/pages/Dashboard.tsx
import React from 'react';
import useDashboardData from './hooks/useDashboardData';
import SummaryCards from './components/SummaryCards';
import SalesChart from './components/SalesChart';
import LowStockTable from './components/LowStockTable';
import ActivityTimeline from './components/ActivityTimeline';
import TopProductsTable from './components/TopProductsTable';
import CustomerStats from './components/CustomerStats';

const DashboardPage: React.FC = () => {
  const {
    summary,
    salesChart,
    lowStockItems,
    recentActivities,
    topProducts,
    customerStats,
    loading,
    chartPeriod,
    onPeriodChange,
  } = useDashboardData();

  return (
    <div className="p-6 space-y-6 bg-[var(--background-color)] min-h-screen">
      {/* Summary Cards */}
      <SummaryCards summary={summary} isLoading={loading.summary} />

      {/* Chart + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72">
          <SalesChart
            data={salesChart}
            period={chartPeriod}
            onPeriodChange={onPeriodChange}
            isLoading={loading.chart}
          />
        </div>
        <div className="h-72">
          <LowStockTable items={lowStockItems} isLoading={loading.lowStock} />
        </div>
      </div>

      {/* Bottom row: Activities, Top Products, Customer Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-96">
          <ActivityTimeline activities={recentActivities} isLoading={loading.activities} />
        </div>
        <div className="h-96">
          <TopProductsTable products={topProducts} isLoading={loading.topProducts} />
        </div>
        <div className="h-96">
          <CustomerStats stats={customerStats} isLoading={loading.customerStats} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;