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
  Filter
} from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  onSearch?: (query: string) => void;
  onFilterClick?: () => void;
  onExport?: () => void;
  onSettingsClick?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  onSearch,
  onFilterClick,
  onExport,
  onSettingsClick,
}) => {
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState([
    { id: 1, message: 'New sale recorded', time: '5 min ago' },
    { id: 2, message: 'Low stock alert', time: '10 min ago' },
    { id: 3, message: 'System update available', time: '1 hour ago' },
  ]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
      <div className="px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left side - Title and subtitle */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2">
            {/* Search */}
            {onSearch && (
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64 transition-all duration-300"
                />
              </div>
            )}

            {/* Filter button */}
            {onFilterClick && (
              <button
                onClick={onFilterClick}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Filters"
              >
                <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            )}

            {/* Export button */}
            {onExport && (
              <button
                onClick={onExport}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Export"
              >
                <Download className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            {/* Help */}
            <button
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Help"
            >
              <HelpCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative">
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Notifications dropdown */}
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Notifications
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-lg transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                            <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Settings */}
            {onSettingsClick && (
              <button
                onClick={onSettingsClick}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            )}

            {/* User profile */}
            <div className="relative">
              <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                  Admin
                </span>
              </button>
              
              {/* User dropdown */}
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                <div className="py-2">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Admin User
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      admin@example.com
                    </p>
                  </div>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors flex items-center space-x-2">
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};