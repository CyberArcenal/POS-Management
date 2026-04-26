import React, { useState, useEffect } from "react";
import { X, Loader2, Save, Barcode, Upload, X as XIcon, Image as ImageIcon } from "lucide-react";
import productAPI from "../../../api/core/product";
import supplierAPI from "../../../api/core/supplier";
import { dialogs } from "../../../utils/dialogs";
import { type ProductFormData } from "../hooks/useProductForm";
import CategorySelect from "../../../components/Selects/Category";
import type { Category } from "../../../api/core/category";
import type { Supplier } from "../../../api/core/supplier";

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
  const [formData, setFormData] = useState<ProductFormData>({
    ...initialData,
    barcode: initialData.barcode || "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // Image state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  // Load suppliers for dropdown
  useEffect(() => {
    if (!isOpen) return;
    const loadSuppliers = async () => {
      setLoadingSuppliers(true);
      try {
        const response = await supplierAPI.getAll({ isActive: true });
        if (response.status && response.data) {
          setSuppliers(response.data);
        }
      } catch (error) {
        console.error("Failed to load suppliers:", error);
      } finally {
        setLoadingSuppliers(false);
      }
    };
    loadSuppliers();
  }, [isOpen]);

  // Reset form when dialog opens or initialData changes
  useEffect(() => {
    setFormData({
      ...initialData,
      barcode: initialData.barcode || "",
    });
    // Reset image states
    setImageFile(null);
    setRemoveImage(false);
    setImageError(false);
    if (mode === "edit" && initialData.image) {
      const url = productAPI.getImageUrl?.(initialData.image);
      if (url) {
        setImagePreview(url);
      } else {
        setImagePreview(null);
        setImageError(true);
      }
    } else {
      setImagePreview(null);
    }
  }, [initialData, mode]);

  // Barcode scanner
  useEffect(() => {
    if (!isOpen) return;
    const handleBarcodeScanned = (barcode: string) => {
      setFormData((prev) => ({ ...prev, barcode }));
    };
    if (window.backendAPI?.onBarcodeScanned) {
      window.backendAPI.onBarcodeScanned(handleBarcodeScanned);
    }
    return () => {
      // Cleanup would require an off method
    };
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!formData.name?.trim()) newErrors.name = "Product name is required";
    if (!formData.price || formData.price <= 0) newErrors.price = "Price must be greater than 0";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const user = "system";
      const basePayload: any = {
        sku: formData.sku || undefined,
        name: formData.name,
        barcode: formData.barcode || undefined,
        description: formData.description || undefined,
        price: formData.price,
        isActive: formData.isActive,
        categoryId: formData.categoryId || undefined,
        supplierId: formData.supplierId || undefined,
      };

      if (mode === "add") {
        if (imageFile) {
          const rawBase64 = imagePreview!.split(',')[1].replace(/\s/g, '');
          basePayload.image = {
            buffer: rawBase64,
            originalName: imageFile.name,
          };
        }
        await productAPI.create(basePayload, user);
      } else {
        if (imageFile) {
          const rawBase64 = imagePreview!.split(',')[1].replace(/\s/g, '');
          basePayload.image = {
            buffer: rawBase64,
            originalName: imageFile.name,
          };
        } else if (removeImage) {
          basePayload.image = null;
        }
        if (!productId) throw new Error("Product ID missing");
        await productAPI.update(productId, basePayload, user);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      dialogs.alert({
        title: "Invalid file",
        message: "Please select an image file (JPG, PNG, GIF, WEBP).",
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      dialogs.alert({
        title: "File too large",
        message: "Image must be less than 2MB.",
      });
      return;
    }
    setImageFile(file);
    setRemoveImage(false);
    setImageError(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError(false);
    if (mode === "edit") {
      setRemoveImage(true);
    }
    const fileInput = document.getElementById("image-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto transition-all duration-200">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-[var(--card-bg)] border-b border-[var(--border-color)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {mode === "add" ? "Add New Product" : "Edit Product"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--card-hover-bg)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SKU */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  value={formData.sku || ""}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Auto-generated if empty"
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent transition"
                />
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  Leave empty to auto‑generate
                </p>
              </div>

              {/* Barcode */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">
                  Barcode
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.barcode || ""}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Scan or enter barcode"
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-4 py-2.5 pl-10 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
                  />
                  <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                </div>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  Scanner is active while this dialog is open.
                </p>
              </div>

              {/* Product Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">
                  Product Name <span className="text-[var(--accent-red)]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full bg-[var(--input-bg)] border ${
                    errors.name ? "border-[var(--accent-red)]" : "border-[var(--input-border)]"
                  } rounded-lg px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-[var(--accent-red)]">{errors.name}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">
                  Category
                </label>
                <CategorySelect
                  value={formData.categoryId as number}
                  activeOnly
                  onChange={(categoryId: number | null) => {
                    setFormData({ ...formData, categoryId: categoryId || undefined });
                  }}
                />
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">
                  Supplier
                </label>
                <select
                  value={formData.supplierId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, supplierId: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
                  disabled={loadingSuppliers}
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {loadingSuppliers && (
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">Loading suppliers...</p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">
                  Price (₱) <span className="text-[var(--accent-red)]">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                  }
                  className={`w-full bg-[var(--input-bg)] border ${
                    errors.price ? "border-[var(--accent-red)]" : "border-[var(--input-border)]"
                  } rounded-lg px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]`}
                />
                {errors.price && (
                  <p className="mt-1 text-xs text-[var(--accent-red)]">{errors.price}</p>
                )}
              </div>

              {/* Stock Quantity (optional) */}
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">
                  Initial Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stockQty || 0}
                  onChange={(e) =>
                    setFormData({ ...formData, stockQty: parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
                />
              </div>

              {/* Description - full width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-4 py-2.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] resize-none"
                />
              </div>

              {/* Image Upload - full width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                  Product Image
                </label>
                <div className="flex flex-col sm:flex-row items-start gap-6 bg-[var(--card-secondary-bg)] rounded-xl p-5 border border-[var(--border-color)]">
                  {/* Image Preview Area */}
                  <div className="w-36 h-36 flex-shrink-0 bg-[var(--input-bg)] rounded-lg overflow-hidden border border-[var(--border-color)] flex items-center justify-center">
                    {imagePreview && !imageError ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[var(--text-tertiary)]">
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span className="text-xs">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex-1 space-y-3">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => document.getElementById("image-upload")?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] transition"
                      >
                        <Upload className="w-4 h-4" />
                        Choose Image
                      </button>
                      {(imagePreview || (mode === "edit" && initialData.image && !removeImage)) && (
                        <button
                          type="button"
                          onClick={handleClearImage}
                          className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--accent-red)] text-[var(--accent-red)] rounded-lg hover:bg-[var(--accent-red-light)] transition"
                        >
                          <XIcon className="w-4 h-4" />
                          {mode === "edit" && initialData.image && !imageFile ? "Remove Image" : "Clear"}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Recommended: 500x500px, max 2MB. Supported: JPG, PNG, GIF, WEBP.
                    </p>
                    {mode === "edit" && initialData.image && !removeImage && !imageFile && (
                      <p className="text-xs text-[var(--accent-blue)]">
                        ✓ Current image: {initialData.image.split('/').pop()}
                      </p>
                    )}
                    {imageError && (
                      <p className="text-xs text-[var(--accent-red)]">
                        ⚠️ Could not load image preview. The file may be missing or corrupted.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Checkbox */}
              <div className="md:col-span-2 flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--accent-blue)] focus:ring-[var(--accent-blue)]"
                />
                <label htmlFor="isActive" className="text-sm text-[var(--text-primary)]">
                  Active (available for sale)
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold shadow-sm"
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