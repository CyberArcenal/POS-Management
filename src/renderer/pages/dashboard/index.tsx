import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Settings, 
  User, 
  LogOut,
  Moon,
  Sun,
  HelpCircle,
  Download,
  Filter,
  ChevronDown,
  Calendar,
  RefreshCw,
  Maximize2,
  Grid,
  List,
  Clock,
  Home,
  BarChart,
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Activity,
  Database,
  CheckCircle,
  X
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefresh = () => {
    setLastRefresh(new Date());
    // Add your refresh logic here
  };

  // Sample data
  const stats = [
    { title: 'Today Revenue', value: '₱125,480', change: '+12.5%', icon: DollarSign, color: 'bg-emerald-500' },
    { title: 'Transactions', value: '89', change: '+8.3%', icon: ShoppingCart, color: 'bg-blue-500' },
    { title: 'Avg. Transaction', value: '₱1,409', change: '+5.2%', icon: TrendingUp, color: 'bg-purple-500' },
    { title: 'Low Stock Items', value: '12', change: '-2.1%', icon: Package, color: 'bg-amber-500' },
  ];

  const quickActions = [
    { icon: ShoppingCart, label: 'New Sale', color: 'bg-emerald-500', shortcut: 'F1' },
    { icon: BarChart, label: 'Reports', color: 'bg-blue-500', shortcut: 'F2' },
    { icon: Package, label: 'Inventory', color: 'bg-amber-500', shortcut: 'F3' },
    { icon: Download, label: 'Export', color: 'bg-cyan-500', shortcut: 'F5' },
    { icon: Users, label: 'Customers', color: 'bg-pink-500', shortcut: 'F6' },
    { icon: Filter, label: 'Filters', color: 'bg-indigo-500', shortcut: 'F7' },
  ];

  const topProducts = [
    { name: 'iPhone 14 Pro', sku: 'SKU001', revenue: '₱52,000', sold: '45' },
    { name: 'MacBook Air M2', sku: 'SKU002', revenue: '₱38,000', sold: '32' },
    { name: 'AirPods Pro', sku: 'SKU003', revenue: '₱27,500', sold: '28' },
    { name: 'iPad Pro', sku: 'SKU004', revenue: '₱21,000', sold: '25' },
  ];

  const inventoryAlerts = [
    { name: 'iPhone 13', sku: 'SKU101', stock: 3, min: 10, status: 'low' },
    { name: 'MacBook Pro', sku: 'SKU102', stock: 5, min: 15, status: 'low' },
    { name: 'AirPods Max', sku: 'SKU103', stock: 0, min: 5, status: 'out' },
    { name: 'iPad Air', sku: 'SKU104', stock: 8, min: 20, status: 'low' },
  ];

  const recentActivity = [
    { action: 'New Sale Completed', details: 'Transaction #TX-001', time: '10:15 AM', status: 'completed' },
    { action: 'Low Stock Alert', details: 'iPhone 13 running low', time: '09:45 AM', status: 'warning' },
    { action: 'New Customer Added', details: 'John Doe registered', time: '09:30 AM', status: 'info' },
    { action: 'Payment Received', details: '₱15,000 via Credit Card', time: '09:15 AM', status: 'completed' },
  ];

  return (
    <div className="min-h-screen bg-[var(--background-color)] overflow-y-auto">
      {/* MAIN CONTENT ONLY - No Header */}
      <div className="p-3">
        {/* Quick Stats - 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          {stats.map((stat, index) => (
            <div
              key={stat.title}
              className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-3 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] mb-0.5">{stat.title}</p>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">{stat.value}</h3>
                </div>
                <div className={`${stat.color} p-2 rounded`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className={`flex items-center text-xs ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                <span className="font-medium">{stat.change}</span>
                <span className="text-[var(--text-tertiary)] ml-1">vs yesterday</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-[var(--text-primary)]">Quick Actions</h2>
            <span className="text-xs text-[var(--text-tertiary)] hidden sm:inline">Press function keys for quick access</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={action.label}
                className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-3 hover:border-[var(--accent-blue)] hover:shadow-sm transition-all text-center"
              >
                <div className={`${action.color} p-2 rounded w-10 h-10 flex items-center justify-center mx-auto mb-2`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-0.5">{action.label}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{action.shortcut}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Charts & Alerts - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          {/* Sales Chart */}
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-3">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Sales Overview</h3>
                <p className="text-xs text-[var(--text-tertiary)]">Last 30 days revenue trend</p>
              </div>
              <button className="px-2 py-1 bg-[var(--accent-blue-light)] text-[var(--accent-blue)] rounded text-xs font-medium">
                This Month
              </button>
            </div>
            <div className="h-40 bg-[var(--card-secondary-bg)] border border-[var(--border-color)] rounded flex items-center justify-center">
              <div className="text-center">
                <BarChart className="h-8 w-8 text-[var(--text-tertiary)] mx-auto mb-2" />
                <p className="text-sm text-[var(--text-tertiary)]">Chart visualization</p>
              </div>
            </div>
          </div>

          {/* Inventory Alerts */}
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-3">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Inventory Alerts</h3>
                <p className="text-xs text-[var(--text-tertiary)]">Items needing attention</p>
              </div>
              <div className="flex space-x-1">
                <div className="px-2 py-0.5 bg-red-900/30 text-red-400 rounded-full text-xs border border-red-800/50">
                  1 Out
                </div>
                <div className="px-2 py-0.5 bg-amber-900/30 text-amber-400 rounded-full text-xs border border-amber-800/50">
                  3 Low
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {inventoryAlerts.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border border-[var(--border-color)] rounded hover:bg-[var(--card-hover-bg)]"
                >
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded ${
                      alert.status === 'out' ? 'bg-red-900/30 text-red-400 border border-red-800/50' : 
                      'bg-amber-900/30 text-amber-400 border border-amber-800/50'
                    }`}>
                      {alert.status === 'out' ? <X className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{alert.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{alert.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      alert.status === 'out' ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {alert.stock} units
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">Min: {alert.min}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Products & Activity - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Top Products */}
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-3">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Top Selling Products</h3>
                <p className="text-xs text-[var(--text-tertiary)]">Best performers this month</p>
              </div>
              <div className="flex items-center space-x-1 text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-full text-xs border border-emerald-800/50">
                <TrendingUp className="h-3 w-3" />
                <span className="font-medium">Top Sellers</span>
              </div>
            </div>
            <div className="space-y-2">
              {topProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border border-[var(--border-color)] rounded hover:bg-[var(--card-hover-bg)]"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <Package className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{product.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)]">{product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--text-primary)]">{product.revenue}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{product.sold} sold</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-3">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Recent Activity</h3>
                <p className="text-xs text-[var(--text-tertiary)]">Latest system activities</p>
              </div>
              <div className="flex items-center space-x-1 text-blue-400 text-xs">
                <Clock className="h-3 w-3" />
                <span>Real-time</span>
              </div>
            </div>
            <div className="space-y-2">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-2 p-2 border border-[var(--border-color)] rounded hover:bg-[var(--card-hover-bg)]"
                >
                  <div className={`p-1.5 rounded ${
                    activity.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' :
                    activity.status === 'warning' ? 'bg-amber-900/30 text-amber-400 border border-amber-800/50' :
                    'bg-blue-900/30 text-blue-400 border border-blue-800/50'
                  }`}>
                    {activity.status === 'completed' ? <CheckCircle className="h-3 w-3" /> :
                     activity.status === 'warning' ? <AlertTriangle className="h-3 w-3" /> :
                     <Activity className="h-3 w-3" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{activity.action}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{activity.details}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5 flex items-center">
                      <Clock className="h-2.5 w-2.5 mr-0.5" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM STATUS BAR - Keep this */}
      <div className="h-8 bg-[var(--header-bg)] text-[var(--text-secondary)] flex items-center justify-between px-3 text-xs border-t border-[var(--border-color)]">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <span>System: Operational</span>
          </div>
          <span className="text-[var(--text-tertiary)]">•</span>
          <span>POS v2.1.0 • Windows Desktop App</span>
          <span className="text-[var(--text-tertiary)]">•</span>
          <span>Last Refresh: {lastRefresh.toLocaleTimeString()}</span>
        </div>
        <div className="text-[var(--text-tertiary)] hidden sm:block">
          © 2024 POS Management System
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;