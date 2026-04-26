// src/renderer/api/customer.ts
// Customer API – aligned with backend IPC handlers (customer channel)

// ----------------------------------------------------------------------
// 📦 Types & Interfaces (based on backend entity and service)
// ----------------------------------------------------------------------

export interface Customer {
  id: number;
  name: string;
  contactInfo: string | null;
  email: string | null;
  phone: string | null;
  status: "regular" | "vip" | "elite";
  loyaltyPointsBalance: number;
  lifetimePointsEarned: number;
  createdAt: string; // ISO date string
  updatedAt: string | null;
}

export interface LoyaltyTransaction {
  id: number;
  pointsChange: number; // positive = earned, negative = redeemed
  timestamp: string;
  notes: string | null;
  customerId: number;
  saleId: number | null;
  // Optionally include related objects if needed
  customer?: Customer;
  sale?: any; // Simplified, can be extended
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface CustomerResponse {
  status: boolean;
  message: string;
  data: Customer; // Single customer
}

export interface CustomersResponse {
  status: boolean;
  message: string;
  data: Customer[]; // Array of customers
}

export interface LoyaltyTransactionResponse {
  status: boolean;
  message: string;
  data: LoyaltyTransaction; // Single transaction
}

export interface LoyaltyTransactionsResponse {
  status: boolean;
  message: string;
  data: LoyaltyTransaction[];
}

export interface LoyaltyAdjustmentResponse {
  status: boolean;
  message: string;
  data: {
    customer: Customer;
    transaction: LoyaltyTransaction;
  };
}

export interface BulkOperationResponse {
  status: boolean;
  message: string;
  data: {
    created?: Customer[];
    updated?: Customer[];
    errors?: Array<{ index?: number; id?: number; error: string }>;
  };
}

export interface ImportCSVResponse {
  status: boolean;
  message: string;
  data: {
    created: Customer[];
    errors: Array<{ row: number; error: string }>;
  };
}

export interface ExportCSVResponse {
  status: boolean;
  message: string;
  data: {
    format: "csv";
    data: string; // CSV content
    filename: string;
  };
}

export interface StatisticsResponse {
  status: boolean;
  message: string;
  data: {
    totalCustomers: number;
    customersWithLoyaltyPoints: number;
    averageLoyaltyPoints: number;
    topCustomers: Array<{ id: number; name: string; points: number }>;
    activeCustomers: number;
  };
}

export interface ReportResponse {
  status: boolean;
  message: string;
  data: any; // Flexible report structure (see generateCustomerReport / generateLoyaltyReport)
}

export interface DeleteResponse {
  status: boolean;
  message: string;
  data: null; // Deletion not supported, but kept for consistency
}

// ----------------------------------------------------------------------
// 🧠 CustomerAPI Class
// ----------------------------------------------------------------------

class CustomerAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all customers with optional filtering and pagination.
   * @param params - Filters: search, minPoints, maxPoints, sortBy, sortOrder, page, limit
   */
  async getAll(params?: {
    search?: string;
    minPoints?: number;
    maxPoints?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    page?: number;
    limit?: number;
  }): Promise<CustomersResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "getAllCustomers",
        params: params || {},
      });

      if (response.status) {
        return response as CustomersResponse;
      }
      throw new Error(response.message || "Failed to fetch customers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch customers");
    }
  }

  /**
   * Get a single customer by ID.
   * @param id - Customer ID
   */
  async getById(id: number): Promise<CustomerResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "getCustomerById",
        params: { id },
      });

      if (response.status) {
        return response as CustomerResponse;
      }
      throw new Error(response.message || "Failed to fetch customer");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch customer");
    }
  }

  /**
   * Find customer by contact info (email/phone).
   * @param contact - Contact info to search
   */
  async getByContact(contact: string): Promise<CustomerResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "getCustomerByContact",
        params: { contact },
      });

      if (response.status) {
        return response as CustomerResponse;
      }
      throw new Error(
        response.message || "Customer not found with that contact",
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch customer by contact");
    }
  }

  /**
   * Get total spent for multiple customers (batch).
   * @param customerIds - Array of customer IDs
   */
  async getTotalSpentForCustomers(
    customerIds: number[],
  ): Promise<Record<number, number>> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "getTotalSpentForCustomers",
        params: { customerIds },
      });

      if (response.status) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch total spent");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch total spent");
    }
  }

  /**
   * Find customers by name (partial match).
   * @param name - Name to search
   * @param limit - Max results (optional)
   */
  async getByName(name: string, limit?: number): Promise<CustomersResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "getCustomersByName",
        params: { name, limit },
      });

      if (response.status) {
        return response as CustomersResponse;
      }
      throw new Error(response.message || "Failed to search customers by name");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search customers by name");
    }
  }

  /**
   * Get active customers (those with at least one sale).
   * @param limit - Max results (optional)
   */
  async getActive(limit?: number): Promise<CustomersResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "getActiveCustomers",
        params: { limit },
      });

      if (response.status) {
        return response as CustomersResponse;
      }
      throw new Error(response.message || "Failed to fetch active customers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch active customers");
    }
  }

  /**
   * Get loyalty details for a customer (just points balance).
   * @param id - Customer ID
   */
  async getLoyalty(id: number): Promise<CustomerResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "getCustomerLoyalty",
        params: { id },
      });

      if (response.status) {
        return response as CustomerResponse;
      }
      throw new Error(response.message || "Failed to fetch loyalty info");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch loyalty info");
    }
  }

  /**
   * Get customer statistics (totals, averages, top customers).
   */
  async getStatistics(): Promise<StatisticsResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "getCustomerStatistics",
        params: {},
      });

      if (response.status) {
        return response as StatisticsResponse;
      }
      throw new Error(response.message || "Failed to fetch statistics");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch statistics");
    }
  }

  /**
   * Search customers by name or contact (wrapper for getAll with search).
   * @param query - Search term
   * @param limit - Max results (optional)
   */
  async search(query: string, limit?: number): Promise<CustomersResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "searchCustomers",
        params: { query, limit },
      });

      if (response.status) {
        return response as CustomersResponse;
      }
      throw new Error(response.message || "Failed to search customers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search customers");
    }
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATION METHODS
  // --------------------------------------------------------------------

  /**
   * Create a new customer.
   * @param data - Customer data (name required, contactInfo and loyaltyPointsBalance optional)
   * @param userId - User performing action (default 'system')
   */
  async create(
    data: {
      name: string;
      contactInfo?: string;
      loyaltyPointsBalance?: number;
      email?: string;
      phone?: string;
    },
    userId: string = "system",
  ): Promise<CustomerResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "createCustomer",
        params: data,
        user: userId,
      });

      if (response.status) {
        return response as CustomerResponse;
      }
      throw new Error(response.message || "Failed to create customer");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create customer");
    }
  }

  /**
   * Update an existing customer.
   * @param id - Customer ID
   * @param data - Fields to update (name, contactInfo, loyaltyPointsBalance)
   * @param userId - User performing action (default 'system')
   */
  async update(
    id: number,
    data: Partial<{
      name: string;
      contactInfo: string;
      loyaltyPointsBalance: number;
      email: string;
      phone: string;
    }>,
    userId: string = "system",
  ): Promise<CustomerResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "updateCustomer",
        params: { id, ...data },
        user: userId,
      });

      if (response.status) {
        return response as CustomerResponse;
      }
      throw new Error(response.message || "Failed to update customer");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update customer");
    }
  }

  /**
   * Delete a customer (not allowed – always returns error).
   * Kept for interface completeness.
   */
  async delete(id: number, userId: string = "system"): Promise<DeleteResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "deleteCustomer",
        params: { id },
        user: userId,
      });

      return response as DeleteResponse; // status will be false
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete customer");
    }
  }

  /**
   * Directly set loyalty points (use with caution; prefer add/redeem).
   * @param id - Customer ID
   * @param points - New points balance
   * @param notes - Reason for change (optional)
   * @param userId - User performing action (default 'system')
   */
  async updateLoyaltyPoints(
    id: number,
    points: number,
    notes?: string,
    userId: string = "system",
  ): Promise<CustomerResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "updateLoyaltyPoints",
        params: { id, points, notes },
        user: userId,
      });

      if (response.status) {
        return response as CustomerResponse;
      }
      throw new Error(response.message || "Failed to update loyalty points");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update loyalty points");
    }
  }

  // --------------------------------------------------------------------
  // 📊 LOYALTY & TRANSACTION METHODS
  // --------------------------------------------------------------------

  /**
   * Get loyalty transaction history for a customer.
   * @param id - Customer ID
   * @param options - Pagination/sorting
   */
  async getLoyaltyTransactions(
    id: number,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
    },
  ): Promise<LoyaltyTransactionsResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "getLoyaltyTransactions",
        params: { id, ...options },
      });

      if (response.status) {
        return response as LoyaltyTransactionsResponse;
      }
      throw new Error(
        response.message || "Failed to fetch loyalty transactions",
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch loyalty transactions");
    }
  }

  /**
   * Add loyalty points to a customer.
   * @param id - Customer ID
   * @param points - Positive number of points to add
   * @param notes - Reason (optional)
   * @param saleId - Associated sale ID (optional)
   * @param userId - User performing action (default 'system')
   */
  async addLoyaltyPoints(
    id: number,
    points: number,
    notes?: string,
    saleId?: number,
    userId: string = "system",
  ): Promise<LoyaltyAdjustmentResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "addLoyaltyPoints",
        params: { id, points, notes, saleId },
        user: userId,
      });

      if (response.status) {
        return response as LoyaltyAdjustmentResponse;
      }
      throw new Error(response.message || "Failed to add loyalty points");
    } catch (error: any) {
      throw new Error(error.message || "Failed to add loyalty points");
    }
  }

  /**
   * Redeem loyalty points from a customer.
   * @param id - Customer ID
   * @param points - Positive number of points to redeem
   * @param notes - Reason (optional)
   * @param saleId - Associated sale ID (optional)
   * @param userId - User performing action (default 'system')
   */
  async redeemLoyaltyPoints(
    id: number,
    points: number,
    notes?: string,
    saleId?: number,
    userId: string = "system",
  ): Promise<LoyaltyAdjustmentResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "redeemLoyaltyPoints",
        params: { id, points, notes, saleId },
        user: userId,
      });

      if (response.status) {
        return response as LoyaltyAdjustmentResponse;
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
   * Bulk create customers.
   * @param customers - Array of customer data (each must have name)
   * @param userId - User performing action (default 'system')
   */
  async bulkCreate(
    customers: Array<{
      name: string;
      contactInfo?: string;
      loyaltyPointsBalance?: number;
    }>,
    userId: string = "system",
  ): Promise<BulkOperationResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "bulkCreateCustomers",
        params: { customers },
        user: userId,
      });

      if (response.status) {
        return response as BulkOperationResponse;
      }
      throw new Error(response.message || "Failed to bulk create customers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk create customers");
    }
  }

  /**
   * Bulk update customers.
   * @param updates - Array of updates (each must have id and at least one field)
   * @param userId - User performing action (default 'system')
   */
  async bulkUpdate(
    updates: Array<{
      id: number;
      name?: string;
      contactInfo?: string;
      loyaltyPointsBalance?: number;
    }>,
    userId: string = "system",
  ): Promise<BulkOperationResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "bulkUpdateCustomers",
        params: { updates },
        user: userId,
      });

      if (response.status) {
        return response as BulkOperationResponse;
      }
      throw new Error(response.message || "Failed to bulk update customers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk update customers");
    }
  }

  /**
   * Import customers from a CSV file.
   * @param filePath - Full path to CSV file
   * @param userId - User performing action (default 'system')
   */
  async importFromCSV(
    filePath: string,
    userId: string = "system",
  ): Promise<ImportCSVResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "importCustomersFromCSV",
        params: { filePath },
        user: userId,
      });

      if (response.status) {
        return response as ImportCSVResponse;
      }
      throw new Error(
        response.message || "Failed to import customers from CSV",
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to import customers from CSV");
    }
  }

  /**
   * Export customers to CSV.
   * @param filters - Same filters as getAll
   * @param userId - User performing action (default 'system')
   */
  async exportToCSV(
    filters?: { search?: string; minPoints?: number; maxPoints?: number },
    userId: string = "system",
  ): Promise<ExportCSVResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "exportCustomersToCSV",
        params: { filters },
        user: userId,
      });

      if (response.status) {
        return response as ExportCSVResponse;
      }
      throw new Error(response.message || "Failed to export customers to CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export customers to CSV");
    }
  }

  // --------------------------------------------------------------------
  // 📄 REPORT METHODS
  // --------------------------------------------------------------------

  /**
   * Generate a comprehensive customer report.
   * @param options - Date range filters (optional)
   * @param userId - User performing action (default 'system')
   */
  async generateReport(
    options?: { startDate?: string; endDate?: string },
    userId: string = "system",
  ): Promise<ReportResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "generateCustomerReport",
        params: options || {},
        user: userId,
      });

      if (response.status) {
        return response as ReportResponse;
      }
      throw new Error(response.message || "Failed to generate customer report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate customer report");
    }
  }

  /**
   * Generate loyalty-specific report.
   * @param options - Date range filters (optional)
   * @param userId - User performing action (default 'system')
   */
  async generateLoyaltyReport(
    options?: { startDate?: string; endDate?: string },
    userId: string = "system",
  ): Promise<ReportResponse> {
    try {
      if (!window.backendAPI?.customer) {
        throw new Error("Electron API (customer) not available");
      }

      const response = await window.backendAPI.customer({
        method: "generateLoyaltyReport",
        params: options || {},
        user: userId,
      });

      if (response.status) {
        return response as ReportResponse;
      }
      throw new Error(response.message || "Failed to generate loyalty report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate loyalty report");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if the backend API is available.
   */
  async isAvailable(): Promise<boolean> {
    return !!window.backendAPI?.customer;
  }

  /**
   * Quick check if a customer exists (by ID).
   * @param id - Customer ID
   */
  async exists(id: number): Promise<boolean> {
    try {
      const response = await this.getById(id);
      return response.status && !!response.data;
    } catch {
      return false;
    }
  }

  /**
   * Get total count of customers (using statistics).
   */
  async getTotalCount(): Promise<number> {
    try {
      const stats = await this.getStatistics();
      return stats.data.totalCustomers;
    } catch {
      return 0;
    }
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const customerAPI = new CustomerAPI();
export default customerAPI;
