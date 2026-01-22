// src/features/transactions/utils/itemTransformer.ts

import type { SaleItem as ApiSaleItem } from '../../../api/sales';
import type { TransactionItem } from '../api/types';

/**
 * Transform API SaleItem to TransactionItem
 */
export const transformSaleItemToTransactionItem = (apiItem: ApiSaleItem): TransactionItem => {
  // Extract product information from nested product object
  const productName = apiItem.product?.name || `Product ${apiItem.product_id}`;
  const sku = apiItem.product?.sku || `SKU-${apiItem.product_id}`;
  const barcode = apiItem.product?.barcode || null;
  
  // Extract variant information if available
  const variant = apiItem.variant ? {
    id: apiItem.variant.id,
    name: apiItem.variant.name,
    price_adjustment: apiItem.variant.price_adjustment,
    stock: apiItem.variant.stock,
  } : null;

  return {
    id: apiItem.id,
    sale_id: apiItem.sale_id,
    product_id: apiItem.product_id,
    quantity: apiItem.quantity,
    unit_price: apiItem.unit_price,
    total_price: apiItem.total_price,
    discount_amount: apiItem.discount_amount,
    discount_percentage: apiItem.discount_percentage,
    cost_price: apiItem.cost_price,
    profit: apiItem.profit,
    returned_quantity: apiItem.returned_quantity,
    is_returned: apiItem.is_returned,
    return_reason: apiItem.return_reason,
    notes: apiItem.notes || null,
    variant_id: apiItem.variant_id || null,
    created_at: apiItem.created_at,
    updated_at: apiItem.updated_at,
    product_name: productName,
    sku: sku,
    barcode: barcode,
    variant: variant,
  };
};

/**
 * Transform array of API SaleItems to TransactionItems
 */
export const transformSaleItemsToTransactionItems = (apiItems: ApiSaleItem[] = []): TransactionItem[] => {
  return apiItems.map(transformSaleItemToTransactionItem);
};

/**
 * Fallback function to fetch missing product details
 */
export const enrichSaleItemWithProductDetails = async (
  apiItem: ApiSaleItem
): Promise<ApiSaleItem> => {
  // If item already has product details, return as-is
  if (apiItem.product && apiItem.product.name) {
    return apiItem;
  }

  try {
    // Import product API dynamically
    const productApi = (await import('../../../api/product')).default;
    const productResponse = await productApi.getProductById(apiItem.product_id);
    
    return {
      ...apiItem,
      product: {
        ...productResponse.data,
        name: productResponse.data.name,
        sku: productResponse.data.sku,
        barcode: productResponse.data.barcode,
      }
    };
  } catch (error) {
    console.error(`Failed to fetch product ${apiItem.product_id}:`, error);
    // Return original item with placeholder product info
    return {
      ...apiItem,
      product: {
        id: apiItem.product_id,
        name: `Product ${apiItem.product_id}`,
        sku: `SKU-${apiItem.product_id}`,
        barcode: null,
        price: apiItem.unit_price,
        stock: 0,
        min_stock: 0,
        stock_item_id: null,
        category_name: null,
        supplier_name: null,
        description: null,
        cost_price: null,
        is_active: true,
        reorder_quantity: 0,
        last_reorder_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
        last_price_change: null,
        original_price: null,
      }
    };
  }
};