// src/renderer/pages/purchase/Purchase.tsx
import React, { useState } from 'react';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { dialogs } from '../../utils/dialogs';
import purchaseAPI, { type Purchase } from '../../api/purchase';

// Hooks
import { usePurchases, type PurchaseFilters } from './hooks/usePurchases';
import { usePurchaseForm } from './hooks/usePurchaseForm';
import { usePurchaseView } from './hooks/usePurchaseView';

// Components
import { FilterBar } from './components/FilterBar';
import { PurchaseTable } from './components/PurchaseTable';
import { PurchaseFormDialog } from './components/PurchaseFormDialog';
import { PurchaseViewDialog } from './components/PurchaseViewDialog';
import { Pagination } from '../../components/Shared/Pagination';

const PurchasePage: React.FC = () => {
  const { purchases, suppliers, filters, setFilters, loading, error, reload } = usePurchases({
    search: '',
    status: '',
    supplierId: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
    sortBy: 'orderDate',
    sortOrder: 'DESC',
  });

  const [formDialog, setFormDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; purchaseId?: number; initialData?: any }>({
    open: false,
    mode: 'add',
  });

  const viewDialog = usePurchaseView();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = filters.limit;

  const handleFilterChange = <K extends keyof PurchaseFilters>(key: K, value: PurchaseFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Client-side pagination
  const paginatedPurchases = purchases.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalPages = Math.ceil(purchases.length / pageSize);

  const handleAdd = () => {
    setFormDialog({ open: true, mode: 'add' });
  };

  const handleEdit = (purchase: Purchase) => {
    setFormDialog({ open: true, mode: 'edit', purchaseId: purchase.id, initialData: purchase });
  };

  const handleDelete = async (purchase: Purchase) => {
    const confirmed = await dialogs.confirm({
      title: 'Cancel Purchase',
      message: `Are you sure you want to cancel purchase ${purchase.referenceNo || `#${purchase.id}`}?`,
    });
    if (!confirmed) return;

    try {
      // Soft delete via update status to cancelled
      await purchaseAPI.updateStatus(purchase.id, 'cancelled', 'system');
      dialogs.alert({ title: 'Success', message: 'Purchase cancelled successfully.' });
      reload();
    } catch (err: any) {
      dialogs.alert({ title: 'Error', message: err.message });
    }
  };

  const handleFormClose = () => {
    setFormDialog({ open: false, mode: 'add' });
  };

  const handleFormSuccess = () => {
    handleFormClose();
    reload();
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background-color)] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Purchase Orders</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Purchase
        </button>
      </div>

      {/* Filters */}
      <FilterBar filters={filters} onFilterChange={handleFilterChange} onReload={reload} />

      {/* Purchase Table */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-[var(--accent-red)]" />
            <p className="text-[var(--text-primary)] font-medium">Error loading purchases</p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">{error}</p>
            <button onClick={reload} className="mt-4 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg">
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1">
            <PurchaseTable
              purchases={paginatedPurchases}
              onView={(purchase) => {viewDialog.open(purchase.id)}}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={purchases.length}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Form Dialog */}
      <PurchaseFormDialog
        isOpen={formDialog.open}
        mode={formDialog.mode}
        purchaseId={formDialog.purchaseId}
        initialData={formDialog.initialData}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      {/* View Dialog */}
      <PurchaseViewDialog
        purchase={viewDialog.purchase}
        items={viewDialog.items}
        loading={viewDialog.loading}
        isOpen={viewDialog.isOpen}
        onClose={viewDialog.close}
      />
    </div>
  );
};

export default PurchasePage;