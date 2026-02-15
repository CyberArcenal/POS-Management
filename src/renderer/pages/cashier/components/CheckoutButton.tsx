import React from 'react';
import { Loader2, Receipt } from 'lucide-react';
import Decimal from 'decimal.js';

interface CheckoutButtonProps {
  isProcessing: boolean;
  disabled: boolean;
  total: Decimal;
  onClick: () => void;
}

const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  isProcessing,
  disabled,
  total,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isProcessing || disabled}
      className="w-full bg-gradient-to-r from-[var(--accent-green)] to-[var(--accent-green-hover)] text-white py-3 rounded-lg font-semibold hover:from-[var(--accent-green-hover)] hover:to-[var(--accent-green-dark)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Receipt className="w-5 h-5" />
          Checkout (₱{total.toFixed(2)})
        </>
      )}
    </button>
  );
};

export default CheckoutButton;