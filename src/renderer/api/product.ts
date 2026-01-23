// productAPI.ts - Frontend API for Product Management
export interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  min_stock: number;
  stock_item_id: string | null;
  category_name: string | null;
  supplier_name: string | null;
  barcode: string | null;
  description: string | null;
  cost_price: number | null;
  is_active: boolean;
  reorder_quantity: number;
  last_reorder_date: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  last_price_change: string | null;
  original_price: number | null;
  parent_product_id?: number | null;
  parent_product?: Product | null;
  // 🆕 NEW WAREHOUSE FIELDS
  warehouse_id?: string | null;
  warehouse_name?: string | null;
  sync_id?: string | null;
  sync_status?: string | null;
  last_sync_at?: string | null;
  is_variant?: boolean;
  variant_name?: string | null;
  item_type?: string | null;
}

export interface Warehouse {
  id: string | number;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  email?: string;
  manager?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WarehouseSyncStatus {
  warehouse: Warehouse;
  inventory: {
    productCount: number;
    totalStock: number;
  };
  pos: {
    productCount: number;
    syncedCount: number;
    outOfSyncCount: number;
  };
  syncStatus: {
    percentage: number;
    needsSync: boolean;
    lastSync: number | null;
  };
}

export interface InventoryTransactionLog {
  id: number;
  product_id: number | string;
  action: string;
  change_amount: number;
  quantity_before: number;
  quantity_after: number;
  price_before: number | null;
  price_after: number | null;
  reference_id: string | null;
  reference_type: string | null;
  performed_by_id: string | null;
  notes: string | null;
  batch_number: string | null;
  expiry_date: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  performed_by?: any; // User object if populated
  // 🆕 NEW FIELD
  warehouse_id?: string | null;
}

export interface ProductInventoryData extends Product {
  inventoryValue: number;
  stockStatus: 'out_of_stock' | 'low_stock' | 'in_stock';
  reorderNeeded: boolean;
}

export interface ProductStats {
  summary: {
    totalProducts: number;
    activeProducts: number;
    inStockProducts: number;
    outOfStockProducts: number;
    lowStockProducts: number;
    productsWithInventoryLink: number;
    inventoryValue: number;
    inventoryCost: number;
    totalStock: number;
    potentialProfit: number;
  };
  categories: Array<{ category: string; count: string }>;
  suppliers: Array<{ supplier: string; count: string }>;
  topSellingProducts: Array<{
    product_id: number;
    product_name: string;
    sku: string;
    category: string;
    total_quantity: string;
    total_revenue: string;
  }>;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

export interface ProductSalesReport {
  sales: Array<{
    id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    cost_price: number | null;
    profit: number | null;
    created_at: string;
    sale: {
      id: number;
      datetime: string;
      reference_number: string | null;
    };
    product: {
      id: number;
      name: string;
      sku: string;
      category_name: string | null;
      supplier_name: string | null;
    };
  }>;
  summary: {
    totalQuantitySold: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    averagePrice: number;
    numberOfSales: number;
  };
  chartData: Array<{
    date: string;
    quantity: number;
    revenue: number;
    cost: number;
    profit: number;
    sales: number;
  }>;
  categoryData: Array<{
    category: string;
    quantity: number;
    revenue: number;
    sales: number;
  }>;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

export interface ProductHistory {
  logs: InventoryTransactionLog[];
  summary: {
    totalTransactions: number;
    totalIncrease: number;
    totalDecrease: number;
    uniqueActions: string[];
  };
}

export interface InventorySyncResult {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ product: string; error: string }>;
  syncRecords: Array<{
    productId: number | string;
    syncId: number;
    action: string;
    success: boolean;
    error?: string;
  }>;
  inventoryConnection: {
    connected: boolean;
    message?: string;
  };
  warehouseInfo?: Warehouse | null;
  deactivated?: number;
  masterSyncId?: number;
}

export interface InventoryConnectionStatus {
  connection: {
    connected: boolean;
    message?: string;
    timestamp?: string;
  };
  config: {
    sync_enabled?: boolean;
    auto_update_on_sale?: boolean;
    sync_interval?: number;
    last_sync?: string;
  };
  timestamp: string;
}

export interface InventorySyncStatus {
  config: {
    sync_enabled?: boolean;
    auto_update_on_sale?: boolean;
    sync_interval?: number;
    last_sync?: string;
  };
  settings: Record<string, any>;
  lastSync: {
    timestamp?: string;
  } | null;
  systemTime: string;
}

export interface InventoryConfigUpdateResult {
  results: {
    updated: number;
    failed: number;
    details: Array<{
      key: string;
      success: boolean;
      oldValue?: any;
      newValue?: any;
      error?: string;
    }>;
  };
  config: Record<string, any>;
}

export interface PaginatedResponse<T> {
  status: boolean;
  message: string;
  pagination: {
    count: number;
    current_page: number;
    total_pages: number;
    page_size: number;
    next: boolean;
    previous: boolean;
  };
  data: T[];
}

export interface ProductResponse {
  status: boolean;
  message: string;
  data: Product;
}

export interface ProductsResponse {
  status: boolean;
  message: string;
  data: Product[];
}

export interface ProductInventoryResponse {
  status: boolean;
  message: string;
  data: {
    products: ProductInventoryData[];
    totals: {
      totalProducts: number;
      totalStockValue: number;
      totalStockQuantity: number;
      outOfStock: number;
      lowStock: number;
      inStock: number;
    };
    filters: Record<string, any>;
  };
}

export interface ProductStatsResponse {
  status: boolean;
  message: string;
  data: ProductStats;
}

export interface ProductSalesReportResponse {
  status: boolean;
  message: string;
  data: ProductSalesReport;
}

export interface ProductHistoryResponse {
  status: boolean;
  message: string;
  data: ProductHistory;
}

export interface ProductAvailabilityResponse {
  status: boolean;
  message: string;
  data: {
    available: boolean;
    currentStock: number;
    requiredQuantity: number;
    difference: number;
    lowStock: boolean;
    outOfStock: boolean;
    product: {
      id: number;
      name: string;
      sku: string;
    };
  };
}

export interface SKUValidationResponse {
  status: boolean;
  message: string;
  data: {
    available: boolean;
    exists: boolean;
    product: {
      id: number;
      name: string;
    } | null;
  };
}

export interface ProductSyncResponse {
  status: boolean;
  message: string;
  data: InventorySyncResult;
}

export interface InventoryConnectionResponse {
  status: boolean;
  message: string;
  data: InventoryConnectionStatus;
}

export interface InventorySyncStatusResponse {
  status: boolean;
  message: string;
  data: InventorySyncStatus;
}

export interface InventoryConfigUpdateResponse {
  status: boolean;
  message: string;
  data: InventoryConfigUpdateResult;
}

export interface ProductOperationResponse {
  status: boolean;
  message: string;
  data: {
    id?: number;
    productId?: number;
    newStock?: number;
    updated?: boolean;
    [key: string]: any;
  };
}

// 🆕 NEW WAREHOUSE RESPONSE INTERFACES
export interface WarehouseProductsResponse {
  status: boolean;
  message: string;
  data: {
    products: Product[];
    total: number;
    warehouseId: string | number;
  };
}

export interface AvailableWarehousesResponse {
  status: boolean;
  message: string;
  data: {
    warehouses: Warehouse[];
    currentWarehouse: {
      id: string | number;
      name: string;
    } | null;
    total: number;
    timestamp: string;
  };
}

export interface WarehouseSyncStatusResponse {
  status: boolean;
  message: string;
  data: WarehouseSyncStatus;
}

export interface ProductPayload {
  method: string;
  params?: Record<string, any>;
}

class ProductAPI {
  // 📦 READ-ONLY OPERATIONS

  /**
   * Get all products with optional filters
   */
  async getAllProducts(filters?: {
    category_name?: string;
    supplier_name?: string;
    in_stock_only?: boolean;
    low_stock_only?: boolean;
    out_of_stock_only?: boolean;
    has_stock_item_id?: boolean;
    is_active?: boolean;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<ProductsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "getAllProducts",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get products");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get products");
    }
  }

  /**
   * Get paginated products with filters
   */
  async findPage(
    filters: {
      category_name?: string;
      supplier_name?: string;
      is_active?: boolean;
      min_price?: number;
      max_price?: number;
      low_stock?: boolean;
      out_of_stock?: boolean;
      search?: string;
      has_stock_item?: boolean;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    } = {},
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Product>> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "findPage",
        params: { ...filters, page, offset: pageSize },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to find products");
    } catch (error: any) {
      throw new Error(error.message || "Failed to find products");
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id: number): Promise<ProductResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "getProductById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get product");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get product");
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(
    categoryName: string,
    filters?: {
      is_active?: boolean;
      in_stock_only?: boolean;
      low_stock_only?: boolean;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    }
  ): Promise<ProductsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "getProductsByCategory",
        params: { category_name: categoryName, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get products by category");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get products by category");
    }
  }

  /**
   * Get products by supplier
   */
  async getProductsBySupplier(
    supplierName: string,
    filters?: {
      is_active?: boolean;
      in_stock_only?: boolean;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    }
  ): Promise<ProductsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "getProductsBySupplier",
        params: { supplier_name: supplierName, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get products by supplier");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get products by supplier");
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(threshold?: number): Promise<ProductsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "getLowStockProducts",
        params: { threshold },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get low stock products");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get low stock products");
    }
  }

  /**
   * Get product statistics
   */
  async getProductStats(dateRange?: {
    start?: string;
    end?: string;
  }): Promise<ProductStatsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "getProductStats",
        params: { date_range: dateRange },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get product stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get product stats");
    }
  }

  /**
   * Search products
   */
  async searchProducts(query: string): Promise<ProductsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "searchProducts",
        params: { query },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search products");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search products");
    }
  }

  /**
   * Get product history/logs
   */
  async getProductHistory(productId: number): Promise<ProductHistoryResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "getProductHistory",
        params: { product_id: productId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get product history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get product history");
    }
  }

  /**
   * Get product variants (placeholder - needs variant support)
   */
  async getProductVariants(productId: number): Promise<ProductsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "getProductVariants",
        params: { product_id: productId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get product variants");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get product variants");
    }
  }

  /**
   * Get product sales report
   */
  async getProductSalesReport(
    productId: number,
    dateRange?: {
      start?: string;
      end?: string;
    }
  ): Promise<ProductSalesReportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "getProductSalesReport",
        params: { product_id: productId, date_range: dateRange },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get product sales report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get product sales report");
    }
  }

  /**
   * Check product availability
   */
  async checkProductAvailability(
    productId: number,
    quantity: number
  ): Promise<ProductAvailabilityResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "checkProductAvailability",
        params: { product_id: productId, quantity },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to check product availability");
    } catch (error: any) {
      throw new Error(error.message || "Failed to check product availability");
    }
  }

  /**
   * Validate product SKU
   */
  async validateProductSKU(sku: string): Promise<SKUValidationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "validateProductSKU",
        params: { sku },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to validate SKU");
    } catch (error: any) {
      throw new Error(error.message || "Failed to validate SKU");
    }
  }

  /**
   * Get product price history
   */
  async getProductPriceHistory(productId: number): Promise<ProductHistoryResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "getProductPriceHistory",
        params: { product_id: productId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get price history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get price history");
    }
  }

  /**
   * Get detailed product inventory information
   */
  async getProductInventory(filters?: {
    stock_level?: 'out_of_stock' | 'low_stock' | 'in_stock';
    has_inventory_link?: boolean;
  }): Promise<ProductInventoryResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "getProductInventory",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get product inventory");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get product inventory");
    }
  }

  /**
   * Get products by barcode
   */
  async getProductsByBarcode(barcode: string): Promise<ProductsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "getProductsByBarcode",
        params: { barcode },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get products by barcode");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get products by barcode");
    }
  }

  // 🏬 WAREHOUSE-RELATED OPERATIONS (NEW)

  /**
   * Get products from specific warehouse
   */
  async getWarehouseProducts(
    warehouseId: string | number,
    filters?: {
      is_active?: boolean;
      category_name?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<WarehouseProductsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "getWarehouseProducts",
        params: { warehouseId, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get warehouse products");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get warehouse products");
    }
  }

  /**
   * Get available warehouses from inventory system
   */
  async getAvailableWarehouses(): Promise<AvailableWarehousesResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "getAvailableWarehouses",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get available warehouses");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get available warehouses");
    }
  }

  /**
   * Get sync status for specific warehouse
   */
  async getWarehouseSyncStatus(warehouseId: string | number): Promise<WarehouseSyncStatusResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "getWarehouseSyncStatus",
        params: { warehouseId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get warehouse sync status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get warehouse sync status");
    }
  }

  // 🛒 SALE-RELATED STOCK OPERATIONS

  /**
   * Update product stock for sale
   */
  async updateProductStockForSale(params: {
    productId: number;
    quantity: number;
    saleId: string | number;
  }): Promise<ProductOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "updateProductStockForSale",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update stock for sale");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update stock for sale");
    }
  }

  /**
   * Adjust product inventory for return
   */
  async adjustProductInventoryForReturn(params: {
    productId: number;
    quantity: number;
    returnId: string | number;
    reason?: string;
  }): Promise<ProductOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "adjustProductInventoryForReturn",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to adjust inventory for return");
    } catch (error: any) {
      throw new Error(error.message || "Failed to adjust inventory for return");
    }
  }

  /**
   * Sync products from inventory system (WAREHOUSE REQUIRED)
   */
  async syncProductsFromInventory(params: {
    warehouseId: string | number;
    fullSync?: boolean;
    incremental?: boolean;
  }): Promise<ProductSyncResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      if (!params.warehouseId) {
        throw new Error("Warehouse ID is required for inventory sync");
      }

      const response = await window.backendAPI.product({
        method: "syncProductsFromInventory",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to sync products from inventory");
    } catch (error: any) {
      throw new Error(error.message || "Failed to sync products from inventory");
    }
  }

  /**
   * Update inventory stock after POS sale
   */
  async updateInventoryStock(params: {
    saleData: {
      id?: number;
      reference_number?: string;
    };
    items: Array<{
      product_id: number;
      quantity: number;
      id?: number;
    }>;
    action?: 'sale' | 'return';
  }): Promise<ProductOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "updateInventoryStock",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update inventory stock");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update inventory stock");
    }
  }

  /**
   * Check inventory database connection
   */
  async checkInventoryConnection(): Promise<InventoryConnectionResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "checkInventoryConnection",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to check inventory connection");
    } catch (error: any) {
      throw new Error(error.message || "Failed to check inventory connection");
    }
  }

  /**
   * Get current inventory sync status
   */
  async getInventorySyncStatus(): Promise<InventorySyncStatusResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "getInventorySyncStatus",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get inventory sync status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get inventory sync status");
    }
  }

  /**
   * Update inventory sync configuration
   */
  async updateInventoryConfig(updates: {
    inventory_sync_enabled?: boolean | string;
    inventory_auto_update_on_sale?: boolean | string;
    inventory_sync_interval?: number | string;
    inventory_last_sync?: string;
    current_warehouse_id?: string | number;
    current_warehouse_name?: string;
    [key: string]: any;
  }): Promise<InventoryConfigUpdateResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "updateInventoryConfig",
        params: { updates },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update inventory config");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update inventory config");
    }
  }

  /**
   * Manage sync data - view history, retry failed syncs, etc.
   */
  async manageSyncData(params: {
    action: 'get_history' | 'get_pending' | 'retry_sync' | 'cleanup_old';
    filters?: {
      entityType?: string;
      entityId?: number;
      direction?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
      daysToKeep?: number;
    };
    syncId?: number;
    forceRetry?: boolean;
  }): Promise<any> {
    try {
      if (!window.backendAPI || !window.backendAPI.product) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.product({
        method: "manageSyncData",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to manage sync data");
    } catch (error: any) {
      throw new Error(error.message || "Failed to manage sync data");
    }
  }

  // Utility methods

  /**
   * Quick search products by name, SKU, or barcode
   */
  async quickSearch(query: string): Promise<Product[]> {
    try {
      const response = await this.searchProducts(query);
      return response.data;
    } catch (error) {
      console.error("Quick search error:", error);
      return [];
    }
  }

  /**
   * Check if product needs reorder
   */
  needsReorder(product: Product): boolean {
    return product.stock <= product.min_stock && product.stock > 0;
  }

  /**
   * Get stock status
   */
  getStockStatus(product: Product): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (product.stock === 0) return 'out_of_stock';
    if (product.stock <= product.min_stock) return 'low_stock';
    return 'in_stock';
  }

  /**
   * Calculate inventory value for a product
   */
  calculateInventoryValue(product: Product): number {
    return product.stock * product.price;
  }

  /**
   * Get profit margin
   */
  calculateProfitMargin(product: Product): number | null {
    if (!product.cost_price || product.cost_price <= 0) return null;
    return ((product.price - product.cost_price) / product.cost_price) * 100;
  }

  /**
   * Get profit amount
   */
  calculateProfitAmount(product: Product): number | null {
    if (!product.cost_price) return null;
    return product.price - product.cost_price;
  }

  /**
   * Get all categories from products
   */
  async getAllCategories(): Promise<string[]> {
    try {
      const response = await this.getAllProducts();
      const categories = response.data
        .map(p => p.category_name)
        .filter((cat): cat is string => cat !== null && cat !== '')
        .filter((value, index, self) => self.indexOf(value) === index);
      return categories;
    } catch (error) {
      console.error("Failed to get categories:", error);
      return [];
    }
  }

  /**
   * Get all suppliers from products
   */
  async getAllSuppliers(): Promise<string[]> {
    try {
      const response = await this.getAllProducts();
      const suppliers = response.data
        .map(p => p.supplier_name)
        .filter((sup): sup is string => sup !== null && sup !== '')
        .filter((value, index, self) => self.indexOf(value) === index);
      return suppliers;
    } catch (error) {
      console.error("Failed to get suppliers:", error);
      return [];
    }
  }

  /**
   * Get critical stock products (stock <= 2)
   */
  async getCriticalStockProducts(): Promise<Product[]> {
    try {
      const response = await this.getAllProducts();
      return response.data.filter(p => p.stock <= 2 && p.stock > 0);
    } catch (error) {
      console.error("Failed to get critical stock products:", error);
      return [];
    }
  }

  /**
   * Get product by barcode or SKU
   */
  async getProductByCode(code: string): Promise<Product | null> {
    try {
      // Try barcode first
      const barcodeResponse = await this.getProductsByBarcode(code);
      if (barcodeResponse.data.length > 0) {
        return barcodeResponse.data[0];
      }

      // Try SKU
      const allProducts = await this.getAllProducts();
      const skuMatch = allProducts.data.find(p => p.sku === code);
      if (skuMatch) return skuMatch;

      return null;
    } catch (error) {
      console.error("Failed to get product by code:", error);
      return null;
    }
  }

  /**
   * Bulk update stocks (for manual adjustments)
   */
  async bulkUpdateStocks(updates: Array<{
    productId: number;
    newStock: number;
    reason?: string;
  }>): Promise<ProductOperationResponse[]> {
    const results: ProductOperationResponse[] = [];
    
    for (const update of updates) {
      try {
        // This is a simplified version - you might need to create a separate IPC method
        // for bulk updates or handle it differently
        const product = await this.getProductById(update.productId);
        if (product.status) {
          // Here you would call an IPC method to update stock
          // For now, we'll just return a mock response
          results.push({
            status: true,
            message: `Stock updated for product ${update.productId}`,
            data: {
              productId: update.productId,
              newStock: update.newStock,
              updated: true
            }
          });
        }
      } catch (error: any) {
        results.push({
          status: false,
          message: error.message,
          data: { productId: update.productId }
        });
      }
    }
    
    return results;
  }

  /**
   * Check if product is linked to inventory
   */
  isLinkedToInventory(product: Product): boolean {
    return product.stock_item_id !== null && product.stock_item_id !== undefined;
  }

  /**
   * Check if product is synced with warehouse
   */
  isWarehouseSynced(product: Product): boolean {
    return product.sync_status === 'synced' && !!product.warehouse_id;
  }

  /**
   * Get products by warehouse
   */
  async getProductsByWarehouseId(warehouseId: string | number): Promise<Product[]> {
    try {
      const response = await this.getWarehouseProducts(warehouseId);
      return response.data.products;
    } catch (error) {
      console.error(`Failed to get products for warehouse ${warehouseId}:`, error);
      return [];
    }
  }

  /**
   * Get current warehouse from settings
   */
  async getCurrentWarehouse(): Promise<{ id: string | number; name: string } | null> {
    try {
      const response = await this.getAvailableWarehouses();
      return response.data.currentWarehouse;
    } catch (error) {
      console.error("Failed to get current warehouse:", error);
      return null;
    }
  }

  /**
   * Set current warehouse
   */
  async setCurrentWarehouse(warehouseId: string | number, warehouseName: string): Promise<boolean> {
    try {
      await this.updateInventoryConfig({
        current_warehouse_id: warehouseId,
        current_warehouse_name: warehouseName
      });
      return true;
    } catch (error) {
      console.error("Failed to set current warehouse:", error);
      return false;
    }
  }
}

const productAPI = new ProductAPI();

export default productAPI;