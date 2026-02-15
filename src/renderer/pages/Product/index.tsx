// src/renderer/pages/inventory/Product.tsx

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Package,
  Loader2,
  AlertCircle,
  X,
  Check,
  RefreshCw,
  TrendingUp,
  History,
  Save,
} from "lucide-react";
import Decimal from "decimal.js";
import { format } from "date-fns";
import productAPI, {
  type Product,
  type ProductSalesReportItem,
} from "../../api/product";
import inventoryAPI, { type InventoryMovement } from "../../api/inventory";
import { dialogs } from "../../utils/dialogs";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface ProductFilters {
  search: string;
  status: "active" | "inactive" | "all";
  category: string;
  lowStock: boolean;
}

interface ProductFormData {
  sku: string;
  name: string;
  description: string;
  price: number;
  stockQty: number;
  reorderLevel?: number;
  isActive: boolean;
  category?: string;
}

// ----------------------------------------------------------------------
// Custom Hooks
// ----------------------------------------------------------------------

function useProducts(initialFilters: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        sortBy: "name",
        sortOrder: "ASC",
      };

      if (filters.status !== "all") {
        params.isActive = filters.status === "active";
      }

      if (filters.search) {
        params.search = filters.search;
      }

      if (filters.category) {
        params.category = filters.category;
      }

      if (filters.lowStock) {
        // We'll handle low stock filtering client-side for simplicity
        // Or you can add a lowStock param to your API
      }

      const response = await productAPI.getAll(params);
      if (response.status) {
        setProducts(response.data);

        // Extract unique categories (if you have category field)
        const cats = response.data
          .map((p) => (p as any).category) // assuming category might be in extended Product
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i);
        setCategories(cats);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load products");
      dialogs.alert({ title: "Error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Apply filters locally
  useEffect(() => {
    let filtered = [...products];

    if (filters.lowStock) {
      filtered = filtered.filter((p) => p.stockQty <= 5); // threshold
    }

    if (filters.search) {
      const lower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.sku.toLowerCase().includes(lower) ||
          (p.description && p.description.toLowerCase().includes(lower)),
      );
    }

    if (filters.category) {
      filtered = filtered.filter(
        (p) => (p as any).category === filters.category,
      );
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(
        (p) => p.isActive === (filters.status === "active"),
      );
    }

    setFilteredProducts(filtered);
  }, [products, filters]);

  useEffect(() => {
    loadProducts();
  }, [filters.status, filters.category]); // Reload when these change (search is client-side)

  return {
    products: filteredProducts,
    filters,
    setFilters,
    loading,
    error,
    categories,
    reload: loadProducts,
  };
}

function useProductForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [productId, setProductId] = useState<number | undefined>();
  const [initialData, setInitialData] = useState<ProductFormData>({
    sku: "",
    name: "",
    description: "",
    price: 0,
    stockQty: 0,
    reorderLevel: 5,
    isActive: true,
    category: "",
  });

  const openAdd = () => {
    setMode("add");
    setProductId(undefined);
    setInitialData({
      sku: "",
      name: "",
      description: "",
      price: 0,
      stockQty: 0,
      reorderLevel: 5,
      isActive: true,
      category: "",
    });
    setIsOpen(true);
  };

  const openEdit = (product: Product) => {
    setMode("edit");
    setProductId(product.id);
    setInitialData({
      sku: product.sku,
      name: product.name,
      description: product.description || "",
      price:
        typeof product.price === "string"
          ? parseFloat(product.price)
          : product.price,
      stockQty: product.stockQty,
      reorderLevel: (product as any).reorderLevel || 5,
      isActive: product.isActive,
      category: (product as any).category || "",
    });
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setProductId(undefined);
  };

  return {
    isOpen,
    mode,
    productId,
    initialData,
    openAdd,
    openEdit,
    close,
  };
}

function useProductView() {
  const [isOpen, setIsOpen] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [salesStats, setSalesStats] = useState<ProductSalesReportItem | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const open = async (product: Product) => {
    setProduct(product);
    setIsOpen(true);
    setLoading(true);

    try {
      // Load inventory movements
      const movementsRes = await inventoryAPI.getByProduct(product.id);
      if (movementsRes.status) {
        setMovements(movementsRes.data.slice(0, 10)); // last 10
      }

      // Load sales stats for this product
      const salesRes = await productAPI.getSalesReport({
        productId: product.id,
      });
      if (salesRes.status && salesRes.data.length > 0) {
        setSalesStats(salesRes.data[0]);
      }
    } catch (err) {
      console.error("Failed to load product details", err);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setIsOpen(false);
    setProduct(null);
    setMovements([]);
    setSalesStats(null);
  };

  return {
    isOpen,
    product,
    movements,
    salesStats,
    loading,
    open,
    close,
  };
}

// ----------------------------------------------------------------------
// Helper Components
// ----------------------------------------------------------------------

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => {
  return active ? (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[var(--status-completed-bg)] text-[var(--status-completed)]">
      <Check className="w-3 h-3" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[var(--status-cancelled-bg)] text-[var(--status-cancelled)]">
      <X className="w-3 h-3" />
      Inactive
    </span>
  );
};

const StockBadge: React.FC<{ qty: number }> = ({ qty }) => {
  if (qty <= 0) {
    return (
      <span className="text-[var(--stock-outstock)] font-medium">
        Out of Stock
      </span>
    );
  }
  if (qty <= 5) {
    return (
      <span className="text-[var(--stock-lowstock)] font-medium">
        Low ({qty})
      </span>
    );
  }
  return <span className="text-[var(--stock-instock)] font-medium">{qty}</span>;
};

const FilterBar: React.FC<{
  filters: ProductFilters;
  onFilterChange: (key: keyof ProductFilters, value: any) => void;
  categories: string[];
  onReload: () => void;
}> = ({ filters, onFilterChange, categories, onReload }) => {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4 mb-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search by SKU, name, description..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg pl-10 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange("status", e.target.value)}
          className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Category Filter */}
        {categories.length > 0 && (
          <select
            value={filters.category}
            onChange={(e) => onFilterChange("category", e.target.value)}
            className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}

        {/* Low Stock Toggle */}
        <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
          <input
            type="checkbox"
            checked={filters.lowStock}
            onChange={(e) => onFilterChange("lowStock", e.target.checked)}
            className="rounded border-[var(--border-color)] bg-[var(--input-bg)]"
          />
          Low stock only
        </label>

        {/* Reload button */}
        <button
          onClick={onReload}
          className="p-2 bg-[var(--card-hover-bg)] rounded-lg hover:bg-[var(--border-color)] transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-[var(--text-secondary)]" />
        </button>
      </div>
    </div>
  );
};

const ProductTable: React.FC<{
  products: Product[];
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}> = ({ products, onView, onEdit, onDelete }) => {
  if (products.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-8 text-center">
        <Package className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
        <p className="text-[var(--text-primary)] font-medium">
          No products found
        </p>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          Try adjusting your filters or add a new product
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--table-header-bg)] border-b border-[var(--border-color)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                SKU
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Product Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Stock
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {products.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-[var(--table-row-hover)] transition-colors"
              >
                <td className="px-4 py-3 text-sm font-mono text-[var(--text-primary)]">
                  {product.sku}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--text-secondary)] font-medium">
                  {product.name}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {(product as any).category || "—"}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-[var(--accent-green)]">
                  ₱{new Decimal(product.price).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <StockBadge qty={product.stockQty} />
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge active={product.isActive} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onView(product)}
                      className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-blue)]"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(product)}
                      className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-purple)]"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(product)}
                      className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-red)]"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ProductFormDialog: React.FC<{
  isOpen: boolean;
  mode: "add" | "edit";
  productId?: number;
  initialData: ProductFormData;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ isOpen, mode, productId, initialData, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<ProductFormData>(initialData);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProductFormData, string>>
  >({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!formData.sku.trim()) newErrors.sku = "SKU is required";
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (formData.price <= 0) newErrors.price = "Price must be greater than 0";
    if (formData.stockQty < 0)
      newErrors.stockQty = "Stock quantity cannot be negative";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const user = "system";

      if (mode === "add") {
        await productAPI.create(
          {
            sku: formData.sku,
            name: formData.name,
            description: formData.description || undefined,
            price: formData.price,
            stockQty: formData.stockQty,
            isActive: formData.isActive,
          },
          user,
        );
      } else {
        if (!productId) throw new Error("Product ID missing");
        await productAPI.update(
          productId,
          {
            sku: formData.sku,
            name: formData.name,
            description: formData.description || undefined,
            price: formData.price,
            stockQty: formData.stockQty,
            isActive: formData.isActive,
          },
          user,
        );
      }

      dialogs.alert({
        title: "Success",
        message: `Product ${mode === "add" ? "created" : "updated"} successfully.`,
      });
      onSuccess();
    } catch (err: any) {
      dialogs.alert({ title: "Error", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-xl w-full max-w-md p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {mode === "add" ? "Add New Product" : "Edit Product"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[var(--card-hover-bg)] rounded"
            >
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                SKU <span className="text-[var(--accent-red)]">*</span>
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                className={`w-full bg-[var(--input-bg)] border ${errors.sku ? "border-[var(--accent-red)]" : "border-[var(--input-border)]"} rounded-lg px-3 py-2 text-[var(--text-primary)]`}
              />
              {errors.sku && (
                <p className="mt-1 text-xs text-[var(--accent-red)]">
                  {errors.sku}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Product Name <span className="text-[var(--accent-red)]">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`w-full bg-[var(--input-bg)] border ${errors.name ? "border-[var(--accent-red)]" : "border-[var(--input-border)]"} rounded-lg px-3 py-2 text-[var(--text-primary)]`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-[var(--accent-red)]">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Price (₱) <span className="text-[var(--accent-red)]">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={`w-full bg-[var(--input-bg)] border ${errors.price ? "border-[var(--accent-red)]" : "border-[var(--input-border)]"} rounded-lg px-3 py-2 text-[var(--text-primary)]`}
                />
                {errors.price && (
                  <p className="mt-1 text-xs text-[var(--accent-red)]">
                    {errors.price}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stockQty}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stockQty: parseInt(e.target.value) || 0,
                    })
                  }
                  className={`w-full bg-[var(--input-bg)] border ${errors.stockQty ? "border-[var(--accent-red)]" : "border-[var(--input-border)]"} rounded-lg px-3 py-2 text-[var(--text-primary)]`}
                />
                {errors.stockQty && (
                  <p className="mt-1 text-xs text-[var(--accent-red)]">
                    {errors.stockQty}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Reorder Level
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.reorderLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reorderLevel: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
                  placeholder="e.g., Electronics"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="rounded border-[var(--border-color)] bg-[var(--input-bg)]"
              />
              <label
                htmlFor="isActive"
                className="text-sm text-[var(--text-primary)]"
              >
                Active (available for sale)
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {mode === "add" ? "Create Product" : "Update Product"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ProductViewDialog: React.FC<{
  product: Product | null;
  movements: InventoryMovement[];
  salesStats: ProductSalesReportItem | null;
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
}> = ({ product, movements, salesStats, loading, isOpen, onClose }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-xl w-full max-w-2xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Product Details
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[var(--card-hover-bg)] rounded"
            >
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="bg-[var(--card-secondary-bg)] rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">SKU</p>
                    <p className="text-sm font-mono text-[var(--text-primary)]">
                      {product.sku}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Status
                    </p>
                    <StatusBadge active={product.isActive} />
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Product Name
                    </p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {product.name}
                    </p>
                  </div>
                  {product.description && (
                    <div className="col-span-2">
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Description
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {product.description}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Price</p>
                    <p className="text-lg font-bold text-[var(--accent-green)]">
                      ₱{new Decimal(product.price).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Stock</p>
                    <StockBadge qty={product.stockQty} />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Category
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {(product as any).category || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Created
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {format(new Date(product.createdAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sales Stats */}
              {salesStats && (
                <div className="bg-[var(--card-secondary-bg)] rounded-lg p-4">
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[var(--accent-blue)]" />
                    Sales Performance
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Total Sold
                      </p>
                      <p className="text-lg font-semibold text-[var(--text-primary)]">
                        {salesStats.totalQuantity} units
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Total Revenue
                      </p>
                      <p className="text-lg font-semibold text-[var(--accent-green)]">
                        ₱{new Decimal(salesStats.totalRevenue).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Movements */}
              {movements.length > 0 && (
                <div className="bg-[var(--card-secondary-bg)] rounded-lg p-4">
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <History className="w-4 h-4 text-[var(--accent-purple)]" />
                    Recent Inventory Movements
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {movements.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between text-sm border-b border-[var(--border-color)] pb-2 last:border-0"
                      >
                        <div>
                          <span
                            className={`inline-block w-2 h-2 rounded-full mr-2 ${
                              m.qtyChange > 0
                                ? "bg-[var(--accent-green)]"
                                : "bg-[var(--accent-red)]"
                            }`}
                          />
                          <span className="text-[var(--text-secondary)]">
                            {m.movementType} – {m.qtyChange > 0 ? "+" : ""}
                            {m.qtyChange} units
                          </span>
                        </div>
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {format(new Date(m.timestamp), "MMM dd, HH:mm")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Main Page Component
// ----------------------------------------------------------------------

const ProductPage: React.FC = () => {
  const { products, filters, setFilters, loading, error, categories, reload } =
    useProducts({
      search: "",
      status: "active",
      category: "",
      lowStock: false,
    });

  const formDialog = useProductForm();
  const viewDialog = useProductView();

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
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

  return (
    <div className="h-full flex flex-col bg-[var(--background-color)] p-6">
      {/* Header */}
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

      {/* Filters */}
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
        <div className="flex-1 overflow-hidden">
          <ProductTable
            products={products}
            onView={viewDialog.open}
            onEdit={formDialog.openEdit}
            onDelete={handleDelete}
          />
        </div>
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
    </div>
  );
};

export default ProductPage;
