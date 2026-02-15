import React from 'react';
import Decimal from 'decimal.js';

interface TotalsDisplayProps {
  subtotal: Decimal;
  globalDiscount: number;
  globalTax: number;
  useLoyalty: boolean;
  loyaltyPointsToRedeem: number;
  total: Decimal;
}

const TotalsDisplay: React.FC<TotalsDisplayProps> = ({
  subtotal,
  globalDiscount,
  globalTax,
  useLoyalty,
  loyaltyPointsToRedeem,
  total,
}) => {
  return (
    <div className="space-y-1 mb-4">
      <div className="flex justify-between text-sm">
        <span className="text-[var(--text-tertiary)]">Subtotal:</span>
        <span className="text-[var(--text-primary)]">₱{subtotal.toFixed(2)}</span>
      </div>
      {globalDiscount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-tertiary)]">Discount ({globalDiscount}%):</span>
          <span className="text-[var(--accent-amber)]">
            -₱{subtotal.times(globalDiscount / 100).toFixed(2)}
          </span>
        </div>
      )}
      {globalTax > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-tertiary)]">Tax ({globalTax}%):</span>
          <span className="text-[var(--accent-blue)]">
            +₱{subtotal.times(globalTax / 100).toFixed(2)}
          </span>
        </div>
      )}
      {useLoyalty && loyaltyPointsToRedeem > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-tertiary)]">Loyalty redemption:</span>
          <span className="text-[var(--accent-purple)]">-₱{loyaltyPointsToRedeem.toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between text-lg font-bold pt-2 border-t border-[var(--border-color)]">
        <span className="text-[var(--text-primary)]">Total:</span>
        <span className="text-[var(--accent-green)]">₱{total.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default TotalsDisplay;