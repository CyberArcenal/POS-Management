// saleItemAPI.ts - Frontend API for Sale Item Management

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  discount_percentage: number | null;
  price_before_discount: number;
  cost_price: number;
  profit: number | null;
  returned_quantity: number;
  is_returned: boolean;
  return_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  sale?: Sale;
  product?: Product;
  variant?: Variant;
  stock_item?: StockItem;
}

export interface Sale {
  id: number;
  reference_number: string;
  customer_id: number | null;
  user_id: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  total: number;
  tax_amount: number;
  discount_amount: number;
  payment_method: string;
  payment_status: string;
  notes: string | null;
  datetime: string;
  refund_amount: number | null;
  refunded_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  category_id: number;
  category_name: string;
  brand: string | null;
  description: string | null;
  unit: string;
  price: number;
  cost_price: number;
  stock: number;
  min_stock: number;
  reorder_level: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Variant {
  id: number;
  product_id: number;
  name: string;
  sku: string;
  barcode: string | null;
  price: number;
  cost_price: number;
  stock: number;
  attributes: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockItem {
  id: number;
  product_id: number;
  variant_id: number | null;
  warehouse_id: number;
  quantity: number;
  reserved_quantity: number;
  reorder_point: number;
  created_at: string;
  updated_at: string;
}

export interface SaleItemSummary {
  total_items: number;
  total_quantity: number;
  total_revenue: number;
  total_discount: number;
  total_profit: number;
  returned_quantity: number;
  returned_items: number;
  average_price: number;
}

export interface SaleItemAdjustment {
  previous_quantity: number;
  new_quantity: number;
  quantity_difference: number;
  previous_total: number;
  new_total: number;
  stock_adjusted: number;
  adjustment_type: 'increase' | 'decrease';
}

export interface SaleItemReturn {
  return_quantity: number;
  refund_amount: number;
  reason: string;
  stock_restored: number;
  is_fully_returned: boolean;
}

export interface ProductSalesSummary {
  product_id: number;
  product_name: string;
  quantity: number;
  revenue: number;
  profit: number;
}

export interface DailySalesTrend {
  date: string;
  items: number;
  quantity: number;
  revenue: number;
}

export interface SaleItemFilters {
  start_date?: string;
  end_date?: string;
  product_id?: number;
  category_name?: string;
  min_quantity?: number;
  max_quantity?: number;
  returned_only?: boolean;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CategoryBreakdown {
  [category: string]: {
    items: number;
    quantity: number;
    amount: number;
    profit: number;
  };
}

export interface PaginatedSaleItems {
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
  data: SaleItem[];
}

export interface SaleItemResponse {
  status: boolean;
  message: string;
  data: SaleItem;
}

export interface SaleItemsResponse {
  status: boolean;
  message: string;
  data: SaleItem[];
}

export interface SaleItemDetailResponse {
  status: boolean;
  message: string;
  data: {
    sale_item: SaleItem;
    profitability: {
      profit_percentage: number;
      profit_per_unit: number;
    };
    item_summary: {
      quantity: number;
      unit_price: number;
      discount: number;
      total: number;
      cost_price: number;
      profit: number | null;
      returned_quantity: number;
      is_returned: boolean;
    };
  };
}

export interface SaleItemBySaleResponse {
  status: boolean;
  message: string;
  data: {
    sale_info: {
      id: number;
      reference_number: string;
      status: string;
      total: number;
      datetime: string;
    };
    items: SaleItem[];
    summary: SaleItemSummary;
    category_breakdown: CategoryBreakdown;
  };
}

export interface SaleItemByDateRangeResponse {
  status: boolean;
  message: string;
  data: {
    items: SaleItem[];
    summary: SaleItemSummary;
    date_range: {
      start: string;
      end: string;
      days: number;
    };
    top_products: ProductSalesSummary[];
    daily_trend: DailySalesTrend[];
    filters_applied: SaleItemFilters;
  };
}

export interface SaleItemByProductResponse {
  status: boolean;
  message: string;
  data: {
    product_info: Product;
    items: SaleItem[];
    summary: SaleItemSummary & {
      total_sales: number;
      average_quantity_per_sale: number;
    };
    monthly_trend: Record<string, {
      quantity: number;
      revenue: number;
      sales_count: number;
    }>;
    recent_sales: Array<{
      id: number;
      sale_id: number;
      sale_date: string | null;
      quantity: number;
      unit_price: number;
      total_price: number;
      discount: number;
      profit: number | null;
    }>;
    filters_applied: SaleItemFilters;
  };
}

export interface SaleItemAdjustmentResponse {
  status: boolean;
  message: string;
  data: {
    sale_item: SaleItem;
    adjustment_details: SaleItemAdjustment;
    sale_total_update: {
      previous_total: number;
      new_total: number;
    };
  };
}

export interface SaleItemReturnResponse {
  status: boolean;
  message: string;
  data: {
    sale_item: SaleItem;
    return_details: SaleItemReturn;
    sale_status_update: string;
  };
}

export interface SaleItemUpdateResponse {
  status: boolean;
  message: string;
  data: {
    sale_item: SaleItem;
    sale_total: number;
    updates_applied: Record<string, { from: any; to: any }>;
  };
}

export interface SaleItemDeleteResponse {
  status: boolean;
  message: string;
  data: {
    sale_id: number;
    deleted_item_total: number;
    new_sale_total: number;
    remaining_items_count: number;
    sale_empty: boolean;
  };
}

export interface SaleItemCreateResponse {
  status: boolean;
  message: string;
  data: {
    sale_item: SaleItem;
    sale_total: number;
  };
}

export interface SaleItemOperationResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    [key: string]: any;
  };
}

export interface SaleItemPayload {
  method: string;
  params?: Record<string, any>;
}

class SaleItemAPI {
  // 📋 READ-ONLY METHODS
  async getSaleItemById(id: number): Promise<SaleItemDetailResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.saleItem) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.saleItem({
        method: "getSaleItemById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get sale item");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get sale item");
    }
  }

  async getSaleItemsBySaleId(saleId: number): Promise<SaleItemBySaleResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.saleItem) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.saleItem({
        method: "getSaleItemsBySaleId",
        params: { sale_id: saleId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get sale items");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get sale items");
    }
  }

  async getSaleItemsByProductId(
    productId: number,
    filters?: SaleItemFilters
  ): Promise<SaleItemByProductResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.saleItem) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.saleItem({
        method: "getSaleItemsByProductId",
        params: { product_id: productId, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get sale items by product");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get sale items by product");
    }
  }

  async getSaleItemsByDateRange(
    startDate: string,
    endDate: string,
    filters?: SaleItemFilters
  ): Promise<SaleItemByDateRangeResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.saleItem) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.saleItem({
        method: "getSaleItemsByDateRange",
        params: { start_date: startDate, end_date: endDate, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get sale items by date range");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get sale items by date range");
    }
  }

  // 📦 CORE OPERATIONS
  async createSaleItem(params: {
    sale_id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    discount_amount?: number;
    variant_id?: number | null;
    notes?: string;
  }): Promise<SaleItemCreateResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.saleItem) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.saleItem({
        method: "createSaleItem",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create sale item");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create sale item");
    }
  }

  async updateSaleItem(params: {
    id: number;
    updates: {
      quantity?: number;
      unit_price?: number;
      discount_amount?: number;
      discount_percentage?: number;
      notes?: string;
      variant_id?: number | null;
    };
  }): Promise<SaleItemUpdateResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.saleItem) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.saleItem({
        method: "updateSaleItem",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update sale item");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update sale item");
    }
  }

  async deleteSaleItem(params: {
    id: number;
    reason?: string;
  }): Promise<SaleItemDeleteResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.saleItem) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.saleItem({
        method: "deleteSaleItem",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete sale item");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete sale item");
    }
  }

  // 🔄 RETURN & ADJUSTMENT OPERATIONS
  async returnSaleItem(params: {
    sale_item_id: number;
    return_quantity: number;
    reason?: string;
    refund_amount?: number | null;
  }): Promise<SaleItemReturnResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.saleItem) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.saleItem({
        method: "returnSaleItem",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to return sale item");
    } catch (error: any) {
      throw new Error(error.message || "Failed to return sale item");
    }
  }

  async adjustSaleItemQuantity(params: {
    sale_item_id: number;
    new_quantity: number;
    reason?: string;
  }): Promise<SaleItemAdjustmentResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.saleItem) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.saleItem({
        method: "adjustSaleItemQuantity",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to adjust sale item quantity");
    } catch (error: any) {
      throw new Error(error.message || "Failed to adjust sale item quantity");
    }
  }

  // 🔍 UTILITY METHODS
  async searchSaleItems(filters: SaleItemFilters & {
    search_term?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedSaleItems> {
    try {
      // This would need to be implemented in the backend if not already
      // For now, using date range with additional filters
      if (filters.start_date && filters.end_date) {
        const response = await this.getSaleItemsByDateRange(
          filters.start_date,
          filters.end_date,
          filters
        );
        
        // Convert to paginated response (simple implementation)
        const page = filters.page || 1;
        const pageSize = filters.page_size || 10;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        
        return {
          status: true,
          message: response.message,
          pagination: {
            count: response.data.items.length,
            current_page: page,
            total_pages: Math.ceil(response.data.items.length / pageSize),
            page_size: pageSize,
            next: endIndex < response.data.items.length,
            previous: page > 1,
          },
          data: response.data.items.slice(startIndex, endIndex),
        };
      }
      
      throw new Error("Date range is required for searching");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search sale items");
    }
  }

  async getSaleItemStatistics(params?: {
    start_date?: string;
    end_date?: string;
    product_id?: number;
    category_name?: string;
  }): Promise<{
    status: boolean;
    message: string;
    data: SaleItemSummary & {
      top_selling_products: ProductSalesSummary[];
      daily_trend: DailySalesTrend[];
    };
  }> {
    try {
      if (!params?.start_date || !params?.end_date) {
        // Get last 30 days if no date range provided
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        params = { ...params, start_date: startDate, end_date: endDate };
      }

      const response = await this.getSaleItemsByDateRange(
        params.start_date!,
        params.end_date!,
        {
          product_id: params.product_id,
          category_name: params.category_name,
        }
      );

      return {
        status: true,
        message: "Sale item statistics retrieved",
        data: {
          ...response.data.summary,
          top_selling_products: response.data.top_products,
          daily_trend: response.data.daily_trend,
        },
      };
    } catch (error: any) {
      throw new Error(error.message || "Failed to get sale item statistics");
    }
  }

  async validateSaleItemUpdate(params: {
    sale_item_id: number;
    new_quantity: number;
  }): Promise<{
    status: boolean;
    message: string;
    data: {
      valid: boolean;
      current_quantity: number;
      difference: number;
      stock_available?: number;
      error?: string;
    };
  }> {
    try {
      // First get current sale item
      const currentItem = await this.getSaleItemById(params.sale_item_id);
      
      if (!currentItem.status) {
        throw new Error(currentItem.message);
      }

      const currentQuantity = currentItem.data.sale_item.quantity;
      const difference = params.new_quantity - currentQuantity;
      
      // Check if quantity is valid
      if (params.new_quantity < 0) {
        return {
          status: true,
          message: "Validation failed",
          data: {
            valid: false,
            current_quantity: currentQuantity,
            difference,
            error: "New quantity cannot be negative",
          },
        };
      }

      // Check if quantity is the same
      if (difference === 0) {
        return {
          status: true,
          message: "Validation failed",
          data: {
            valid: false,
            current_quantity: currentQuantity,
            difference,
            error: "New quantity is the same as current quantity",
          },
        };
      }

      // For quantity increase, check stock if product exists
      if (difference > 0 && currentItem.data.sale_item.product) {
        const stock = currentItem.data.sale_item.product.stock;
        
        if (stock < difference) {
          return {
            status: true,
            message: "Validation failed",
            data: {
              valid: false,
              current_quantity: currentQuantity,
              difference,
              stock_available: stock,
              error: `Insufficient stock. Available: ${stock}, Needed: ${difference}`,
            },
          };
        }
      }

      return {
        status: true,
        message: "Validation successful",
        data: {
          valid: true,
          current_quantity: currentQuantity,
          difference,
          stock_available: currentItem.data.sale_item.product?.stock,
        },
      };
    } catch (error: any) {
      throw new Error(error.message || "Failed to validate sale item update");
    }
  }

  async getReturnableQuantity(saleItemId: number): Promise<{
    status: boolean;
    message: string;
    data: {
      sale_item_id: number;
      current_quantity: number;
      returned_quantity: number;
      max_returnable: number;
      unit_price: number;
      potential_refund: number;
    };
  }> {
    try {
      const saleItem = await this.getSaleItemById(saleItemId);
      
      if (!saleItem.status) {
        throw new Error(saleItem.message);
      }

      const item = saleItem.data.sale_item;
      const maxReturnable = item.quantity - item.returned_quantity;
      const potentialRefund = item.unit_price * maxReturnable;

      return {
        status: true,
        message: "Returnable quantity calculated",
        data: {
          sale_item_id: saleItemId,
          current_quantity: item.quantity,
          returned_quantity: item.returned_quantity,
          max_returnable: maxReturnable,
          unit_price: item.unit_price,
          potential_refund: potentialRefund,
        },
      };
    } catch (error: any) {
      throw new Error(error.message || "Failed to get returnable quantity");
    }
  }

  // 📊 BATCH OPERATIONS
  async batchUpdateSaleItems(params: {
    sale_id: number;
    updates: Array<{
      id: number;
      quantity?: number;
      unit_price?: number;
      discount_amount?: number;
    }>;
  }): Promise<{
    status: boolean;
    message: string;
    data: {
      updated_items: number;
      failed_items: number;
      results: Array<{
        id: number;
        success: boolean;
        message?: string;
      }>;
    };
  }> {
    try {
      const results = [];
      let updatedItems = 0;
      let failedItems = 0;

      for (const update of params.updates) {
        try {
          await this.updateSaleItem({
            id: update.id,
            updates: {
              quantity: update.quantity,
              unit_price: update.unit_price,
              discount_amount: update.discount_amount,
            },
          });
          results.push({ id: update.id, success: true });
          updatedItems++;
        } catch (error: any) {
          results.push({
            id: update.id,
            success: false,
            message: error.message,
          });
          failedItems++;
        }
      }

      return {
        status: true,
        message: `Batch update completed. Updated: ${updatedItems}, Failed: ${failedItems}`,
        data: {
          updated_items: updatedItems,
          failed_items: failedItems,
          results,
        },
      };
    } catch (error: any) {
      throw new Error(error.message || "Failed to batch update sale items");
    }
  }

  async calculateProfitMargin(saleItemId: number): Promise<{
    status: boolean;
    message: string;
    data: {
      sale_item_id: number;
      cost_price: number;
      selling_price: number;
      profit_amount: number | null;
      profit_margin_percentage: number;
      profit_per_unit: number;
      markup_percentage: number;
    };
  }> {
    try {
      const saleItem = await this.getSaleItemById(saleItemId);
      
      if (!saleItem.status) {
        throw new Error(saleItem.message);
      }

      const item = saleItem.data.sale_item;
      
      if (item.cost_price <= 0) {
        return {
          status: true,
          message: "No cost price available",
          data: {
            sale_item_id: saleItemId,
            cost_price: item.cost_price,
            selling_price: item.unit_price,
            profit_amount: item.profit,
            profit_margin_percentage: 0,
            profit_per_unit: 0,
            markup_percentage: 0,
          },
        };
      }

      const profitPerUnit = item.unit_price - item.cost_price;
      const profitMargin = (profitPerUnit / item.unit_price) * 100;
      const markup = (profitPerUnit / item.cost_price) * 100;

      return {
        status: true,
        message: "Profit margin calculated",
        data: {
          sale_item_id: saleItemId,
          cost_price: item.cost_price,
          selling_price: item.unit_price,
          profit_amount: item.profit,
          profit_margin_percentage: parseFloat(profitMargin.toFixed(2)),
          profit_per_unit: parseFloat(profitPerUnit.toFixed(2)),
          markup_percentage: parseFloat(markup.toFixed(2)),
        },
      };
    } catch (error: any) {
      throw new Error(error.message || "Failed to calculate profit margin");
    }
  }

  // 🧪 TEST/DEBUG METHODS
  async testConnection(): Promise<{
    status: boolean;
    message: string;
    data: {
      connected: boolean;
      backend_available: boolean;
      api_version?: string;
    };
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.saleItem) {
        return {
          status: false,
          message: "Electron API not available",
          data: {
            connected: false,
            backend_available: false,
          },
        };
      }

      // Try a simple operation
      const response = await window.backendAPI.saleItem({
        method: "getSaleItemById",
        params: { id: 0 }, // Will fail but shows connection works
      });

      return {
        status: true,
        message: "Connection successful",
        data: {
          connected: true,
          backend_available: true,
          api_version: "1.0.0",
        },
      };
    } catch (error: any) {
      return {
        status: false,
        message: error.message || "Connection test failed",
        data: {
          connected: false,
          backend_available: false,
        },
      };
    }
  }
}

const saleItemAPI = new SaleItemAPI();

export default saleItemAPI;