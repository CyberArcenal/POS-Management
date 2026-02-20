// src/renderer/pages/category/Category.tsx
import React, { useState } from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { dialogs } from "../../utils/dialogs";
import categoryAPI, { type Category } from "../../api/category";

// Hooks
import { useCategories, type CategoryFilters } from "./hooks/useCategories";
import { useCategoryForm } from "./hooks/useCategoryForm";
import { useCategoryView } from "./hooks/useCategoryView";

// Components
import { FilterBar } from "./components/FilterBar";
import { CategoryTable } from "./components/CategoryTable";
import { CategoryFormDialog } from "./components/CategoryFormDialog";
import { CategoryViewDialog } from "./components/CategoryViewDialog";
import Pagination from "../../components/Shared/Pagination1";

const CategoryPage: React.FC = () => {
  const {
    categories,
    productCounts,
    filters,
    setFilters,
    loading,
    error,
    reload,
  } = useCategories({
    search: "",
    status: "all",
    sortBy: "name",
    sortOrder: "ASC",
  });

  const formDialog = useCategoryForm();
  const viewDialog = useCategoryView();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [10, 20, 50, 100];

  const handleFilterChange = <K extends keyof CategoryFilters>(
    key: K,
    value: CategoryFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Client-side pagination
  const paginatedCategories = categories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const totalItems = categories.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // reset to first page
  };

  const handleDelete = async (category: Category) => {
    const confirmed = await dialogs.confirm({
      title: "Deactivate Category",
      message: `Are you sure you want to deactivate ${category.name}? This action can be reversed later.`,
    });
    if (!confirmed) return;

    try {
      await categoryAPI.delete(category.id);
      dialogs.alert({
        title: "Success",
        message: "Category deactivated successfully.",
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
          Categories
        </h1>
        <button
          onClick={formDialog.openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReload={reload}
      />

      {/* Category Table */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-[var(--accent-red)]" />
            <p className="text-[var(--text-primary)] font-medium">
              Error loading categories
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
            <CategoryTable
              categories={paginatedCategories}
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
      <CategoryFormDialog
        isOpen={formDialog.isOpen}
        mode={formDialog.mode}
        categoryId={formDialog.categoryId}
        initialData={formDialog.initialData}
        onClose={formDialog.close}
        onSuccess={() => {
          formDialog.close();
          reload();
        }}
      />

      <CategoryViewDialog
        category={viewDialog.category}
        products={viewDialog.products}
        loading={viewDialog.loading}
        isOpen={viewDialog.isOpen}
        onClose={viewDialog.close}
      />
    </div>
  );
};

export default CategoryPage;
