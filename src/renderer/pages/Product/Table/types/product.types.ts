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
  
  // Warehouse fields
  warehouse_id?: string | null;
  warehouse_name?: string | null;
  sync_id?: string | null;
  sync_status?: 'synced' | 'pending' | 'failed' | 'not_synced' | null;
  last_sync_at?: string | null;
  is_variant?: boolean;
  variant_name?: string | null;
  item_type?: string | null;
}

export interface PaginationMeta {
  count: number;
  current_page: number;
  total_pages: number;
  page_size: number;
  next: boolean;
  previous: boolean;
}

export interface ProductsResponse {
  status: boolean;
  message: string;
  pagination: PaginationMeta;
  data: Product[];
}

export interface SyncResponse {
  status: boolean;
  message: string;
  data: {
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
    warehouseInfo?: {
      id: string | number;
      name: string;
    } | null;
    deactivated?: number;
    masterSyncId?: number;
  };
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category_name?: string;
  supplier_name?: string;
  in_stock_only?: boolean;
  low_stock_only?: boolean;
  out_of_stock_only?: boolean;
  has_stock_item_id?: boolean;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  warehouse_id?: string | number;
}