import {
  Menu,
  Search,
  User,
  Plus,
  ShoppingCart,
  DollarSign,
  Bell
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
    <header className="sticky top-0 z-40 p-1 bg-[var(--card-bg)] border-b border-[var(--border-color)] flex items-center justify-between shadow-md">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button
          onClick={toggleSidebar}
          aria-label="Toggle menu"
          className="p-2 rounded-lg hover:bg-[var(--card-hover-bg)] text-[var(--sidebar-text)] transition-all duration-200 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo / App Name (Mobile) */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-blue)] to-[#3b82f6] flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">POS</span>
        </div>

        {/* Date Display (Desktop) */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex flex-col">
            <div className="text-sm font-medium text-[var(--text-primary)]">
              {today.toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">{formattedDate}</div>
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
                placeholder="Search products, customers..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                className="w-full pl-10 pr-4 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--card-secondary-bg)] text-[var(--sidebar-text)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent text-sm"
              />
            </div>
          </form>

          {/* Search Results Dropdown */}
          {showSearchResults && filteredRoutes.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-xl bg-[var(--sidebar-bg)] border border-[var(--border-color)] max-h-80 overflow-auto z-50">
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
                    className="px-4 py-3 cursor-pointer border-b border-[var(--border-color)] last:border-b-0 hover:bg-[var(--card-hover-bg)] transition-colors"
                    onMouseDown={() => handleRouteSelect(route.path)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: categoryColor + '20',
                          color: categoryColor
                        }}
                      >
                        <RouteIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[var(--text-primary)] truncate text-sm">
                          {route.name}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)] mt-1">
                          {route.path}
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
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-xl bg-[var(--sidebar-bg)] border border-[var(--border-color)] p-4 z-50">
              <div className="text-center text-[var(--text-tertiary)] text-sm">
                No results found for "{searchQuery}"
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Section - Actions & Profile */}
      <div className="flex items-center gap-2">
        {/* Quick Actions */}
        <div className="hidden md:flex items-center gap-1">
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[var(--accent-blue)] to-[#3b82f6] text-white text-sm hover:opacity-90 transition-all duration-200"
            onClick={() => navigate('/pos/cashier')}
            title="New Sale"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">New Sale</span>
          </button>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-2 p-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[#3b82f6] flex items-center justify-center text-white">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium text-[var(--text-primary)]">
              Cashier
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">
              POS User
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;