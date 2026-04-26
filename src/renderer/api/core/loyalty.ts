// src/renderer/api/loyalty.ts
// Loyalty API – aligned with backend IPC handlers (loyalty channel)

// ----------------------------------------------------------------------
// 📦 Types & Interfaces (based on backend entity and service)
// ----------------------------------------------------------------------

export interface Customer {
  id: number;
  name: string;
  contactInfo?: string | null;
  loyaltyPointsBalance: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface Sale {
  id: number;
  timestamp: string;
  status: 'initiated' | 'paid' | 'refunded' | 'voided';
  paymentMethod: 'cash' | 'card' | 'wallet';
  totalAmount: number;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface LoyaltyTransaction {
  id: number;
  pointsChange: number;        // positive = earned, negative = redeemed
  timestamp: string;           // ISO datetime
  notes?: string | null;
  updatedAt?: string | null;

  // Relations (may be partially populated)
  customer?: Customer | null;
  sale?: Sale | null;

  // Foreign keys (may be present if relations not loaded)
  customerId?: number;
  saleId?: number | null;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface LoyaltyTransactionsResponse {
  status: boolean;
  message: string;
  data: LoyaltyTransaction[];        // Array of transactions
}

export interface LoyaltyTransactionResponse {
  status: boolean;
  message: string;
  data: LoyaltyTransaction;           // Single transaction
}

export interface LoyaltyStatisticsResponse {
  status: boolean;
  message: string;
  data: {
    totalEarned: number;
    totalRedeemed: number;
    netPoints: number;
    transactionCounts: {
      earn: number;
      redeem: number;
    };
    topCustomers: Array<{
      customerId: number;
      transactionCount: number;
      netPoints: number;
    }>;
    monthlyTrends: Array<{
      month: string;                  // e.g., '2025-02'
      count: number;
      earned: number;
      redeemed: number;
    }>;
  };
}

export interface CustomerLoyaltySummaryResponse {
  status: boolean;
  message: string;
  data: {
    customer: Pick<Customer, 'id' | 'name' | 'loyaltyPointsBalance'>;
    summary: {
      earnedThisMonth: number;
      redeemedThisMonth: number;
    };
    recentTransactions: LoyaltyTransaction[];
  };
}

export interface BulkCreateResponse {
  status: boolean;
  message: string;
  data: LoyaltyTransaction[] | {
    successful: LoyaltyTransaction[];
    errors: Array<{ index: number; error: string }>;
  };
}

export interface ExportCSVResponse {
  status: boolean;
  message: string;
  data: {
    format: 'csv';
    data: string;                      // CSV content as string
    filename: string;                   // Suggested filename
  };
}

export interface GenerateReportResponse {
  status: boolean;
  message: string;
  data: {
    statistics: LoyaltyStatisticsResponse['data'];
    filteredTransactions?: LoyaltyTransaction[] | null;
    reportGeneratedAt: string;
    params: any;
  };
}

export interface PointsHistoryResponse {
  status: boolean;
  message: string;
  data: {
    customerId: number;
    history: Array<{
      id: number;
      date: string;
      pointsChange: number;
      runningBalance: number;
      notes?: string | null;
      saleId?: number | null;
    }>;
    currentBalance: number;
  };
}

export interface DeleteResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
  };
}

// ----------------------------------------------------------------------
// 🧠 LoyaltyAPI Class
// ----------------------------------------------------------------------

class LoyaltyAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all loyalty transactions with optional filtering and pagination.
   * @param params - Filters: page, limit, sortBy, sortOrder, customerId, saleId, startDate, endDate, type ('earn'|'redeem'), search
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    customerId?: number;
    saleId?: number;
    startDate?: string;
    endDate?: string;
    type?: 'earn' | 'redeem';
    search?: string;
  }): Promise<LoyaltyTransactionsResponse> {
    try {
      if (!window.backendAPI?.loyalty) {
        throw new Error("Electron API (loyalty) not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "getAllLoyaltyTransactions",
        params: params || {},
      });

      if (response.status) {
        return response as LoyaltyTransactionsResponse;
      }
      throw new Error(response.message || "Failed to fetch loyalty transactions");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch loyalty transactions");
    }
  }

  /**
   * Get a single loyalty transaction by ID.
   * @param id - Transaction ID
   */
  async getById(id: number): Promise<LoyaltyTransactionResponse> {
    try {
      if (!window.backendAPI?.loyalty) {
        throw new Error("Electron API (loyalty) not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "getLoyaltyTransactionById",
        params: { id },
      });

      if (response.status) {
        return response as LoyaltyTransactionResponse;
      }
      throw new Error(response.message || "Failed to fetch loyalty transaction");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch loyalty transaction");
    }
  }

  /**
   * Get loyalty transactions for a specific customer.
   * @param params - customerId, page, limit
   */
  async getByCustomer(params: {
    customerId: number;
    page?: number;
    limit?: number;
  }): Promise<LoyaltyTransactionsResponse> {
    try {
      if (!window.backendAPI?.loyalty) {
        throw new Error("Electron API (loyalty) not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "getLoyaltyTransactionsByCustomer",
        params,
      });

      if (response.status) {
        return response as LoyaltyTransactionsResponse;
      }
      throw new Error(response.message || "Failed to fetch transactions for customer");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch transactions for customer");
    }
  }

  /**
   * Get loyalty transactions linked to a specific sale.
   * @param saleId - Sale ID
   */
  async getBySale(saleId: number): Promise<LoyaltyTransactionsResponse> {
    try {
      if (!window.backendAPI?.loyalty) {
        throw new Error("Electron API (loyalty) not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "getLoyaltyTransactionsBySale",
        params: { saleId },
      });

      if (response.status) {
        return response as LoyaltyTransactionsResponse;
      }
      throw new Error(response.message || "Failed to fetch transactions for sale");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch transactions for sale");
    }
  }

  /**
   * Get loyalty statistics (totals, trends, top customers).
   */
  async getStatistics(): Promise<LoyaltyStatisticsResponse> {
    try {
      if (!window.backendAPI?.loyalty) {
        throw new Error("Electron API (loyalty) not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "getLoyaltyStatistics",
        params: {},
      });

      if (response.status) {
        return response as LoyaltyStatisticsResponse;
      }
      throw new Error(response.message || "Failed to fetch loyalty statistics");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch loyalty statistics");
    }
  }

  /**
   * Search loyalty transactions with flexible criteria.
   * @param params - query, customerId, saleId, startDate, endDate, minPoints, maxPoints, page, limit
   */
  async search(params: {
    query?: string;
    customerId?: number;
    saleId?: number;
    startDate?: string;
    endDate?: string;
    minPoints?: number;
    maxPoints?: number;
    page?: number;
    limit?: number;
  }): Promise<LoyaltyTransactionsResponse & { data: { transactions: LoyaltyTransaction[]; total: number; page: number; limit: number } }> {
    try {
      if (!window.backendAPI?.loyalty) {
        throw new Error("Electron API (loyalty) not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "searchLoyaltyTransactions",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search loyalty transactions");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search loyalty transactions");
    }
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATION METHODS
  // --------------------------------------------------------------------

  /**
   * Create a manual loyalty transaction (adjustment).
   * @param params - customerId, pointsChange (positive for earn, negative for redeem), notes, saleId (optional), user (default 'system')
   */
  async create(params: {
    customerId: number;
    pointsChange: number;
    notes?: string;
    saleId?: number;
    user?: string;
  }): Promise<LoyaltyTransactionResponse> {
    try {
      if (!window.backendAPI?.loyalty) {
        throw new Error("Electron API (loyalty) not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "createLoyaltyTransaction",
        params,
      });

      if (response.status) {
        return response as LoyaltyTransactionResponse;
      }
      throw new Error(response.message || "Failed to create loyalty transaction");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create loyalty transaction");
    }
  }

  /**
   * Reverse a previous loyalty transaction.
   * @param params - transactionId, reason (optional), user (default 'system')
   */
  async reverse(params: {
    transactionId: number;
    reason?: string;
    user?: string;
  }): Promise<LoyaltyTransactionResponse & { data: { original: LoyaltyTransaction; reversal: LoyaltyTransaction } }> {
    try {
      if (!window.backendAPI?.loyalty) {
        throw new Error("Electron API (loyalty) not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "reverseLoyaltyTransaction",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to reverse loyalty transaction");
    } catch (error: any) {
      throw new Error(error.message || "Failed to reverse loyalty transaction");
    }
  }

  // --------------------------------------------------------------------
  // 📊 CUSTOMER LOYALTY METHODS
  // --------------------------------------------------------------------

  /**
   * Get loyalty summary for a specific customer.
   * @param customerId - Customer ID
   */
  async getCustomerSummary(customerId: number): Promise<CustomerLoyaltySummaryResponse> {
    try {
      if (!window.backendAPI?.loyalty) {
        throw new Error("Electron API (loyalty) not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "getCustomerLoyaltySummary",
        params: { customerId },
      });

      if (response.status) {
        return response as CustomerLoyaltySummaryResponse;
      }
      throw new Error(response.message || "Failed to fetch customer loyalty summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch customer loyalty summary");
    }
  }

  /**
   * Add loyalty points to a customer.
   * @param params - customerId, points (positive), notes, saleId (optional), user (default 'system')
   */
  async addPoints(params: {
    customerId: number;
    points: number;
    notes?: string;
    saleId?: number;
    user?: string;
  }): Promise<LoyaltyTransactionResponse> {
    try {
      if (!window.backendAPI?.loyalty) {
        throw new Error("Electron API (loyalty) not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "addLoyaltyPoints",
        params,
      });

      if (response.status) {
        return response as LoyaltyTransactionResponse;
      }
      throw new Error(response.message || "Failed to add loyalty points");
    } catch (error: any) {
      throw new Error(error.message || "Failed to add loyalty points");
    }
  }

  /**
   * Redeem loyalty points from a customer.
   * @param params - customerId, points (positive), notes, saleId (optional), user (default 'system')
   */
  async redeemPoints(params: {
    customerId: number;
    points: number;
    notes?: string;
    saleId?: number;
    user?: string;
  }): Promise<LoyaltyTransactionResponse> {
    try {
      if (!window.backendAPI?.loyalty) {
        throw new Error("Electron API (loyalty) not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "redeemLoyaltyPoints",
        params,
      });

      if (response.status) {
        return response as LoyaltyTransactionResponse;
      }
      throw new Error(response.message || "Failed to redeem loyalty points");
    } catch (error: any) {
      throw new Error(error.message || "Failed to redeem loyalty points");
    }
  }

  // --------------------------------------------------------------------
  // 🔄 BATCH OPERATIONS
  // --------------------------------------------------------------------

  /**
   * Bulk create multiple loyalty transactions.
   * @param params - transactions array, user (default 'system')
   */
  async bulkCreate(params: {
    transactions: Array<{
      customerId: number;
      pointsChange: number;
      notes?: string;
      saleId?: number;
    }>;
    user?: string;
  }): Promise<BulkCreateResponse> {
    try {
      if (!window.backendAPI?.loyalty) {
        throw new Error("Electron API (loyalty) not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "bulkCreateLoyaltyTransactions",
        params,
      });

      if (response.status) {
        return response as BulkCreateResponse;
      }
      throw new Error(response.message || "Failed to bulk create loyalty transactions");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk create loyalty transactions");
    }
  }

  /**
   * Export loyalty transactions to CSV.
   * @param filters - Same filters as getAll (except pagination)
   */
  async exportCSV(filters?: {
    customerId?: number;
    saleId?: number;
    startDate?: string;
    endDate?: string;
    type?: 'earn' | 'redeem';
    search?: string;
  }): Promise<ExportCSVResponse> {
    try {
      if (!window.backendAPI?.loyalty) {
        throw new Error("Electron API (loyalty) not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "exportLoyaltyTransactionsToCSV",
        params: { filters },
      });

      if (response.status) {
        return response as ExportCSVResponse;
      }
      throw new Error(response.message || "Failed to export loyalty transactions to CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export loyalty transactions to CSV");
    }
  }

  // --------------------------------------------------------------------
  // 📄 REPORT METHODS
  // --------------------------------------------------------------------

  /**
   * Generate a loyalty report (summary and optionally filtered transactions).
   * @param params - startDate, endDate, groupBy ('day'|'week'|'month'), user
   */
  async generateReport(params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
    user?: string;
  }): Promise<GenerateReportResponse> {
    try {
      if (!window.backendAPI?.loyalty) {
        throw new Error("Electron API (loyalty) not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "generateLoyaltyReport",
        params: params || {},
      });

      if (response.status) {
        return response as GenerateReportResponse;
      }
      throw new Error(response.message || "Failed to generate loyalty report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate loyalty report");
    }
  }

  /**
   * Generate points history with running balance for a customer.
   * @param params - customerId, startDate, endDate
   */
  async generatePointsHistory(params: {
    customerId: number;
    startDate?: string;
    endDate?: string;
  }): Promise<PointsHistoryResponse> {
    try {
      if (!window.backendAPI?.loyalty) {
        throw new Error("Electron API (loyalty) not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "generatePointsHistory",
        params,
      });

      if (response.status) {
        return response as PointsHistoryResponse;
      }
      throw new Error(response.message || "Failed to generate points history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate points history");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if the backend API is available.
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.loyalty);
  }

  /**
   * Quick check if a customer has any loyalty transactions.
   * @param customerId - Customer ID
   */
  async customerHasTransactions(customerId: number): Promise<boolean> {
    try {
      const response = await this.getByCustomer({ customerId, limit: 1 });
      return (response.data?.length ?? 0) > 0;
    } catch (error) {
      console.error("Error checking customer transactions:", error);
      return false;
    }
  }

  /**
   * Calculate total points earned by a customer.
   * @param customerId - Customer ID
   */
  async getTotalEarnedByCustomer(customerId: number): Promise<number> {
    try {
      const transactions = await this.getByCustomer({ customerId });
      return transactions.data
        .filter(tx => tx.pointsChange > 0)
        .reduce((sum, tx) => sum + tx.pointsChange, 0);
    } catch (error) {
      console.error("Error calculating total earned points:", error);
      return 0;
    }
  }

  /**
   * Calculate total points redeemed by a customer.
   * @param customerId - Customer ID
   */
  async getTotalRedeemedByCustomer(customerId: number): Promise<number> {
    try {
      const transactions = await this.getByCustomer({ customerId });
      return transactions.data
        .filter(tx => tx.pointsChange < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.pointsChange), 0);
    } catch (error) {
      console.error("Error calculating total redeemed points:", error);
      return 0;
    }
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const loyaltyAPI = new LoyaltyAPI();
export default loyaltyAPI;