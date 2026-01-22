import React, { useEffect } from 'react';
import ProductTable from './components/ProductTable';
import PaginationControls from './components/PaginationControls';
import SyncButton from './components/SyncButton';
import { showSuccess } from '../../../utils/notification';
import { useProducts } from './hooks/useProducts';
import { ProductProvider } from './context/ProductContext';

// Main product page content
const ProductPageContent: React.FC = () => {
  const {
    products,
    pagination,
    isLoading,
    filters,
    error,
    loadProducts,
    searchProducts,
    changePage,
    applyFilter,
    clearFilters,
    refreshProducts
  } = useProducts();

  // Load products on initial render
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Handle sync completion
  const handleSyncComplete = async () => {
    await refreshProducts();
    showSuccess('Product list refreshed after sync');
  };

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length === 0 || value.length >= 2) {
      searchProducts(value);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white p-6">
      {/* Header with title and actions */}
      <div className="flex-none mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Product Management</h1>
            <p className="text-gray-400 mt-1">
              Manage and sync products from inventory system
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SyncButton onSyncComplete={handleSyncComplete} />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex-none mb-6 p-4 bg-gray-800 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Search Products
            </label>
            <input
              type="text"
              placeholder="Search by name, SKU, or barcode..."
              value={filters.search}
              onChange={handleSearch}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Category
            </label>
            <select
              value={filters.category_name}
              onChange={(e) => applyFilter('category_name', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="groceries">Groceries</option>
              <option value="clothing">Clothing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Stock Status
            </label>
            <select
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => {
                if (e.target.value === 'in_stock') applyFilter('in_stock_only', true);
                else if (e.target.value === 'low_stock') applyFilter('low_stock_only', true);
                else clearFilters();
              }}
            >
              <option value="">All Products</option>
              <option value="in_stock">In Stock Only</option>
              <option value="low_stock">Low Stock</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded text-red-300">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Products Count */}
      <div className="flex-none mb-4">
        <div className="text-sm text-gray-400">
          Showing {products.length} of {pagination?.count || 0} products
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <ProductTable
          products={products}
          isLoading={isLoading}
          onRowClick={(product) => {
            console.log('Product clicked:', product);
            // You can implement a modal or details view here
          }}
          className="h-full"
        />
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex-none mt-6">
          <PaginationControls
            pagination={pagination}
            onPageChange={changePage}
          />
        </div>
      )}

      {/* Stats Footer */}
      <div className="flex-none mt-6 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-500">
          Last updated: {new Date().toLocaleTimeString()} • 
          Auto-refresh: 5 minutes • 
          Inventory sync: {typeof window.backendAPI?.sync === 'object' && (window.backendAPI.sync as any)?.isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
    </div>
  );
};

// Wrap with ProductProvider for React Router integration
const ProductPage: React.FC = () => {
  return (
    <ProductProvider>
      <ProductPageContent />
    </ProductProvider>
  );
};

// React Router Integration
export const ProductRoute = () => ({
  path: '/products/list',
  element: <ProductPage />,
  protected: true,
  requiredPermissions: ['can_manage_products'],
  breadcrumb: 'Product Management',
});

export default ProductPage;