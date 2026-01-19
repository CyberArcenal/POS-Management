import {
  Menu,
  Search,
  User,
  Plus,
  ShoppingCart,
  DollarSign,
  Bell,
  Calendar
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface RouteInfo {
  path: string;
  name: string;
  category: string;
}

interface TopBarProps {
  toggleSidebar: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Define searchable routes for POS
  const allRoutes: RouteInfo[] = useMemo(() => [
    // Dashboard
    { path: '/', name: 'Dashboard', category: 'Main' },
    { path: '/dashboard', name: 'Dashboard', category: 'Main' },

    // POS
    { path: '/pos/cashier', name: 'Cashier', category: 'POS' },
    { path: '/pos/transactions', name: 'Transactions', category: 'POS' },
    { path: '/pos/returns', name: 'Returns', category: 'POS' },
    { path: '/pos/invoices', name: 'Invoices', category: 'POS' },

    // Products
    { path: '/products/list', name: 'Product Catalog', category: 'Products' },
    { path: '/products/categories', name: 'Categories', category: 'Products' },
    { path: '/products/inventory', name: 'Inventory', category: 'Products' },
    { path: '/products/pricing', name: 'Pricing', category: 'Products' },

    // Customers
    { path: '/customers/list', name: 'Customer List', category: 'Customers' },
    { path: '/customers/loyalty', name: 'Loyalty Program', category: 'Customers' },
    { path: '/customers/credit', name: 'Credit Accounts', category: 'Customers' },

    // Sales
    { path: '/sales/daily', name: 'Daily Sales', category: 'Sales' },
    { path: '/sales/reports', name: 'Sales Reports', category: 'Sales' },
    { path: '/sales/orders', name: 'Orders', category: 'Sales' },

    // System
    { path: '/settings/general', name: 'General Settings', category: 'System' },
    { path: '/settings/payments', name: 'Payment Methods', category: 'System' },
    { path: '/users', name: 'Users', category: 'System' },
  ], []);

  // Filter routes based on search query
  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return allRoutes.filter(route =>
      route.name.toLowerCase().includes(query) ||
      route.path.toLowerCase().includes(query.replace(/\s+/g, '-')) ||
      route.category.toLowerCase().includes(query)
    );
  }, [searchQuery, allRoutes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredRoutes.length > 0) {
      navigate(filteredRoutes[0].path);
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  const handleRouteSelect = (path: string) => {
    navigate(path);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const getRouteIcon = (category: string) => {
    switch (category) {
      case 'Main': return DollarSign;
      case 'POS': return ShoppingCart;
      case 'Products': return DollarSign;
      case 'Customers': return User;
      case 'Sales': return DollarSign;
      case 'System': return User;
      default: return DollarSign;
    }
  };

  // Today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="sticky top-0 z-40 p-1 bg-gradient-to-r from-[var(--sidebar-bg)] to-[#1e293b] border-b border-[var(--sidebar-border)] flex items-center justify-between shadow-lg">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button
          onClick={toggleSidebar}
          aria-label="Toggle menu"
          className="p-2 rounded-lg hover:bg-[var(--topbar-hover)]/20 text-[var(--sidebar-text)] transition-all duration-200 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo / App Name (Mobile) */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-blue)] to-[#3b82f6] flex items-center justify-center shadow-md">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">POS</span>
        </div>

        {/* Date Display (Desktop) */}
        <div className="hidden md:flex items-center gap-3 ml-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--topbar-search-bg)]/50 border border-[var(--topbar-search-border)]">
            <Calendar className="w-4 h-4 text-[var(--sidebar-text)]" />
            <div className="flex flex-col">
              <div className="text-sm font-medium text-[var(--sidebar-text)]">
                {today.toLocaleDateString('en-US', { weekday: 'long' })}
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">{formattedDate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Center Section - Search Bar */}
      <div className="flex-1 max-w-2xl mx-4">
        <div className="relative">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-[var(--text-tertiary)]" />
              </div>
              <input
                type="text"
                placeholder="Search products, customers, transactions..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                className="w-full pl-10 pr-4 py-2.5 border border-[var(--topbar-search-border)] rounded-lg bg-[var(--topbar-search-bg)] text-[var(--sidebar-text)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--topbar-hover)] focus:border-transparent text-sm shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <div className="w-5 h-5 rounded-full bg-[var(--text-tertiary)]/20 flex items-center justify-center">
                    <span className="text-[10px] text-[var(--text-tertiary)]">×</span>
                  </div>
                </button>
              )}
            </div>
          </form>

          {/* Search Results Dropdown */}
          {showSearchResults && filteredRoutes.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-2xl bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] max-h-80 overflow-auto z-50">
              <div className="p-2 border-b border-[var(--sidebar-border)]">
                <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-2 py-1">
                  Quick Navigation
                </div>
              </div>
              {filteredRoutes.map((route, index) => {
                const RouteIcon = getRouteIcon(route.category);
                const categoryColor = route.category === 'POS' ? 'var(--accent-blue)' :
                  route.category === 'Products' ? 'var(--accent-green)' :
                    route.category === 'Customers' ? 'var(--accent-purple)' :
                      route.category === 'Sales' ? 'var(--accent-blue)' :
                        route.category === 'System' ? 'var(--accent-amber)' :
                          'var(--accent-blue)';

                return (
                  <div
                    key={index}
                    className="px-3 py-2.5 cursor-pointer border-b border-[var(--sidebar-border)] last:border-b-0 hover:bg-[var(--topbar-hover)]/10 transition-colors group"
                    onMouseDown={() => handleRouteSelect(route.path)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform"
                        style={{
                          backgroundColor: categoryColor + '20',
                          color: categoryColor
                        }}
                      >
                        <RouteIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[var(--sidebar-text)] truncate text-sm">
                          {route.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--sidebar-border)]/50 text-[var(--text-tertiary)]">
                            {route.category}
                          </span>
                          <span className="text-xs text-[var(--text-tertiary)] truncate">
                            {route.path}
                          </span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-6 h-6 rounded-full bg-[var(--topbar-hover)]/20 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--topbar-hover)]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No Results Message */}
          {showSearchResults && searchQuery.trim() && filteredRoutes.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-2xl bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] p-6 z-50">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--sidebar-border)]/30 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-5 h-5 text-[var(--text-tertiary)]" />
                </div>
                <div className="text-[var(--sidebar-text)] font-medium mb-1">
                  No results found
                </div>
                <div className="text-xs text-[var(--text-tertiary)]">
                  Try searching for products, customers, or transactions
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Section - Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button className="relative p-2 rounded-lg hover:bg-[var(--topbar-hover)]/20 text-[var(--sidebar-text)] transition-colors duration-200 group">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--accent-red)] rounded-full border border-[var(--sidebar-bg)]"></span>
          <div className="absolute top-full right-0 mt-2 w-64 bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="p-3 border-b border-[var(--sidebar-border)]">
              <div className="text-sm font-semibold text-[var(--sidebar-text)]">Notifications</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-sm text-[var(--text-tertiary)]">No new notifications</div>
            </div>
          </div>
        </button>

        {/* Quick Actions */}
        <div className="hidden md:flex items-center gap-2 border-r border-[var(--sidebar-border)] pr-3">
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[var(--accent-blue)] to-[#3b82f6] text-white text-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 shadow-md"
            onClick={() => navigate('/pos/cashier')}
            title="New Sale"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline font-medium">New Sale</span>
            <span className="lg:hidden">Sale</span>
          </button>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 p-2 group relative">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[#3b82f6] flex items-center justify-center text-white shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[var(--accent-green)] rounded-full border-2 border-[var(--sidebar-bg)]"></div>
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-sm font-medium text-[var(--sidebar-text)]">
              Cashier
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">
              POS User
            </div>
          </div>
          
          {/* Profile Dropdown */}
          <div className="absolute top-full right-0 mt-2 w-48 bg-[var(--sidebar-bg)] border border-[var(--sidebar-border)] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <div className="p-4 border-b border-[var(--sidebar-border)]">
              <div className="text-sm font-semibold text-[var(--sidebar-text)]">Cashier</div>
              <div className="text-xs text-[var(--text-tertiary)]">pos@example.com</div>
            </div>
            <div className="p-2">
              <button
                onClick={() => navigate('/settings/profile')}
                className="w-full text-left px-3 py-2 text-sm text-[var(--sidebar-text)] hover:bg-[var(--topbar-hover)]/10 rounded-lg transition-colors"
              >
                Profile Settings
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="w-full text-left px-3 py-2 text-sm text-[var(--sidebar-text)] hover:bg-[var(--topbar-hover)]/10 rounded-lg transition-colors"
              >
                System Settings
              </button>
              <button
                onClick={() => {/* Logout handler */}}
                className="w-full text-left px-3 py-2 text-sm text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 rounded-lg transition-colors mt-1"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;