/// <reference types="node" />

// dashboardAPI.ts - SIMILAR STRUCTURE TO activation.ts
export interface SalesOverviewData {
  overview: {
    totalTransactions: number;
    totalRevenue: number;
    averageTransactionValue: number;
    highestSale: number;
    lowestSale: number;
    conversionRate: number;
  };
  paymentMethods: Array<{
    paymentMethod: string;
    count: number;
    total: number;
  }>;
  topProducts: Array<{
    id: number;
    name: string;
    sku: string;
    quantity: number;
    revenue: number;
  }>;
  growth: any | null;
}

export interface SalesTrendData {
  period: string;
  trend: Array<{
    period: string;
    transactionCount: number;
    totalRevenue: number;
    avgTransactionValue: number;
  }>;
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    peakPeriod: any;
  };
}

export interface TopSellingProductsData {
  products: Array<{
    id: number;
    name: string;
    sku: string;
    price: number;
    costPrice: number | null;
    stock: number;
    category: string | null;
    totalSold: number;
    totalRevenue: number;
    avgSellingPrice: number;
    timesSold: number;
    profit: number | null;
    profitMargin: number | null;
  }>;
  summary: {
    totalItemsSold: number;
    totalRevenue: number;
    averagePrice: number;
  };
}

export interface SalesByCategoryData {
  categories: Array<{
    category: string;
    productCount: number;
    totalQuantity: number;
    totalRevenue: number;
    avgPrice: number;
    percentage: number;
  }>;
  summary: {
    totalCategories: number;
    totalRevenue: number;
    mostPopularCategory: any;
    leastPopularCategory: any;
  };
}

export interface HourlySalesPatternData {
  pattern: Array<{
    hour: number;
    totalRevenue: number;
    totalTransactions: number;
    byDay: Record<string, { revenue: number; transactions: number }>;
  }>;
  peakHours: {
    hour: number;
    revenue: number;
    transactions: number;
  };
  summary: {
    busiestDay: { day: string; stats: { revenue: number; transactions: number } };
    quietestHour: any;
  };
}

export interface InventoryOverviewData {
  summary: {
    totalProducts: number;
    outOfStock: number;
    lowStock: number;
    totalStock: number;
    totalValue: number;
    inStock: number;
  };
  recentMovements: Array<{
    action: string;
    change: number;
    date: string;
    product: string | null;
    sku: string | null;
  }>;
  stockAlerts: Array<{
    id: number;
    name: string;
    sku: string;
    currentStock: number;
    minStock: number;
    needed: number;
  }>;
}

export interface LowStockAlertsData {
  alerts: Array<{
    id: number;
    name: string;
    sku: string;
    currentStock: number;
    minStock: number;
    category: string | null;
    supplier: string | null;
    lastReorder: string | null;
    reorderQuantity: number;
    urgency: 'critical' | 'warning' | 'attention' | 'normal';
  }>;
  summary: {
    critical: number;
    warning: number;
    attention: number;
  };
}

export interface StaffPerformanceData {
  performance: Array<{
    id: number;
    name: string;
    username: string;
    role: string;
    metrics: {
      totalSales: number;
      totalRevenue: number;
      avgSaleValue: number;
      highestSale: number;
      lowestSale: number;
      efficiency: number;
    };
  }>;
  summary: {
    topPerformer: any;
    averageRevenue: number;
    totalStaff: number;
  };
}

export interface LiveDashboardData {
  timestamp: string;
  today: {
    transactionCount: number;
    totalRevenue: number;
    avgTransactionValue: number;
  };
  currentHour: {
    transactionCount: number;
    hour: number;
  };
  activeUsers: number;
  recentTransactions: Array<{
    id: number;
    total: number;
    time: string;
    reference: string | null;
    cashier: string | null;
  }>;
  systemStatus: {
    lastSync: string | null;
    syncStatus: string | null;
    hasErrors: boolean;
    uptime: number;
  };
  alerts: Array<{
    type: 'warning' | 'danger' | 'info' | 'success';
    message: string;
    icon: string;
    priority: number;
    link: string;
  }>;
}

export interface MobileDashboardData {
  summary: {
    transactions: number;
    revenue: number;
    avgTransaction: number;
  };
  topProducts: Array<{
    name: string;
    sold: number;
  }>;
  lowStock: Array<{
    name: string;
    stock: number;
    minStock: number;
    status: 'out' | 'low';
  }>;
  recentSales: Array<{
    amount: number;
    time: string;
  }>;
  updatedAt: string;
}

export interface QuickStatsData {
  sales: {
    today: {
      transactions: number;
      revenue: number;
      vsYesterday: {
        transactions: number;
        revenue: number;
      };
    };
    week: {
      transactions: number;
      revenue: number;
    };
  };
  inventory: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    inStock: number;
  };
  performance: {
    avgTransactionValue: number;
    conversionRate: number;
  };
}

// Generic Response Interfaces
export interface DashboardResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface DashboardPayload {
  method: string;
  params?: Record<string, any>;
}

// Specific Response Types for Each Method
export type SalesOverviewResponse = DashboardResponse<SalesOverviewData>;
export type SalesTrendResponse = DashboardResponse<SalesTrendData>;
export type TopSellingProductsResponse = DashboardResponse<TopSellingProductsData>;
export type SalesByCategoryResponse = DashboardResponse<SalesByCategoryData>;
export type HourlySalesPatternResponse = DashboardResponse<HourlySalesPatternData>;
export type InventoryOverviewResponse = DashboardResponse<InventoryOverviewData>;
export type LowStockAlertsResponse = DashboardResponse<LowStockAlertsData>;
export type StaffPerformanceResponse = DashboardResponse<StaffPerformanceData>;
export type LiveDashboardResponse = DashboardResponse<LiveDashboardData>;
export type MobileDashboardResponse = DashboardResponse<MobileDashboardData>;
export type QuickStatsResponse = DashboardResponse<QuickStatsData>;

class DashboardAPI {
  private async callDashboardAPI<T>(method: string, params?: Record<string, any>): Promise<DashboardResponse<T>> {
    try {
      if (!window.backendAPI || !window.backendAPI.dashboard) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.dashboard({
        method,
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || `Failed to execute ${method}`);
    } catch (error: any) {
      throw new Error(error.message || `Failed to execute ${method}`);
    }
  }

  // 📊 SALES ANALYTICS METHODS
  async getSalesOverview(params?: {
    startDate?: string;
    endDate?: string;
    comparePeriod?: boolean;
  }): Promise<SalesOverviewResponse> {
    return this.callDashboardAPI<SalesOverviewData>("getSalesOverview", params);
  }

  async getSalesTrend(params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
    groupBy?: string;
  }): Promise<SalesTrendResponse> {
    return this.callDashboardAPI<SalesTrendData>("getSalesTrend", params);
  }

  async getTopSellingProducts(params?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<TopSellingProductsResponse> {
    return this.callDashboardAPI<TopSellingProductsData>("getTopSellingProducts", params);
  }

  async getSalesByCategory(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<SalesByCategoryResponse> {
    return this.callDashboardAPI<SalesByCategoryData>("getSalesByCategory", params);
  }

  async getHourlySalesPattern(params?: {
    days?: number;
  }): Promise<HourlySalesPatternResponse> {
    return this.callDashboardAPI<HourlySalesPatternData>("getHourlySalesPattern", params);
  }

  async getSalesComparison(params?: Record<string, any>): Promise<DashboardResponse<any>> {
    return this.callDashboardAPI<any>("getSalesComparison", params);
  }

  // 📦 INVENTORY ANALYTICS METHODS
  async getInventoryOverview(params?: Record<string, any>): Promise<InventoryOverviewResponse> {
    return this.callDashboardAPI<InventoryOverviewData>("getInventoryOverview", params);
  }

  async getLowStockAlerts(params?: {
    threshold?: number;
  }): Promise<LowStockAlertsResponse> {
    return this.callDashboardAPI<LowStockAlertsData>("getLowStockAlerts", params);
  }

  async getStockMovement(params?: Record<string, any>): Promise<DashboardResponse<any>> {
    return this.callDashboardAPI<any>("getStockMovement", params);
  }

  async getInventoryTurnover(params?: Record<string, any>): Promise<DashboardResponse<any>> {
    return this.callDashboardAPI<any>("getInventoryTurnover", params);
  }

  async getExpiringProducts(params?: Record<string, any>): Promise<DashboardResponse<any>> {
    return this.callDashboardAPI<any>("getExpiringProducts", params);
  }

  async getInventoryValue(params?: Record<string, any>): Promise<DashboardResponse<any>> {
    return this.callDashboardAPI<any>("getInventoryValue", params);
  }

  // 👤 PERFORMANCE ANALYTICS METHODS
  async getStaffPerformance(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<StaffPerformanceResponse> {
    return this.callDashboardAPI<StaffPerformanceData>("getStaffPerformance", params);
  }

  async getCashierPerformance(params?: Record<string, any>): Promise<DashboardResponse<any>> {
    return this.callDashboardAPI<any>("getCashierPerformance", params);
  }

  async getUserActivitySummary(params?: Record<string, any>): Promise<DashboardResponse<any>> {
    return this.callDashboardAPI<any>("getUserActivitySummary", params);
  }

  // 💰 FINANCIAL METRICS METHODS
  async getRevenueMetrics(params?: Record<string, any>): Promise<DashboardResponse<any>> {
    return this.callDashboardAPI<any>("getRevenueMetrics", params);
  }

  async getProfitAnalysis(params?: Record<string, any>): Promise<DashboardResponse<any>> {
    return this.callDashboardAPI<any>("getProfitAnalysis", params);
  }

  async getAverageTransactionValue(params?: Record<string, any>): Promise<DashboardResponse<any>> {
    return this.callDashboardAPI<any>("getAverageTransactionValue", params);
  }

  async getDiscountAnalysis(params?: Record<string, any>): Promise<DashboardResponse<any>> {
    return this.callDashboardAPI<any>("getDiscountAnalysis", params);
  }

  // 📈 REAL-TIME DASHBOARD METHODS
  async getLiveDashboard(params?: Record<string, any>): Promise<LiveDashboardResponse> {
    return this.callDashboardAPI<LiveDashboardData>("getLiveDashboard", params);
  }

  async getTodayStats(params?: Record<string, any>): Promise<DashboardResponse<any>> {
    return this.callDashboardAPI<any>("getTodayStats", params);
  }

  async getRealTimeSales(params?: Record<string, any>): Promise<DashboardResponse<any>> {
    return this.callDashboardAPI<any>("getRealTimeSales", params);
  }

  async getCurrentQueue(params?: Record<string, any>): Promise<DashboardResponse<any>> {
    return this.callDashboardAPI<any>("getCurrentQueue", params);
  }

  // 🔄 SYNC & SYSTEM HEALTH METHODS
  async getSyncStatus(params?: Record<string, any>): Promise<DashboardResponse<any>> {
    return this.callDashboardAPI<any>("getSyncStatus", params);
  }

  async getSystemHealth(params?: Record<string, any>): Promise<DashboardResponse<any>> {
    return this.callDashboardAPI<any>("getSystemHealth", params);
  }

  async getAuditSummary(params?: Record<string, any>): Promise<DashboardResponse<any>> {
    return this.callDashboardAPI<any>("getAuditSummary", params);
  }

  async getRecentActivities(params?: Record<string, any>): Promise<DashboardResponse<any>> {
    return this.callDashboardAPI<any>("getRecentActivities", params);
  }

  // 📱 MOBILE DASHBOARD METHODS
  async getMobileDashboard(params?: Record<string, any>): Promise<MobileDashboardResponse> {
    return this.callDashboardAPI<MobileDashboardData>("getMobileDashboard", params);
  }

  async getQuickStats(params?: Record<string, any>): Promise<QuickStatsResponse> {
    return this.callDashboardAPI<QuickStatsData>("getQuickStats", params);
  }

  // 🎯 UTILITY METHODS (Similar to ActivationAPI)
  async isDashboardAvailable(): Promise<boolean> {
    try {
      await this.getQuickStats();
      return true;
    } catch {
      return false;
    }
  }

  async getDashboardSummary(): Promise<{
    sales: { transactions: number; revenue: number };
    inventory: { lowStock: number; outOfStock: number };
    alerts: Array<any>;
  }> {
    try {
      const [quickStats, inventoryOverview] = await Promise.all([
        this.getQuickStats(),
        this.getInventoryOverview()
      ]);

      return {
        sales: {
          transactions: quickStats.data.sales.today.transactions,
          revenue: quickStats.data.sales.today.revenue
        },
        inventory: {
          lowStock: inventoryOverview.data.summary.lowStock,
          outOfStock: inventoryOverview.data.summary.outOfStock
        },
        alerts: [] // Can be populated from live dashboard
      };
    } catch (error) {
      console.error("Error getting dashboard summary:", error);
      return {
        sales: { transactions: 0, revenue: 0 },
        inventory: { lowStock: 0, outOfStock: 0 },
        alerts: []
      };
    }
  }

  async refreshAllData(): Promise<{
    liveDashboard: LiveDashboardData;
    salesOverview: SalesOverviewData;
    inventoryOverview: InventoryOverviewData;
  }> {
    try {
      const [liveDashboard, salesOverview, inventoryOverview] = await Promise.all([
        this.getLiveDashboard(),
        this.getSalesOverview(),
        this.getInventoryOverview()
      ]);

      return {
        liveDashboard: liveDashboard.data,
        salesOverview: salesOverview.data,
        inventoryOverview: inventoryOverview.data
      };
    } catch (error: any) {
      throw new Error(`Failed to refresh dashboard data: ${error.message}`);
    }
  }

  async subscribeToLiveUpdates(
    callback: (data: LiveDashboardData) => void,
    interval: number = 30000
  ): Promise<NodeJS.Timeout> {
    // Initial call
    const initialData = await this.getLiveDashboard();
    callback(initialData.data);

    // Set up polling
    const intervalId = setInterval(async () => {
      try {
        const data = await this.getLiveDashboard();
        callback(data.data);
      } catch (error) {
        console.error("Error in live update:", error);
      }
    }, interval);

    return intervalId;
  }

  async getChartsData(): Promise<{
    salesTrend: SalesTrendData;
    topProducts: TopSellingProductsData;
    salesByCategory: SalesByCategoryData;
    hourlyPattern: HourlySalesPatternData;
  }> {
    try {
      const [salesTrend, topProducts, salesByCategory, hourlyPattern] = await Promise.all([
        this.getSalesTrend(),
        this.getTopSellingProducts({ limit: 10 }),
        this.getSalesByCategory(),
        this.getHourlySalesPattern({ days: 7 })
      ]);

      return {
        salesTrend: salesTrend.data,
        topProducts: topProducts.data,
        salesByCategory: salesByCategory.data,
        hourlyPattern: hourlyPattern.data
      };
    } catch (error: any) {
      throw new Error(`Failed to get charts data: ${error.message}`);
    }
  }

  async getAlertsSummary(): Promise<{
    stockAlerts: Array<any>;
    systemAlerts: Array<any>;
    performanceAlerts: Array<any>;
  }> {
    try {
      const [lowStockAlerts, liveDashboard] = await Promise.all([
        this.getLowStockAlerts(),
        this.getLiveDashboard()
      ]);

      return {
        stockAlerts: lowStockAlerts.data.alerts,
        systemAlerts: liveDashboard.data.alerts,
        performanceAlerts: [] // Can be populated based on business logic
      };
    } catch (error) {
      console.error("Error getting alerts summary:", error);
      return {
        stockAlerts: [],
        systemAlerts: [],
        performanceAlerts: []
      };
    }
  }

  async exportDashboardData(format: 'json' | 'csv' = 'json'): Promise<{
    data: any;
    format: string;
    timestamp: string;
  }> {
    try {
      const dashboardData = await this.refreshAllData();
      
      if (format === 'csv') {
        // Convert to CSV format (simplified example)
        const csvData = this.convertToCSV(dashboardData);
        return {
          data: csvData,
          format: 'csv',
          timestamp: new Date().toISOString()
        };
      }

      return {
        data: dashboardData,
        format: 'json',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Failed to export dashboard data: ${error.message}`);
    }
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion (you can enhance this based on your needs)
    const replacer = (key: string, value: any) => value === null ? '' : value;
    const header = Object.keys(data);
    const csv = [
      header.join(','),
      ...Object.values(data).map((row: any) => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    ].join('\r\n');

    return csv;
  }

  // Event listeners (if your dashboard supports events)
  onDashboardUpdate(callback: (data: LiveDashboardData) => void) {
    if (window.backendAPI && (window.backendAPI as any).onDashboardUpdate) {
      (window.backendAPI as any).onDashboardUpdate(callback);
    } else {
      // Fallback to polling
      console.warn("Dashboard update events not available, using polling instead");
      this.subscribeToLiveUpdates(callback);
    }
  }

  onStockAlert(callback: (alert: any) => void) {
    if (window.backendAPI && (window.backendAPI as any).onStockAlert) {
      (window.backendAPI as any).onStockAlert(callback);
    }
  }

  onSalesUpdate(callback: (sale: any) => void) {
    if (window.backendAPI && (window.backendAPI as any).onSalesUpdate) {
      (window.backendAPI as any).onSalesUpdate(callback);
    }
  }
}

const dashboardAPI = new DashboardAPI();

export default dashboardAPI;