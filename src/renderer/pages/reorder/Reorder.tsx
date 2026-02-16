// src/renderer/pages/reorder/Reorder.tsx
import React, { useState } from 'react';
import { Loader2, AlertCircle, ShoppingCart } from 'lucide-react';
import { dialogs } from '../../utils/dialogs';
import { useReorder, type SupplierGroup, type LowStockProduct } from './hooks/useReorder';
import { VendorCard } from './components/VendorCard';
import { ReorderTable } from './components/ReorderTable';
import { PurchaseFormDialog } from '../purchase/components/PurchaseFormDialog'; // adjust path as needed
import type { Supplier } from '../../api/supplier';

const ReorderPage: React.FC = () => {
  const { supplierGroups, loading, error, reload } = useReorder();
  const [selectedGroup, setSelectedGroup] = useState<SupplierGroup | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [orderInitialData, setOrderInitialData] = useState<any>(null);

  const handleSelectGroup = (group: SupplierGroup) => {
    setSelectedGroup(group);
    setSelectedProductIds(new Set()); // clear selections when switching supplier
  };

  const toggleProduct = (productId: number) => {
    const newSet = new Set(selectedProductIds);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    setSelectedProductIds(newSet);
  };

  const toggleSelectAll = () => {
    if (!selectedGroup) return;
    if (selectedProductIds.size === selectedGroup.products.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(selectedGroup.products.map(p => p.id)));
    }
  };

  const handleCreateOrder = () => {
    if (!selectedGroup || selectedProductIds.size === 0) {
      dialogs.alert({ title: 'No Selection', message: 'Please select at least one product.' });
      return;
    }
    const selectedProducts = selectedGroup.products.filter(p => selectedProductIds.has(p.id));
    const items = selectedProducts.map(p => ({
      productId: p.id,
      quantity: p.reorderQty,
      unitPrice: p.price,
    }));
    const initialData = {
      supplierId: selectedGroup.supplier.id,
      items,
      // orderDate will default to today, status pending
    };
    setOrderInitialData(initialData);
    setOrderFormOpen(true);
  };

  const handleOrderSuccess = () => {
    setOrderFormOpen(false);
    setOrderInitialData(null);
    dialogs.alert({ title: 'Success', message: 'Purchase order created.' });
    // Optionally reload low stock list (items may still be low until received)
    reload();
  };

  const handleOrderClose = () => {
    setOrderFormOpen(false);
    setOrderInitialData(null);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--background-color)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--background-color)]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-[var(--accent-red)]" />
          <p className="text-[var(--text-primary)] font-medium">Error loading reorder data</p>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">{error}</p>
          <button onClick={reload} className="mt-4 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--background-color)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reorder & Vendor Management</h1>
        <button
          onClick={reload}
          className="px-4 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)]"
        >
          Refresh
        </button>
      </div>

      {supplierGroups.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
            <p className="text-[var(--text-primary)] font-medium">No low‑stock products found</p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">All products are above their reorder level.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 gap-6 min-h-0">
          {/* Left sidebar: Vendor cards */}
          <div className="w-80 flex flex-col gap-3 overflow-y-auto pr-2">
            {supplierGroups.map(group => (
              <VendorCard
                key={group.supplier.id}
                group={group}
                isSelected={selectedGroup?.supplier.id === group.supplier.id}
                onSelect={() => handleSelectGroup(group)}
              />
            ))}
          </div>

          {/* Right side: Products table and actions */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedGroup ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    Products from {selectedGroup.supplier.name}
                  </h2>
                  <button
                    onClick={handleCreateOrder}
                    disabled={selectedProductIds.size === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-green)] text-white rounded-lg hover:bg-[var(--accent-green-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Create Purchase Order ({selectedProductIds.size})
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <ReorderTable
                    products={selectedGroup.products}
                    selectedIds={selectedProductIds}
                    onToggleSelect={toggleProduct}
                    onSelectAll={toggleSelectAll}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[var(--text-tertiary)]">
                Select a vendor to see low‑stock products.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Purchase Form Dialog (reused from purchase page) */}
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

export default ReorderPage;