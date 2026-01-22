// src/features/transactions/api/types.ts
import type { 
  Sale as ApiSale, 
  SaleItem as ApiSaleItem,
  Product as ApiProduct 
} from '../../../api/sales';
import { transformSaleItemsToTransactionItems } from '../utils/itemTransformer';

export interface Transaction extends Omit<ApiSale, 'customer_name' | 'customer_phone' | 'customer_email' | 'notes' | 'items'> {
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  notes: string | null;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  discount_percentage: number | null;
  cost_price: number | null;
  profit: number | null;
  returned_quantity: number;
  is_returned: boolean;
  return_reason: string | null;
  notes: string | null;
  variant_id?: number | null;
  created_at: string;
  updated_at: string;
  product_name: string;
  sku: string;
  barcode?: string | null;
  variant?: {
    id: number;
    name: string;
    price_adjustment: number;
    stock: number;
  } | null;
}

export interface PaginationMeta {
  count: number;
  current_page: number;
  total_pages: number;
  page_size: number;
  next: boolean;
  previous: boolean;
}

export interface PaginatedResponse<T> {
  status: boolean;
  message: string;
  pagination: PaginationMeta;
  data: T[];
}

export interface FilterState {
  start_date: string | null;
  end_date: string | null;
  reference_number: string;
  customer_name: string;
  status: string;
  payment_method: string;
  min_total: string;
  max_total: string;
  search: string;
}

// // Helper function to convert ApiSale to Transaction
// export const convertApiSaleToTransaction = (apiSale: ApiSale): Transaction => {
//   // Convert Sale items to Transaction items
//   const items: TransactionItem[] = apiSale.items?.map(item => {
//     // Extract product information
//     const productName = item.product?.name || 'Unknown Product';
//     const sku = item.product?.sku || 'N/A';
//     const barcode = item.product?.barcode || null;
    
//     return {
//       id: item.id,
//       sale_id: item.sale_id,
//       product_id: item.product_id,
//       quantity: item.quantity,
//       unit_price: item.unit_price,
//       total_price: item.total_price,
//       discount_amount: item.discount_amount,
//       discount_percentage: item.discount_percentage,
//       cost_price: item.cost_price,
//       profit: item.profit,
//       returned_quantity: item.returned_quantity,
//       is_returned: item.is_returned,
//       return_reason: item.return_reason,
//       notes: item.notes || null,
//       variant_id: item.variant_id || null,
//       created_at: item.created_at,
//       updated_at: item.updated_at,
//       product_name: productName,
//       sku: sku,
//       barcode: barcode,
//       variant: item.variant || null,
//     };
//   }) || [];

//   return {
//     ...apiSale,
//     customer_name: apiSale.customer_name || null,
//     customer_phone: apiSale.customer_phone || null,
//     customer_email: apiSale.customer_email || null,
//     notes: apiSale.notes || null,
//     items: items.length > 0 ? items : undefined,
//   };
// };

// Helper para sa pag-extract ng product info kapag walang nested product object
export const extractProductInfo = (item: ApiSaleItem): { product_name: string; sku: string; barcode: string | null } => {
  // Kung may product object, gamitin iyon
  if (item.product) {
    return {
      product_name: item.product.name || 'Unknown Product',
      sku: item.product.sku || 'N/A',
      barcode: item.product.barcode || null,
    };
  }
  
  // Kung walang product object, subukan mag-fetch gamit ang product_id
  // (Ito ay placeholder - sa totoong implementation, kailangan i-fetch ang product details)
  return {
    product_name: `Product ${item.product_id}`,
    sku: `SKU-${item.product_id}`,
    barcode: null,
  };
};


export const convertApiSaleToTransaction = (apiSale: ApiSale): Transaction => {
  // Convert Sale items to Transaction items
  const items = apiSale.items 
    ? transformSaleItemsToTransactionItems(apiSale.items)
    : undefined;

  return {
    ...apiSale,
    customer_name: apiSale.customer_name || null,
    customer_phone: apiSale.customer_phone || null,
    customer_email: apiSale.customer_email || null,
    notes: apiSale.notes || null,
    items: items,
  };
};