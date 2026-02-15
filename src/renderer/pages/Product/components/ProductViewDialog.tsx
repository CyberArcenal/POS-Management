import React from "react";
import { X, Loader2, TrendingUp, History, Check } from "lucide-react";
import Decimal from "decimal.js";
import { format } from "date-fns";
import { type Product } from "../../../api/product";
import { type InventoryMovement } from "../../../api/inventory";
import { type ProductSalesReportItem } from "../../../api/product";

// Reuse status badge and stock badge (or define locally)
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

interface ProductViewDialogProps {
  product: Product | null;
  movements: InventoryMovement[];
  salesStats: ProductSalesReportItem | null;
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductViewDialog: React.FC<ProductViewDialogProps> = ({
  product,
  movements,
  salesStats,
  loading,
  isOpen,
  onClose,
}) => {
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
                    <p className="text-xs text-[var(--text-tertiary)]">Status</p>
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
                    <p className="text-xs text-[var(--text-tertiary)]">Category</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {(product as any).category || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Created</p>
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