// src/components/cashier/PaymentModal.tsx
import React, { useState, useEffect } from 'react';
import type { PaymentDetails, PaymentMethod } from '../../hooks/useCart';
import { dialogs } from '../../utils/dialogs';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSubmit: (details: PaymentDetails) => void;
  grandTotal: number;
  loading?: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSubmit,
  grandTotal,
  loading = false,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [calculatedChange, setCalculatedChange] = useState(0);

  const paymentMethods: { id: PaymentMethod; name: string; icon: string }[] = [
    { id: 'cash', name: 'Cash', icon: '💰' },
    { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
    { id: 'gcash', name: 'GCash', icon: '📱' },
    { id: 'maya', name: 'Maya', icon: '📱' },
    { id: 'paymaya', name: 'PayMaya', icon: '📱' },
    { id: 'credit', name: 'Store Credit', icon: '🧾' },
  ];

  useEffect(() => {
    if (paymentMethod === 'cash' && amountTendered) {
      const tendered = parseFloat(amountTendered) || 0;
      setCalculatedChange(Math.max(0, tendered - grandTotal));
    } else {
      setCalculatedChange(0);
    }
  }, [amountTendered, grandTotal, paymentMethod]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (paymentMethod === 'cash') {
      const tendered = parseFloat(amountTendered) || 0;
      if (tendered < grandTotal) {
        dialogs.error(`Insufficient payment. Need ₱${grandTotal.toFixed(2)}, received ₱${tendered.toFixed(2)}`);
        return;
      }
    }

    onPaymentSubmit({
      method: paymentMethod,
      amountTendered: parseFloat(amountTendered) || grandTotal,
      referenceNumber: referenceNumber || undefined,
      transactionId: transactionId || undefined,
      notes: notes || undefined,
    });
  };

  const handleKeypadInput = (value: string) => {
    if (value === 'C') {
      setAmountTendered('');
    } else if (value === '.') {
      if (!amountTendered.includes('.')) {
        setAmountTendered(prev => prev + '.');
      }
    } else if (value === '00') {
      setAmountTendered(prev => prev + '00');
    } else {
      setAmountTendered(prev => prev + value);
    }
  };

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-var(--card-bg) rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-var(--card-bg) border-b border-var(--border-color) p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-var(--text-primary)">Process Payment</h2>
              <p className="text-var(--text-tertiary) mt-1">Complete the transaction</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-var(--card-hover-bg) rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-var(--text-secondary)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Total Display */}
          <div className="bg-var(--card-secondary-bg) rounded-lg p-6 mb-6 text-center">
            <div className="text-sm text-var(--text-tertiary) mb-2">Amount Due</div>
            <div className="text-5xl font-bold text-var(--text-primary)">₱{grandTotal.toFixed(2)}</div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-var(--text-primary) mb-4">Payment Method</h3>
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${paymentMethod === method.id
                      ? 'border-var(--accent-blue) bg-var(--accent-blue-light)'
                      : 'border-var(--border-color) hover:border-var(--accent-blue)'
                    }`}
                >
                  <div className="text-2xl mb-2">{method.icon}</div>
                  <div className="font-medium text-var(--text-primary)">{method.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-var(--text-primary) mb-4">
              {paymentMethod === 'cash' ? 'Amount Tendered' : 'Payment Details'}
            </h3>

            {paymentMethod === 'cash' ? (
              <div className="space-y-4">
                {/* Quick Amount Buttons */}
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setAmountTendered(amount.toString())}
                      className="px-4 py-2 bg-var(--card-secondary-bg) hover:bg-var(--card-hover-bg) rounded-lg transition-colors"
                    >
                      ₱{amount}
                    </button>
                  ))}
                </div>

                {/* Amount Input */}
                <div className="relative">
                  <div className="text-var(--text-tertiary) absolute left-4 top-1/2 transform -translate-y-1/2">₱</div>
                  <input
                    type="number"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="w-full pl-10 pr-4 py-4 text-2xl bg-var(--input-bg) border border-var(--input-border) rounded-lg text-var(--text-primary) text-center"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    autoFocus
                  />
                </div>

                {/* Keypad */}
                <div className="pos-keyboard">
                  <div className="grid grid-cols-3 gap-3">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'C'].map((key) => (
                      <button
                        key={key}
                        onClick={() => handleKeypadInput(key)}
                        className="pos-keyboard-key aspect-square flex items-center justify-center text-xl font-medium"
                      >
                        {key}
                      </button>
                    ))}
                    <button
                      onClick={() => handleKeypadInput('00')}
                      className="pos-keyboard-key col-span-2 aspect-auto py-4 flex items-center justify-center text-xl font-medium"
                    >
                      00
                    </button>
                  </div>
                </div>

                {/* Change Display */}
                {calculatedChange > 0 && (
                  <div className="mt-4 p-4 bg-var(--accent-green-light) border border-var(--accent-green) rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-var(--text-primary)">Change Due:</span>
                      <span className="text-2xl font-bold text-var(--accent-green)">₱{calculatedChange.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-var(--text-secondary) mb-2">Reference Number</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-var(--input-bg) border border-var(--input-border) rounded-lg text-var(--text-primary)"
                    placeholder="Enter reference number"
                  />
                </div>
                <div>
                  <label className="block text-sm text-var(--text-secondary) mb-2">Transaction ID</label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-4 py-3 bg-var(--input-bg) border border-var(--input-border) rounded-lg text-var(--text-primary)"
                    placeholder="Enter transaction ID"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mt-6">
              <label className="block text-sm text-var(--text-secondary) mb-2">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-var(--input-bg) border border-var(--input-border) rounded-lg text-var(--text-primary)"
                placeholder="Add any notes about this transaction"
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-var(--border-color)">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-var(--card-secondary-bg) hover:bg-var(--card-hover-bg) text-var(--text-primary) font-medium rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || (paymentMethod === 'cash' && (!amountTendered || parseFloat(amountTendered) < grandTotal))}
              className="flex-1 px-6 py-4 btn-payment font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="spinner w-5 h-5"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  CONFIRM PAYMENT
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;