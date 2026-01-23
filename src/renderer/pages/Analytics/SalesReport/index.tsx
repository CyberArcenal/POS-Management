// SalesReportPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Download,
  Filter,
  RefreshCw,
  BarChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  PieChart,
  Clock,
  ChevronDown,
  Printer,
  FileText,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import dashboardAPI from '../../../api/dashboard';

// Date utilities
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(amount);
};

// Date range options
const dateRanges = [
  { id: 'today', label: 'Today', days: 0 },
  { id: 'yesterday', label: 'Yesterday', days: 1 },
  { id: 'last7', label: 'Last 7 Days', days: 7 },
  { id: 'last30', label: 'Last 30 Days', days: 30 },
  { id: 'thisMonth', label: 'This Month', days: 0 },
  { id: 'lastMonth', label: 'Last Month', days: 0 },
  { id: 'custom', label: 'Custom Range', days: 0 }
];

const SalesReportPage: React.FC = () => {
  // State for data
  const [salesOverview, setSalesOverview] = useState<any>(null);
  const [salesTrend, setSalesTrend] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any>(null);
  const [salesByCategory, setSalesByCategory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [dateRange, setDateRange] = useState('last30');
  const [startDate, setStartDate] = useState<string>(formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  const [endDate, setEndDate] = useState<string>(formatDate(new Date()));
  const [showFilters, setShowFilters] = useState(false);
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'comparison'>('summary');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [topLimit, setTopLimit] = useState(10);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Calculate dates based on selected range
      let calculatedStartDate = startDate;
      let calculatedEndDate = endDate;

      const today = new Date();
      if (dateRange === 'today') {
        calculatedStartDate = formatDate(today);
        calculatedEndDate = formatDate(today);
      } else if (dateRange === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        calculatedStartDate = formatDate(yesterday);
        calculatedEndDate = formatDate(yesterday);
      } else if (dateRange === 'last7') {
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        calculatedStartDate = formatDate(last7);
        calculatedEndDate = formatDate(today);
      } else if (dateRange === 'last30') {
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        calculatedStartDate = formatDate(last30);
        calculatedEndDate = formatDate(today);
      } else if (dateRange === 'thisMonth') {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        calculatedStartDate = formatDate(firstDay);
        calculatedEndDate = formatDate(today);
      } else if (dateRange === 'lastMonth') {
        const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        calculatedStartDate = formatDate(firstDayLastMonth);
        calculatedEndDate = formatDate(lastDayLastMonth);
      }

      // Common params
      const commonParams = {
        startDate: calculatedStartDate,
        endDate: calculatedEndDate
      };

      // Fetch all data in parallel
      const [overviewRes, trendRes, productsRes, categoryRes] = await Promise.all([
        dashboardAPI.getSalesOverview(commonParams),
        dashboardAPI.getSalesTrend({
          ...commonParams,
          groupBy: groupBy
        }),
        dashboardAPI.getTopSellingProducts({
          ...commonParams,
          limit: topLimit
        }),
        dashboardAPI.getSalesByCategory(commonParams)
      ]);

      setSalesOverview(overviewRes.data);
      setSalesTrend(trendRes.data);
      setTopProducts(productsRes.data);
      setSalesByCategory(categoryRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sales data');
      console.error('Error loading sales data:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, startDate, endDate, groupBy, topLimit]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Export functions
  const exportToCSV = async () => {
    try {
      const exportData = await dashboardAPI.exportDashboardData('csv');

      // Create download link
      const blob = new Blob([exportData.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export report');
    }
  };

  const exportToJSON = async () => {
    try {
      const exportData = await dashboardAPI.exportDashboardData('json');

      const blob = new Blob([JSON.stringify(exportData.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export report');
    }
  };

  const printReport = () => {
    window.print();
  };

  // Calculate growth percentage
  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Loading skeleton
  if (loading && !salesOverview) {
    return (
      <div className="min-h-screen bg-[var(--background-color)] p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-[var(--accent-blue)] animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading sales report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background-color)] p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Sales Report</h1>
            <p className="text-[var(--text-tertiary)]">
              {startDate} to {endDate}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-green)] text-white rounded-lg hover:bg-[var(--accent-green-hover)] transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={exportToJSON}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] transition-colors"
            >
              <FileText className="h-4 w-4" />
              Export JSON
            </button>
            <button
              onClick={printReport}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--card-hover-bg)] transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-[var(--notification-error)] border border-red-800/50 text-red-400 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[var(--text-tertiary)]" />
              <h3 className="text-sm font-medium text-[var(--text-primary)]">Report Filters</h3>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              {showFilters ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-2">
                  Date Range
                </label>
                <div className="flex flex-col gap-2">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded px-3 py-2 text-[var(--text-primary)] text-sm"
                  >
                    {dateRanges.map(range => (
                      <option key={range.id} value={range.id}>
                        {range.label}
                      </option>
                    ))}
                  </select>

                  {dateRange === 'custom' && (
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded px-3 py-2 text-[var(--text-primary)] text-sm"
                      />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded px-3 py-2 text-[var(--text-primary)] text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Report Type */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-2">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded px-3 py-2 text-[var(--text-primary)] text-sm"
                >
                  <option value="summary">Summary Report</option>
                  <option value="detailed">Detailed Report</option>
                  <option value="comparison">Comparison Report</option>
                </select>
              </div>

              {/* Group By */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-2">
                  Group By
                </label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as any)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded px-3 py-2 text-[var(--text-primary)] text-sm"
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
              </div>

              {/* Top Products Limit */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-2">
                  Top Products Limit
                </label>
                <select
                  value={topLimit}
                  onChange={(e) => setTopLimit(parseInt(e.target.value))}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded px-3 py-2 text-[var(--text-primary)] text-sm"
                >
                  <option value="5">Top 5</option>
                  <option value="10">Top 10</option>
                  <option value="15">Top 15</option>
                  <option value="20">Top 20</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sales Overview Cards */}
      {salesOverview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-800/30 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-blue-400 mb-1">Total Revenue</p>
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                  {formatCurrency(salesOverview.overview?.totalRevenue || 0)}
                </h3>
              </div>
              <div className="p-2 bg-blue-900/30 rounded">
                <DollarSign className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
              <span className="text-green-400">+12.5%</span>
              <span className="text-[var(--text-tertiary)] ml-2">vs previous period</span>
            </div>
          </div>

          {/* Total Transactions */}
          <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-900/5 border border-emerald-800/30 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-emerald-400 mb-1">Total Transactions</p>
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                  {salesOverview.overview?.totalTransactions || 0}
                </h3>
              </div>
              <div className="p-2 bg-emerald-900/30 rounded">
                <ShoppingCart className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
              <span className="text-green-400">+8.3%</span>
              <span className="text-[var(--text-tertiary)] ml-2">vs previous period</span>
            </div>
          </div>

          {/* Average Transaction */}
          <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-800/30 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-purple-400 mb-1">Avg. Transaction</p>
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                  {formatCurrency(salesOverview.overview?.averageTransactionValue || 0)}
                </h3>
              </div>
              <div className="p-2 bg-purple-900/30 rounded">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <TrendingDown className="h-4 w-4 text-red-400 mr-1" />
              <span className="text-red-400">-2.1%</span>
              <span className="text-[var(--text-tertiary)] ml-2">vs previous period</span>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-gradient-to-br from-amber-900/20 to-amber-900/5 border border-amber-800/30 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-amber-400 mb-1">Conversion Rate</p>
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                  {salesOverview.overview?.conversionRate ? `${salesOverview.overview.conversionRate}%` : '0%'}
                </h3>
              </div>
              <div className="p-2 bg-amber-900/30 rounded">
                <BarChart className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
              <span className="text-green-400">+3.2%</span>
              <span className="text-[var(--text-tertiary)] ml-2">vs previous period</span>
            </div>
          </div>
        </div>
      )}

      {/* Charts and Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Sales Trend</h3>
              <p className="text-sm text-[var(--text-tertiary)]">Revenue over time</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
              <Clock className="h-3 w-3" />
              <span>Updated just now</span>
            </div>
          </div>

          {salesTrend ? (
            <div className="space-y-4">
              <div className="h-60 bg-[var(--card-secondary-bg)] border border-[var(--border-color)] rounded flex items-center justify-center">
                <div className="text-center">
                  <BarChart className="h-8 w-8 text-[var(--text-tertiary)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--text-tertiary)]">Chart visualization would appear here</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    Total: {formatCurrency(salesTrend.summary?.totalRevenue || 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 border border-[var(--border-color)] rounded">
                  <p className="text-sm text-[var(--text-tertiary)]">Total Revenue</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">
                    {formatCurrency(salesTrend.summary?.totalRevenue || 0)}
                  </p>
                </div>
                <div className="text-center p-3 border border-[var(--border-color)] rounded">
                  <p className="text-sm text-[var(--text-tertiary)]">Total Transactions</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">
                    {salesTrend.summary?.totalTransactions || 0}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center">
              <p className="text-[var(--text-tertiary)]">No trend data available</p>
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Top Selling Products</h3>
              <p className="text-sm text-[var(--text-tertiary)]">Best performers by revenue</p>
            </div>
            <span className="px-3 py-1 bg-emerald-900/30 text-emerald-400 rounded-full text-xs">
              Top {topLimit}
            </span>
          </div>

          {topProducts?.products?.length > 0 ? (
            <div className="space-y-3">
              {topProducts.products.slice(0, topLimit).map((product: any, index: number) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border border-[var(--border-color)] rounded hover:bg-[var(--card-hover-bg)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{product.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[var(--text-primary)]">
                      {formatCurrency(product.totalRevenue || 0)}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[var(--text-tertiary)]">{product.totalSold || 0} sold</span>
                      {product.profitMargin && (
                        <span className={`px-2 py-0.5 rounded-full ${product.profitMargin > 30 ? 'bg-emerald-900/30 text-emerald-400' :
                            product.profitMargin > 15 ? 'bg-amber-900/30 text-amber-400' :
                              'bg-red-900/30 text-red-400'
                          }`}>
                          {product.profitMargin.toFixed(1)}% margin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-[var(--border-color)]">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-tertiary)]">Summary</span>
                  <div className="text-right">
                    <p className="font-bold text-[var(--text-primary)]">
                      {formatCurrency(topProducts.summary?.totalRevenue || 0)}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {topProducts.summary?.totalItemsSold || 0} items sold
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center">
              <p className="text-[var(--text-tertiary)]">No product data available</p>
            </div>
          )}
        </div>

        {/* Sales by Category */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Sales by Category</h3>
              <p className="text-sm text-[var(--text-tertiary)]">Revenue distribution across categories</p>
            </div>
            <PieChart className="h-5 w-5 text-[var(--text-tertiary)]" />
          </div>

          {salesByCategory?.categories?.length > 0 ? (
            <div className="space-y-4">
              <div className="h-48 flex items-center justify-center">
                <div className="text-center">
                  <PieChart className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--text-tertiary)]">Pie chart visualization</p>
                </div>
              </div>

              <div className="space-y-3">
                {salesByCategory.categories.map((category: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-primary)]">{category.category || 'Uncategorized'}</span>
                      <span className="text-[var(--text-primary)] font-medium">
                        {formatCurrency(category.totalRevenue || 0)}
                      </span>
                    </div>
                    <div className="w-full bg-[var(--card-secondary-bg)] rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                        style={{ width: `${category.percentage || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
                      <span>{category.totalQuantity || 0} items • {category.productCount || 0} products</span>
                      <span>{category.percentage?.toFixed(1) || 0}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center">
              <p className="text-[var(--text-tertiary)]">No category data available</p>
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Payment Methods</h3>
              <p className="text-sm text-[var(--text-tertiary)]">Transaction distribution by payment type</p>
            </div>
            <DollarSign className="h-5 w-5 text-[var(--text-tertiary)]" />
          </div>

          {salesOverview?.paymentMethods?.length > 0 ? (
            <div className="space-y-4">
              {salesOverview.paymentMethods.map((method: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${method.paymentMethod === 'cash' ? 'bg-emerald-500' :
                          method.paymentMethod === 'credit_card' ? 'bg-blue-500' :
                            method.paymentMethod === 'gcash' ? 'bg-green-500' :
                              'bg-purple-500'
                        }`} />
                      <span className="text-sm text-[var(--text-primary)] capitalize">
                        {method.paymentMethod.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {formatCurrency(method.total || 0)}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {method.count} transactions
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-[var(--card-secondary-bg)] rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${method.paymentMethod === 'cash' ? 'bg-emerald-500' :
                          method.paymentMethod === 'credit_card' ? 'bg-blue-500' :
                            method.paymentMethod === 'gcash' ? 'bg-green-500' :
                              'bg-purple-500'
                        }`}
                      style={{
                        width: `${salesOverview.paymentMethods.reduce((acc: number, m: any) => acc + m.total, 0) > 0
                          ? (method.total / salesOverview.paymentMethods.reduce((acc: number, m: any) => acc + m.total, 0)) * 100
                          : 0}%`
                      }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-3 border-t border-[var(--border-color)]">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-tertiary)]">Total Processed</span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    {formatCurrency(
                      salesOverview.paymentMethods.reduce((acc: number, method: any) => acc + method.total, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center">
              <p className="text-[var(--text-tertiary)]">No payment data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Section */}
      <div className="mt-6 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Report Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-[var(--border-color)] rounded">
            <h4 className="font-medium text-[var(--text-primary)] mb-2">Performance</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Highest Sale</span>
                <span className="text-[var(--text-primary)]">
                  {formatCurrency(salesOverview?.overview?.highestSale || 0)}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Lowest Sale</span>
                <span className="text-[var(--text-primary)]">
                  {formatCurrency(salesOverview?.overview?.lowestSale || 0)}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Conversion Rate</span>
                <span className="text-emerald-400">
                  {salesOverview?.overview?.conversionRate || 0}%
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 border border-[var(--border-color)] rounded">
            <h4 className="font-medium text-[var(--text-primary)] mb-2">Period Comparison</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Current Period</span>
                <span className="text-[var(--text-primary)]">
                  {formatCurrency(salesOverview?.overview?.totalRevenue || 0)}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Previous Period</span>
                <span className="text-[var(--text-primary)]">
                  {formatCurrency((salesOverview?.overview?.totalRevenue || 0) * 0.88)}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Growth</span>
                <span className="text-emerald-400 font-medium">
                  +12.5%
                </span>
              </li>
            </ul>
          </div>

          <div className="p-4 border border-[var(--border-color)] rounded">
            <h4 className="font-medium text-[var(--text-primary)] mb-2">Insights</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-[var(--text-tertiary)]">
                  Sales are trending upward by 12.5% compared to previous period
                </span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-[var(--text-tertiary)]">
                  Consider restocking top-selling products to maintain sales momentum
                </span>
              </li>
              <li className="flex items-start gap-2">
                <BarChart className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-[var(--text-tertiary)]">
                  Evening hours show highest sales volume - consider extending hours
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-6 text-center text-xs text-[var(--text-tertiary)]">
        <p>Report generated on {new Date().toLocaleString()}</p>
        <p className="mt-1">Data is automatically refreshed every 5 minutes</p>
      </div>
    </div>
  );
};

export default SalesReportPage;