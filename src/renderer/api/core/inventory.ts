// src/renderer/api/inventory.ts
// Inventory API – aligned with backend IPC handlers (inventory channel)

// ----------------------------------------------------------------------
// 📦 Types & Interfaces (based on backend entities)
// ----------------------------------------------------------------------

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  price: number | string;      // decimal from DB may be string
  stockQty: number;
  isActive: boolean;
  createdAt: string;           // ISO datetime
  updatedAt: string | null;
}

export interface Sale {
  id: number;
  timestamp: string;
  status: "initiated" | "paid" | "refunded" | "voided";
  paymentMethod: "cash" | "card" | "wallet";
  totalAmount: number | string;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
  customerId?: number | null;
}

export interface InventoryMovement {
  id: number;
  movementType: "sale" | "refund" | "adjustment";
  qtyChange: number;           // positive or negative
  timestamp: string;
  notes: string | null;
  updatedAt: string | null;

  // relations (may be populated)
  product?: Product | null;
  sale?: Sale | null;
  productId?: number;
  saleId?: number | null;
}

export interface StockAlert {
  id: number;
  name: string;
  sku: string;
  stockQty: number;
  price: number | string;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface InventoryMovementsResponse {
  status: boolean;
  message: string;
  data: InventoryMovement[];
}

export interface InventoryMovementResponse {
  status: boolean;
  message: string;
  data: InventoryMovement;
}

export interface InventoryStatisticsResponse {
  status: boolean;
  message: string;
  data: {
    byType: Array<{ type: string; totalChange: number; count: number }>;
    totals: { totalIncrease: number; totalDecrease: number };
    topProducts: Array<{ productId: number; netChange: number; movementCount: number }>;
    monthlyTrends: Array<{ month: string; count: number; totalIncrease: number; totalDecrease: number }>;
  };
}

export interface StockAlertsResponse {
  status: boolean;
  message: string;
  data: Product[];
}

export interface BulkCreateResponse {
  status: boolean;
  message: string;
  data: {
    created: InventoryMovement[];
    errors: string[];
  };
}

export interface ExportCSVResponse {
  status: boolean;
  message: string;
  data: {
    csv: string;               // CSV content as string
    filename: string;
  };
}

export interface InventoryReportResponse {
  status: boolean;
  message: string;
  data: {
    generatedAt: string;
    dateRange?: { startDate?: string; endDate?: string };
    productSummary: Array<{ id: number; name: string; sku: string; currentStock: number; price: number | string }>;
    movementSummary: { totalMovements: number; byType: Record<string, { count: number; totalChange: number }> };
    topProducts: Array<{ count: number; netChange: number; name: string }>;
    recentMovements: InventoryMovement[];
  };
}

export interface StockValuationResponse {
  status: boolean;
  message: string;
  data: {
    totalValue: number;
    currency: string;
    details: Array<{ id: number; name: string; sku: string; stockQty: number; price: number | string; value: number }>;
  };
}

export interface DeleteResponse {
  status: boolean;
  message: string;
  data: { id: number };
}

// ----------------------------------------------------------------------
// 🧠 InventoryAPI Class
// ----------------------------------------------------------------------

class InventoryAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all inventory movements with optional filtering and pagination.
   * @param params - Filters: page, limit, sortBy, sortOrder, productId, saleId, movementType, movementTypes, startDate, endDate, direction, search
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    productId?: number;
    saleId?: number;
    movementType?: string;
    movementTypes?: string[];
    startDate?: string;
    endDate?: string;
    direction?: "increase" | "decrease";
    search?: string;
  }): Promise<InventoryMovementsResponse> {
    try {
      if (!window.backendAPI?.inventory) {
        throw new Error("Electron API (inventory) not available");
      }

      const response = await window.backendAPI.inventory({
        method: "getAllInventoryMovements",
        params: params || {},
      });

      if (response.status) {
        return response as InventoryMovementsResponse;
      }
      throw new Error(response.message || "Failed to fetch inventory movements");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch inventory movements");
    }
  }

  /**
   * Get a single inventory movement by ID.
   * @param id - Movement ID
   */
  async getById(id: number): Promise<InventoryMovementResponse> {
    try {
      if (!window.backendAPI?.inventory) {
        throw new Error("Electron API (inventory) not available");
      }

      const response = await window.backendAPI.inventory({
        method: "getInventoryMovementById",
        params: { id },
      });

      if (response.status) {
        return response as InventoryMovementResponse;
      }
      throw new Error(response.message || "Failed to fetch inventory movement");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch inventory movement");
    }
  }

  /**
   * Get inventory movements for a specific product.
   * @param productId - Product ID
   */
  async getByProduct(productId: number): Promise<InventoryMovementsResponse> {
    try {
      if (!window.backendAPI?.inventory) {
        throw new Error("Electron API (inventory) not available");
      }

      const response = await window.backendAPI.inventory({
        method: "getInventoryMovementsByProduct",
        params: { productId },
      });

      if (response.status) {
        return response as InventoryMovementsResponse;
      }
      throw new Error(response.message || "Failed to fetch product movements");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch product movements");
    }
  }

  /**
   * Get inventory movements associated with a sale.
   * @param saleId - Sale ID
   */
  async getBySale(saleId: number): Promise<InventoryMovementsResponse> {
    try {
      if (!window.backendAPI?.inventory) {
        throw new Error("Electron API (inventory) not available");
      }

      const response = await window.backendAPI.inventory({
        method: "getInventoryMovementsBySale",
        params: { saleId },
      });

      if (response.status) {
        return response as InventoryMovementsResponse;
      }
      throw new Error(response.message || "Failed to fetch sale movements");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch sale movements");
    }
  }

  /**
   * Get inventory movements filtered by movement type.
   * @param movementType - "sale" | "refund" | "adjustment"
   */
  async getByType(movementType: string): Promise<InventoryMovementsResponse> {
    try {
      if (!window.backendAPI?.inventory) {
        throw new Error("Electron API (inventory) not available");
      }

      const response = await window.backendAPI.inventory({
        method: "getInventoryMovementsByType",
        params: { movementType },
      });

      if (response.status) {
        return response as InventoryMovementsResponse;
      }
      throw new Error(response.message || "Failed to fetch movements by type");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch movements by type");
    }
  }

  /**
   * Get inventory movement statistics.
   */
  async getStatistics(): Promise<InventoryStatisticsResponse> {
    try {
      if (!window.backendAPI?.inventory) {
        throw new Error("Electron API (inventory) not available");
      }

      const response = await window.backendAPI.inventory({
        method: "getInventoryStatistics",
        params: {},
      });

      if (response.status) {
        return response as InventoryStatisticsResponse;
      }
      throw new Error(response.message || "Failed to fetch statistics");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch statistics");
    }
  }

  /**
   * Search inventory movements by keyword (notes) and optional filters.
   * @param params - keyword, limit
   */
  async search(params: { keyword: string; limit?: number }): Promise<InventoryMovementsResponse> {
    try {
      if (!window.backendAPI?.inventory) {
        throw new Error("Electron API (inventory) not available");
      }

      const response = await window.backendAPI.inventory({
        method: "searchInventoryMovements",
        params,
      });

      if (response.status) {
        return response as InventoryMovementsResponse;
      }
      throw new Error(response.message || "Search failed");
    } catch (error: any) {
      throw new Error(error.message || "Search failed");
    }
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATION METHODS
  // --------------------------------------------------------------------

  /**
   * Create a manual inventory adjustment.
   * @param data - Movement data (productId, qtyChange, movementType, notes?, saleId?)
   * @param user - Username (defaults to 'system')
   */
  async create(
    data: {
      productId: number;
      qtyChange: number;
      movementType: string;
      notes?: string;
      saleId?: number;
    },
    user: string = "system"
  ): Promise<InventoryMovementResponse> {
    try {
      if (!window.backendAPI?.inventory) {
        throw new Error("Electron API (inventory) not available");
      }

      const response = await window.backendAPI.inventory({
        method: "createInventoryMovement",
        params: { ...data, user },
      });

      if (response.status) {
        return response as InventoryMovementResponse;
      }
      throw new Error(response.message || "Failed to create inventory movement");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create inventory movement");
    }
  }

  /**
   * Update an existing inventory movement (notes and optionally qtyChange).
   * @param id - Movement ID
   * @param updates - Fields to update (notes, qtyChange)
   * @param user - Username (defaults to 'system')
   */
  async update(
    id: number,
    updates: { notes?: string; qtyChange?: number },
    user: string = "system"
  ): Promise<InventoryMovementResponse> {
    try {
      if (!window.backendAPI?.inventory) {
        throw new Error("Electron API (inventory) not available");
      }

      const response = await window.backendAPI.inventory({
        method: "updateInventoryMovement",
        params: { id, ...updates, user },
      });

      if (response.status) {
        return response as InventoryMovementResponse;
      }
      throw new Error(response.message || "Failed to update inventory movement");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update inventory movement");
    }
  }

  /**
   * Delete an inventory movement and revert its stock change.
   * @param id - Movement ID
   * @param user - Username (defaults to 'system')
   */
  async delete(id: number, user: string = "system"): Promise<DeleteResponse> {
    try {
      if (!window.backendAPI?.inventory) {
        throw new Error("Electron API (inventory) not available");
      }

      const response = await window.backendAPI.inventory({
        method: "deleteInventoryMovement",
        params: { id, user },
      });

      if (response.status) {
        return response as DeleteResponse;
      }
      throw new Error(response.message || "Failed to delete inventory movement");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete inventory movement");
    }
  }

  // --------------------------------------------------------------------
  // 📊 STOCK HISTORY & ALERTS
  // --------------------------------------------------------------------

  /**
   * Get stock change history for a specific product.
   * @param productId - Product ID
   * @param startDate - Optional start date (ISO)
   * @param endDate - Optional end date (ISO)
   */
  async getProductStockHistory(
    productId: number,
    startDate?: string,
    endDate?: string
  ): Promise<InventoryMovementsResponse> {
    try {
      if (!window.backendAPI?.inventory) {
        throw new Error("Electron API (inventory) not available");
      }

      const response = await window.backendAPI.inventory({
        method: "getProductStockHistory",
        params: { productId, startDate, endDate },
      });

      if (response.status) {
        return response as InventoryMovementsResponse;
      }
      throw new Error(response.message || "Failed to fetch stock history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch stock history");
    }
  }

  /**
   * Get products with low stock (below threshold).
   * @param threshold - Stock threshold (default 5)
   */
  async getStockAlerts(threshold: number = 5): Promise<StockAlertsResponse> {
    try {
      if (!window.backendAPI?.inventory) {
        throw new Error("Electron API (inventory) not available");
      }

      const response = await window.backendAPI.inventory({
        method: "getStockAlerts",
        params: { threshold },
      });

      if (response.status) {
        return response as StockAlertsResponse;
      }
      throw new Error(response.message || "Failed to fetch stock alerts");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch stock alerts");
    }
  }

  // --------------------------------------------------------------------
  // 🔄 BATCH OPERATIONS
  // --------------------------------------------------------------------

  /**
   * Create multiple inventory movements in one transaction.
   * @param movements - Array of movement data
   * @param user - Username (defaults to 'system')
   */
  async bulkCreate(
    movements: Array<{
      productId: number;
      qtyChange: number;
      movementType: string;
      notes?: string;
      saleId?: number;
    }>,
    user: string = "system"
  ): Promise<BulkCreateResponse> {
    try {
      if (!window.backendAPI?.inventory) {
        throw new Error("Electron API (inventory) not available");
      }

      const response = await window.backendAPI.inventory({
        method: "bulkCreateInventoryMovements",
        params: { movements, user },
      });

      if (response.status) {
        return response as BulkCreateResponse;
      }
      throw new Error(response.message || "Bulk create failed");
    } catch (error: any) {
      throw new Error(error.message || "Bulk create failed");
    }
  }

  /**
   * Export filtered inventory movements to CSV.
   * @param params - Same filters as getAll
   */
  async exportToCSV(params?: {
    productId?: number;
    saleId?: number;
    movementType?: string;
    movementTypes?: string[];
    startDate?: string;
    endDate?: string;
    direction?: "increase" | "decrease";
    search?: string;
  }): Promise<ExportCSVResponse> {
    try {
      if (!window.backendAPI?.inventory) {
        throw new Error("Electron API (inventory) not available");
      }

      const response = await window.backendAPI.inventory({
        method: "exportInventoryMovementsToCSV",
        params: params || {},
      });

      if (response.status) {
        return response as ExportCSVResponse;
      }
      throw new Error(response.message || "Export failed");
    } catch (error: any) {
      throw new Error(error.message || "Export failed");
    }
  }

  // --------------------------------------------------------------------
  // 📄 REPORT OPERATIONS
  // --------------------------------------------------------------------

  /**
   * Generate a comprehensive inventory report.
   * @param startDate - Optional start date (ISO)
   * @param endDate - Optional end date (ISO)
   */
  async generateReport(startDate?: string, endDate?: string): Promise<InventoryReportResponse> {
    try {
      if (!window.backendAPI?.inventory) {
        throw new Error("Electron API (inventory) not available");
      }

      const response = await window.backendAPI.inventory({
        method: "generateInventoryReport",
        params: { startDate, endDate },
      });

      if (response.status) {
        return response as InventoryReportResponse;
      }
      throw new Error(response.message || "Report generation failed");
    } catch (error: any) {
      throw new Error(error.message || "Report generation failed");
    }
  }

  /**
   * Calculate current stock valuation.
   * @param productIds - Optional array of product IDs to restrict
   */
  async generateStockValuation(productIds?: number[]): Promise<StockValuationResponse> {
    try {
      if (!window.backendAPI?.inventory) {
        throw new Error("Electron API (inventory) not available");
      }

      const response = await window.backendAPI.inventory({
        method: "generateStockValuationReport",
        params: { productIds },
      });

      if (response.status) {
        return response as StockValuationResponse;
      }
      throw new Error(response.message || "Stock valuation failed");
    } catch (error: any) {
      throw new Error(error.message || "Stock valuation failed");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if the backend inventory API is available.
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.inventory);
  }

  /**
   * Quick check if there are any movements for a given product.
   */
  async hasMovements(productId: number): Promise<boolean> {
    try {
      const response = await this.getByProduct(productId);
      return (response.data?.length ?? 0) > 0;
    } catch (error) {
      console.error("Error checking product movements:", error);
      return false;
    }
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const inventoryAPI = new InventoryAPI();
export default inventoryAPI;