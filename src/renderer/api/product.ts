// src/renderer/api/product.ts
// Product API – aligned with backend IPC handlers (product channel)

// ----------------------------------------------------------------------
// 📦 Types & Interfaces (based on backend entities and services)
// ----------------------------------------------------------------------

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  price: number;                // decimal stored as number
  stockQty: number;
  isActive: boolean;
  createdAt: string;            // ISO datetime
  updatedAt: string | null;
}

export interface InventoryMovement {
  id: number;
  movementType: 'sale' | 'refund' | 'adjustment';
  qtyChange: number;
  timestamp: string;
  notes: string | null;
  productId: number;
  saleId: number | null;
}

export interface ProductStatistics {
  totalActive: number;
  totalInactive: number;
  totalStockValue: number;
  averagePrice: number;
  zeroStock: number;
}

export interface InventoryValueResult {
  totalValue: number;
}

export interface ProductSalesReportItem {
  productId: number;
  productName: string;
  productSku: string;
  totalQuantity: number;
  totalRevenue: number;
  avgPrice: number;
}

export interface ProductReport {
  generatedAt: string;
  period: { startDate?: string; endDate?: string };
  statistics: ProductStatistics;
  products: Array<{
    id: number;
    sku: string;
    name: string;
    price: number;
    stockQty: number;
    isActive: boolean;
  }>;
  sales: ProductSalesReportItem[];
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface ProductsResponse {
  status: boolean;
  message: string;
  data: Product[];              // array of products
}

export interface ProductResponse {
  status: boolean;
  message: string;
  data: Product;                // single product
}

export interface InventoryMovementsResponse {
  status: boolean;
  message: string;
  data: InventoryMovement[];
}

export interface StatisticsResponse {
  status: boolean;
  message: string;
  data: ProductStatistics;
}

export interface InventoryValueResponse {
  status: boolean;
  message: string;
  data: InventoryValueResult;
}

export interface ProductSalesReportResponse {
  status: boolean;
  message: string;
  data: ProductSalesReportItem[];
}

export interface ExportCSVResponse {
  status: boolean;
  message: string;
  data: {
    filePath: string;           // path to the exported CSV file
  };
}

export interface ImportCSVResponse {
  status: boolean;
  message: string;
  data: {
    imported: Product[];
    errors: Array<{ row: any; errors: string[] }>;
  };
}

export interface BulkOperationResponse {
  status: boolean;
  message: string;
  data: {
    created?: Product[];
    updated?: Product[];
    errors: Array<{ item: any; errors: string[] }>;
  };
}

export interface UpdateStockResponse {
  status: boolean;
  message: string;
  data: {
    product: Product;
    movement: InventoryMovement;
  };
}

export interface DeleteResponse {
  status: boolean;
  message: string;
  data: Product;                // the deactivated product
}

export interface ReportResponse {
  status: boolean;
  message: string;
  data: {
    filePath: string;
    report: ProductReport;
  };
}

// ----------------------------------------------------------------------
// 🧠 ProductAPI Class
// ----------------------------------------------------------------------

class ProductAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all products with optional filtering, sorting, pagination.
   * @param params - Filters: isActive, search, minPrice, maxPrice, sortBy, sortOrder, page, limit
   */
  async getAll(params?: {
    isActive?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
  }): Promise<ProductsResponse> {
    try {
      if (!window.backendAPI?.product) {
        throw new Error('Electron API (product) not available');
      }

      const response = await window.backendAPI.product({
        method: 'getAllProducts',
        params: params || {},
      });

      if (response.status) {
        return response as ProductsResponse;
      }
      throw new Error(response.message || 'Failed to fetch products');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch products');
    }
  }

  /**
   * Get a single product by ID.
   * @param id - Product ID
   */
  async getById(id: number): Promise<ProductResponse> {
    try {
      if (!window.backendAPI?.product) {
        throw new Error('Electron API (product) not available');
      }

      const response = await window.backendAPI.product({
        method: 'getProductById',
        params: { id },
      });

      if (response.status) {
        return response as ProductResponse;
      }
      throw new Error(response.message || 'Failed to fetch product');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch product');
    }
  }

  /**
   * Get a product by SKU.
   * @param sku - Product SKU
   */
  async getBySKU(sku: string): Promise<ProductResponse> {
    try {
      if (!window.backendAPI?.product) {
        throw new Error('Electron API (product) not available');
      }

      const response = await window.backendAPI.product({
        method: 'getProductBySKU',
        params: { sku },
      });

      if (response.status) {
        return response as ProductResponse;
      }
      throw new Error(response.message || 'Failed to fetch product by SKU');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch product by SKU');
    }
  }

  /**
   * Get all active products.
   * @param params - Optional filters (search, minPrice, maxPrice, etc.)
   */
  async getActive(params?: {
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
  }): Promise<ProductsResponse> {
    try {
      if (!window.backendAPI?.product) {
        throw new Error('Electron API (product) not available');
      }

      const response = await window.backendAPI.product({
        method: 'getActiveProducts',
        params: params || {},
      });

      if (response.status) {
        return response as ProductsResponse;
      }
      throw new Error(response.message || 'Failed to fetch active products');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch active products');
    }
  }

  /**
   * Get products with low stock (stock ≤ threshold).
   * @param threshold - Stock threshold (default 5)
   */
  async getLowStock(threshold: number = 5): Promise<ProductsResponse> {
    try {
      if (!window.backendAPI?.product) {
        throw new Error('Electron API (product) not available');
      }

      const response = await window.backendAPI.product({
        method: 'getLowStockProducts',
        params: { threshold },
      });

      if (response.status) {
        return response as ProductsResponse;
      }
      throw new Error(response.message || 'Failed to fetch low stock products');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch low stock products');
    }
  }

  /**
   * Get product statistics (counts, total value, average price, etc.)
   */
  async getStatistics(): Promise<StatisticsResponse> {
    try {
      if (!window.backendAPI?.product) {
        throw new Error('Electron API (product) not available');
      }

      const response = await window.backendAPI.product({
        method: 'getProductStatistics',
        params: {},
      });

      if (response.status) {
        return response as StatisticsResponse;
      }
      throw new Error(response.message || 'Failed to fetch product statistics');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch product statistics');
    }
  }

  /**
   * Search products by name or SKU.
   * @param query - Search term
   * @param limit - Max number of results (default 50)
   */
  async search(query: string, limit?: number): Promise<ProductsResponse> {
    try {
      if (!window.backendAPI?.product) {
        throw new Error('Electron API (product) not available');
      }

      const response = await window.backendAPI.product({
        method: 'searchProducts',
        params: { query, limit },
      });

      if (response.status) {
        return response as ProductsResponse;
      }
      throw new Error(response.message || 'Search failed');
    } catch (error: any) {
      throw new Error(error.message || 'Search failed');
    }
  }

  /**
   * Get products created/updated within a date range.
   * @param params - startDate, endDate, field ('createdAt' or 'updatedAt')
   */
  async getByDate(params: {
    startDate: string;
    endDate: string;
    field?: 'createdAt' | 'updatedAt';
  }): Promise<ProductsResponse> {
    try {
      if (!window.backendAPI?.product) {
        throw new Error('Electron API (product) not available');
      }

      const response = await window.backendAPI.product({
        method: 'getProductsByDate',
        params,
      });

      if (response.status) {
        return response as ProductsResponse;
      }
      throw new Error(response.message || 'Failed to fetch products by date');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch products by date');
    }
  }

  /**
   * Get inventory movements for a specific product.
   * @param params - productId, limit, offset
   */
  async getInventoryMovements(params: {
    productId: number;
    limit?: number;
    offset?: number;
  }): Promise<InventoryMovementsResponse> {
    try {
      if (!window.backendAPI?.product) {
        throw new Error('Electron API (product) not available');
      }

      const response = await window.backendAPI.product({
        method: 'getInventoryMovements',
        params,
      });

      if (response.status) {
        return response as InventoryMovementsResponse;
      }
      throw new Error(response.message || 'Failed to fetch inventory movements');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch inventory movements');
    }
  }

  /**
   * Get total inventory value (optionally only active products).
   * @param activeOnly - If true (default), only active products are considered.
   */
  async getInventoryValue(activeOnly: boolean = true): Promise<InventoryValueResponse> {
    try {
      if (!window.backendAPI?.product) {
        throw new Error('Electron API (product) not available');
      }

      const response = await window.backendAPI.product({
        method: 'getInventoryValue',
        params: { activeOnly },
      });

      if (response.status) {
        return response as InventoryValueResponse;
      }
      throw new Error(response.message || 'Failed to calculate inventory value');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to calculate inventory value');
    }
  }

  /**
   * Get product sales report (aggregated).
   * @param params - startDate, endDate, productId (optional)
   */
  async getSalesReport(params?: {
    startDate?: string;
    endDate?: string;
    productId?: number;
  }): Promise<ProductSalesReportResponse> {
    try {
      if (!window.backendAPI?.product) {
        throw new Error('Electron API (product) not available');
      }

      const response = await window.backendAPI.product({
        method: 'getProductSalesReport',
        params: params || {},
      });

      if (response.status) {
        return response as ProductSalesReportResponse;
      }
      throw new Error(response.message || 'Failed to generate sales report');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to generate sales report');
    }
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATION METHODS
  // --------------------------------------------------------------------

  /**
   * Create a new product.
   * @param productData - Product data (sku, name, price, stockQty, description, isActive)
   * @param user - Optional username (defaults to 'system')
   */
  async create(
    productData: {
      sku: string;
      name: string;
      price: number;
      stockQty?: number;
      description?: string | null;
      isActive?: boolean;
    },
    user: string = 'system'
  ): Promise<ProductResponse> {
    try {
      if (!window.backendAPI?.product) {
        throw new Error('Electron API (product) not available');
      }

      const response = await window.backendAPI.product({
        method: 'createProduct',
        params: productData,
        user,
      });

      if (response.status) {
        return response as ProductResponse;
      }
      throw new Error(response.message || 'Failed to create product');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create product');
    }
  }

  /**
   * Update an existing product.
   * @param id - Product ID
   * @param updates - Fields to update (sku, name, price, stockQty, description, isActive)
   * @param user - Optional username
   */
  async update(
    id: number,
    updates: Partial<{
      sku: string;
      name: string;
      price: number;
      stockQty: number;
      description: string | null;
      isActive: boolean;
    }>,
    user: string = 'system'
  ): Promise<ProductResponse> {
    try {
      if (!window.backendAPI?.product) {
        throw new Error('Electron API (product) not available');
      }

      const response = await window.backendAPI.product({
        method: 'updateProduct',
        params: { id, ...updates },
        user,
      });

      if (response.status) {
        return response as ProductResponse;
      }
      throw new Error(response.message || 'Failed to update product');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update product');
    }
  }

  /**
   * Soft delete (deactivate) a product.
   * @param id - Product ID
   * @param user - Optional username
   */
  async delete(id: number, user: string = 'system'): Promise<DeleteResponse> {
    try {
      if (!window.backendAPI?.product) {
        throw new Error('Electron API (product) not available');
      }

      const response = await window.backendAPI.product({
        method: 'deleteProduct',
        params: { id },
        user,
      });

      if (response.status) {
        return response as DeleteResponse;
      }
      throw new Error(response.message || 'Failed to delete product');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete product');
    }
  }

  /**
   * Update product stock and record an inventory movement.
   * @param params - productId, quantityChange, movementType, notes, saleId
   * @param user - Optional username
   */
  async updateStock(
    params: {
      productId: number;
      quantityChange: number;
      movementType: 'sale' | 'refund' | 'adjustment';
      notes?: string | null;
      saleId?: number | null;
    },
    user: string = 'system'
  ): Promise<UpdateStockResponse> {
    try {
      if (!window.backendAPI?.product) {
        throw new Error('Electron API (product) not available');
      }

      const response = await window.backendAPI.product({
        method: 'updateProductStock',
        params,
        user,
      });

      if (response.status) {
        return response as UpdateStockResponse;
      }
      throw new Error(response.message || 'Failed to update stock');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update stock');
    }
  }

  /**
   * Bulk create multiple products.
   * @param products - Array of product objects (each with sku, name, price, etc.)
   * @param user - Optional username
   */
  async bulkCreate(
    products: Array<{
      sku: string;
      name: string;
      price: number;
      stockQty?: number;
      description?: string | null;
      isActive?: boolean;
    }>,
    user: string = 'system'
  ): Promise<BulkOperationResponse> {
    try {
      if (!window.backendAPI?.product) {
        throw new Error('Electron API (product) not available');
      }

      const response = await window.backendAPI.product({
        method: 'bulkCreateProducts',
        params: { products },
        user,
      });

      if (response.status) {
        return response as BulkOperationResponse;
      }
      throw new Error(response.message || 'Bulk create failed');
    } catch (error: any) {
      throw new Error(error.message || 'Bulk create failed');
    }
  }

  /**
   * Bulk update multiple products.
   * @param updates - Array of { id, updates } objects
   * @param user - Optional username
   */
  async bulkUpdate(
    updates: Array<{
      id: number;
      updates: Partial<{
        sku: string;
        name: string;
        price: number;
        stockQty: number;
        description: string | null;
        isActive: boolean;
      }>;
    }>,
    user: string = 'system'
  ): Promise<BulkOperationResponse> {
    try {
      if (!window.backendAPI?.product) {
        throw new Error('Electron API (product) not available');
      }

      const response = await window.backendAPI.product({
        method: 'bulkUpdateProducts',
        params: { updates },
        user,
      });

      if (response.status) {
        return response as BulkOperationResponse;
      }
      throw new Error(response.message || 'Bulk update failed');
    } catch (error: any) {
      throw new Error(error.message || 'Bulk update failed');
    }
  }

  /**
   * Import products from a CSV file.
   * @param filePath - Absolute path to the CSV file
   * @param user - Optional username
   */
  async importFromCSV(
    filePath: string,
    user: string = 'system'
  ): Promise<ImportCSVResponse> {
    try {
      if (!window.backendAPI?.product) {
        throw new Error('Electron API (product) not available');
      }

      const response = await window.backendAPI.product({
        method: 'importProductsFromCSV',
        params: { filePath },
        user,
      });

      if (response.status) {
        return response as ImportCSVResponse;
      }
      throw new Error(response.message || 'CSV import failed');
    } catch (error: any) {
      throw new Error(error.message || 'CSV import failed');
    }
  }

  /**
   * Export products to a CSV file.
   * @param filters - Optional filters (same as getAll)
   * @param outputPath - Optional custom output path; if omitted, saves to userData/exports
   * @param user - Optional username
   */
  async exportToCSV(
    filters?: {
      isActive?: boolean;
      search?: string;
      minPrice?: number;
      maxPrice?: number;
    },
    outputPath?: string,
    user: string = 'system'
  ): Promise<ExportCSVResponse> {
    try {
      if (!window.backendAPI?.product) {
        throw new Error('Electron API (product) not available');
      }

      const response = await window.backendAPI.product({
        method: 'exportProductsToCSV',
        params: { filters, outputPath },
        user,
      });

      if (response.status) {
        return response as ExportCSVResponse;
      }
      throw new Error(response.message || 'CSV export failed');
    } catch (error: any) {
      throw new Error(error.message || 'CSV export failed');
    }
  }

  /**
   * Generate a comprehensive product report (JSON or CSV).
   * @param params - startDate, endDate, format ('json' or 'csv')
   * @param user - Optional username
   */
  async generateReport(
    params?: {
      startDate?: string;
      endDate?: string;
      format?: 'json' | 'csv';
    },
    user: string = 'system'
  ): Promise<ReportResponse> {
    try {
      if (!window.backendAPI?.product) {
        throw new Error('Electron API (product) not available');
      }

      const response = await window.backendAPI.product({
        method: 'generateProductReport',
        params: params || {},
        user,
      });

      if (response.status) {
        return response as ReportResponse;
      }
      throw new Error(response.message || 'Report generation failed');
    } catch (error: any) {
      throw new Error(error.message || 'Report generation failed');
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if the backend API is available.
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.product);
  }

  /**
   * Quick check if a product exists by SKU.
   * @param sku - SKU to check
   */
  async existsBySKU(sku: string): Promise<boolean> {
    try {
      const response = await this.getBySKU(sku);
      return response.status;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get product stock level.
   * @param productId - Product ID
   */
  async getStockLevel(productId: number): Promise<number | null> {
    try {
      const response = await this.getById(productId);
      return response.data?.stockQty ?? null;
    } catch (error) {
      return null;
    }
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const productAPI = new ProductAPI();
export default productAPI;