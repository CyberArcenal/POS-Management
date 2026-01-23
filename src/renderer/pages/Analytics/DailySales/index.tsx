// DailySalesPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Download, 
  RefreshCw, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Users,
  Package,
  BarChart,
  PieChart,
  Activity,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Filter,
  ChevronDown,
  Printer,
  FileText,
  Target,
  Percent,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import dashboardAPI from '../../../api/dashboard';

const DailySalesPage: React.FC = () => {
  // State for data
  const [liveData, setLiveData] = useState<any>(null);
  const [hourlyPattern, setHourlyPattern] = useState<any>(null);
  const [quickStats, setQuickStats] = useState<any>(null);
  const [salesOverview, setSalesOverview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  // Current date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Load all data
  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const todayStr = today.toISOString().split('T')[0];
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Fetch multiple data sources
      const [liveRes, hourlyRes, statsRes, overviewRes] = await Promise.all([
        dashboardAPI.getLiveDashboard(),
        dashboardAPI.getHourlySalesPattern({ days: 1 }),
        dashboardAPI.getQuickStats(),
        dashboardAPI.getSalesOverview({
          startDate: todayStr,
          endDate: todayStr,
          comparePeriod: true
        })
      ]);

      setLiveData(liveRes.data);
      setHourlyPattern(hourlyRes.data);
      setQuickStats(statsRes.data);
      setSalesOverview(overviewRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load daily sales data');
      console.error('Error loading daily sales data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      loadAllData();
    }, refreshInterval * 1000);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, loadAllData]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get hour label
  const getHourLabel = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  // Calculate hourly sales data
  const getHourlyChartData = () => {
    if (!hourlyPattern?.pattern) return Array(24).fill(0).map((_, i) => ({ hour: i, revenue: 0 }));
    
    const hourlyData = hourlyPattern.pattern.map((hour: any) => ({
      hour: hour.hour,
      revenue: hour.totalRevenue || 0
    }));
    
    // Fill missing hours
    const completeData = Array.from({ length: 24 }, (_, i) => {
      const existing = hourlyData.find((h: any) => h.hour === i);
      return existing || { hour: i, revenue: 0 };
    });
    
    return completeData;
  };

  // Get current hour progress
  const getCurrentHourProgress = () => {
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    return (currentMinute / 60) * 100;
  };

  // Export daily report
  const exportDailyReport = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const exportData = await dashboardAPI.exportDashboardData(format);
      
      const blob = new Blob(
        format === 'csv' ? [exportData.data] : [JSON.stringify(exportData.data, null, 2)], 
        { type: format === 'csv' ? 'text/csv' : 'application/json' }
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily_sales_${today.toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export daily report');
    }
  };

  // Calculate performance metrics
  const calculateMetrics = () => {
    const currentHour = new Date().getHours();
    const todayRevenue = quickStats?.sales?.today?.revenue || 0;
    const todayTransactions = quickStats?.sales?.today?.transactions || 0;
    
    // Estimate projected revenue for the day
    const hoursInDay = 24;
    const hoursElapsed = currentHour + 1;
    const projectedRevenue = todayRevenue * (hoursInDay / hoursElapsed);
    
    // Hourly averages
    const hourlyRevenue = todayRevenue / Math.max(hoursElapsed, 1);
    const hourlyTransactions = todayTransactions / Math.max(hoursElapsed, 1);
    
    // Yesterday comparison
    const yesterdayRevenue = quickStats?.sales?.today?.vsYesterday?.revenue || 0;
    const revenueChange = yesterdayRevenue !== 0 
      ? ((todayRevenue - yesterdayRevenue) / Math.abs(yesterdayRevenue)) * 100 
      : 0;

    return {
      projectedRevenue,
      hourlyRevenue,
      hourlyTransactions,
      revenueChange,
      hoursElapsed
    };
  };

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Loading skeleton
  if (loading && !liveData) {
    return (
      <div className="min-h-screen bg-[var(--background-color)] p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-[var(--accent-blue)] animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading today's sales dashboard...</p>
        </div>
      </div>
    );
  }

  const metrics = calculateMetrics();
  const hourlyData = getHourlyChartData();
  const maxRevenue = Math.max(...hourlyData.map((h: any) => h.revenue), 1);
  const currentHour = new Date().getHours();

  return (
    <div className="min-h-screen bg-[var(--background-color)] p-4">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <BarChart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Daily Sales Dashboard</h1>
                <p className="text-[var(--text-tertiary)]">{formattedDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
              <Activity className="h-3 w-3" />
              <span>Live updates {autoRefresh ? 'enabled' : 'disabled'}</span>
              <span>•</span>
              <Clock className="h-3 w-3" />
              <span>Last refresh: {liveData?.timestamp ? new Date(liveData.timestamp).toLocaleTimeString() : 'N/A'}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2">
              <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
              <select 
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-transparent text-[var(--text-primary)] text-sm outline-none"
              >
                <option value="10">10s</option>
                <option value="30">30s</option>
                <option value="60">60s</option>
                <option value="300">5m</option>
              </select>
            </div>
            
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                autoRefresh 
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                  : 'bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)]'
              }`}
            >
              {autoRefresh ? <Activity className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span className="hidden sm:inline">Auto-refresh</span>
            </button>
            
            <button
              onClick={loadAllData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Now</span>
            </button>
            
            <div className="relative">
              <button className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--card-hover-bg)]">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-lg z-10 hidden group-hover:block">
                <button
                  onClick={() => exportDailyReport('csv')}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] rounded-t-lg"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => exportDailyReport('json')}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)]"
                >
                  Export as JSON
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] rounded-b-lg"
                >
                  Print Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-800/50 text-red-400 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Welcome & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <Activity className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{getGreeting()}!</h2>
              <p className="text-sm text-[var(--text-tertiary)]">Here's your sales performance today</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-tertiary)]">Current Hour</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-[var(--card-bg)] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                    style={{ width: `${getCurrentHourProgress()}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {currentHour}:00
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-tertiary)]">Live Status</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${liveData?.systemStatus?.hasErrors ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span className="text-sm text-[var(--text-primary)]">
                  {liveData?.systemStatus?.hasErrors ? 'Issues Detected' : 'All Systems Go'}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-tertiary)]">Active Users</span>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                <span className="text-lg font-bold text-[var(--text-primary)]">
                  {liveData?.activeUsers || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-900/5 border border-emerald-800/30 rounded-xl p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-emerald-400 mb-1">Today's Revenue</p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                {formatCurrency(quickStats?.sales?.today?.revenue || 0)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-900/30 rounded-lg">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-tertiary)]">Projected Daily</span>
              <div className="flex items-center gap-2">
                {metrics.projectedRevenue > (quickStats?.sales?.today?.revenue || 0) ? (
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-amber-400" />
                )}
                <span className={`text-sm font-medium ${
                  metrics.projectedRevenue > (quickStats?.sales?.today?.revenue || 0) 
                    ? 'text-emerald-400' 
                    : 'text-amber-400'
                }`}>
                  {formatCurrency(metrics.projectedRevenue)}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-tertiary)]">Hourly Average</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {formatCurrency(metrics.hourlyRevenue)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-tertiary)]">vs Yesterday</span>
              <div className="flex items-center gap-2">
                {metrics.revenueChange >= 0 ? (
                  <ArrowUp className="h-4 w-4 text-emerald-400" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-400" />
                )}
                <span className={`text-sm font-medium ${
                  metrics.revenueChange >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {Math.abs(metrics.revenueChange).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-800/30 rounded-xl p-5">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-purple-400 mb-1">Today's Transactions</p>
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                {quickStats?.sales?.today?.transactions || 0}
              </h3>
            </div>
            <div className="p-3 bg-purple-900/30 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-purple-400" />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-tertiary)]">Hourly Average</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {metrics.hourlyTransactions.toFixed(1)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-tertiary)]">Avg. Value</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {formatCurrency(quickStats?.performance?.avgTransactionValue || 0)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-tertiary)]">Conversion Rate</span>
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-emerald-400">
                  {quickStats?.performance?.conversionRate || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Hourly Sales Chart */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Hourly Sales Breakdown</h3>
              <p className="text-sm text-[var(--text-tertiary)]">Revenue by hour (PHP)</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-emerald-500 to-emerald-400" />
                <span className="text-[var(--text-tertiary)]">Revenue</span>
              </div>
              {hourlyPattern?.peakHours && (
                <div className="px-3 py-1 bg-emerald-900/30 text-emerald-400 rounded-full text-xs">
                  Peak: {getHourLabel(hourlyPattern.peakHours.hour)}
                </div>
              )}
            </div>
          </div>
          
          <div className="h-64">
            <div className="h-full flex items-end justify-between px-2">
              {hourlyData.map((hour: any, index: number) => {
                const height = maxRevenue > 0 ? (hour.revenue / maxRevenue) * 100 : 0;
                const isCurrentHour = hour.hour === currentHour;
                const isPastHour = hour.hour < currentHour;
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1 mx-1">
                    <div
                      className={`w-full rounded-t transition-all duration-300 ${
                        isCurrentHour
                          ? 'bg-gradient-to-t from-blue-500 to-blue-400'
                          : isPastHour
                          ? 'bg-gradient-to-t from-emerald-500 to-emerald-400'
                          : 'bg-gradient-to-t from-gray-700 to-gray-600'
                      }`}
                      style={{ height: `${Math.max(height, 3)}%` }}
                      title={`${getHourLabel(hour.hour)}: ${formatCurrency(hour.revenue)}`}
                    >
                      {isCurrentHour && (
                        <div className="w-full h-1 bg-yellow-400 rounded-b animate-pulse" />
                      )}
                    </div>
                    <span className={`text-xs mt-2 ${
                      isCurrentHour 
                        ? 'text-blue-400 font-bold' 
                        : 'text-[var(--text-tertiary)]'
                    }`}>
                      {hour.hour === 0 || hour.hour === 12 ? getHourLabel(hour.hour) : hour.hour % 12 || 12}
                    </span>
                    {hour.hour % 6 === 0 && (
                      <span className="text-xs text-[var(--text-tertiary)] mt-1">
                        {hour.hour < 12 ? 'AM' : 'PM'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Chart Summary */}
          <div className="mt-6 pt-4 border-t border-[var(--border-color)]">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-[var(--text-tertiary)]">Peak Hour</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  {hourlyPattern?.peakHours ? getHourLabel(hourlyPattern.peakHours.hour) : 'N/A'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-[var(--text-tertiary)]">Peak Revenue</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  {hourlyPattern?.peakHours ? formatCurrency(hourlyPattern.peakHours.revenue) : 'N/A'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-[var(--text-tertiary)]">Current Hour</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  {formatCurrency(hourlyData[currentHour]?.revenue || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Recent Transactions</h3>
              <p className="text-sm text-[var(--text-tertiary)]">Latest sales activity</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-900/30 px-3 py-1 rounded-full">
                <Activity className="h-3 w-3" />
                <span>Live Feed</span>
              </div>
              <span className="text-xs text-[var(--text-tertiary)]">
                {liveData?.recentTransactions?.length || 0} transactions
              </span>
            </div>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {liveData?.recentTransactions?.length > 0 ? (
              liveData.recentTransactions.slice(0, 8).map((transaction: any, index: number) => (
                <div
                  key={transaction.id || index}
                  className="flex items-center justify-between p-3 border border-[var(--border-color)] rounded-lg hover:bg-[var(--card-hover-bg)] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        {transaction.reference || `TXN-${String(transaction.id).padStart(5, '0')}`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {transaction.cashier && (
                          <>
                            <Users className="h-3 w-3 text-[var(--text-tertiary)]" />
                            <span className="text-xs text-[var(--text-tertiary)]">{transaction.cashier}</span>
                            <span className="text-xs text-[var(--text-tertiary)]">•</span>
                          </>
                        )}
                        <Clock className="h-3 w-3 text-[var(--text-tertiary)]" />
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {new Date(transaction.time).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-[var(--text-primary)]">
                      {formatCurrency(transaction.total || 0)}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-emerald-400 justify-end">
                      <CheckCircle className="h-3 w-3" />
                      <span>Completed</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center">
                <ShoppingCart className="h-12 w-12 text-[var(--text-tertiary)] mb-3 opacity-50" />
                <p className="text-[var(--text-tertiary)]">No transactions today yet</p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">Sales will appear here as they happen</p>
              </div>
            )}
          </div>
          
          {liveData?.recentTransactions?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-tertiary)]">Today's Total</span>
                <div className="text-right">
                  <p className="font-bold text-[var(--text-primary)]">
                    {formatCurrency(liveData.today?.totalRevenue || 0)}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {liveData.today?.transactionCount || 0} transactions • 
                    Avg: {formatCurrency(liveData.today?.avgTransactionValue || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section - Performance & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Metrics */}
        <div className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Performance Metrics</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border border-[var(--border-color)] rounded-lg">
              <Target className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <p className="text-xs text-[var(--text-tertiary)] mb-1">Daily Target</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">85%</p>
              <div className="w-full h-2 bg-[var(--card-secondary-bg)] rounded-full mt-2">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
            
            <div className="text-center p-4 border border-[var(--border-color)] rounded-lg">
              <Zap className="h-8 w-8 text-amber-400 mx-auto mb-2" />
              <p className="text-xs text-[var(--text-tertiary)] mb-1">Busiest Hour</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {hourlyPattern?.peakHours ? getHourLabel(hourlyPattern.peakHours.hour) : 'N/A'}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {hourlyPattern?.peakHours ? formatCurrency(hourlyPattern.peakHours.revenue) : ''}
              </p>
            </div>
            
            <div className="text-center p-4 border border-[var(--border-color)] rounded-lg">
              <Package className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-[var(--text-tertiary)] mb-1">Avg Items/Sale</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {salesOverview?.overview?.totalTransactions ? 
                  ((salesOverview.overview.totalTransactions / (quickStats?.sales?.today?.transactions || 1)) || 0).toFixed(1) 
                  : '0.0'}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Items per transaction</p>
            </div>
            
            <div className="text-center p-4 border border-[var(--border-color)] rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <p className="text-xs text-[var(--text-tertiary)] mb-1">Growth Rate</p>
              <p className="text-lg font-bold text-emerald-400">
                +{metrics.revenueChange >= 0 ? metrics.revenueChange.toFixed(1) : '0.0'}%
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">vs yesterday</p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Today's Insights</p>
                <p className="text-xs text-[var(--text-tertiary)]">Based on current performance</p>
              </div>
              <BarChart className="h-5 w-5 text-[var(--text-tertiary)]" />
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-emerald-900/10 to-emerald-900/5 border border-emerald-800/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-[var(--text-primary)]">Ahead of Target</p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Sales are 15% above yesterday's pace
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-900/10 to-blue-900/5 border border-blue-800/20 rounded-lg">
                <Zap className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-[var(--text-primary)]">Peak Performance</p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Highest sales between {hourlyPattern?.peakHours ? getHourLabel(hourlyPattern.peakHours.hour) : '2-4 PM'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">System Status</h3>
              <p className="text-sm text-[var(--text-tertiary)]">Alerts & notifications</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              liveData?.systemStatus?.hasErrors 
                ? 'bg-red-900/30 text-red-400 border border-red-800/50' 
                : 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50'
            }`}>
              {liveData?.systemStatus?.hasErrors ? 'Issues' : 'Normal'}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 border border-[var(--border-color)] rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[var(--text-primary)]">Sync Status</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  liveData?.systemStatus?.syncStatus === 'success' 
                    ? 'bg-emerald-900/30 text-emerald-400' 
                    : 'bg-amber-900/30 text-amber-400'
                }`}>
                  {liveData?.systemStatus?.syncStatus || 'Unknown'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">
                Last sync: {liveData?.systemStatus?.lastSync || 'Never'}
              </p>
            </div>
            
            <div className="p-4 border border-[var(--border-color)] rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[var(--text-primary)]">Uptime</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {liveData?.systemStatus?.uptime || 0}%
                </span>
              </div>
              <div className="w-full h-2 bg-[var(--card-secondary-bg)] rounded-full">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                  style={{ width: `${liveData?.systemStatus?.uptime || 0}%` }}
                />
              </div>
            </div>
            
            {/* Alerts List */}
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Active Alerts</p>
              <div className="space-y-2">
                {liveData?.alerts?.slice(0, 3).map((alert: any, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      alert.type === 'warning' 
                        ? 'bg-amber-900/20 border-amber-800/30' 
                        : alert.type === 'danger'
                        ? 'bg-red-900/20 border-red-800/30'
                        : 'bg-blue-900/20 border-blue-800/30'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className={`h-4 w-4 mt-0.5 ${
                        alert.type === 'warning' ? 'text-amber-400' :
                        alert.type === 'danger' ? 'text-red-400' :
                        'text-blue-400'
                      }`} />
                      <div>
                        <p className="text-sm text-[var(--text-primary)]">{alert.message}</p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-1">Priority: {alert.priority}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!liveData?.alerts || liveData.alerts.length === 0) && (
                  <div className="p-4 border border-[var(--border-color)] rounded-lg text-center">
                    <CheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm text-[var(--text-primary)]">No active alerts</p>
                    <p className="text-xs text-[var(--text-tertiary)]">All systems operating normally</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-sm text-[var(--text-tertiary)]">
            <p>Daily Sales Dashboard • Auto-refresh: {autoRefresh ? `Every ${refreshInterval}s` : 'Off'}</p>
            <p className="mt-1">Data updates in real-time from your POS system</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Operational</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span>Warning</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Information</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySalesPage;