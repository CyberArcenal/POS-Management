// src/renderer/api/customerInsights.ts
// Similar structure to audit.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface CustomerProfile {
  id: number;
  name: string;
  contactInfo: string;
  loyaltyPointsBalance: number;
  createdAt: string;
  updatedAt: string;
  // optional relations
  sales?: any[];
  loyaltyTransactions?: any[];
}

export interface CustomerWithStats extends CustomerProfile {
  stats: {
    totalSpent: number;
    totalPointsEarned: number;
    totalPointsRedeemed: number;
    lastPurchaseDate: string | null;
  };
}

export interface CustomerSummary {
  totalCustomers: number;
  activeCustomers: number;
  averageLoyaltyPoints: number;
  totalLoyaltyPoints: number;
  newCustomersThisMonth: number;
}

export interface CustomerSegmentation {
  highValue: number;
  mediumValue: number;
  lowValue: number;
  inactive: number;
  thresholds: {
    high: number;
    low: number;
  };
}

export interface TopCustomerSpending {
  customerId: number;
  customerName: string;
  purchaseCount: string | number;
  totalSpent: string | number;
}

export interface TopCustomerLoyalty {
  customerId: number;
  customerName: string;
  points: number;
}

export interface PurchaseHistoryEntry {
  // based on Sale entity
  id: number;
  timestamp: string;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  notes?: string;
  saleItems?: any[];
}

export interface LoyaltyHistoryEntry {
  id: number;
  pointsChange: number;
  reason: string;
  timestamp: string;
  sale?: any;
}

export interface ReturnHistoryEntry {
  id: number;
  referenceNo: string;
  createdAt: string;
  reason: string;
  refundMethod: string;
  totalAmount: number;
  status: string;
}

export interface PaginatedCustomers {
  items: CustomerProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedPurchases {
  data: PurchaseHistoryEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedLoyalty {
  data: LoyaltyHistoryEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedReturns {
  data: ReturnHistoryEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface ExportResult {
  data: any[];
  format: string; // 'csv'
}

export interface CustomerInsightsReport {
  summary: CustomerSummary;
  topSpenders: TopCustomerSpending[];
  topLoyalty: TopCustomerLoyalty[];
  segmentation: CustomerSegmentation;
  recentCustomers: CustomerProfile[];
  generatedAt: string;
  filters: any;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface CustomerSummaryResponse {
  status: boolean;
  message: string;
  data: CustomerSummary;
}

export interface CustomerProfilesResponse {
  status: boolean;
  message: string;
  data: CustomerProfile[];
  total: number;
  page: number;
  limit: number;
}

export interface CustomerResponse {
  status: boolean;
  message: string;
  data: CustomerWithStats | CustomerProfile; // getById includes stats, getByContactInfo may not
}

export interface TopCustomersResponse {
  status: boolean;
  message: string;
  data: TopCustomerSpending[] | TopCustomerLoyalty[];
}

export interface SegmentationResponse {
  status: boolean;
  message: string;
  data: CustomerSegmentation;
}

export interface PurchaseHistoryResponse {
  status: boolean;
  message: string;
  data: PurchaseHistoryEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface LoyaltyHistoryResponse {
  status: boolean;
  message: string;
  data: LoyaltyHistoryEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface ReturnHistoryResponse {
  status: boolean;
  message: string;
  data: ReturnHistoryEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface ExportCustomersResponse {
  status: boolean;
  message: string;
  data: ExportResult;
}

export interface GenerateReportResponse {
  status: boolean;
  message: string;
  data: CustomerInsightsReport;
}

// ----------------------------------------------------------------------
// 🧠 CustomerInsightsAPI Class
// ----------------------------------------------------------------------

class CustomerInsightsAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get high-level customer summary
   */
  async getSummary(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<CustomerSummaryResponse> {
    try {
      if (!window.backendAPI?.customerInsights) {
        throw new Error("Electron API (customerInsights) not available");
      }
      const response = await window.backendAPI.customerInsights({
        method: "getCustomerSummary",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch customer summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch customer summary");
    }
  }

  /**
   * Get paginated list of customer profiles
   * @param params.page - Page number (1-based)
   * @param params.limit - Items per page
   * @param params.searchTerm - Optional search term
   * @param params.minPoints - Filter by minimum loyalty points
   * @param params.maxPoints - Filter by maximum loyalty points
   * @param params.hasLoyaltyPoints - Filter by having points > 0
   * @param params.createdAfter - ISO date string
   * @param params.createdBefore - ISO date string
   */
  async getProfiles(params?: {
    page?: number;
    limit?: number;
    searchTerm?: string;
    minPoints?: number;
    maxPoints?: number;
    hasLoyaltyPoints?: boolean;
    createdAfter?: string;
    createdBefore?: string;
  }): Promise<CustomerProfilesResponse> {
    try {
      if (!window.backendAPI?.customerInsights) {
        throw new Error("Electron API (customerInsights) not available");
      }
      const response = await window.backendAPI.customerInsights({
        method: "getCustomerProfiles",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch customer profiles");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch customer profiles");
    }
  }

  /**
   * Get a single customer by ID, including statistics
   * @param id - Customer ID
   */
  async getById(id: number): Promise<CustomerResponse> {
    try {
      if (!window.backendAPI?.customerInsights) {
        throw new Error("Electron API (customerInsights) not available");
      }
      const response = await window.backendAPI.customerInsights({
        method: "getCustomerById",
        params: { id },
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch customer");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch customer");
    }
  }

  /**
   * Find a customer by contact information (email/phone)
   * @param contactInfo - Email or phone number
   */
  async getByContactInfo(contactInfo: string): Promise<CustomerResponse> {
    try {
      if (!window.backendAPI?.customerInsights) {
        throw new Error("Electron API (customerInsights) not available");
      }
      const response = await window.backendAPI.customerInsights({
        method: "getCustomerByContactInfo",
        params: { contactInfo },
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch customer by contact");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch customer by contact");
    }
  }

  /**
   * Get top customers by total spending
   * @param params.limit - Number of customers (default 10)
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async getTopBySpending(params?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<TopCustomersResponse> {
    try {
      if (!window.backendAPI?.customerInsights) {
        throw new Error("Electron API (customerInsights) not available");
      }
      const response = await window.backendAPI.customerInsights({
        method: "getTopCustomersBySpending",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch top spenders");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch top spenders");
    }
  }

  /**
   * Get top customers by loyalty points balance
   * @param params.limit - Number of customers (default 10)
   */
  async getTopByLoyaltyPoints(params?: { limit?: number }): Promise<TopCustomersResponse> {
    try {
      if (!window.backendAPI?.customerInsights) {
        throw new Error("Electron API (customerInsights) not available");
      }
      const response = await window.backendAPI.customerInsights({
        method: "getTopCustomersByLoyaltyPoints",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch top loyalty customers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch top loyalty customers");
    }
  }

  /**
   * Get customer segmentation (high/medium/low/inactive)
   */
  async getSegmentation(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<SegmentationResponse> {
    try {
      if (!window.backendAPI?.customerInsights) {
        throw new Error("Electron API (customerInsights) not available");
      }
      const response = await window.backendAPI.customerInsights({
        method: "getCustomerSegmentation",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch customer segmentation");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch customer segmentation");
    }
  }

  /**
   * Get purchase history for a specific customer
   * @param params.customerId - Customer ID
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getPurchaseHistory(params: {
    customerId: number;
    page?: number;
    limit?: number;
  }): Promise<PurchaseHistoryResponse> {
    try {
      if (!window.backendAPI?.customerInsights) {
        throw new Error("Electron API (customerInsights) not available");
      }
      const response = await window.backendAPI.customerInsights({
        method: "getCustomerPurchaseHistory",
        params,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch purchase history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch purchase history");
    }
  }

  /**
   * Get loyalty transaction history for a specific customer
   * @param params.customerId - Customer ID
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getLoyaltyHistory(params: {
    customerId: number;
    page?: number;
    limit?: number;
  }): Promise<LoyaltyHistoryResponse> {
    try {
      if (!window.backendAPI?.customerInsights) {
        throw new Error("Electron API (customerInsights) not available");
      }
      const response = await window.backendAPI.customerInsights({
        method: "getCustomerLoyaltyHistory",
        params,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch loyalty history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch loyalty history");
    }
  }

  /**
   * Get return/refund history for a specific customer
   * @param params.customerId - Customer ID
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getReturnHistory(params: {
    customerId: number;
    page?: number;
    limit?: number;
  }): Promise<ReturnHistoryResponse> {
    try {
      if (!window.backendAPI?.customerInsights) {
        throw new Error("Electron API (customerInsights) not available");
      }
      const response = await window.backendAPI.customerInsights({
        method: "getCustomerReturnHistory",
        params,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch return history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch return history");
    }
  }

  // --------------------------------------------------------------------
  // 📁 EXPORT & REPORT METHODS
  // --------------------------------------------------------------------

  /**
   * Export customers to CSV format (returns data array ready for CSV conversion)
   * @param params - Same filters as getProfiles()
   */
  async exportCSV(params?: {
    searchTerm?: string;
    minPoints?: number;
    maxPoints?: number;
    hasLoyaltyPoints?: boolean;
    createdAfter?: string;
    createdBefore?: string;
  }): Promise<ExportCustomersResponse> {
    try {
      if (!window.backendAPI?.customerInsights) {
        throw new Error("Electron API (customerInsights) not available");
      }
      const response = await window.backendAPI.customerInsights({
        method: "exportCustomers",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to export customers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export customers");
    }
  }

  /**
   * Generate a comprehensive customer insights report
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async generateReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<GenerateReportResponse> {
    try {
      if (!window.backendAPI?.customerInsights) {
        throw new Error("Electron API (customerInsights) not available");
      }
      const response = await window.backendAPI.customerInsights({
        method: "generateCustomerInsightsReport",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to generate report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate report");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if a customer exists by ID
   */
  async exists(id: number): Promise<boolean> {
    try {
      const response = await this.getById(id);
      return response.status;
    } catch {
      return false;
    }
  }

  /**
   * Validate if the backend API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.customerInsights);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const customerInsightsAPI = new CustomerInsightsAPI();
export default customerInsightsAPI;