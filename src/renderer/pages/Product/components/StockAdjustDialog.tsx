import React, { useState } from "react";
import { X, Loader2, PackagePlus } from "lucide-react";
import Decimal from "decimal.js";
import productAPI from "../../../api/product";
import { dialogs } from "../../../utils/dialogs";
import type { Product } from "../../../api/product";

interface StockAdjustDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StockAdjustDialog: React.FC<StockAdjustDialogProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [quantityChange, setQuantityChange] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (quantityChange === 0) {
      setError("Quantity change must be non-zero");
      return;
    }

    // Optional: check if resulting stock would be negative
    const newStock = product.stockQty + quantityChange;
    if (newStock < 0) {
      setError("Resulting stock cannot be negative");
      return;
    }

    setSaving(true);
    try {
      const response = await productAPI.updateStock(
        {
          productId: product.id,
          quantityChange,
          movementType: "adjustment",
          notes: notes.trim() || null,
          saleId: null,
        },
        "system"
      );

      if (response.status) {
        dialogs.alert({
          title: "Success",
          message: `Stock updated successfully. New stock: ${response.data.product.stockQty}`,
        });
        onSuccess();
        onClose();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update stock");
    } finally {
      setSaving(false);
    }
  };

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
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-[var(--accent-blue)]" />
              Adjust Stock
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[var(--card-hover-bg)] rounded"
            >
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          {/* Product Info */}
          <div className="mb-4 p-3 bg-[var(--card-secondary-bg)] rounded-lg">
            <p className="text-sm text-[var(--text-primary)] font-medium">
              {product.name}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              SKU: {product.sku} | Current Stock:{" "}
              <span className="font-mono">{product.stockQty}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Quantity Change <span className="text-[var(--accent-red)]">*</span>
              </label>
              <input
                type="number"
                step="1"
                value={quantityChange}
                onChange={(e) => setQuantityChange(parseInt(e.target.value) || 0)}
                placeholder="e.g., 10 (increase) or -5 (decrease)"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
                required
              />
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                Positive = increase, negative = decrease
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Notes (optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for adjustment"
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
              />
            </div>

            {error && (
              <div className="p-2 bg-[var(--status-cancelled-bg)] border border-[var(--accent-red)] rounded text-sm text-[var(--accent-red)]">
                {error}
              </div>
            )}

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
                    Updating...
                  </>
                ) : (
                  "Update Stock"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};