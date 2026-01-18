// inventoryTransactionAPI.ts - Frontend API for Inventory Transaction Management

import type { Product } from "./product";


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
  location_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  product?: Product | null;
  performed_by?: any; // User object if populated
  location?: any; // Location object if populated
}

export interface InventoryAction {
  ORDER_ALLOCATION: "order_allocation";
  ORDER_CANCELLATION: "order_cancellation";
  ORDER_CONFIRMATION: "order_confirmation";
  ORDER_COMPLETED: "order_completed";
  ORDER_REFUND: "order_refund";
  MANUAL_ADJUSTMENT: "manual_adjustment";
  RETURN: "return";
  TRANSFER_IN: "transfer_in";
  TRANSFER_OUT: "transfer_out";
  DAMAGE: "damage";
  REPLENISHMENT: "replenishment";
  STOCK_TAKE: "stock_take";
  EXPIRY: "expiry";
  FOUND: "found";
  THEFT: "theft";
  CORRECTION: "correction";
  QUICK_INCREASE: "quick_increase";
  QUICK_DECREASE: "quick_decrease";
  BULK_INCREASE: "bulk_increase";
  BULK_DECREASE: "bulk_decrease";
  VARIANT_ADJUSTMENT: "variant_adjustment";
  QUARANTINE: "quarantine";
  CONSIGNMENT: "consignment";
  DONATION: "donation";
  PRODUCTION: "production";
  RECALL: "recall";
  PURCHASE_RECEIVE: "purchase_receive";
  PURCHASE_CANCEL: "purchase_cancel";
  SALE: "sale";
  PRICE_CHANGE: "price_change";
  STOCK_SYNC: "stock_sync";
  CATEGORY_CHANGE: "category_change";
  SUPPLIER_CHANGE: "supplier_change";
  PRODUCT_CREATED: "product_created";
  PRODUCT_UPDATED: "product_updated";
  PRODUCT_ARCHIVED: "product_archived";
  PRODUCT_RESTORED: "product_restored";
}

export interface TransactionSummary {
  total_transactions: number;
  total_increase: number;
  total_decrease: number;
  net_change: number;
  average_change: number;
  unique_products: number;
  unique_users: number;
  total_monetary_impact: number;
  first_transaction_date?: string;
  last_transaction_date?: string;
}

export interface ActionBreakdown {
  [action: string]: {
    count: number;
    total_change: number;
    average_change: number;
    transactions?: number[];
  };
}

export interface ProductMovement {
  product_id: string | number;
  product_name: string;
  transactions: number;
  total_change: number;
  increase: number;
  decrease: number;
  average_change: number;
}

export interface DailyTrend {
  date: string;
  transactions: number;
  increase: number;
  decrease: number;
  net_change: number;
  unique_products: number;
}

export interface MonthlyTrend {
  month: string;
  transactions: number;
  increase: number;
  decrease: number;
  net_change: number;
}

export interface UserActivityMetrics {
  total_transactions: number;
  first_transaction: string;
  last_transaction: string;
  days_active: number;
  total_increase: number;
  total_decrease: number;
  net_change: number;
  unique_products: number;
  unique_locations: number;
  total_monetary_impact: number;
  transactions_per_day: number;
}

export interface SearchInsight {
  type: string;
  message: string;
  priority: 'info' | 'low' | 'medium' | 'high';
  data?: Record<string, any>;
}

export interface TransactionClassification {
  type: 'stock_increase' | 'stock_decrease' | 'stock_adjustment' | 'price_change' | 'product_change' | 'other';
  is_increase: boolean;
  is_decrease: boolean;
  is_price_change: boolean;
  is_stock_change: boolean;
}

export interface TransactionImpact {
  stock_change_percentage: number;
  price_change_percentage: number | null;
  monetary_value_change: number;
}

export interface InventoryMovementReport {
  transactions: InventoryTransactionLog[];
  summary: TransactionSummary;
  action_summary: ActionBreakdown;
  daily_trend: DailyTrend[];
  top_products: {
    by_change: ProductMovement[];
    by_transactions: ProductMovement[];
  };
  filters_applied: Record<string, any>;
}

export interface StockAdjustmentSummary {
  period: {
    start: string;
    end: string;
    days: number;
  };
  adjustments: {
    total: number;
    manual: number;
    quick: number;
    bulk: number;
    other: number;
  };
  impact: {
    total_increase: number;
    total_decrease: number;
    net_change: number;
    monetary_impact: number;
  };
  top_adjusted_products: ProductMovement[];
  recent_adjustments: InventoryTransactionLog[];
}

export interface TransactionStatistics {
  timeframe: {
    start?: string;
    end?: string;
    period: string;
  };
  volume: {
    total_transactions: number;
    transactions_per_day: number;
    peak_day: {
      date: string;
      count: number;
    };
  };
  actions: {
    most_common: string;
    least_common: string;
    distribution: Array<{
      action: string;
      count: number;
      percentage: number;
    }>;
  };
  products: {
    most_active: Array<{
      product_id: string | number;
      product_name: string;
      transactions: number;
    }>;
    unique_products: number;
  };
  users: {
    most_active: Array<{
      user_id: string | number;
      username: string;
      transactions: number;
    }>;
    unique_users: number;
  };
  impact: {
    total_stock_movement: number;
    average_daily_change: number;
    largest_increase: number;
    largest_decrease: number;
  };
}

export interface TransactionSearchResults {
  results: InventoryTransactionLog[];
  grouped_results: {
    product_matches: InventoryTransactionLog[];
    user_matches: InventoryTransactionLog[];
    reference_matches: InventoryTransactionLog[];
    note_matches: InventoryTransactionLog[];
    other_matches: InventoryTransactionLog[];
  };
  search_stats: {
    total_results: number;
    by_action: Record<string, number>;
    by_change_type: {
      increase: number;
      decrease: number;
      no_change: number;
    };
    by_product: Record<string, number>;
    by_user: Record<string, number>;
  };
  search_insights: SearchInsight[];
  search_criteria: {
    query: string | null;
    filters_applied: string[];
  };
}

export interface TransactionByProductResponse {
  product_info: Product;
  transactions: InventoryTransactionLog[];
  summary: TransactionSummary;
  action_breakdown: ActionBreakdown;
  monthly_trend: MonthlyTrend[];
  recent_transactions: any[];
  filters_applied: Record<string, any>;
}

export interface TransactionByUserResponse {
  user_info: {
    id: number;
    username: string;
    display_name: string;
    role: string;
    employee_id?: string;
    department?: string;
  };
  transactions: InventoryTransactionLog[];
  user_metrics: UserActivityMetrics;
  action_breakdown: ActionBreakdown;
  product_activity: Record<string, ProductMovement>;
  top_products: ProductMovement[];
  activity_trend: DailyTrend[];
  recent_activity: any[];
  insights: SearchInsight[];
  period: string;
}

export interface TransactionByActionResponse {
  action: string;
  action_description: string;
  transactions: InventoryTransactionLog[];
  summary: TransactionSummary;
  insights: SearchInsight[];
  product_breakdown: Record<string, ProductMovement>;
  top_products: ProductMovement[];
  date_trend: DailyTrend[];
  recent_transactions: any[];
  filters_applied: Record<string, any>;
}

export interface TransactionByDateRangeResponse {
  transactions: InventoryTransactionLog[];
  summary: TransactionSummary;
  date_range: {
    start: string;
    end: string;
    days: number;
  };
  action_summary: ActionBreakdown;
  daily_trend: DailyTrend[];
  top_products: {
    by_change: ProductMovement[];
    by_transactions: ProductMovement[];
  };
  filters_applied: Record<string, any>;
}

export interface TransactionDetailResponse {
  transaction: InventoryTransactionLog;
  impact: TransactionImpact;
  classification: TransactionClassification;
  context: {
    performed_by: any | null;
    location: any | null;
    product: any | null;
  };
}

// 📦 BASE RESPONSE INTERFACES
export interface BaseResponse {
  status: boolean;
  message: string;
  data: any;
}

export interface TransactionLogResponse extends BaseResponse {
  data: {
    transaction_log: InventoryTransactionLog;
    product_update: {
      previous_stock: number;
      new_stock: number;
      stock_change: number;
    };
  };
}

export interface BulkTransactionLogResponse extends BaseResponse {
  data: {
    summary: {
      total: number;
      successful: number;
      failed: number;
      success_rate: number;
    };
    details: {
      successful: Array<{
        index: number;
        transaction_id: number;
        product_id: number;
        action: string;
        change_amount: number;
      }>;
      failed: Array<{
        index: number;
        product_id: number;
        error: string;
      }>;
      product_updates: Array<{
        product_id: number;
        product_name: string;
        previous_stock: number;
        new_stock: number;
        stock_change: number;
      }>;
    };
  };
}

export interface TransactionByIdResponse extends BaseResponse {
  data: TransactionDetailResponse;
}

export interface TransactionsByProductResponse extends BaseResponse {
  data: TransactionByProductResponse;
}

export interface TransactionsByUserResponse extends BaseResponse {
  data: TransactionByUserResponse;
}

export interface TransactionsByActionResponse extends BaseResponse {
  data: TransactionByActionResponse;
}

export interface TransactionsByDateRangeResponse extends BaseResponse {
  data: TransactionByDateRangeResponse;
}

export interface TransactionSearchResponse extends BaseResponse {
  data: TransactionSearchResults;
}

export interface InventoryMovementReportResponse extends BaseResponse {
  data: InventoryMovementReport;
}

export interface StockAdjustmentSummaryResponse extends BaseResponse {
  data: StockAdjustmentSummary;
}

export interface TransactionStatisticsResponse extends BaseResponse {
  data: TransactionStatistics;
}

export interface PaginatedTransactionResponse {
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
  data: InventoryTransactionLog[];
}

export interface TransactionPayload {
  method: string;
  params?: Record<string, any>;
}

class InventoryTransactionAPI {
  // 📦 TRANSACTION LOGGING

  /**
   * Create a single transaction log
   */
  async createTransactionLog(params: {
    product_id: number;
    action: string;
    change_amount: number;
    quantity_before: number;
    quantity_after: number;
    price_before?: number | null;
    price_after?: number | null;
    reference_id?: string | null;
    reference_type?: string | null;
    notes?: string;
    location_id?: string | null;
    batch_number?: string | null;
    expiry_date?: string | null;
  }): Promise<TransactionLogResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.inventoryTransaction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.inventoryTransaction({
        method: "createTransactionLog",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create transaction log");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create transaction log");
    }
  }

  /**
   * Create bulk transaction logs
   */
  async createBulkTransactionLog(params: {
    transactions: Array<{
      product_id: number;
      action: string;
      change_amount: number;
      quantity_before: number;
      quantity_after: number;
      price_before?: number | null;
      price_after?: number | null;
      reference_id?: string | null;
      reference_type?: string | null;
      notes?: string;
      location_id?: string | null;
      batch_number?: string | null;
      expiry_date?: string | null;
    }>;
    bulk_action?: string | null;
    bulk_reference_id?: string | null;
    bulk_reference_type?: string | null;
    bulk_notes?: string;
  }): Promise<BulkTransactionLogResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.inventoryTransaction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.inventoryTransaction({
        method: "createBulkTransactionLog",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create bulk transaction logs");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create bulk transaction logs");
    }
  }

  // 📋 READ-ONLY OPERATIONS

  /**
   * Get transaction log by ID
   */
  async getTransactionLogById(id: number): Promise<TransactionByIdResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.inventoryTransaction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.inventoryTransaction({
        method: "getTransactionLogById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get transaction log");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get transaction log");
    }
  }

  /**
   * Get transaction logs by product
   */
  async getTransactionLogsByProduct(
    productId: number,
    filters?: {
      start_date?: string;
      end_date?: string;
      action?: string;
      reference_type?: string;
      user_id?: number;
      change_type?: 'increase' | 'decrease';
      limit?: number;
      offset?: number;
    }
  ): Promise<TransactionsByProductResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.inventoryTransaction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.inventoryTransaction({
        method: "getTransactionLogsByProduct",
        params: { product_id: productId, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get transaction logs by product");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get transaction logs by product");
    }
  }

  /**
   * Get transaction logs by date range
   */
  async getTransactionLogsByDateRange(
    startDate: string,
    endDate: string,
    filters?: {
      product_id?: number;
      action?: string;
      reference_type?: string;
      user_id?: number;
      location_id?: string;
      change_type?: 'increase' | 'decrease' | 'no_change';
      min_change_amount?: number;
      limit?: number;
      offset?: number;
    }
  ): Promise<TransactionsByDateRangeResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.inventoryTransaction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.inventoryTransaction({
        method: "getTransactionLogsByDateRange",
        params: { start_date: startDate, end_date: endDate, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get transaction logs by date range");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get transaction logs by date range");
    }
  }

  /**
   * Get transaction logs by action
   */
  async getTransactionLogsByAction(
    action: string,
    filters?: {
      start_date?: string;
      end_date?: string;
      product_id?: number;
      reference_type?: string;
      user_id?: number;
      location_id?: string;
      min_change_amount?: number;
      limit?: number;
      offset?: number;
    }
  ): Promise<TransactionsByActionResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.inventoryTransaction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.inventoryTransaction({
        method: "getTransactionLogsByAction",
        params: { action, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get transaction logs by action");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get transaction logs by action");
    }
  }

  /**
   * Get transaction logs by user
   */
  async getTransactionLogsByUser(
    userId: number,
    filters?: {
      start_date?: string;
      end_date?: string;
      action?: string;
      product_id?: number;
      location_id?: string;
      change_type?: 'increase' | 'decrease' | 'no_change';
      limit?: number;
    }
  ): Promise<TransactionsByUserResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.inventoryTransaction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.inventoryTransaction({
        method: "getTransactionLogsByUser",
        params: { user_id: userId, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get transaction logs by user");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get transaction logs by user");
    }
  }

  /**
   * Search transaction logs
   */
  async searchTransactionLogs(
    query?: string,
    filters?: {
      start_date?: string;
      end_date?: string;
      product_id?: number;
      action?: string;
      reference_type?: string;
      user_id?: number;
      location_id?: string;
      change_type?: 'increase' | 'decrease' | 'no_change';
      min_change_amount?: number;
      max_change_amount?: number;
    }
  ): Promise<TransactionSearchResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.inventoryTransaction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.inventoryTransaction({
        method: "searchTransactionLogs",
        params: { query, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search transaction logs");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search transaction logs");
    }
  }

  // 📊 REPORTING & ANALYTICS

  /**
   * Get inventory movement report
   */
  async getInventoryMovementReport(
    filters?: {
      start_date?: string;
      end_date?: string;
      product_id?: number;
      action?: string;
      user_id?: number;
      location_id?: string;
      change_type?: 'increase' | 'decrease' | 'no_change';
      min_change_amount?: number;
    }
  ): Promise<InventoryMovementReportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.inventoryTransaction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.inventoryTransaction({
        method: "getInventoryMovementReport",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get inventory movement report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get inventory movement report");
    }
  }

  /**
   * Get stock adjustment summary
   */
  async getStockAdjustmentSummary(
    filters?: {
      start_date?: string;
      end_date?: string;
      product_id?: number;
      user_id?: number;
      location_id?: string;
    }
  ): Promise<StockAdjustmentSummaryResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.inventoryTransaction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.inventoryTransaction({
        method: "getStockAdjustmentSummary",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get stock adjustment summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get stock adjustment summary");
    }
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStatistics(
    filters?: {
      start_date?: string;
      end_date?: string;
      product_id?: number;
      action?: string;
      user_id?: number;
      location_id?: string;
    }
  ): Promise<TransactionStatisticsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.inventoryTransaction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.inventoryTransaction({
        method: "getTransactionStatistics",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get transaction statistics");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get transaction statistics");
    }
  }

  // 🔄 PAGINATION METHODS

  /**
   * Get paginated transaction logs
   */
  async findPage(
    filters: {
      start_date?: string;
      end_date?: string;
      product_id?: number;
      action?: string;
      reference_type?: string;
      user_id?: number;
      location_id?: string;
      change_type?: 'increase' | 'decrease' | 'no_change';
      min_change_amount?: number;
      search?: string;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    } = {},
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedTransactionResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.inventoryTransaction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.inventoryTransaction({
        method: "searchTransactionLogs",
        params: {
          ...filters,
          limit: pageSize,
          offset: (page - 1) * pageSize,
        },
      });

      // Transform the response to match paginated structure
      if (response.status) {
        return {
          status: true,
          message: response.message,
          pagination: {
            count: response.data?.results?.length || 0,
            current_page: page,
            total_pages: Math.ceil((response.data?.results?.length || 0) / pageSize),
            page_size: pageSize,
            next: page * pageSize < (response.data?.results?.length || 0),
            previous: page > 1,
          },
          data: response.data?.results || [],
        };
      }
      throw new Error(response.message || "Failed to get paginated transaction logs");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get paginated transaction logs");
    }
  }

  // 🛠️ UTILITY METHODS

  /**
   * Get all valid actions
   */
  getAllActions(): Record<string, string> {
    return {
      ORDER_ALLOCATION: "order_allocation",
      ORDER_CANCELLATION: "order_cancellation",
      ORDER_CONFIRMATION: "order_confirmation",
      ORDER_COMPLETED: "order_completed",
      ORDER_REFUND: "order_refund",
      MANUAL_ADJUSTMENT: "manual_adjustment",
      RETURN: "return",
      TRANSFER_IN: "transfer_in",
      TRANSFER_OUT: "transfer_out",
      DAMAGE: "damage",
      REPLENISHMENT: "replenishment",
      STOCK_TAKE: "stock_take",
      EXPIRY: "expiry",
      FOUND: "found",
      THEFT: "theft",
      CORRECTION: "correction",
      QUICK_INCREASE: "quick_increase",
      QUICK_DECREASE: "quick_decrease",
      BULK_INCREASE: "bulk_increase",
      BULK_DECREASE: "bulk_decrease",
      VARIANT_ADJUSTMENT: "variant_adjustment",
      QUARANTINE: "quarantine",
      CONSIGNMENT: "consignment",
      DONATION: "donation",
      PRODUCTION: "production",
      RECALL: "recall",
      PURCHASE_RECEIVE: "purchase_receive",
      PURCHASE_CANCEL: "purchase_cancel",
      SALE: "sale",
      PRICE_CHANGE: "price_change",
      STOCK_SYNC: "stock_sync",
      CATEGORY_CHANGE: "category_change",
      SUPPLIER_CHANGE: "supplier_change",
      PRODUCT_CREATED: "product_created",
      PRODUCT_UPDATED: "product_updated",
      PRODUCT_ARCHIVED: "product_archived",
      PRODUCT_RESTORED: "product_restored",
    };
  }

  /**
   * Get action description
   */
  getActionDescription(action: string): string {
    const descriptions: Record<string, string> = {
      'ORDER_ALLOCATION': 'Order allocation - stock reserved for customer order',
      'ORDER_CANCELLATION': 'Order cancellation - stock returned from cancelled order',
      'ORDER_CONFIRMATION': 'Order confirmation - stock confirmed for order',
      'ORDER_COMPLETED': 'Order completed - stock deducted for completed order',
      'ORDER_REFUND': 'Order refund - stock returned from refund',
      'MANUAL_ADJUSTMENT': 'Manual adjustment - stock manually adjusted',
      'RETURN': 'Return - customer return of products',
      'TRANSFER_IN': 'Transfer in - stock received from transfer',
      'TRANSFER_OUT': 'Transfer out - stock sent in transfer',
      'DAMAGE': 'Damage - stock marked as damaged',
      'REPLENISHMENT': 'Replenishment - stock received from supplier',
      'STOCK_TAKE': 'Stock take - stock adjustment from inventory count',
      'EXPIRY': 'Expiry - stock expired and removed',
      'FOUND': 'Found - previously missing stock found',
      'THEFT': 'Theft - stock lost to theft',
      'CORRECTION': 'Correction - stock correction',
      'QUICK_INCREASE': 'Quick increase - quick stock increase',
      'QUICK_DECREASE': 'Quick decrease - quick stock decrease',
      'BULK_INCREASE': 'Bulk increase - bulk stock increase',
      'BULK_DECREASE': 'Bulk decrease - bulk stock decrease',
      'VARIANT_ADJUSTMENT': 'Variant adjustment - stock adjustment between variants',
      'QUARANTINE': 'Quarantine - stock placed in quarantine',
      'CONSIGNMENT': 'Consignment - stock on consignment',
      'DONATION': 'Donation - stock donated',
      'PRODUCTION': 'Production - stock from production',
      'RECALL': 'Recall - stock recalled',
      'PURCHASE_RECEIVE': 'Purchase receive - stock received from purchase',
      'PURCHASE_CANCEL': 'Purchase cancel - purchase cancelled',
      'SALE': 'Sale - stock sold to customer',
      'PRICE_CHANGE': 'Price change - product price changed',
      'STOCK_SYNC': 'Stock sync - stock synchronized',
      'CATEGORY_CHANGE': 'Category change - product category changed',
      'SUPPLIER_CHANGE': 'Supplier change - product supplier changed',
      'PRODUCT_CREATED': 'Product created - new product created',
      'PRODUCT_UPDATED': 'Product updated - product details updated',
      'PRODUCT_ARCHIVED': 'Product archived - product archived',
      'PRODUCT_RESTORED': 'Product restored - product restored from archive',
    };
    
    return descriptions[action] || action;
  }

  /**
   * Determine transaction type
   */
  getTransactionType(action: string): TransactionClassification['type'] {
    const increaseActions = [
      'RETURN', 'TRANSFER_IN', 'REPLENISHMENT', 'FOUND',
      'QUICK_INCREASE', 'BULK_INCREASE', 'PURCHASE_RECEIVE'
    ];
    
    const decreaseActions = [
      'SALE', 'ORDER_ALLOCATION', 'ORDER_CANCELLATION', 'TRANSFER_OUT',
      'DAMAGE', 'THEFT', 'EXPIRY', 'QUICK_DECREASE', 'BULK_DECREASE',
      'PURCHASE_CANCEL'
    ];
    
    const adjustmentActions = [
      'MANUAL_ADJUSTMENT', 'STOCK_TAKE', 'CORRECTION',
      'VARIANT_ADJUSTMENT', 'STOCK_SYNC'
    ];
    
    const priceActions = ['PRICE_CHANGE'];
    
    const productActions = [
      'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_ARCHIVED', 'PRODUCT_RESTORED',
      'CATEGORY_CHANGE', 'SUPPLIER_CHANGE'
    ];

    if (increaseActions.includes(action)) return 'stock_increase';
    if (decreaseActions.includes(action)) return 'stock_decrease';
    if (adjustmentActions.includes(action)) return 'stock_adjustment';
    if (priceActions.includes(action)) return 'price_change';
    if (productActions.includes(action)) return 'product_change';
    
    return 'other';
  }

  /**
   * Calculate transaction impact
   */
  calculateTransactionImpact(transaction: InventoryTransactionLog): TransactionImpact {
    const stockChangePercentage = transaction.quantity_before > 0 ? 
      (transaction.change_amount / transaction.quantity_before) * 100 : 0;
    
    const priceChangePercentage = transaction.price_before && transaction.price_after && transaction.price_before > 0 ?
      ((transaction.price_after - transaction.price_before) / transaction.price_before) * 100 : null;
    
    const monetaryValueChange = transaction.change_amount * (transaction.price_before || 0);

    return {
      stock_change_percentage: stockChangePercentage,
      price_change_percentage: priceChangePercentage,
      monetary_value_change: monetaryValueChange,
    };
  }

  /**
   * Validate transaction data
   */
  validateTransactionData(transaction: Partial<InventoryTransactionLog>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!transaction.product_id) errors.push("Product ID is required");
    if (!transaction.action) errors.push("Action is required");
    if (transaction.change_amount === undefined) errors.push("Change amount is required");
    if (transaction.quantity_before === undefined) errors.push("Quantity before is required");
    if (transaction.quantity_after === undefined) errors.push("Quantity after is required");

    // Validate quantity consistency
    if (transaction.quantity_before !== undefined && 
        transaction.change_amount !== undefined && 
        transaction.quantity_after !== undefined) {
      const expected = transaction.quantity_before + transaction.change_amount;
      if (transaction.quantity_after !== expected) {
        errors.push(`Quantity inconsistency. Expected: ${expected}, Provided: ${transaction.quantity_after}`);
      }
    }

    // Validate action
    const validActions = Object.values(this.getAllActions());
    if (transaction.action && !validActions.includes(transaction.action)) {
      errors.push(`Invalid action: ${transaction.action}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate transaction summary
   */
  generateTransactionSummary(transactions: InventoryTransactionLog[]): TransactionSummary {
    const totalIncrease = transactions
      .filter(t => t.change_amount > 0)
      .reduce((sum, t) => sum + t.change_amount, 0);
    
    const totalDecrease = Math.abs(transactions
      .filter(t => t.change_amount < 0)
      .reduce((sum, t) => sum + t.change_amount, 0));
    
    const netChange = transactions.reduce((sum, t) => sum + t.change_amount, 0);
    
    const totalMonetaryImpact = transactions.reduce((sum, t) => 
      sum + (t.change_amount * (t.price_before || 0)), 0);

    return {
      total_transactions: transactions.length,
      total_increase: totalIncrease,
      total_decrease: totalDecrease,
      net_change: netChange,
      average_change: transactions.length > 0 ? netChange / transactions.length : 0,
      unique_products: new Set(transactions.map(t => t.product_id)).size,
      unique_users: new Set(transactions.map(t => t.performed_by_id)).size,
      total_monetary_impact: totalMonetaryImpact,
      first_transaction_date: transactions.length > 0 
        ? transactions[transactions.length - 1].created_at 
        : undefined,
      last_transaction_date: transactions.length > 0 
        ? transactions[0].created_at 
        : undefined,
    };
  }

  /**
   * Quick search transactions
   */
  async quickSearch(query: string, limit: number = 20): Promise<InventoryTransactionLog[]> {
    try {
      const response = await this.searchTransactionLogs(query, {});
      return response.data?.results?.slice(0, limit) || [];
    } catch (error) {
      console.error("Quick search error:", error);
      return [];
    }
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(limit: number = 10): Promise<InventoryTransactionLog[]> {
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // Last 30 days
      
      const response = await this.getTransactionLogsByDateRange(startDate, endDate, { limit });
      return response.data?.transactions?.slice(0, limit) || [];
    } catch (error) {
      console.error("Failed to get recent transactions:", error);
      return [];
    }
  }

  /**
   * Get product transaction history
   */
  async getProductTransactionHistory(productId: number, limit: number = 50): Promise<InventoryTransactionLog[]> {
    try {
      const response = await this.getTransactionLogsByProduct(productId, { limit });
      return response.data?.transactions || [];
    } catch (error) {
      console.error("Failed to get product transaction history:", error);
      return [];
    }
  }

  /**
   * Get user transaction activity
   */
  async getUserTransactionActivity(userId: number, days: number = 30): Promise<UserActivityMetrics | null> {
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await this.getTransactionLogsByUser(userId, { 
        start_date: startDate, 
        end_date: endDate 
      });
      
      return response.data?.user_metrics || null;
    } catch (error) {
      console.error("Failed to get user transaction activity:", error);
      return null;
    }
  }
}

const inventoryTransactionAPI = new InventoryTransactionAPI();

export default inventoryTransactionAPI;