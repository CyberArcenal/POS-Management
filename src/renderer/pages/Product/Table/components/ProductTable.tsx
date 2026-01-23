import React from 'react';
import type { Product } from '../types/product.types';

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  onRowClick?: (product: Product) => void;
  className?: string;
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  isLoading,
  onRowClick,
  className = ''
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { text: 'Out of Stock', color: 'text-red-400', bg: 'bg-red-900/20' };
    if (product.stock <= product.min_stock) return { text: 'Low Stock', color: 'text-yellow-400', bg: 'bg-yellow-900/20' };
    return { text: 'In Stock', color: 'text-green-400', bg: 'bg-green-900/20' };
  };

  const getSyncStatus = (product: Product) => {
    switch (product.sync_status) {
      case 'synced':
        return { text: 'Synced', color: 'text-green-400', bg: 'bg-green-900/30' };
      case 'pending':
        return { text: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-900/30' };
      case 'failed':
        return { text: 'Failed', color: 'text-red-400', bg: 'bg-red-900/30' };
      case 'not_synced':
        return { text: 'Not Synced', color: 'text-gray-400', bg: 'bg-gray-800' };
      default:
        return { text: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-800' };
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 ${className}`}>
        <svg className="w-12 h-12 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-gray-500">No products found</p>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-lg border border-gray-700 ${className}`}>
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Product Details
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              SKU / Barcode
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Category / Supplier
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Price & Stock
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Warehouse & Sync
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-gray-900 divide-y divide-gray-700">
          {products.map((product) => {
            const stockStatus = getStockStatus(product);
            const syncStatus = getSyncStatus(product);
            
            return (
              <tr
                key={product.id}
                onClick={() => onRowClick?.(product)}
                className="hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-700 rounded flex items-center justify-center">
                      {product.is_variant ? (
                        <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                      ) : (
                        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white flex items-center gap-2">
                        {product.name}
                        {product.is_variant && (
                          <span className="text-xs px-2 py-0.5 bg-purple-900/30 text-purple-300 rounded-full">
                            {product.variant_name || 'Variant'}
                          </span>
                        )}
                      </div>
                      {product.description && (
                        <div className="text-xs text-gray-400 truncate max-w-xs">
                          {product.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-300">{product.sku}</div>
                  {product.barcode && (
                    <div className="text-xs text-gray-500 font-mono">
                      {product.barcode}
                    </div>
                  )}
                  {product.stock_item_id && (
                    <div className="text-xs text-blue-400 font-mono mt-1">
                      Item: {product.stock_item_id}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    {product.category_name && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-900/30 text-blue-300">
                        {product.category_name}
                      </span>
                    )}
                    {product.supplier_name && (
                      <div className="text-xs text-gray-400">
                        {product.supplier_name}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-white">
                      {formatCurrency(product.price)}
                      {product.cost_price && (
                        <span className="text-xs text-gray-400 ml-2">
                          Cost: {formatCurrency(product.cost_price)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-300">
                      <div className="flex justify-between mb-1">
                        <span>{product.stock} units</span>
                        <span className="text-xs text-gray-400">Min: {product.min_stock}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${stockStatus.bg}`}
                          style={{
                            width: `${Math.min((product.stock / (product.min_stock * 3)) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-300">
                      {product.warehouse_name || 'No Warehouse'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${syncStatus.bg} ${syncStatus.color}`}>
                        {syncStatus.text}
                      </span>
                      {product.last_sync_at && (
                        <span className="text-xs text-gray-500">
                          {formatDate(product.last_sync_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <span className={`text-sm font-medium ${stockStatus.color}`}>
                      {stockStatus.text}
                    </span>
                    <div className="flex items-center gap-2">
                      {product.is_active ? (
                        <span className="text-xs px-2 py-0.5 bg-green-900/30 text-green-300 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-red-900/30 text-red-300 rounded-full">
                          Inactive
                        </span>
                      )}
                      {product.is_deleted && (
                        <span className="text-xs px-2 py-0.5 bg-gray-800 text-gray-300 rounded-full">
                          Deleted
                        </span>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;