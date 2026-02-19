import React, { useState } from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { dialogs } from "../../utils/dialogs";
import productAPI, { type Product } from "../../api/product";

// Hooks
import { useProducts, type ProductFilters } from "./hooks/useProducts";
import { useProductForm } from "./hooks/useProductForm";
import { useProductView } from "./hooks/useProductView";

// Components
import { FilterBar } from "./components/FilterBar";
import { ProductTable } from "./components/ProductTable";
import { ProductFormDialog } from "./components/ProductFormDialog";
import { ProductViewDialog } from "./components/ProductViewDialog";
import { StockAdjustDialog } from "./components/StockAdjustDialog"; // new
import { PriceEditDialog } from "./components/PriceEditDialog";
import { ReorderLevelEditDialog } from "./components/ReorderLevelEditDialog";
import { ReorderQtyEditDialog } from "./components/ReorderQtyEditDialog";

const ProductPage: React.FC = () => {
  const [priceEditProduct, setPriceEditProduct] = useState<Product | null>(
    null,
  );
  const [reorderLevelEditProduct, setReorderLevelEditProduct] =
    useState<Product | null>(null);
  const [reorderQtyEditProduct, setReorderQtyEditProduct] =
    useState<Product | null>(null);

  const handlePriceEdit = (product: Product) => setPriceEditProduct(product);
  const handleReorderLevelEdit = (product: Product) =>
    setReorderLevelEditProduct(product);
  const handleReorderQtyEdit = (product: Product) =>
    setReorderQtyEditProduct(product);

  const closePriceEdit = () => setPriceEditProduct(null);
  const closeReorderLevelEdit = () => setReorderLevelEditProduct(null);
  const closeReorderQtyEdit = () => setReorderQtyEditProduct(null);

  const { products, filters, setFilters, loading, error, categories, reload } =
    useProducts({
      search: "",
      status: "active",
      category: "",
      lowStock: false,
    });

  const formDialog = useProductForm();
  const viewDialog = useProductView();

  // Stock adjustment dialog state
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(
    null,
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleDelete = async (product: Product) => {
    const confirmed = await dialogs.confirm({
      title: "Delete Product",
      message: `Are you sure you want to delete ${product.name}?`,
    });
    if (!confirmed) return;

    try {
      await productAPI.delete(product.id, "system");
      dialogs.alert({
        title: "Success",
        message: "Product deleted successfully.",
      });
      reload();
    } catch (err: any) {
      dialogs.alert({ title: "Error", message: err.message });
    }
  };

  const handleStockAdjust = (product: Product) => {
    setStockAdjustProduct(product);
  };

  const closeStockAdjust = () => {
    setStockAdjustProduct(null);
  };

  // Pagination calculations
  const totalPages = Math.ceil(products.length / pageSize);
  const paginatedProducts = products.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="h-full flex flex-col bg-[var(--background-color)] p-6">
      {/* Header - unchanged */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Products
        </h1>
        <button
          onClick={formDialog.openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Filters - unchanged */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
        onReload={reload}
      />

      {/* Product Table */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-[var(--accent-red)]" />
            <p className="text-[var(--text-primary)] font-medium">
              Error loading products
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
            <ProductTable
              products={paginatedProducts}
              onView={viewDialog.open}
              onEdit={formDialog.openEdit}
              onDelete={handleDelete}
              onStockAdjust={handleStockAdjust} // new prop
              onPriceEdit={handlePriceEdit} // new
              onReorderLevelEdit={handleReorderLevelEdit} // new
              onReorderQtyEdit={handleReorderQtyEdit} // new
            />
          </div>

          {/* Pagination - unchanged */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-[var(--text-tertiary)]">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, products.length)} of{" "}
                {products.length} products
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded-lg ${
                        currentPage === page
                          ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]"
                          : "border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)]"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <ProductFormDialog
        isOpen={formDialog.isOpen}
        mode={formDialog.mode}
        productId={formDialog.productId}
        initialData={formDialog.initialData}
        onClose={formDialog.close}
        onSuccess={() => {
          formDialog.close();
          reload();
        }}
      />

      <ProductViewDialog
        product={viewDialog.product}
        movements={viewDialog.movements}
        salesStats={viewDialog.salesStats}
        loading={viewDialog.loading}
        isOpen={viewDialog.isOpen}
        onClose={viewDialog.close}
      />

      {/* New Stock Adjustment Dialog */}
      <StockAdjustDialog
        product={stockAdjustProduct}
        isOpen={!!stockAdjustProduct}
        onClose={closeStockAdjust}
        onSuccess={reload}
      />

      <PriceEditDialog
        product={priceEditProduct}
        isOpen={!!priceEditProduct}
        onClose={closePriceEdit}
        onSuccess={reload}
      />

      <ReorderLevelEditDialog
        product={reorderLevelEditProduct}
        isOpen={!!reorderLevelEditProduct}
        onClose={closeReorderLevelEdit}
        onSuccess={reload}
      />

      <ReorderQtyEditDialog
        product={reorderQtyEditProduct}
        isOpen={!!reorderQtyEditProduct}
        onClose={closeReorderQtyEdit}
        onSuccess={reload}
      />
    </div>
  );
};

export default ProductPage;
