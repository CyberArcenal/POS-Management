// src/components/Shared/PageNotFound.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Home,
  Search,
  RefreshCw,
  ArrowLeft,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Store,
  Receipt,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { posAuthStore } from '../../lib/authStore';

const PageNotFound: React.FC = () => {
  const userInfo = posAuthStore.getUserDisplayInfo();
  
  // Common navigation paths for POS Management
  const quickLinks = [
    { 
      path: '/', 
      label: 'Dashboard', 
      icon: Home, 
      color: 'var(--accent-blue)',
      permission: () => true
    },
    { 
      path: '/pos/cashier', 
      label: 'Point of Sale', 
      icon: ShoppingCart, 
      color: 'var(--accent-green)',
      permission: () => posAuthStore.canAccessModule('pos')
    },
    { 
      path: '/products/list', 
      label: 'Products', 
      icon: Package, 
      color: 'var(--accent-purple)',
      permission: () => posAuthStore.canAccessModule('products')
    },
    { 
      path: '/customers/list', 
      label: 'Customers', 
      icon: Users, 
      color: 'var(--accent-amber)',
      permission: () => posAuthStore.canAccessModule('customers')
    },
    { 
      path: '/analytics/sales', 
      label: 'Analytics', 
      icon: BarChart3, 
      color: 'var(--accent-blue)',
      permission: () => posAuthStore.canAccessModule('reports')
    },
    { 
      path: '/settings/general', 
      label: 'Settings', 
      icon: Settings, 
      color: 'var(--accent-red)',
      permission: () => posAuthStore.canAccessModule('settings')
    },
  ];

  // Filter links based on user permissions
  const filteredLinks = quickLinks.filter(link => link.permission());

  const handleGoBack = () => {
    window.history.back();
  };

  // Get user role for personalized message
  const getUserRoleMessage = () => {
    if (posAuthStore.isAdmin()) return 'administrator';
    if (posAuthStore.isManager()) return 'manager';
    return 'cashier';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--background-color)]">
      {/* Main Content */}
      <div className="relative z-10 max-w-4xl w-full">
        {/* Error Code Display */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="text-9xl font-bold tracking-tighter text-[var(--primary-color)]">
              4<span className="relative">
                0
                <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full animate-ping bg-[var(--accent-amber)]"></div>
              </span>4
            </div>
            <div className="absolute -top-6 -right-6 animate-bounce">
              <AlertTriangle className="w-12 h-12 text-[var(--accent-amber)]" />
            </div>
          </div>
          <div className="mt-2 text-lg font-semibold tracking-widest uppercase text-[var(--text-secondary)]">
            Page Not Found
          </div>
        </div>

        {/* Error Message Card */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-8 mb-8 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--accent-blue-light)] flex items-center justify-center">
            <Store className="w-10 h-10 text-[var(--accent-blue)]" />
          </div>

          <h1 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">
            Page Not Found in POS System
          </h1>

          <p className="text-base mb-6 max-w-2xl mx-auto text-[var(--text-secondary)]">
            The page you're looking for could not be found in our POS Management System. 
            It might have been moved, deleted, or you might have entered an incorrect URL.
            As a {getUserRoleMessage()}, you can try one of the available pages below.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 bg-[var(--card-secondary-bg)] border border-[var(--border-color)] font-mono">
            <Search className="w-4 h-4 text-[var(--text-secondary)]" />
            <code className="text-sm font-mono text-[var(--text-primary)]">
              {window.location.pathname}
            </code>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-semibold mb-6 text-center text-[var(--text-primary)]">
            Quick Navigation
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {filteredLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <Link
                  key={index}
                  to={link.path}
                  className="group flex flex-col items-center p-4 rounded-lg bg-[var(--card-secondary-bg)] border border-[var(--border-color)] hover:border-[var(--accent-blue)] transition-all duration-200"
                >
                  <div className="p-3 rounded-full mb-3 bg-opacity-20" style={{ backgroundColor: link.color + '20' }}>
                    <Icon className="w-6 h-6" style={{ color: link.color }} />
                  </div>
                  <span className="text-sm font-medium text-center text-[var(--text-primary)]">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Info Card (if logged in) */}
        {userInfo && (
          <div className="bg-[var(--card-secondary-bg)] border border-[var(--border-color)] rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-blue-hover)] flex items-center justify-center text-white font-semibold"
                >
                  {userInfo.initials || 'CU'}
                </div>
                <div>
                  <div className="font-medium text-[var(--text-primary)]">{userInfo.name || 'Cashier User'}</div>
                  <div className="text-sm text-[var(--text-secondary)]">{userInfo.role || 'Cashier'}</div>
                  <div className="text-xs mt-1 px-2 py-1 rounded-full inline-block bg-[var(--card-hover-bg)] text-[var(--text-secondary)]">
                    POS Management System
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-[var(--text-secondary)]">Session Active</div>
                <div className="text-xs flex items-center gap-1 text-[var(--accent-green)]">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-green)]"></div>
                  Authenticated
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGoBack}
            className="px-6 py-3 rounded-lg flex items-center justify-center gap-2 bg-[var(--card-secondary-bg)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <Link
            to="/"
            className="px-6 py-3 rounded-lg flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-blue-hover)] text-white hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-lg flex items-center justify-center gap-2 bg-[var(--card-secondary-bg)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Page</span>
          </button>

          {posAuthStore.isAuthenticated() && (
            <button
              onClick={() => posAuthStore.logout()}
              className="px-6 py-3 rounded-lg flex items-center justify-center gap-2 bg-[var(--accent-red)] text-white hover:opacity-90 transition-opacity"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm mb-2 text-[var(--text-secondary)]">
            Need assistance? Contact your system administrator if you believe this is an error.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]"></div>
              POS Management System
            </span>
            <span>•</span>
            <span>Error Code: 404</span>
            <span>•</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--card-secondary-bg)] border border-[var(--border-color)]">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse"></div>
            <span className="text-xs text-[var(--text-secondary)]">
              POS Management System • v1.0 • {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;