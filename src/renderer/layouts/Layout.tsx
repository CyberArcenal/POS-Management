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
    <div className="flex h-screen">
      {/* Sidebar component */}
      <Sidebar isOpen={sidebarOpen} />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-20 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar component */}
        <TopBar toggleSidebar={toggleSidebar} />

        {/* Page content - NO PADDING */}
        <main className="flex-1 overflow-y-auto bg-[var(--background-color)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;