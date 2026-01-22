// Updated TotalsPanel.tsx - Simplified version for right panel
import React from 'react';
import { useCart } from '../../hooks/useCart';

interface TotalsPanelProps {
  onCheckout?: () => void;
}

const TotalsPanel: React.FC<TotalsPanelProps> = ({ onCheckout }) => {
  const { state } = useCart();
  const { subtotal, discountTotal, taxTotal, grandTotal, itemCount } = state;

  return (
    <div className="h-full bg-gray-800 p-6">
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-white mb-6 pb-4 border-b border-gray-700">
          Order Summary
        </h3>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-300 text-lg">Subtotal</span>
            <span className="text-xl font-semibold">₱{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-gray-300 text-lg">Discount</span>
            <span className="text-xl font-semibold text-green-400">-₱{discountTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-gray-300 text-lg">Tax (12%)</span>
            <span className="text-xl font-semibold">₱{taxTotal.toFixed(2)}</span>
          </div>

          <div className="border-t border-gray-700 pt-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold text-white">Total</span>
              <span className="text-5xl font-bold text-white">₱{grandTotal.toFixed(2)}</span>
            </div>
            <div className="text-sm text-gray-400 text-center">
              {itemCount} item{itemCount !== 1 ? 's' : ''} in cart
            </div>
          </div>
        </div>

        <button
          onClick={onCheckout}
          disabled={itemCount === 0}
          className="w-full mt-8 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold py-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-xl shadow-lg hover:shadow-xl"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          CHECKOUT
        </button>
      </div>
    </div>
  );
};

export default TotalsPanel;