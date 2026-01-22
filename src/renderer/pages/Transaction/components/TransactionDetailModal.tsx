// src/features/transactions/components/TransactionDetailModal.tsx
import React from 'react';
import type { Transaction, TransactionItem } from '../api/types';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isLoading: boolean;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  isLoading,
  onClose,
}) => {
  if (!transaction) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/30 text-green-300 border-green-700/50';
      case 'cancelled':
        return 'bg-red-900/30 text-red-300 border-red-700/50';
      case 'refunded':
        return 'bg-yellow-900/30 text-yellow-300 border-yellow-700/50';
      case 'pending':
        return 'bg-blue-900/30 text-blue-300 border-blue-700/50';
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  // Helper function to safely access item properties
  const getItemDisplayInfo = (item: TransactionItem) => {
    return {
      productName: item.product_name || `Product ${item.product_id}`,
      sku: item.sku || `SKU-${item.product_id}`,
      barcode: item.barcode || null,
      variantName: item.variant?.name || null,
    };
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Transaction Details</h2>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-400">
                Receipt: <span className="text-blue-300 font-medium">{transaction.reference_number || 'N/A'}</span>
              </span>
              <span className={`px-3 py-1 text-sm rounded-full border ${getStatusColor(transaction.status)}`}>
                {transaction.status.toUpperCase()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400">Loading details...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Transaction Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400">Date & Time:</span>
                      <div className="text-white">{formatDateTime(transaction.datetime)}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Cashier:</span>
                      <div className="text-white">
                        {transaction.user?.display_name || transaction.user?.username || 'System'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Payment Method:</span>
                      <div className="text-white capitalize">{transaction.payment_method}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Payment Status:</span>
                      <div className="text-white capitalize">{transaction.payment_status || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Customer Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400">Customer:</span>
                      <div className="text-white">{transaction.customer_name || 'Walk-in Customer'}</div>
                    </div>
                    {transaction.customer_phone && (
                      <div>
                        <span className="text-gray-400">Phone:</span>
                        <div className="text-white">{transaction.customer_phone}</div>
                      </div>
                    )}
                    {transaction.customer_email && (
                      <div>
                        <span className="text-gray-400">Email:</span>
                        <div className="text-white">{transaction.customer_email}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Items Purchased</h3>
                {transaction.items && transaction.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead>
                        <tr className="bg-gray-800">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">Product</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">SKU</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">Unit Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">Discount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">Total</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {transaction.items.map((item) => {
                          const displayInfo = getItemDisplayInfo(item);
                          return (
                            <tr key={item.id}>
                              <td className="px-4 py-3 text-sm text-white">
                                {displayInfo.productName}
                                {displayInfo.variantName && (
                                  <div className="text-xs text-gray-400">Variant: {displayInfo.variantName}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-400">{displayInfo.sku}</td>
                              <td className="px-4 py-3 text-sm text-white">{item.quantity}</td>
                              <td className="px-4 py-3 text-sm text-white">₱{item.unit_price.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-red-300">
                                -₱{item.discount_amount.toFixed(2)}
                                {item.discount_percentage && item.discount_percentage > 0 && (
                                  <div className="text-xs">({item.discount_percentage}%)</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-white">
                                ₱{item.total_price.toFixed(2)}
                              </td>
                              <td className="px-4 py-3">
                                {item.is_returned ? (
                                  <span className="px-2 py-1 text-xs bg-red-900/30 text-red-300 rounded border border-red-700/50">
                                    RETURNED
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs bg-green-900/30 text-green-300 rounded border border-green-700/50">
                                    SOLD
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-lg">
                    <div className="text-gray-400">No items found for this transaction</div>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Transaction Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal:</span>
                    <span className="text-white">₱{(transaction.subtotal ?? 0).toFixed(2)}</span>
                  </div>
                  {transaction.discount_amount && transaction.discount_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Discount:</span>
                      <span className="text-red-300">-₱{transaction.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  {transaction.tax_amount && transaction.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tax (12%):</span>
                      <span className="text-white">₱{transaction.tax_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-700 pt-3 mt-3">
                    <span className="text-xl font-bold text-white">Grand Total:</span>
                    <span className="text-2xl font-bold text-white">₱{transaction.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount Paid:</span>
                    <span className="text-white">₱{(transaction.amount_paid ?? 0).toFixed(2)}</span>
                  </div>
                  {transaction.payment_change && transaction.payment_change > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Change:</span>
                      <span className="text-green-300">₱{transaction.payment_change.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {transaction.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Notes</h3>
                  <div className="bg-gray-800 p-4 rounded border border-gray-700">
                    <p className="text-gray-300">{transaction.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            Transaction ID: {transaction.id} • Created: {new Date(transaction.created_at).toLocaleDateString()}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
            >
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};