// src/components/cashier/ReceiptPreview.tsx
import React from 'react';
import type { Sale } from '../../api/sales';
import type { CartItem } from '../../contexts/CartContext';

interface ReceiptPreviewProps {
  sale: Sale;
  cartItems: CartItem[];
  change: number;
  onPrint: () => void;
  onClose: () => void;
  onEmailReceipt?: () => void;
}

const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  sale,
  cartItems,
  change,
  onPrint,
  onClose,
  onEmailReceipt,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white text-black w-full max-w-md rounded-lg shadow-2xl">
        {/* Receipt Content */}
        <div className="receipt p-4">
          {/* Store Header */}
          <div className="receipt-header text-center py-4 mb-4">
            <h2 className="text-xl font-bold mb-1">POS MANAGEMENT SYSTEM</h2>
            <p className="text-sm">123 Business Street, Makati City</p>
            <p className="text-sm">TIN: 123-456-789-000</p>
            <div className="text-xs mt-2">VAT Reg. TIN: 123-456-789-000</div>
          </div>

          {/* Receipt Info */}
          <div className="mb-4 text-center">
            <div className="text-sm">Receipt #: {sale.reference_number}</div>
            <div className="text-sm">Date: {formatDate(sale.datetime)}</div>
            <div className="text-sm">Cashier: {sale.user?.display_name || 'POS System'}</div>
            {sale.customer_name && (
              <div className="text-sm mt-1">Customer: {sale.customer_name}</div>
            )}
          </div>

          {/* Items List */}
          <div className="border-t border-b border-gray-300 py-2 mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-1">Item</th>
                  <th className="text-center py-1">Qty</th>
                  <th className="text-right py-1">Amount</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-1">
                      <div>{item.name}</div>
                      {item.discount > 0 && (
                        <div className="text-xs text-gray-500">Disc: ₱{item.discount.toFixed(2)}</div>
                      )}
                    </td>
                    <td className="text-center py-1">{item.quantity}</td>
                    <td className="text-right py-1">
                      ₱{((item.price - item.discount) * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="text-sm space-y-1 mb-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₱{sale.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>
              <span className="text-red-600">-₱{sale.discount_amount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (12%):</span>
              <span>₱{sale.tax_amount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="receipt-total flex justify-between font-bold text-lg border-t border-gray-300 pt-2 mt-2">
              <span>TOTAL:</span>
              <span>₱{sale.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="border-t border-gray-300 pt-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Payment Method:</span>
              <span className="font-medium">{sale.payment_method.toUpperCase()}</span>
            </div>
            {sale.payment_method === 'cash' && (
              <>
                <div className="flex justify-between text-sm">
                  <span>Amount Tendered:</span>
                  <span>₱{sale.amount_paid?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Change:</span>
                  <span className="font-medium">₱{change.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-600">
            <div className="mb-2">Thank you for your purchase!</div>
            <div>Items can be returned within 7 days with receipt</div>
            <div>For inquiries: (02) 123-4567</div>
            <div className="mt-4">** END OF RECEIPT **</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            Close
          </button>
          <button
            onClick={onPrint}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          {onEmailReceipt && (
            <button
              onClick={onEmailReceipt}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptPreview;