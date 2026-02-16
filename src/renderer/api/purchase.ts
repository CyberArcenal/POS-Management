// src/renderer/api/purchaseAPI.ts
// Similar structure to audit.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces (mirror backend entities)
// ----------------------------------------------------------------------

export interface Purchase {
  id: number;
  referenceNo: string; // unique reference
  orderDate: string; // ISO date
  status: "pending" | "completed" | "cancelled";
  totalAmount: number; // decimal stored as number
  createdAt: string;
  updatedAt: string | null;

  // relations (may be populated or just IDs)
  supplierId?: number;
  supplier?: Supplier; // if eager loaded
  purchaseItems?: PurchaseItem[];
}

export interface PurchaseItem {
  id: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: string;

  purchaseId?: number;
  productId?: number;
  product?: Product; // if eager loaded
}

// Minimal Supplier type for relation
export interface Supplier {
  id: number;
  name: string;
  contactInfo?: string | null;
  address?: string | null;
  isActive: boolean;
}

// Minimal Product type
export interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
}

// ----------------------------------------------------------------------
// 📦 Pagination & Filter Types
// ----------------------------------------------------------------------

export interface PaginatedPurchases {
  items: Purchase[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedPurchaseItems {
  items: PurchaseItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PurchaseStatistics {
  totalPurchases: number;
  totalAmount: number;
  byStatus: { status: string; count: number; totalAmount: number }[];
  topSuppliers: {
    supplierId: number;
    supplierName: string;
    count: number;
    totalAmount: number;
  }[];
  averageOrderValue: number;
  pendingCount: number;
  completedCount: number;
  cancelledCount: number;
  dateRange?: { start: string; end: string } | null;
}

export interface PurchaseCounts {
  byStatus: { status: string; count: number }[];
  bySupplier: { supplierId: number; supplierName: string; count: number }[];
  byMonth: { month: string; count: number }[];
}

// ----------------------------------------------------------------------
// 📨 Request/Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface PurchaseResponse {
  status: boolean;
  message: string;
  data: Purchase;
}

export interface PurchasesResponse {
  status: boolean;
  message: string;
  data: PaginatedPurchases;
}

export interface PurchaseItemResponse {
  status: boolean;
  message: string;
  data: PurchaseItem;
}

export interface PurchaseItemsResponse {
  status: boolean;
  message: string;
  data: PaginatedPurchaseItems;
}

export interface PurchaseStatisticsResponse {
  status: boolean;
  message: string;
  data: PurchaseStatistics;
}

export interface PurchaseCountsResponse {
  status: boolean;
  message: string;
  data: PurchaseCounts;
}

export interface DeleteResponse {
  status: boolean;
  message: string;
  data: { success: boolean; id: number };
}

export interface ExportResult {
  filePath: string;
}

export interface ExportResponse {
  status: boolean;
  message: string;
  data: ExportResult;
}

export interface ReportResult {
  filePath: string;
  format: string;
  entryCount: number;
}

export interface ReportResponse {
  status: boolean;
  message: string;
  data: ReportResult;
}

// ----------------------------------------------------------------------
// 🧠 PurchaseAPI Class
// ----------------------------------------------------------------------

class PurchaseAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS (Purchases)
  // --------------------------------------------------------------------

  /**
   * Get all purchases with pagination, filtering, and sorting
   * @param params.page - Page number (1‑based)
   * @param params.limit - Items per page (default 20, max 100)
   * @param params.status - Filter by status
   * @param params.supplierId - Filter by supplier
   * @param params.search - Search by referenceNo or notes (if any)
   * @param params.startDate - ISO date string
   * @param params.endDate - ISO date string
   * @param params.sortBy - Field to sort by (e.g., 'orderDate', 'totalAmount')
   * @param params.sortOrder - 'ASC' or 'DESC'
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    supplierId?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<PurchasesResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error("Electron API (purchase) not available");
      }

      const response = await window.backendAPI.purchase({
        method: "getAllPurchases",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch purchases");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch purchases");
    }
  }

  /**
   * Get a single purchase by ID
   * @param id - Purchase ID
   */
  async getById(id: number): Promise<PurchaseResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error("Electron API (purchase) not available");
      }

      const response = await window.backendAPI.purchase({
        method: "getPurchaseById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch purchase");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch purchase");
    }
  }

  /**
   * Get purchases by supplier
   * @param supplierId - Supplier ID
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getBySupplier(
    supplierId: number,
    params?: { page?: number; limit?: number },
  ): Promise<PurchasesResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error("Electron API (purchase) not available");
      }

      const response = await window.backendAPI.purchase({
        method: "getPurchasesBySupplier",
        params: { supplierId, ...params },
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to fetch purchases by supplier",
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch purchases by supplier");
    }
  }

  /**
   * Get purchases by status
   * @param status - 'pending', 'completed', 'cancelled'
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getByStatus(
    status: string,
    params?: { page?: number; limit?: number },
  ): Promise<PurchasesResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error("Electron API (purchase) not available");
      }

      const response = await window.backendAPI.purchase({
        method: "getPurchasesByStatus",
        params: { status, ...params },
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to fetch purchases by status",
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch purchases by status");
    }
  }

  /**
   * Get purchases within a date range
   * @param startDate - ISO date string
   * @param endDate - ISO date string
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getByDateRange(
    startDate: string,
    endDate: string,
    params?: { page?: number; limit?: number },
  ): Promise<PurchasesResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error("Electron API (purchase) not available");
      }

      const response = await window.backendAPI.purchase({
        method: "getPurchasesByDateRange",
        params: { startDate, endDate, ...params },
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to fetch purchases by date range",
      );
    } catch (error: any) {
      throw new Error(
        error.message || "Failed to fetch purchases by date range",
      );
    }
  }

  /**
   * Search purchases with flexible filters
   * @param params - Supports searchTerm (referenceNo), status, supplierId, date range, pagination
   */
  async search(params: {
    searchTerm?: string;
    status?: string;
    supplierId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PurchasesResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error("Electron API (purchase) not available");
      }

      const response = await window.backendAPI.purchase({
        method: "searchPurchases",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search purchases");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search purchases");
    }
  }

  /**
   * Get purchase statistics
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async getStatistics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<PurchaseStatisticsResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error("Electron API (purchase) not available");
      }

      const response = await window.backendAPI.purchase({
        method: "getPurchaseStatistics",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to fetch purchase statistics",
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch purchase statistics");
    }
  }

  /**
   * Get aggregated counts grouped by status, supplier, month, etc.
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async getCounts(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<PurchaseCountsResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error("Electron API (purchase) not available");
      }

      const response = await window.backendAPI.purchase({
        method: "getPurchaseCounts",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch purchase counts");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch purchase counts");
    }
  }

  /**
   * Get recent purchases (latest orders)
   * @param limit - Number of entries (default 10, max 50)
   */
  async getRecentPurchases(limit?: number): Promise<PurchasesResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error("Electron API (purchase) not available");
      }

      const response = await window.backendAPI.purchase({
        method: "getRecentPurchases",
        params: { limit },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch recent purchases");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch recent purchases");
    }
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE METHODS (Purchases)
  // --------------------------------------------------------------------

  /**
   * Create a new purchase
   * @param data - Purchase data (supplierId, referenceNo?, orderDate?, status?, items? - items can be added later)
   */
  async create(data: {
    supplierId: number;
    referenceNo?: string;
    orderDate?: string; // defaults to now
    status?: "pending" | "completed" | "cancelled";
    items?: Omit<PurchaseItem, "id" | "purchaseId" | "createdAt">[];
  }): Promise<PurchaseResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error("Electron API (purchase) not available");
      }

      const response = await window.backendAPI.purchase({
        method: "createPurchase",
        params: data,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create purchase");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create purchase");
    }
  }

  /**
   * Update an existing purchase (e.g., change status, orderDate)
   * @param id - Purchase ID
   * @param data - Fields to update
   */
  async update(
    id: number,
    data: Partial<{
      referenceNo: string;
      orderDate: string;
      status: "pending" | "completed" | "cancelled";
      totalAmount: number;
    }>,
  ): Promise<PurchaseResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error("Electron API (purchase) not available");
      }

      const response = await window.backendAPI.purchase({
        method: "updatePurchase",
        params: { id, ...data },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update purchase");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update purchase");
    }
  }

  /**
   * Delete (or cancel) a purchase. Usually a soft delete or status change.
   * @param id - Purchase ID
   */
  async delete(id: number): Promise<DeleteResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error("Electron API (purchase) not available");
      }

      const response = await window.backendAPI.purchase({
        method: "deletePurchase",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete purchase");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete purchase");
    }
  }

  // --------------------------------------------------------------------
  // 📦 PURCHASE ITEMS METHODS
  // --------------------------------------------------------------------

  /**
   * Get all items for a specific purchase
   * @param purchaseId - Purchase ID
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getItems(
    purchaseId: number,
    params?: { page?: number; limit?: number },
  ): Promise<PurchaseItemsResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error("Electron API (purchase) not available");
      }

      const response = await window.backendAPI.purchase({
        method: "getPurchaseItems",
        params: { purchaseId, ...params },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch purchase items");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch purchase items");
    }
  }

  /**
   * Add an item to a purchase
   * @param purchaseId - Purchase ID
   * @param data - Item data (productId, quantity, unitPrice)
   */
  async addItem(
    purchaseId: number,
    data: {
      productId: number;
      quantity: number;
      unitPrice: number;
    },
  ): Promise<PurchaseItemResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error("Electron API (purchase) not available");
      }

      const response = await window.backendAPI.purchase({
        method: "addPurchaseItem",
        params: { purchaseId, ...data },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to add purchase item");
    } catch (error: any) {
      throw new Error(error.message || "Failed to add purchase item");
    }
  }

  /**
   * Update a purchase item (quantity, unitPrice)
   * @param itemId - PurchaseItem ID
   * @param data - Fields to update
   */
  async updateItem(
    itemId: number,
    data: Partial<{
      quantity: number;
      unitPrice: number;
    }>,
  ): Promise<PurchaseItemResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error("Electron API (purchase) not available");
      }

      const response = await window.backendAPI.purchase({
        method: "updatePurchaseItem",
        params: { itemId, ...data },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update purchase item");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update purchase item");
    }
  }

  /**
   * Remove an item from a purchase
   * @param itemId - PurchaseItem ID
   */
  async removeItem(itemId: number): Promise<DeleteResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error("Electron API (purchase) not available");
      }

      const response = await window.backendAPI.purchase({
        method: "removePurchaseItem",
        params: { itemId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to remove purchase item");
    } catch (error: any) {
      throw new Error(error.message || "Failed to remove purchase item");
    }
  }

  // --------------------------------------------------------------------
  // 📁 EXPORT & REPORT METHODS
  // --------------------------------------------------------------------

  /**
   * Export filtered purchases to CSV file
   * @param params - Same filters as search() (searchTerm, status, supplierId, date range)
   * @param params.limit - Max rows to export (default 5000, max 10000)
   */
  async exportCSV(params?: {
    searchTerm?: string;
    status?: string;
    supplierId?: number;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ExportResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error("Electron API (purchase) not available");
      }

      const response = await window.backendAPI.purchase({
        method: "exportPurchases",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export purchases");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export purchases");
    }
  }

  /**
   * Generate a comprehensive purchase report (JSON or HTML)
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   * @param params.format - 'json' or 'html' (default 'json')
   */
  async generateReport(params?: {
    startDate?: string;
    endDate?: string;
    format?: "json" | "html";
  }): Promise<ReportResponse> {
    try {
      if (!window.backendAPI?.purchase) {
        throw new Error("Electron API (purchase) not available");
      }

      const response = await window.backendAPI.purchase({
        method: "generatePurchaseReport",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to generate purchase report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate purchase report");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if the purchase API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!window.backendAPI?.purchase;
  }

  /**
   * Get the total number of purchases (optionally filtered)
   * @param params.status - Filter by status
   * @param params.supplierId - Filter by supplier
   */
  async getTotalCount(params?: {
    status?: string;
    supplierId?: number;
  }): Promise<number> {
    try {
      const response = await this.getAll({ ...params, limit: 1 });
      return response.data.total;
    } catch (error) {
      console.error("Error getting purchase count:", error);
      return 0;
    }
  }

  /**
   * Check if a specific purchase exists
   * @param id - Purchase ID
   */
  async exists(id: number): Promise<boolean> {
    try {
      const response = await this.getById(id);
      return response.status;
    } catch {
      return false;
    }
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const purchaseAPI = new PurchaseAPI();
export default purchaseAPI;
