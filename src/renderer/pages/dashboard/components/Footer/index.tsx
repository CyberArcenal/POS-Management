import React from 'react';
import { Heart, Coffee, Code, Activity } from 'lucide-react';

interface DashboardFooterProps {
  lastUpdated?: string;
  version?: string;
}

export const DashboardFooter: React.FC<DashboardFooterProps> = ({ 
  lastUpdated, 
  version = '1.0.0' 
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Left side */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-green-500" />
            <span>System Status: <span className="font-medium text-green-600 dark:text-green-400">Operational</span></span>
          </div>
          {lastUpdated && (
            <div className="mt-1">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </div>
          )}
        </div>

        {/* Center - Version info */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <Code className="h-4 w-4" />
            <span>Version: {version}</span>
          </div>
          <div className="mt-1 text-xs">
            Data refreshes every 30 seconds
          </div>
        </div>

        {/* Right side - Credits */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500 animate-pulse-subtle" />
            <span>and</span>
            <Coffee className="h-4 w-4 text-amber-600" />
            <span>• © {currentYear} POS Dashboard</span>
          </div>
        </div>
      </div>

      {/* Bottom links */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Terms of Service
          </a>
          <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Documentation
          </a>
          <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Support
          </a>
          <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            API Reference
          </a>
        </div>
      </div>
    </footer>
  );
};