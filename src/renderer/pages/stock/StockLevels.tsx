// src/renderer/pages/stock/StockLevels.tsx
import React, { useState } from 'react';
import { Loader2, AlertCircle, ShoppingCart } from 'lucide-react';
import { useStockLevels, type StockFilters } from './hooks/useStockLevels';
import { dialogs } from '../../utils/dialogs';
import type { Product } from '../../api/product';
import { StockSummaryCards } from './components/StockSummaryCards';
import { StockFilterBar } from './components/StockFilterBar';
import { StockTable } from './components/StockTable';
import { PurchaseFormDialog } from '../purchase/components/PurchaseFormDialog';


const StockLevelsPage: React.FC = () => {
  const {
    products,
    suppliers,
    categories,
    filters,
    setFilters,
    loading,
    error,
    total,
    reload,
  } = useStockLevels({
    search: '',
    supplierId: '',
    categoryId: '',
    stockStatus: 'all',
    page: 1,
    limit: 20,
    sortBy: 'name',
    sortOrder: 'ASC',
  });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [orderInitialData, setOrderInitialData] = useState<any>(null);

  const handleFilterChange = (key: keyof StockFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    setSelectedIds(new Set()); // clear selections on filter change
  };

  const toggleSelect = (productId: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(productId)) newSet.delete(productId);
    else newSet.add(productId);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const handleBulkReorder = () => {
    if (selectedIds.size === 0) {
      dialogs.alert({ title: 'No Selection', message: 'Please select at least one product.' });
      return;
    }
    const selectedProducts = products.filter(p => selectedIds.has(p.id));
    // Group by supplier? For now, we'll only allow reorder if all selected products belong to the same supplier.
    // If multiple suppliers, we need to create separate purchase orders. For simplicity, we'll alert.
    const supplierIds = new Set(selectedProducts.map(p => p.supplier?.id));
    if (supplierIds.size > 1 || supplierIds.has(undefined)) {
      dialogs.alert({
        title: 'Multiple Suppliers',
        message: 'Selected products belong to different suppliers. Please select products from a single supplier.',
      });
      return;
    }
    const supplierId = selectedProducts[0].supplier?.id;
    if (!supplierId) {
      dialogs.alert({ title: 'No Supplier', message: 'Selected products have no supplier assigned.' });
      return;
    }
    const items = selectedProducts.map(p => ({
      productId: p.id,
      quantity: p.reorderQty, // use product's reorderQty
      unitPrice: p.price,
    }));
    const initialData = {
      supplierId,
      items,
    };
    setOrderInitialData(initialData);
    setOrderFormOpen(true);
  };

  const handleSingleReorder = (product: Product) => {
    if (!product.supplier) {
      dialogs.alert({ title: 'No Supplier', message: 'This product has no supplier assigned.' });
      return;
    }
    const initialData = {
      supplierId: product.supplier.id,
      items: [{
        productId: product.id,
        quantity: product.reorderQty,
        unitPrice: product.price,
      }],
    };
    setOrderInitialData(initialData);
    setOrderFormOpen(true);
  };

  const handleOrderSuccess = () => {
    setOrderFormOpen(false);
    setOrderInitialData(null);
    setSelectedIds(new Set());
    dialogs.alert({ title: 'Success', message: 'Purchase order created.' });
    reload(); // maybe refresh stock levels
  };

  const handleOrderClose = () => {
    setOrderFormOpen(false);
    setOrderInitialData(null);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background-color)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Stock Levels</h1>
        <button
          onClick={handleBulkReorder}
          disabled={selectedIds.size === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-green)] text-white rounded-lg hover:bg-[var(--accent-green-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-4 h-4" />
          Reorder Selected ({selectedIds.size})
        </button>
      </div>

      <StockSummaryCards products={products} />

      <StockFilterBar
        filters={filters}
        suppliers={suppliers}
        categories={categories}
        onFilterChange={handleFilterChange}
        onReload={reload}
      />

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-[var(--accent-red)]" />
            <p className="text-[var(--text-primary)] font-medium">Error loading stock levels</p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">{error}</p>
            <button onClick={reload} className="mt-4 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg">
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto">
            <StockTable
              products={products}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onSelectAll={toggleSelectAll}
              onReorder={handleSingleReorder}
            />
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-[var(--text-tertiary)]">
              Showing {products.length} of {total} products
            </div>
            {/* Pagination controls can be added later */}
          </div>
        </>
      )}

      {/* Purchase Form Dialog */}
      {orderFormOpen && (
        <PurchaseFormDialog
          isOpen={orderFormOpen}
          mode="add"
          initialData={orderInitialData}
          onClose={handleOrderClose}
          onSuccess={handleOrderSuccess}
        />
      )}
    </div>
  );
};

export default StockLevelsPage;