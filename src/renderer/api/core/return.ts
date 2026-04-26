// src/renderer/api/return.ts
// Similar structure to audit.ts – API client for Return/Refund module

// ----------------------------------------------------------------------
// 📦 Types & Interfaces (mirror backend entities)
// ----------------------------------------------------------------------

export interface ReturnRefundItem {
  id: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  reason?: string | null;
  createdAt: string; // ISO date
  product: ProductSummary; // product details
}

export interface ReturnRefund {
  id: number;
  referenceNo: string;
  reason?: string | null;
  refundMethod: string; // 'Cash', 'Card', 'Store Credit'
  totalAmount: number;
  status: 'pending' | 'processed' | 'cancelled';
  createdAt: string; // ISO date
  updatedAt?: string | null;
  sale: SaleSummary;
  customer: CustomerSummary;
  items: ReturnRefundItem[];
}

// Minimal versions for nested relations
export interface ProductSummary {
  id: number;
  name: string;
  sku: string;
  price: number;
}

export interface SaleSummary {
  id: number;
  timestamp: string;
  totalAmount: number;
}

export interface CustomerSummary {
  id: number;
  name: string;
  contactInfo?: string;
  loyaltyPointsBalance?: number;
}

// ----------------------------------------------------------------------
// 📨 Request/Response Interfaces
// ----------------------------------------------------------------------

// Standard paginated list response
export interface PaginatedReturns {
  items: ReturnRefund[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReturnsResponse {
  status: boolean;
  message: string;
  data: PaginatedReturns;
}

export interface ReturnResponse {
  status: boolean;
  message: string;
  data: ReturnRefund;
}

export interface ReturnItemsResponse {
  status: boolean;
  message: string;
  data: ReturnRefundItem[];
}

export interface ReturnStatistics {
  statusCounts: Array<{ status: string; count: number }>;
  totalProcessedAmount: number;
  averageProcessedAmount: number;
  topCustomers: Array<{
    customerId: number;
    customerName: string;
    returnCount: number;
    totalRefunded: number;
  }>;
}

export interface ReturnStatisticsResponse {
  status: boolean;
  message: string;
  data: ReturnStatistics;
}

export interface ExportResult {
  filePath: string;
  format: string;
  entryCount: number;
}

export interface ExportReturnsResponse {
  status: boolean;
  message: string;
  data: ExportResult;
}

export interface BulkCreateResponse {
  status: boolean;
  message: string;
  data: ReturnRefund[]; // created returns
}

// ----------------------------------------------------------------------
// 🧠 ReturnAPI Class
// ----------------------------------------------------------------------

class ReturnAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all returns with optional filtering, sorting, and pagination.
   * @param params - Query parameters
   */
  async getAll(params?: {
    status?: string;
    saleId?: number;
    customerId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
  }): Promise<ReturnsResponse> {
    try {
      if (!window.backendAPI?.returnRefund) {
        throw new Error('Electron API (returnRefund) not available');
      }
      const response = await window.backendAPI.returnRefund({
        method: 'getAllReturns',
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || 'Failed to fetch returns');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch returns');
    }
  }

  /**
   * Get a single return by ID.
   * @param id - Return ID
   */
  async getById(id: number): Promise<ReturnResponse> {
    try {
      if (!window.backendAPI?.returnRefund) {
        throw new Error('Electron API (returnRefund) not available');
      }
      const response = await window.backendAPI.returnRefund({
        method: 'getReturnById',
        params: { id },
      });
      if (response.status) return response;
      throw new Error(response.message || 'Failed to fetch return');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch return');
    }
  }

  /**
   * Get returns filtered by status.
   * @param status - Return status
   * @param page - Page number
   * @param limit - Items per page
   */
  async getByStatus(
    status: string,
    page?: number,
    limit?: number
  ): Promise<ReturnsResponse> {
    try {
      if (!window.backendAPI?.returnRefund) {
        throw new Error('Electron API (returnRefund) not available');
      }
      const response = await window.backendAPI.returnRefund({
        method: 'getReturnsByStatus',
        params: { status, page, limit },
      });
      if (response.status) return response;
      throw new Error(response.message || 'Failed to fetch returns by status');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch returns by status');
    }
  }

  /**
   * Get returns for a specific customer.
   * @param customerId - Customer ID
   * @param page - Page number
   * @param limit - Items per page
   */
  async getByCustomer(
    customerId: number,
    page?: number,
    limit?: number
  ): Promise<ReturnsResponse> {
    try {
      if (!window.backendAPI?.returnRefund) {
        throw new Error('Electron API (returnRefund) not available');
      }
      const response = await window.backendAPI.returnRefund({
        method: 'getReturnsByCustomer',
        params: { customerId, page, limit },
      });
      if (response.status) return response;
      throw new Error(response.message || 'Failed to fetch returns by customer');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch returns by customer');
    }
  }

  /**
   * Get returns for a specific sale.
   * @param saleId - Sale ID
   * @param page - Page number
   * @param limit - Items per page
   */
  async getBySale(
    saleId: number,
    page?: number,
    limit?: number
  ): Promise<ReturnsResponse> {
    try {
      if (!window.backendAPI?.returnRefund) {
        throw new Error('Electron API (returnRefund) not available');
      }
      const response = await window.backendAPI.returnRefund({
        method: 'getReturnsBySale',
        params: { saleId, page, limit },
      });
      if (response.status) return response;
      throw new Error(response.message || 'Failed to fetch returns by sale');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch returns by sale');
    }
  }

  /**
   * Get returns within a date range.
   * @param startDate - ISO date string (e.g., '2025-01-01')
   * @param endDate - ISO date string (defaults to now)
   * @param page - Page number
   * @param limit - Items per page
   */
  async getByDateRange(
    startDate: string,
    endDate?: string,
    page?: number,
    limit?: number
  ): Promise<ReturnsResponse> {
    try {
      if (!window.backendAPI?.returnRefund) {
        throw new Error('Electron API (returnRefund) not available');
      }
      const response = await window.backendAPI.returnRefund({
        method: 'getReturnsByDate',
        params: { startDate, endDate, page, limit },
      });
      if (response.status) return response;
      throw new Error(response.message || 'Failed to fetch returns by date');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch returns by date');
    }
  }

  /**
   * Get aggregated statistics about returns.
   */
  async getStatistics(): Promise<ReturnStatisticsResponse> {
    try {
      if (!window.backendAPI?.returnRefund) {
        throw new Error('Electron API (returnRefund) not available');
      }
      const response = await window.backendAPI.returnRefund({
        method: 'getReturnStatistics',
        params: {},
      });
      if (response.status) return response;
      throw new Error(response.message || 'Failed to fetch return statistics');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch return statistics');
    }
  }

  /**
   * Get items belonging to a specific return.
   * @param returnId - Return ID
   */
  async getItems(returnId: number): Promise<ReturnItemsResponse> {
    try {
      if (!window.backendAPI?.returnRefund) {
        throw new Error('Electron API (returnRefund) not available');
      }
      const response = await window.backendAPI.returnRefund({
        method: 'getReturnItems',
        params: { returnId },
      });
      if (response.status) return response;
      throw new Error(response.message || 'Failed to fetch return items');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch return items');
    }
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS
  // --------------------------------------------------------------------

  /**
   * Create a new return/refund.
   * @param data - Return creation data
   * @param user - Username (optional, defaults to 'system')
   */
  async create(
    data: {
      referenceNo: string;
      saleId: number;
      customerId: number;
      reason?: string;
      refundMethod: string;
      status?: string;
      items: Array<{
        productId: number;
        quantity: number;
        unitPrice: number;
        reason?: string;
      }>;
    },
    user?: string
  ): Promise<ReturnResponse> {
    try {
      if (!window.backendAPI?.returnRefund) {
        throw new Error('Electron API (returnRefund) not available');
      }
      const response = await window.backendAPI.returnRefund({
        method: 'createReturn',
        params: { ...data, user },
      });
      if (response.status) return response;
      throw new Error(response.message || 'Failed to create return');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create return');
    }
  }

  /**
   * Update an existing return (only allowed if status is pending).
   * @param id - Return ID
   * @param updates - Fields to update
   * @param user - Username
   */
  async update(
    id: number,
    updates: {
      referenceNo?: string;
      saleId?: number;
      customerId?: number;
      reason?: string;
      refundMethod?: string;
      status?: string;
      items?: Array<{
        productId: number;
        quantity: number;
        unitPrice: number;
        reason?: string;
      }>;
    },
    user?: string
  ): Promise<ReturnResponse> {
    try {
      if (!window.backendAPI?.returnRefund) {
        throw new Error('Electron API (returnRefund) not available');
      }
      const response = await window.backendAPI.returnRefund({
        method: 'updateReturn',
        params: { id, updates, user },
      });
      if (response.status) return response;
      throw new Error(response.message || 'Failed to update return');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update return');
    }
  }

  /**
   * Soft‑delete a return (set status to 'cancelled').
   * @param id - Return ID
   * @param user - Username
   */
  async delete(id: number, user?: string): Promise<ReturnResponse> {
    try {
      if (!window.backendAPI?.returnRefund) {
        throw new Error('Electron API (returnRefund) not available');
      }
      const response = await window.backendAPI.returnRefund({
        method: 'deleteReturn',
        params: { id, user },
      });
      if (response.status) return response;
      throw new Error(response.message || 'Failed to delete return');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete return');
    }
  }

  /**
   * Update only the status of a return.
   * @param id - Return ID
   * @param status - New status ('pending', 'processed', 'cancelled')
   * @param user - Username
   */
  async updateStatus(
    id: number,
    status: string,
    user?: string
  ): Promise<ReturnResponse> {
    try {
      if (!window.backendAPI?.returnRefund) {
        throw new Error('Electron API (returnRefund) not available');
      }
      const response = await window.backendAPI.returnRefund({
        method: 'updateReturnStatus',
        params: { id, status, user },
      });
      if (response.status) return response;
      throw new Error(response.message || 'Failed to update return status');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update return status');
    }
  }

  /**
   * Bulk create multiple returns.
   * @param returns - Array of return creation objects
   * @param user - Username
   */
  async bulkCreate(
    returns: Array<{
      referenceNo: string;
      saleId: number;
      customerId: number;
      reason?: string;
      refundMethod: string;
      status?: string;
      items: Array<{
        productId: number;
        quantity: number;
        unitPrice: number;
        reason?: string;
      }>;
    }>,
    user?: string
  ): Promise<BulkCreateResponse> {
    try {
      if (!window.backendAPI?.returnRefund) {
        throw new Error('Electron API (returnRefund) not available');
      }
      const response = await window.backendAPI.returnRefund({
        method: 'bulkCreateReturns',
        params: { returns, user },
      });
      if (response.status) return response;
      throw new Error(response.message || 'Failed to bulk create returns');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to bulk create returns');
    }
  }

  // --------------------------------------------------------------------
  // 📁 EXPORT METHODS
  // --------------------------------------------------------------------

  /**
   * Export filtered returns to CSV file.
   * @param filters - Same filters as getAll()
   * @param user - Username
   */
  async exportCSV(
    filters?: {
      status?: string;
      saleId?: number;
      customerId?: number;
      startDate?: string;
      endDate?: string;
      search?: string;
    },
    user?: string
  ): Promise<ExportReturnsResponse> {
    try {
      if (!window.backendAPI?.returnRefund) {
        throw new Error('Electron API (returnRefund) not available');
      }
      const response = await window.backendAPI.returnRefund({
        method: 'exportReturnsToCSV',
        params: { filters, user },
      });
      if (response.status) return response;
      throw new Error(response.message || 'Failed to export returns to CSV');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to export returns to CSV');
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if a specific sale has any returns.
   * @param saleId - Sale ID
   */
  async hasReturnsForSale(saleId: number): Promise<boolean> {
    try {
      const response = await this.getBySale(saleId, 1, 1);
      return response.data.total > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get total refund amount for a customer (processed returns only).
   * @param customerId - Customer ID
   */
  async getTotalRefundedByCustomer(customerId: number): Promise<number> {
    try {
      const response = await this.getAll({
        customerId,
        status: 'processed',
        limit: 1000, // reasonable limit; could be extended
      });
      return response.data.items.reduce((sum, ret) => sum + ret.totalAmount, 0);
    } catch {
      return 0;
    }
  }

  /**
   * Validate if the backend API is available.
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.returnRefund);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const returnAPI = new ReturnAPI();
export default returnAPI;