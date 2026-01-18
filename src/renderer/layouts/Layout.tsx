// src/layouts/Layout.tsx

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Shared/SideBar';
import TopBar from '../components/Shared/TopBar';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // After mounting, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return null;
  }

  return (
    <div className={`flex h-screen`}>
      {/* Sidebar component */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar component */}
        <TopBar
          toggleSidebar={toggleSidebar}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-2 bg-background text-foreground">
          <Outlet /> {/* Dito lalabas ang content ng bawat page */}
        </main>
      </div>
    </div>
  );
};

export default Layout;