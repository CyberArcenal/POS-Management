// src/renderer/pages/supplier/Supplier.tsx
import React, { useState } from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { dialogs } from "../../utils/dialogs";
import supplierAPI, { type Supplier } from "../../api/supplier";

// Hooks
import { useSuppliers, type SupplierFilters } from "./hooks/useSuppliers";
import { useSupplierForm } from "./hooks/useSupplierForm";
import { useSupplierView } from "./hooks/useSupplierView";

// Components
import { FilterBar } from "./components/FilterBar";
import { SupplierTable } from "./components/SupplierTable";
import { SupplierFormDialog } from "./components/SupplierFormDialog";
import { SupplierViewDialog } from "./components/SupplierViewDialog";
import Pagination from "../../components/Shared/Pagination1";

const SupplierPage: React.FC = () => {
  const {
    suppliers,
    productCounts,
    filters,
    setFilters,
    loading,
    error,
    reload,
  } = useSuppliers({
    search: "",
    status: "all",
    sortBy: "name",
    sortOrder: "ASC",
  });

  const formDialog = useSupplierForm();
  const viewDialog = useSupplierView();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [10, 20, 50, 100];

  // Pagination state (handled in hook, but we need to update page)
  const handleFilterChange = <K extends keyof SupplierFilters>(
    key: K,
    value: SupplierFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Client-side pagination
  const paginatedSuppliers = suppliers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const totalItems = suppliers.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // reset to first page
  };

  const handleDelete = async (supplier: Supplier) => {
    const confirmed = await dialogs.confirm({
      title: "Deactivate Supplier",
      message: `Are you sure you want to deactivate ${supplier.name}? This action can be reversed later.`,
    });
    if (!confirmed) return;

    try {
      await supplierAPI.delete(supplier.id);
      dialogs.alert({
        title: "Success",
        message: "Supplier deactivated successfully.",
      });
      reload();
    } catch (err: any) {
      dialogs.alert({ title: "Error", message: err.message });
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background-color)] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Suppliers
        </h1>
        <button
          onClick={formDialog.openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReload={reload}
      />

      {/* Supplier Table */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-[var(--accent-red)]" />
            <p className="text-[var(--text-primary)] font-medium">
              Error loading suppliers
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">{error}</p>
            <button
              onClick={reload}
              className="mt-4 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1">
            <SupplierTable
              suppliers={paginatedSuppliers}
              productCounts={productCounts}
              onView={viewDialog.open}
              onEdit={formDialog.openEdit}
              onDelete={handleDelete}
            />
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={pageSizeOptions}
            showPageSize={true}
          />
        </>
      )}

      {/* Dialogs */}
      <SupplierFormDialog
        isOpen={formDialog.isOpen}
        mode={formDialog.mode}
        supplierId={formDialog.supplierId}
        initialData={formDialog.initialData}
        onClose={formDialog.close}
        onSuccess={() => {
          formDialog.close();
          reload();
        }}
      />

      <SupplierViewDialog
        supplier={viewDialog.supplier}
        products={viewDialog.products}
        purchases={viewDialog.purchases}
        metrics={viewDialog.metrics}
        loading={viewDialog.loading}
        isOpen={viewDialog.isOpen}
        onClose={viewDialog.close}
      />
    </div>
  );
};

export default SupplierPage;
