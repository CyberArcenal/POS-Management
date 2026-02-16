// src/renderer/pages/purchase/components/PurchaseViewDialog.tsx
import React from 'react';
import { X, Package, ShoppingCart, Loader2 } from 'lucide-react';
import type { Purchase, PurchaseItem } from '../../../api/purchase';
import Decimal from 'decimal.js';

interface PurchaseViewDialogProps {
  purchase: Purchase | null;
  items: PurchaseItem[];
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusStyles = {
    pending: 'bg-[var(--status-pending-bg)] text-[var(--status-pending)]',
    completed: 'bg-[var(--status-completed-bg)] text-[var(--status-completed)]',
    cancelled: 'bg-[var(--status-cancelled-bg)] text-[var(--status-cancelled)]',
  };
  const style = statusStyles[status as keyof typeof statusStyles] || '';
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${style}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export const PurchaseViewDialog: React.FC<PurchaseViewDialogProps> = ({
  purchase,
  items,
  loading,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !purchase) return null;

  const totalAmount = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-[var(--card-bg)] rounded-lg w-full max-w-3xl p-6 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Purchase Order: {purchase.referenceNo || `#${purchase.id}`}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-[var(--card-hover-bg)] rounded">
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
            </div>
          ) : (
            <>
              {/* Header Info */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-[var(--card-secondary-bg)] p-3 rounded-lg">
                  <p className="text-xs text-[var(--text-tertiary)]">Supplier</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{purchase.supplier?.name || '—'}</p>
                </div>
                <div className="bg-[var(--card-secondary-bg)] p-3 rounded-lg">
                  <p className="text-xs text-[var(--text-tertiary)]">Order Date</p>
                  <p className="text-sm text-[var(--text-primary)]">{new Date(purchase.orderDate).toLocaleDateString()}</p>
                </div>
                <div className="bg-[var(--card-secondary-bg)] p-3 rounded-lg">
                  <p className="text-xs text-[var(--text-tertiary)]">Status</p>
                  <StatusBadge status={purchase.status} />
                </div>
              </div>

              {/* Items Table */}
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Items
              </h3>
              <div className="flex-1 overflow-y-auto border border-[var(--border-color)] rounded-lg">
                <table className="w-full">
                  <thead className="bg-[var(--table-header-bg)] sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[var(--text-tertiary)]">Product</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-[var(--text-tertiary)]">Qty</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-[var(--text-tertiary)]">Unit Price</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-[var(--text-tertiary)]">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm text-[var(--text-primary)]">
                          {item.product?.name || `Product #${item.product?.id}`}
                          <span className="text-xs text-[var(--text-tertiary)] ml-2">SKU: {item.product?.sku}</span>
                        </td>
                        <td className="px-4 py-2 text-right text-sm text-[var(--text-secondary)]">{item.quantity}</td>
                        <td className="px-4 py-2 text-right text-sm text-[var(--accent-green)]">₱{new Decimal(item.unitPrice).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right text-sm font-semibold text-[var(--accent-green)]">₱{new Decimal(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[var(--table-header-bg)]">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-sm font-medium text-[var(--text-primary)]">Total</td>
                      <td className="px-4 py-2 text-right text-sm font-bold text-[var(--accent-green)]">₱{new Decimal(totalAmount).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Notes */}
              {purchase.notes && (
                <div className="mt-4">
                  <p className="text-sm text-[var(--text-tertiary)]">Notes:</p>
                  <p className="text-sm text-[var(--text-primary)] bg-[var(--card-secondary-bg)] p-2 rounded">{purchase.notes}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};