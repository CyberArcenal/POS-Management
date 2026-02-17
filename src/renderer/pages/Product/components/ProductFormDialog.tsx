import React, { useState, useEffect } from "react";
import { X, Loader2, Save } from "lucide-react";
import productAPI from "../../../api/product";
import { dialogs } from "../../../utils/dialogs";
import { type ProductFormData } from "../hooks/useProductForm";
import CategorySelect from "../../../components/Selects/Category";
import type { Category } from "../../../api/category";

interface ProductFormDialogProps {
  isOpen: boolean;
  mode: "add" | "edit";
  productId?: number;
  initialData: ProductFormData;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  isOpen,
  mode,
  productId,
  initialData,
  onClose,
  onSuccess,
}) => {
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
            isActive: formData.isActive,
            // stockQty intentionally omitted – use stock adjustment dialog
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
            isActive: formData.isActive,
            // stockQty intentionally omitted – use stock adjustment dialog
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
                className={`w-full bg-[var(--input-bg)] border ${
                  errors.sku
                    ? "border-[var(--accent-red)]"
                    : "border-[var(--input-border)]"
                } rounded-lg px-3 py-2 text-[var(--text-primary)]`}
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
                className={`w-full bg-[var(--input-bg)] border ${
                  errors.name
                    ? "border-[var(--accent-red)]"
                    : "border-[var(--input-border)]"
                } rounded-lg px-3 py-2 text-[var(--text-primary)]`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-[var(--accent-red)]">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Category
                </label>
                <CategorySelect
                  value={formData.categoryId as number}
                  activeOnly
                  onChange={(
                    categoryId: number | null,
                    category?: Category,
                  ) => {
                    setFormData({
                      ...formData,
                      categoryId: categoryId,
                    });
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Description
              </label>
              <textarea
                value={formData.description as string}
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
                  className={`w-full bg-[var(--input-bg)] border ${
                    errors.price
                      ? "border-[var(--accent-red)]"
                      : "border-[var(--input-border)]"
                  } rounded-lg px-3 py-2 text-[var(--text-primary)]`}
                />
                {errors.price && (
                  <p className="mt-1 text-xs text-[var(--accent-red)]">
                    {errors.price}
                  </p>
                )}
              </div>

              {/* Stock quantity input removed – use stock adjustment dialog */}
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