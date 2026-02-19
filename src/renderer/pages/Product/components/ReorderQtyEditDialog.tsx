import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import productAPI from "../../../api/product";
import { dialogs } from "../../../utils/dialogs";
import type { Product } from "../../../api/product";

interface ReorderQtyEditDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReorderQtyEditDialog: React.FC<ReorderQtyEditDialogProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [newQty, setNewQty] = useState<number>(product?.reorderQty || 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newQty < 0) {
      setError("Reorder quantity cannot be negative");
      return;
    }

    setSaving(true);
    try {
      const response = await productAPI.update(
        product.id,
        { reorderQty: newQty },
        "system"
      );
      if (response.status) {
        dialogs.alert({
          title: "Success",
          message: `Reorder quantity updated to ${newQty}`,
        });
        onSuccess();
        onClose();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update reorder quantity");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Edit Reorder Quantity</h2>
            <button onClick={onClose} className="p-1 hover:bg-[var(--card-hover-bg)] rounded">
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          <div className="mb-4 p-3 bg-[var(--card-secondary-bg)] rounded-lg">
            <p className="text-sm text-[var(--text-primary)] font-medium">{product.name}</p>
            <p className="text-xs text-[var(--text-tertiary)]">
              SKU: {product.sku} | Current Reorder Quantity: {product.reorderQty}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                New Reorder Quantity <span className="text-[var(--accent-red)]">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={newQty}
                onChange={(e) => setNewQty(parseInt(e.target.value) || 0)}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
                required
              />
            </div>

            {error && (
              <div className="p-2 bg-[var(--status-cancelled-bg)] border border-[var(--accent-red)] rounded text-sm text-[var(--accent-red)]">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)]">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Quantity"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};