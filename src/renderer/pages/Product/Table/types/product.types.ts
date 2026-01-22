export interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  barcode: string | null;
  category_name: string | null;
  supplier_name: string | null;
  is_active: boolean;
  created_at: string;
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
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}