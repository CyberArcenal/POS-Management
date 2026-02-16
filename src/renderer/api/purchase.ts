// src/renderer/api/purchaseAPI.ts
// Similar structure to audit.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces (based on backend entities)
// ----------------------------------------------------------------------

export interface Supplier {
  id: number;
  name: string;
  contactInfo?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string | null;
  price: number | string; // decimal from DB can be string
  stockQty: number;
  reorderLevel: number;
  reorderQty: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
  category?: any; // simplified, can be expanded
  supplier?: Supplier;
}

export interface PurchaseItem {
  id: number;
  quantity: number;
  unitPrice: number | string;
  subtotal: number | string;
  createdAt: string;
  product: Product;
}

export interface Purchase {
  id: number;
  referenceNo?: string;
  orderDate: string;
  status: 'pending' | 'completed' | 'cancelled';
  totalAmount: number | string;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  supplier: Supplier;
  purchaseItems?: PurchaseItem[];
}

export interface PaginatedPurchases {
  items: Purchase[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PurchaseStatistics {
  statusCounts: Array<{ status: string; count: string | number }>;
  totalCompletedAmount: number;
  averageCompletedAmount: number;
  topSuppliers: Array<{
    supplierId: number;
    supplierName: string;
    purchaseCount: string | number;
    totalSpent: string | number;
  }>;
}

export interface ExportResult {
  format: 'csv' | 'json';
  data: string; // CSV content or JSON string
  filename: string;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface PurchasesResponse {
  status: boolean;
  message: string;
  data: Purchase[]; // for findAll without pagination? but our findAll returns array, not paginated object.
  // In the service, findAll returns array. So we'll keep that.
  // If we want pagination metadata, we might need to adjust backend. For now, we use array.
}

export interface PurchaseResponse {
  status: boolean;
  message: string;
  data: Purchase;
}

export interface PurchaseItemsResponse {
  status: boolean;
  message: string;
  data: PurchaseItem[];
}

export interface PurchaseStatisticsResponse {
  status: boolean;
  message: string;
  data: PurchaseStatistics;
}

export interface ExportPurchasesResponse {
  status: boolean;
  message: string;
  data: ExportResult;
}

export interface BulkCreateResponse {
  status: boolean;
  message: string;
  data: {
    created: Purchase[];
    errors: Array<{ data: any; error: string }>;
  };
}

// ----------------------------------------------------------------------
// 🧠 PurchaseAPI Class
// ----------------------------------------------------------------------

class PurchaseAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all purchases with optional filtering and pagination
   * @param params.page - Page number (1-based)
   * @param params.limit - Items per page
   * @param params.status - Filter by status
   * @param params.supplierId - Filter by supplier ID
   * @param params.startDate - Start date (ISO string)
   * @param params.endDate - End date (ISO string)
   * @param params.search - Search by reference number
   * @param params.sortBy - Sort field (default: 'orderDate')
   * @param params.sortOrder - Sort order ('ASC' or 'DESC')
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    supplierId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<PurchasesResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error('Electron API (purchase) not available');
      }

      const response = await window.backendAPI.purchase({
        method: 'getAllPurchases',
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to fetch purchases');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch purchases');
    }
  }

  /**
   * Get a single purchase by ID
   * @param id - Purchase ID
   */
  async getById(id: number): Promise<PurchaseResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error('Electron API (purchase) not available');
      }

      const response = await window.backendAPI.purchase({
        method: 'getPurchaseById',
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to fetch purchase');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch purchase');
    }
  }

  /**
   * Get purchases filtered by status
   * @param params.status - Purchase status
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getByStatus(params: {
    status: string;
    page?: number;
    limit?: number;
  }): Promise<PurchasesResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error('Electron API (purchase) not available');
      }

      const response = await window.backendAPI.purchase({
        method: 'getPurchasesByStatus',
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to fetch purchases by status');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch purchases by status');
    }
  }

  /**
   * Get purchases by supplier ID
   * @param params.supplierId - Supplier ID
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getBySupplier(params: {
    supplierId: number;
    page?: number;
    limit?: number;
  }): Promise<PurchasesResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error('Electron API (purchase) not available');
      }

      const response = await window.backendAPI.purchase({
        method: 'getPurchasesBySupplier',
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to fetch purchases by supplier');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch purchases by supplier');
    }
  }

  /**
   * Get purchases within a date range
   * @param params.startDate - Start date (ISO string)
   * @param params.endDate - End date (ISO string)
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getByDateRange(params: {
    startDate: string;
    endDate: string;
    page?: number;
    limit?: number;
  }): Promise<PurchasesResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error('Electron API (purchase) not available');
      }

      const response = await window.backendAPI.purchase({
        method: 'getPurchasesByDate',
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to fetch purchases by date');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch purchases by date');
    }
  }

  /**
   * Get purchase statistics
   */
  async getStatistics(): Promise<PurchaseStatisticsResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error('Electron API (purchase) not available');
      }

      const response = await window.backendAPI.purchase({
        method: 'getPurchaseStatistics',
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to fetch purchase statistics');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch purchase statistics');
    }
  }

  /**
   * Get items of a specific purchase
   * @param purchaseId - Purchase ID
   */
  async getItems(purchaseId: number): Promise<PurchaseItemsResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error('Electron API (purchase) not available');
      }

      const response = await window.backendAPI.purchase({
        method: 'getPurchaseItems',
        params: { purchaseId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to fetch purchase items');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch purchase items');
    }
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE METHODS
  // --------------------------------------------------------------------

  /**
   * Create a new purchase
   * @param purchaseData - Purchase data (referenceNo, supplierId, items, etc.)
   * @param user - User performing the action (default 'system')
   */
  async create(purchaseData: any, user: string = 'system'): Promise<PurchaseResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error('Electron API (purchase) not available');
      }

      const response = await window.backendAPI.purchase({
        method: 'createPurchase',
        params: { purchaseData, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to create purchase');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create purchase');
    }
  }

  /**
   * Update an existing purchase
   * @param id - Purchase ID
   * @param updateData - Fields to update
   * @param user - User performing the action
   */
  async update(id: number, updateData: any, user: string = 'system'): Promise<PurchaseResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error('Electron API (purchase) not available');
      }

      const response = await window.backendAPI.purchase({
        method: 'updatePurchase',
        params: { id, updateData, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to update purchase');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update purchase');
    }
  }

  /**
   * Soft delete a purchase (set status to cancelled)
   * @param id - Purchase ID
   * @param user - User performing the action
   */
  async delete(id: number, user: string = 'system'): Promise<PurchaseResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error('Electron API (purchase) not available');
      }

      const response = await window.backendAPI.purchase({
        method: 'deletePurchase',
        params: { id, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to delete purchase');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete purchase');
    }
  }

  /**
   * Update only the status of a purchase
   * @param id - Purchase ID
   * @param status - New status (pending, completed, cancelled)
   * @param user - User performing the action
   */
  async updateStatus(id: number, status: string, user: string = 'system'): Promise<PurchaseResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error('Electron API (purchase) not available');
      }

      const response = await window.backendAPI.purchase({
        method: 'updatePurchaseStatus',
        params: { id, status, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to update purchase status');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update purchase status');
    }
  }

  // --------------------------------------------------------------------
  // 🔄 BATCH OPERATIONS
  // --------------------------------------------------------------------

  /**
   * Create multiple purchases in bulk
   * @param purchases - Array of purchase data objects
   * @param user - User performing the action
   */
  async bulkCreate(purchases: any[], user: string = 'system'): Promise<BulkCreateResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error('Electron API (purchase) not available');
      }

      const response = await window.backendAPI.purchase({
        method: 'bulkCreatePurchases',
        params: { purchases, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to bulk create purchases');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to bulk create purchases');
    }
  }

  // --------------------------------------------------------------------
  // 📁 EXPORT METHODS
  // --------------------------------------------------------------------

  /**
   * Export purchases to CSV
   * @param filters - Same filters as getAll (status, supplierId, date range, etc.)
   * @param user - User performing the action
   */
  async exportCSV(filters?: any, user: string = 'system'): Promise<ExportPurchasesResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error('Electron API (purchase) not available');
      }

      const response = await window.backendAPI.purchase({
        method: 'exportPurchasesToCSV',
        params: { filters, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || 'Failed to export purchases');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to export purchases');
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if a purchase exists
   * @param id - Purchase ID
   */
  async exists(id: number): Promise<boolean> {
    try {
      const response = await this.getById(id);
      return response.status;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate if the backend API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.purchase);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const purchaseAPI = new PurchaseAPI();
export default purchaseAPI;