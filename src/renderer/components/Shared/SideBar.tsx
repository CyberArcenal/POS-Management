// components/Sidebar.tsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { version } from "../../../../package.json";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Bell,
  LogOut,
  HelpCircle,
  Calculator,
  ListChecks,
  CalendarDays,
  Users2,
  FileCheck,
  User2,
  Receipt,
  BarChart2,
  Trophy,
  Layers,
  Shuffle,
  Truck,
  FileBarChart,
  DollarSign,
  ClipboardList,
  UserCheck,
  Sliders,
  FileText,
  Boxes,
  Tags,
  RotateCcw,
  ClipboardCheck,
  Building2,
  ComputerIcon,
} from "lucide-react";
import dashboardAPI from "../../api/dashboard";
import { formatCurrency } from "../../utils/formatters";
import systemConfigAPI from "../../api/system_config";

interface SidebarProps {
  isOpen: boolean;
}

interface MenuItem {
  path: string;
  name: string;
  icon: React.ComponentType<any>;
  category?: string;
  children?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(
    {},
  );
  const [companyName, setCompanyName] = useState<string>("POS Management");


  useEffect(() => {
    const loadName = async () => {
      const response = await systemConfigAPI.getGroupedConfig();
      if(response.status){
        setCompanyName(response.data?.grouped_settings.general.company_name || "POS Management");
      }

      loadName();
    }
  }, [])

  // Stats state
  const [stats, setStats] = useState({
    revenueToday: 0,
    transactions: 0,
    lowStockCount: 0,
    pendingOrders: 0, // placeholder – can be replaced with real data later
  });

  // Fetch stats on mount
  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        // Get summary (includes today's revenue and sales count)
        const summaryRes = await dashboardAPI.getSummary();
        if (mounted && summaryRes.status && summaryRes.data) {
          setStats(prev => ({
            ...prev,
            revenueToday: summaryRes.data!.revenueToday,
            transactions: summaryRes.data!.salesToday,
          }));
        }

        // Get inventory status (includes low stock count)
        const inventoryRes = await dashboardAPI.getInventoryStatus();
        if (mounted && inventoryRes.status && inventoryRes.data) {
          setStats(prev => ({
            ...prev,
            lowStockCount: inventoryRes.data!.lowStockCount,
          }));
        }

        // Optional: fetch pending orders count if an API exists
        // const ordersRes = await dashboardAPI.getPendingOrdersCount?.();
        // if (mounted && ordersRes?.status) setStats(prev => ({ ...prev, pendingOrders: ordersRes.data.count }));
      } catch (error) {
        console.error("Failed to fetch sidebar stats:", error);
      }
    };

    fetchStats();

    return () => {
      mounted = false;
    };
  }, []);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { path: "/", name: "Dashboard", icon: LayoutDashboard, category: "core" },

    {
      path: "/pos",
      name: "Point of Sale",
      icon: ShoppingCart,
      category: "core",
      children: [
        { path: "/pos/cashier", name: "Cashier", icon: Calculator },
        { path: "/pos/transactions", name: "Transactions", icon: Receipt },
        { path: "/pos/products", name: "Products", icon: Package },
      ],
    },

    {
      path: "/customers",
      name: "Customers",
      icon: Users,
      category: "core",
      children: [
        { path: "/customers/list", name: "Customer Directory", icon: Users2 },
        { path: "/customers/loyalty", name: "Loyalty Program", icon: Trophy },
      ],
    },

    {
      path: "/sales",
      name: "Sales",
      icon: TrendingUp,
      category: "core",
      children: [
        { path: "/sales/daily", name: "Daily Sales", icon: CalendarDays },
        { path: "/sales/reports", name: "Sales Reports", icon: BarChart2 },
        { path: "/sales/returns", name: "Returns & Refunds", icon: RotateCcw },
      ],
    },

    {
      path: "/inventory",
      name: "Inventory",
      icon: Boxes,
      category: "core",
      children: [
        { path: "/inventory/stock", name: "Stock Levels", icon: Layers },
        { path: "/inventory/movements", name: "Movements", icon: Shuffle },
        { path: "/inventory/reorder", name: "Reorder & Vendors", icon: Truck },
        {
          path: "/inventory/purchases",
          name: "Purchases",
          icon: ClipboardCheck,
        },
        { path: "/inventory/suppliers", name: "Suppliers", icon: Building2 },
        { path: "/inventory/categories", name: "Categories", icon: Tags },
      ],
    },

    {
      path: "/reports",
      name: "Reports",
      icon: FileBarChart,
      category: "analytics",
      children: [
        {
          path: "/reports/financial",
          name: "Financial Reports",
          icon: DollarSign,
        },
        {
          path: "/reports/inventory",
          name: "Inventory Reports",
          icon: ClipboardList,
        },
        {
          path: "/reports/customer",
          name: "Customer Insights",
          icon: UserCheck,
        },
      ],
    },

    {
      path: "/system",
      name: "System",
      icon: Settings,
      category: "system",
      children: [
        { path: "/system/audit", name: "Audit Trail", icon: ListChecks },
        { path: "/notification-logs", name: "Notification Logs", icon: Bell },
        {path: "/devices", name: "Device Manager", icon: ComputerIcon},
        { path: "/system/settings", name: "System Settings", icon: Sliders },
      ],
    },
  ]);

  const filteredMenu = menuItems
    .map((item) => {
      if (item.children) {
        const children = item.children.filter(
          (child) => !(child.path === "/users"),
        );
        return { ...item, children };
      }
      return item;
    })
    .filter(
      (item) =>
        item.path !== "/users" &&
        (item.children ? item.children.length > 0 : true),
    );

  const toggleDropdown = (name: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const isDropdownActive = (items: MenuItem[] = []) => {
    return items.some((item) => isActivePath(item.path));
  };

  useEffect(() => {
    filteredMenu.forEach((item) => {
      if (item.children && isDropdownActive(item.children)) {
        setOpenDropdowns((prev) => ({ ...prev, [item.name]: true }));
      }
    });
  }, [location.pathname]);

  const renderMenuItems = (items: MenuItem[]) => {
    return items.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const is_active = hasChildren
        ? isDropdownActive(item.children)
        : isActivePath(item.path);
      const isOpen = openDropdowns[item.name];

      return (
        <li key={item.path || item.name} className="mb-1">
          {hasChildren ? (
            <>
              <div
                onClick={() => toggleDropdown(item.name)}
                className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer
                  ${
                    is_active
                      ? "bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-blue-hover)] text-white shadow-lg"
                      : "text-[var(--sidebar-text)] hover:bg-[var(--card-hover-bg)] hover:text-white"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`w-5 h-5 ${
                      is_active
                        ? "text-white"
                        : "text-[var(--sidebar-text)] group-hover:text-white"
                    }`}
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  } ${
                    is_active
                      ? "text-white"
                      : "text-[var(--sidebar-text)] group-hover:text-white"
                  }`}
                />
              </div>

              {isOpen && (
                <ul
                  className="ml-4 mt-1 space-y-1 border-l-2 pl-3"
                  style={{ borderColor: "var(--accent-blue)" }}
                >
                  {item.children?.map((child) => {
                    const isChildActive = isActivePath(child.path);
                    return (
                      <li key={child.path} className="mb-1">
                        <Link
                          to={child.path}
                          className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm
                            ${
                              isChildActive
                                ? "text-white bg-[var(--accent-blue)]/20 font-semibold border-l-2 border-[var(--accent-blue)] pl-2"
                                : "text-[var(--sidebar-text)] hover:bg-[var(--card-hover-bg)] hover:text-white"
                            }`}
                        >
                          <child.icon className="w-4 h-4" />
                          <span>{child.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : (
            <Link
              to={item.path}
              className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${
                  is_active
                    ? "bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-blue-hover)] text-white shadow-lg"
                    : "text-[var(--sidebar-text)] hover:bg-[var(--card-hover-bg)] hover:text-white"
                }`}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={`w-5 h-5 ${
                    is_active
                      ? "text-white"
                      : "text-[var(--sidebar-text)] group-hover:text-white"
                  }`}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-opacity duration-200 ${
                  is_active
                    ? "opacity-100 text-white"
                    : "opacity-0 group-hover:opacity-50 text-[var(--sidebar-text)]"
                }`}
              />
            </Link>
          )}
        </li>
      );
    });
  };

  const categories = [
    { id: "core", name: "Core Modules" },
    { id: "analytics", name: "Analytics & Reports" },
    { id: "system", name: "System" },
  ];

  return (
    <div
      className={`fixed md:relative inset-y-0 left-0 w-64
        bg-gradient-to-b from-[var(--sidebar-bg)] to-[#1e293b] border-r border-[var(--sidebar-border)]
        transform ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 transition-all duration-300 ease-in-out
        z-30 flex flex-col h-screen shadow-xl`}
    >
      {/* Header - Fixed height */}
      <div className="flex-shrink-0 border-b border-[var(--sidebar-border)] bg-gradient-to-r from-[var(--sidebar-bg)] to-[#1e293b] p-6">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--accent-blue)] to-[#3b82f6] flex items-center justify-center overflow-hidden shadow-lg">
            <div className="flex items-center justify-center w-full h-full">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-white">
              {companyName}
            </h2>
            <p className="text-xs text-[var(--text-tertiary)]">
              Point of Sale System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation - Scrollable area */}
      <nav className="flex-1 overflow-y-auto pos-scrollbar p-4">
        {categories.map((category) => {
          const categoryItems = menuItems.filter(
            (item) => item.category === category.id,
          );
          if (categoryItems.length === 0) return null;

          return (
            <div key={category.id} className="mb-6">
              <h6 className="px-4 py-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider bg-[#334155]/50 rounded-lg">
                {category.name}
              </h6>
              <ul className="space-y-1 mt-2">
                {renderMenuItems(categoryItems)}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Quick Status Indicators with real data */}
      <div className="p-4 border-t border-[var(--border-color)] bg-[#334155]/30">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-[var(--status-completed-bg)] text-[var(--status-completed)] text-xs py-2 px-2 rounded-lg text-center border border-[var(--border-light)]">
            <div className="font-bold text-sm">
              {formatCurrency(stats.revenueToday.toFixed(2))}
            </div>
            <div className="text-[10px]">Today's Sales</div>
          </div>
          <div className="bg-[var(--status-pending-bg)] text-[var(--status-pending)] text-xs py-2 px-2 rounded-lg text-center border border-[var(--border-light)]">
            <div className="font-bold text-sm">{stats.pendingOrders}</div>
            <div className="text-[10px]">Pending Orders</div>
          </div>
          <div className="bg-[var(--stock-lowstock-bg)] text-[var(--stock-lowstock)] text-xs py-2 px-2 rounded-lg text-center border border-[var(--border-light)]">
            <div className="font-bold text-sm">{stats.lowStockCount}</div>
            <div className="text-[10px]">Low Stock</div>
          </div>
          <div className="bg-[rgba(37,99,235,0.1)] text-[#2563eb] text-xs py-2 px-2 rounded-lg text-center border border-[var(--border-light)]">
            <div className="font-bold text-sm">{stats.transactions}</div>
            <div className="text-[10px]">Transactions</div>
          </div>
        </div>
        <div className="flex justify-center">
          <Link
            to="/pos/cashier"
            className="w-full bg-gradient-to-r from-[var(--accent-blue)] to-[#3b82f6] text-white text-sm py-2 px-4 rounded-lg text-center hover:from-[var(--accent-blue-hover)] hover:to-[#2563eb] transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
          >
            <ShoppingCart className="w-4 h-4" />
            Cashier
          </Link>
        </div>
      </div>

      {/* Footer - Fixed height */}
      <div className="p-4 border-t border-[var(--border-color)] text-center flex-shrink-0 bg-gradient-to-r from-[var(--sidebar-bg)] to-[#1e293b]">
        <p className="text-xs text-[var(--text-tertiary)] mb-2">
          v{version} • © {new Date().getFullYear()} POS System
        </p>
        <div className="flex justify-center gap-4">
          <button
            className="text-[var(--text-tertiary)] hover:text-[var(--accent-green)] hover:bg-[var(--accent-green)]/10 p-1.5 rounded-full transition-colors duration-200"
            title="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <Link
            to="/settings/general"
            className="text-[var(--text-tertiary)] hover:text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/10 p-1.5 rounded-full transition-colors duration-200"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;