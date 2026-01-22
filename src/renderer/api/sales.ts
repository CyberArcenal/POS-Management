// sales.ts - UPDATED VERSION WITH WAREHOUSE SUPPORT
export interface Sale {
  id: number;
  user_id: number | null;
  datetime: string;
  total: number;
  subtotal?: number;
  discount_amount?: number;
  tax_amount?: number;
  payment_method: string;
  payment_status?: string;
  amount_paid?: number;
  payment_change?: number;
  payment_transaction_id?: string | null;
  payment_notes?: string | null;
  status: "completed" | "cancelled" | "refunded" | "pending" | "processing";
  reference_number: string | null;
  stock_item_id: string | null;

  // Warehouse fields - ADDED
  warehouse_id?: number | null;
  warehouse_name?: string | null;

  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  notes?: string | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  refund_amount?: number | null;
  refunded_at?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;

  // Inventory sync fields - ADDED
  inventory_synced?: boolean;
  inventory_sync_date?: string | null;

  user?: User;
  items?: SaleItem[];
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  stock_item_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_percentage: number;
  discount_amount: number;
  price_before_discount: number | null;
  cost_price: number | null;
  profit: number | null;
  returned_quantity: number;
  is_returned: boolean;
  return_reason: string | null;
  notes?: string | null;
  variant_id?: number | null;

  // Warehouse fields - ADDED
  warehouse_id?: number | null;
  sync_id?: string | null;

  created_at: string;
  updated_at: string;
  product?: Product;
  variant?: Variant;
}

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

  // Warehouse fields - ADDED
  warehouse_id?: number | null;
  warehouse_name?: string | null;
  is_variant?: boolean;
  variant_name?: string | null;
  parent_product_id?: number | null;
  sync_id?: string | null;
  sync_status?: "synced" | "pending" | "out_of_sync";
  item_type?: "product" | "variant";
}

export interface Variant {
  id: number;
  name: string;
  price_adjustment: number;
  stock: number;
}

export interface User {
  id: number;
  username: string;
  role: string;
  display_name: string | null;
}

// ADDED: Warehouse interface
export interface Warehouse {
  id: number;
  name: string;
  type?: string;
  location?: string;
  is_active?: boolean;
}

// ADDED: Warehouse Status interface
export interface WarehouseStatus {
  warehouse: {
    id: number;
    name: string;
    type?: string;
    location?: string;
    is_active?: boolean;
  };
  inventory: {
    item_count: number;
    total_stock: number;
  };
  pos: {
    product_count: number;
  };
  sync: {
    unsynced_changes: number;
    last_sync: string | null;
  };
}

// ADDED: Stock Validation interface
export interface StockValidation {
  valid: boolean;
  validations: Array<{
    product_id: number;
    product_name: string;
    sync_id?: string;
    available_stock: number;
    requested_quantity: number;
    sufficient: boolean;
    deficit: number;
    is_variant?: boolean;
    variant_name?: string;
  }>;
  errors: Array<{
    product_id?: number;
    product_name?: string;
    error: string;
    available?: number;
    requested?: number;
    deficit?: number;
  }>;
  total_items: number;
  insufficient_items: number;
}

// ADDED: Out of Stock Item interface
export interface OutOfStockItem {
  product_id: number;
  name: string;
  available: number;
  requested: number;
  warehouse?: string;
}

// ADDED: Create Sale Response with Warehouse
export interface CreateSaleResponseData {
  sale: Sale;
  sale_items: SaleItem[];
  receipt_number: string;
  warehouse: string;
  timestamp: string;
  stock_validation: {
    total_validated: number;
    all_sufficient: boolean;
    details: Array<{
      product_id: number;
      product_name: string;
      requested: number;
      available: number;
      sufficient: boolean;
    }>;
  };
}

export interface SaleStats {
  total_sales: number;
  total_revenue: number;
  total_discount: number;
  total_tax: number;
  average_sale: number;
  completed_sales: number;
  cancelled_sales: number;
  refunded_sales: number;
  pending_sales: number;
  processing_sales: number;
  total_items_sold: number;
  peak_hour: number;
  peak_day: string;
  average_daily_sales: number;
  days_analyzed: number;
}

export interface DailySalesReport {
  date: string;
  total_sales: number;
  total_revenue: number;
  total_items: number;
  average_sale_value: number;
  average_items_per_sale: number;
  peak_hour: number;
  hourly_breakdown: Array<{
    hour: string;
    sales_count: number;
    total_amount: number;
  }>;
  product_breakdown: Record<
    string,
    {
      quantity: number;
      revenue: number;
      product_id: number;
    }
  >;
  category_breakdown: Record<
    string,
    {
      quantity: number;
      revenue: number;
      unique_products: number;
    }
  >;
  payment_distribution: Record<string, number>;
  sales: Sale[];
}

export interface MonthlySalesReport {
  period: {
    year: number;
    month: number;
    month_name: string;
    start_date: string;
    end_date: string;
    days_in_month: number;
  };
  summary: {
    total_sales: number;
    total_revenue: number;
    total_items_sold: number;
    average_daily_sales: number;
    average_daily_revenue: number;
    best_selling_day: {
      day: number;
      sales_count: number;
      total_amount: number;
    };
    worst_selling_day: {
      day: number;
      sales_count: number;
      total_amount: number;
    };
    days_with_sales: number;
  };
  daily_breakdown: Array<{
    day: number;
    date: string;
    sales_count: number;
    total_amount: number;
    items_count: number;
  }>;
  weekly_breakdown: Array<{
    week: number;
    days: string;
    sales_count: number;
    total_amount: number;
  }>;
  product_performance: Record<
    string,
    {
      product_id: number;
      quantity_sold: number;
      revenue_generated: number;
      sale_days_count: number;
      sale_days: number[];
    }
  >;
  category_performance: Record<
    string,
    {
      quantity_sold: number;
      revenue_generated: number;
      unique_products_count: number;
    }
  >;
  user_performance: Record<
    string,
    {
      user_id: number;
      sales_count: number;
      total_revenue: number;
      average_sale_value: number;
    }
  >;
  top_products_by_revenue: Array<{
    name: string;
    product_id: number;
    quantity_sold: number;
    revenue_generated: number;
    sale_days_count: number;
  }>;
  sales: Sale[];
}

export interface TopSellingProduct {
  rank: number;
  product_id: number;
  product_name: string;
  sku: string;
  category: string | null;
  metrics: {
    quantity_sold: number;
    revenue: number;
    sales_count: number;
    average_price: number;
    average_quantity_per_sale: number;
    market_share_quantity: number;
    market_share_revenue: number;
  };
  inventory?: {
    current_stock: number;
    min_stock: number;
    turnover_rate: number;
    stock_status: "low" | "adequate";
  };
  trends: {
    quantity_growth: number;
    revenue_growth: number;
  };
}

export interface RevenueAnalytics {
  period: string;
  summary: {
    total_sales: number;
    total_revenue: number;
    average_sale: number;
    peak_performance: {
      hour: number;
      day: string;
      average_daily_sales: number;
    };
    date_range: {
      start: string;
      end: string;
      days_analyzed: number;
    };
  };
  trends: {
    revenue_trend: "increasing" | "decreasing" | "stable" | "insufficient_data";
    sales_trend: "increasing" | "decreasing" | "stable" | "insufficient_data";
    growth_rates: {
      revenue: number;
      sales: number;
    };
    moving_averages?: {
      revenue: number[];
      sales: number[];
    };
    period_comparison?: {
      first_period: string;
      last_period: string;
      revenue_change: number;
      sales_change: number;
    };
  };
  comparisons: {
    period_over_period:
      | Array<{
          from_period: string;
          to_period: string;
          revenue_change: number;
          sales_change: number;
          is_improvement: boolean;
        }>
      | "insufficient_data";
    best_period: {
      period: string;
      revenue: number;
      sales_count: number;
      average_sale: number;
    } | null;
    worst_period: {
      period: string;
      revenue: number;
      sales_count: number;
      average_sale: number;
    } | null;
    consistency: {
      revenue_std_dev: number;
      sales_std_dev: number;
    };
  };
  forecasts: Array<{
    period_index: number;
    forecast_period: string;
    forecast_revenue: number;
    forecast_sales: number;
    forecast_average_sale: number;
    confidence: number;
    method: string;
  }>;
  insights: Array<{
    type: string;
    message: string;
    priority: "high" | "medium" | "low" | "info";
    data?: any;
  }>;
}

export interface SaleSearchResult {
  results: Sale[];
  grouped_results: {
    exact_matches: Sale[];
    customer_matches: Sale[];
    reference_matches: Sale[];
    product_matches: Sale[];
    user_matches: Sale[];
  };
  search_stats: {
    total_results: number;
    by_status: Record<string, number>;
    by_payment_method: Record<string, number>;
    date_range: { start: string; end: string } | null;
  };
}

export interface ReceiptData {
  receipt_number: string;
  sale_id: number;
  date_time: string;
  cashier: { id: number; name: string } | null;
  customer: {
    name: string;
    phone: string | null;
    email: string | null;
  };
  items: Array<{
    id: number;
    product_name: string;
    variant_name: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    discount: number;
    barcode: string | null;
    sku: string | null;
  }>;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  payment: {
    method: string;
    amount_paid: number;
    change: number;
    status: string;
  };
  store: {
    name: string;
    address: string;
    phone: string;
    vat_registration: string;
  };
  footer: {
    thank_you_message: string;
    return_policy: string;
    contact_info: string;
  };
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
  summary?: {
    total_sales: number;
    total_revenue: number;
    total_discount: number;
    total_tax: number;
  };
  data: T[];
}

export interface SaleResponse {
  status: boolean;
  message: string;
  data: Sale;
}

export interface SalesResponse {
  status: boolean;
  message: string;
  data: Sale[];
}

export interface SaleItemResponse {
  status: boolean;
  message: string;
  data: SaleItem[];
}

export interface SaleStatsResponse {
  status: boolean;
  message: string;
  data: SaleStats;
}

export interface DailySalesReportResponse {
  status: boolean;
  message: string;
  data: DailySalesReport;
}

export interface MonthlySalesReportResponse {
  status: boolean;
  message: string;
  data: MonthlySalesReport;
}

export interface TopSellingProductsResponse {
  status: boolean;
  message: string;
  data: {
    products: TopSellingProduct[];
    summary: {
      total_products_analyzed: number;
      total_quantity_sold: number;
      total_revenue: number;
      average_price_all: number;
      date_range: string;
    };
    category_performance: Record<
      string,
      {
        products_count: number;
        total_quantity: number;
        total_revenue: number;
        products: Array<{
          product_id: number;
          product_name: string;
          rank: number;
        }>;
      }
    >;
    insights: Array<{
      type: string;
      message: string;
      priority: "high" | "medium" | "low" | "info";
      data?: any;
    }>;
  };
}

export interface RevenueAnalyticsResponse {
  status: boolean;
  message: string;
  data: RevenueAnalytics;
}

export interface SaleSearchResponse {
  status: boolean;
  message: string;
  data: SaleSearchResult;
}

export interface ReceiptResponse {
  status: boolean;
  message: string;
  data: {
    receipt: ReceiptData;
    itemized_summary: {
      total_items: number;
      total_quantity: number;
      total_before_discount: number;
    };
    qr_data: {
      sale_id: number;
      receipt_number: string;
      date: string;
      total: number;
      hash: string;
    };
    print_data: string;
    download_url: string;
  };
}

export interface PaymentReceipt {
  receipt_number: string;
  sale_reference: string;
  payment_date: string;
  payment_method: string;
  amount_paid: number;
  amount_due: number;
  change_given: number;
  transaction_id: string;
  processed_by: number;
}

export interface PaymentResponse {
  status: boolean;
  message: string;
  data: {
    sale: Sale;
    payment_receipt: PaymentReceipt;
    payment_summary: {
      total_amount: number;
      previous_paid: number;
      this_payment: number;
      new_total_paid: number;
      change_given: number;
      balance: number;
    };
  };
}

export interface DiscountResponse {
  status: boolean;
  message: string;
  data: {
    sale: Sale;
    discount_details: {
      type: string;
      value: number;
      apply_to: string;
      reason: string;
      previous_total: number;
      previous_discount: number;
      item_updates: Array<{
        item_id: number;
        product_id: number;
        previous_price: number;
        new_price: number;
        discount_amount: number;
        discount_reason: string;
      }>;
    };
    summary: {
      discount_applied: number;
      previous_total: number;
      new_total: number;
      savings_percentage: number;
    };
  };
}

export interface RefundResponse {
  status: boolean;
  message: string;
  data: {
    sale: Sale;
    refund_details: {
      items_refunded: Array<{
        item_id: number;
        product_id: number;
        quantity: number;
        refund_amount: number;
        reason: string;
      }>;
      total_refund_amount: number;
      stock_restored: Array<{
        product_id: number;
        product_name: string;
        quantity: number;
        new_stock: number;
      }>;
    };
    summary: {
      total_refunded: number;
      items_refunded: number;
      stock_restored: number;
      is_full_refund: boolean;
    };
  };
}

export interface SyncResponse {
  status: boolean;
  message: string;
  data: {
    sale: Sale;
    sync_results: {
      stock_updates: Array<{
        product_id: number;
        product_name: string;
        previous_stock: number;
        new_stock: number;
        adjustment: number;
        sync_type: "forced" | "automatic";
      }>;
      price_updates: Array<{
        item_id: number;
        product_id: number;
        previous_unit_price: number;
        new_unit_price: number;
        previous_total: number;
        new_total: number;
        price_difference: number;
      }>;
      inventory_logs: Array<{
        product_id: number;
        log_id: number;
        action: string;
      }>;
      warnings: string[];
      errors: string[];
    };
    sync_summary: {
      total_items: number;
      stock_updates_count: number;
      price_updates_count: number;
      warnings_count: number;
      errors_count: number;
      inventory_logs_count: number;
      sync_type: string;
      forced: boolean;
    };
    recommendations: Array<{
      type: string;
      message: string;
      priority: "high" | "medium" | "low" | "info";
    }>;
  };
}

export interface StockValidationResponse {
  status: boolean;
  message: string;
  data: {
    outOfStockItems: Array<OutOfStockItem>;
    valid: boolean;
  };
}

// UPDATED: Create Sale Response
export interface CreateSaleResponse {
  status: boolean;
  message: string;
  data: CreateSaleResponseData;
}

export interface SaleOperationResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    reference_number: string;
    [key: string]: any;
  };
}

export interface SalePayload {
  method: string;
  params?: Record<string, any>;
}

// ADDED: Warehouse Sales Response
export interface WarehouseSalesResponse {
  status: boolean;
  data: {
    sales: Sale[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
    summary: {
      summary: {
        total_sales: number;
        total_revenue: number;
        total_discounts: number;
        total_taxes: number;
        average_sale: number;
      };
      top_products: Array<{
        product_id: number;
        product_name: string;
        total_quantity: number;
        total_revenue: number;
        sale_count: number;
      }>;
      date_range: {
        startDate: string | null;
        endDate: string | null;
      };
    };
  };
}

class SaleAPI {
  // 📦 SALE CRUD OPERATIONS

  async createSale(params: {
    items: Array<{
      product_id: number;
      quantity: number;
      unit_price?: number;
      discount_percentage?: number;
      discount_amount?: number;
    }>;
    user_id?: number;
    user_name?: string; // ADDED: user_name parameter
    payment_method: string;
    discount?: number;
    tax?: number;
    notes?: string;
    customer_info?: {
      name?: string;
      phone?: string;
      email?: string;
    };
  }): Promise<CreateSaleResponse> {
    // UPDATED return type
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "createSale",
        params,
      });

      if (response.status) {
        return response as CreateSaleResponse;
      }
      throw new Error(response.message || "Failed to create sale");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create sale");
    }
  }

  async updateSale(
    sale_id: number,
    updates: {
      customer_name?: string;
      customer_phone?: string;
      customer_email?: string;
      notes?: string;
      payment_method?: string;
      status?: string;
    },
    item_updates?: Array<{
      item_id: number;
      updates: {
        quantity?: number;
        unit_price?: number;
        discount_percentage?: number;
        discount_amount?: number;
        notes?: string;
        variant_id?: number;
      };
    }>,
    // ADDED: return items parameter
    return_items?: Array<{
      item_id: number;
      quantity: number;
      reason?: string;
    }>,
    user_name?: string, // ADDED: user_name parameter
  ): Promise<SaleOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "updateSale",
        params: {
          sale_id,
          updates,
          item_updates,
          return_items,
          user_name,
        },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update sale");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update sale");
    }
  }

  async cancelSale(
    sale_id: number,
    reason?: string,
  ): Promise<SaleOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "cancelSale",
        params: { sale_id, reason },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to cancel sale");
    } catch (error: any) {
      throw new Error(error.message || "Failed to cancel sale");
    }
  }

  async processRefund(params: {
    sale_id: number;
    items?: Array<{
      item_id: number;
      quantity: number;
      reason?: string;
    }>;
    partial?: boolean;
    refund_amount?: number;
    reason?: string;
  }): Promise<RefundResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "processRefund",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to process refund");
    } catch (error: any) {
      throw new Error(error.message || "Failed to process refund");
    }
  }

  // 📋 READ-ONLY OPERATIONS

  async getAllSales(filters?: {
    start_date?: string;
    end_date?: string;
    status?: string;
    user_id?: number;
    warehouse_id?: number; // ADDED: warehouse filter
  }): Promise<SalesResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "getAllSales",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get all sales");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get all sales");
    }
  }

  async findPage(
    filters: {
      start_date?: string;
      end_date?: string;
      user_id?: number;
      status?: string;
      payment_method?: string;
      min_total?: number;
      max_total?: number;
      reference_number?: string;
      customer_name?: string;
      search?: string;
      warehouse_id?: number; // ADDED: warehouse filter
    } = {},
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedResponse<Sale>> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "findPage",
        params: { ...filters, page, pageSize },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to find sales");
    } catch (error: any) {
      throw new Error(error.message || "Failed to find sales");
    }
  }

  async getSaleById(id: number): Promise<SaleResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "getSaleById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get sale");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get sale");
    }
  }

  async getSalesByDateRange(
    start_date: string,
    end_date: string,
    filters?: {
      user_id?: number;
      status?: string;
      payment_method?: string;
      warehouse_id?: number; // ADDED: warehouse filter
    },
  ): Promise<SalesResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "getSalesByDateRange",
        params: { start_date, end_date, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get sales by date range");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get sales by date range");
    }
  }

  async getSalesByUser(
    user_id: number,
    filters?: {
      start_date?: string;
      end_date?: string;
      status?: string;
      warehouse_id?: number; // ADDED: warehouse filter
    },
  ): Promise<SalesResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "getSalesByUser",
        params: { user_id, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get sales by user");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get sales by user");
    }
  }

  async getSalesByStatus(
    status: string,
    filters?: {
      start_date?: string;
      end_date?: string;
      user_id?: number;
      min_total?: number;
      max_total?: number;
      warehouse_id?: number; // ADDED: warehouse filter
    },
  ): Promise<SalesResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "getSalesByStatus",
        params: { status, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get sales by status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get sales by status");
    }
  }

  async getSalesByProduct(
    product_id: number,
    filters?: {
      start_date?: string;
      end_date?: string;
      user_id?: number;
      status?: string;
      warehouse_id?: number; // ADDED: warehouse filter
    },
  ): Promise<SalesResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "getSalesByProduct",
        params: { product_id, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get sales by product");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get sales by product");
    }
  }

  // ADDED: Get sales by warehouse
  async getWarehouseSales(params: {
    warehouse_id: number;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<WarehouseSalesResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "getWarehouseSales",
        params,
      });

      if (response.status) {
        return response as WarehouseSalesResponse;
      }
      throw new Error(response.message || "Failed to get warehouse sales");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get warehouse sales");
    }
  }

  async getDailySalesReport(
    date?: string,
    filters?: {
      user_id?: number;
      payment_method?: string;
      warehouse_id?: number; // ADDED: warehouse filter
    },
  ): Promise<DailySalesReportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "getDailySalesReport",
        params: { date, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get daily sales report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get daily sales report");
    }
  }

  async getMonthlySalesReport(
    year?: number,
    month?: number,
    filters?: {
      user_id?: number;
      payment_method?: string;
      warehouse_id?: number; // ADDED: warehouse filter
    },
  ): Promise<MonthlySalesReportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "getMonthlySalesReport",
        params: { year, month, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get monthly sales report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get monthly sales report");
    }
  }

  async getSalesStats(
    date_range?: {
      start_date?: string;
      end_date?: string;
    },
    filters?: {
      user_id?: number;
      payment_method?: string;
      warehouse_id?: number; // ADDED: warehouse filter
    },
  ): Promise<SaleStatsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "getSalesStats",
        params: { date_range, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get sales stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get sales stats");
    }
  }

  async getTopSellingProducts(
    limit?: number,
    date_range?: {
      start_date?: string;
      end_date?: string;
    },
    warehouse_id?: number, // ADDED: warehouse filter
  ): Promise<TopSellingProductsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "getTopSellingProducts",
        params: { limit, date_range, warehouse_id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get top selling products");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get top selling products");
    }
  }

  async getRevenueAnalytics(
    period?: "daily" | "weekly" | "monthly" | "yearly",
    filters?: {
      start_date?: string;
      end_date?: string;
      user_id?: number;
      payment_method?: string;
      warehouse_id?: number; // ADDED: warehouse filter
    },
  ): Promise<RevenueAnalyticsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "getRevenueAnalytics",
        params: { period, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get revenue analytics");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get revenue analytics");
    }
  }

  async searchSales(
    query: string,
    filters?: {
      start_date?: string;
      end_date?: string;
      user_id?: number;
      status?: string;
      payment_method?: string;
      min_total?: number;
      max_total?: number;
      warehouse_id?: number; // ADDED: warehouse filter
    },
  ): Promise<SaleSearchResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "searchSales",
        params: { query, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search sales");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search sales");
    }
  }

  // 🔄 INVENTORY INTEGRATION

  async syncSaleWithInventory(params: {
    sale_id: number;
    sync_type?: "stock_only" | "prices_only" | "both";
    force?: boolean;
  }): Promise<SyncResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "syncSaleWithInventory",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to sync sale with inventory");
    } catch (error: any) {
      throw new Error(error.message || "Failed to sync sale with inventory");
    }
  }

  async validateSaleStock(
    items: Array<{
      product_id: number;
      quantity: number;
    }>,
  ): Promise<StockValidationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "validateSaleStock",
        params: { items },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to validate sale stock");
    } catch (error: any) {
      throw new Error(error.message || "Failed to validate sale stock");
    }
  }

  // 🧾 RECEIPT & INVOICE

  async generateReceipt(sale_id: number): Promise<ReceiptResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "generateReceipt",
        params: { sale_id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to generate receipt");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate receipt");
    }
  }

  async reprintReceipt(receipt_number: string): Promise<ReceiptResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "reprintReceipt",
        params: { receipt_number },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to reprint receipt");
    } catch (error: any) {
      throw new Error(error.message || "Failed to reprint receipt");
    }
  }

  async generateInvoice(sale_id: number): Promise<ReceiptResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "generateInvoice",
        params: { sale_id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to generate invoice");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate invoice");
    }
  }

  // 💰 PAYMENT PROCESSING

  async processPayment(params: {
    sale_id: number;
    payment_method: string;
    amount_paid: number;
    change?: number;
    transaction_id?: string;
    payment_notes?: string;
  }): Promise<PaymentResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "processPayment",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to process payment");
    } catch (error: any) {
      throw new Error(error.message || "Failed to process payment");
    }
  }

  async applyDiscount(params: {
    sale_id: number;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    apply_to?: "total" | "items";
    item_discounts?: Array<{
      item_id: number;
      discount_value: number;
      reason?: string;
    }>;
    reason?: string;
  }): Promise<DiscountResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "applyDiscount",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to apply discount");
    } catch (error: any) {
      throw new Error(error.message || "Failed to apply discount");
    }
  }

  async addTax(
    sale_id: number,
    tax_details: {
      tax_rate: number;
      tax_amount: number;
      tax_type?: string;
    },
  ): Promise<SaleOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sale) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sale({
        method: "addTax",
        params: { sale_id, tax_details },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to add tax");
    } catch (error: any) {
      throw new Error(error.message || "Failed to add tax");
    }
  }

  // Utility methods

  async getSaleSummary(sale_id: number): Promise<{
    total_items: number;
    total_quantity: number;
    average_price: number;
    warehouse?: string;
  }> {
    try {
      const response = await this.getSaleById(sale_id);
      if (response.status && response.data.items) {
        const items = response.data.items;
        return {
          total_items: items.length,
          total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
          average_price:
            items.reduce((sum, item) => sum + item.unit_price, 0) /
            items.length,
          warehouse: response.data.warehouse_name || undefined,
        };
      }
      throw new Error("Failed to get sale summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get sale summary");
    }
  }

  async getTodaysSales(warehouse_id?: number): Promise<SalesResponse> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const filters = warehouse_id ? { warehouse_id } : undefined;
      return await this.getSalesByDateRange(today, today, filters);
    } catch (error: any) {
      throw new Error(error.message || "Failed to get today's sales");
    }
  }

  async getSalesByCurrentUser(warehouse_id?: number): Promise<SalesResponse> {
    try {
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        const filters = warehouse_id ? { warehouse_id } : undefined;
        return await this.getSalesByUser(currentUser.id, filters);
      }
      return {
        status: false,
        message: "No current user found",
        data: [],
      };
    } catch (error: any) {
      throw new Error(error.message || "Failed to get sales by current user");
    }
  }

  async getCurrentUser(): Promise<{ id: number; username: string } | null> {
    try {
      if (window.backendAPI && window.backendAPI.user) {
        const response = await window.backendAPI.user({
          method: "getCurrentUser",
        });
        return response.data;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async checkSaleEligibilityForRefund(sale_id: number): Promise<{
    eligible: boolean;
    reason?: string;
    max_refundable_amount?: number;
    items_eligible_for_refund?: Array<{
      item_id: number;
      product_id: number;
      max_quantity: number;
      refund_amount: number;
    }>;
  }> {
    try {
      const response = await this.getSaleById(sale_id);
      if (!response.status) {
        throw new Error("Failed to get sale");
      }

      const sale = response.data;

      if (sale.status === "cancelled") {
        return {
          eligible: false,
          reason: "Sale is already cancelled",
        };
      }

      if (sale.status === "refunded") {
        return {
          eligible: false,
          reason: "Sale is already fully refunded",
        };
      }

      const items = sale.items || [];
      const eligibleItems = items
        .filter((item) => item.quantity > item.returned_quantity)
        .map((item) => ({
          item_id: item.id,
          product_id: item.product_id,
          max_quantity: item.quantity - item.returned_quantity,
          refund_amount:
            item.unit_price * (item.quantity - item.returned_quantity) -
            item.discount_amount *
              ((item.quantity - item.returned_quantity) / item.quantity),
        }));

      if (eligibleItems.length === 0) {
        return {
          eligible: false,
          reason: "No items available for refund",
        };
      }

      const max_refundable_amount = eligibleItems.reduce(
        (sum, item) => sum + item.refund_amount,
        0,
      );

      return {
        eligible: true,
        max_refundable_amount,
        items_eligible_for_refund: eligibleItems,
      };
    } catch (error: any) {
      throw new Error(error.message || "Failed to check sale eligibility");
    }
  }

  async getSaleTimeline(sale_id: number): Promise<
    Array<{
      timestamp: string;
      action: string;
      details: string;
      user?: { id: number; username: string };
    }>
  > {
    try {
      const sale = await this.getSaleById(sale_id);
      if (!sale.status) {
        throw new Error("Failed to get sale");
      }

      const timeline = [];

      // Add creation
      timeline.push({
        timestamp: sale.data.created_at,
        action: "created",
        details: `Sale created with reference number: ${sale.data.reference_number}`,
      });

      // Add payment if exists
      if (sale.data.paid_at) {
        timeline.push({
          timestamp: sale.data.paid_at,
          action: "payment",
          details: `Payment processed via ${sale.data.payment_method}, Amount: ${sale.data.amount_paid}`,
        });
      }

      // Add cancellation if exists
      if (sale.data.cancelled_at) {
        timeline.push({
          timestamp: sale.data.cancelled_at,
          action: "cancelled",
          details: `Sale cancelled: ${sale.data.cancellation_reason}`,
        });
      }

      // Add refund if exists
      if (sale.data.refunded_at) {
        timeline.push({
          timestamp: sale.data.refunded_at,
          action: "refunded",
          details: `Sale refunded: ₱${sale.data.refund_amount}`,
        });
      }

      // Sort by timestamp
      timeline.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

      return timeline;
    } catch (error: any) {
      throw new Error(error.message || "Failed to get sale timeline");
    }
  }

  async exportSalesToCSV(filters: {
    start_date?: string;
    end_date?: string;
    user_id?: number;
    status?: string;
    warehouse_id?: number; // ADDED: warehouse filter
  }): Promise<{ url: string; filename: string }> {
    try {
      const response = await this.findPage(filters, 1, 1000);
      if (!response.status) {
        throw new Error("Failed to fetch sales for export");
      }

      // Convert sales to CSV format
      const sales = response.data;
      const headers = [
        "ID",
        "Date",
        "Reference",
        "Customer",
        "Total",
        "Status",
        "Payment Method",
        "Items Count",
        "Warehouse",
      ];
      const rows = sales.map((sale) => [
        sale.id,
        sale.datetime,
        sale.reference_number || "",
        sale.customer_name || "Walk-in",
        sale.total,
        sale.status,
        sale.payment_method,
        sale.items?.length || 0,
        sale.warehouse_name || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      // Create blob and download URL
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const filename = `sales_export_${new Date().toISOString().split("T")[0]}.csv`;

      return { url, filename };
    } catch (error: any) {
      throw new Error(error.message || "Failed to export sales to CSV");
    }
  }
}

const saleAPI = new SaleAPI();

export default saleAPI;
