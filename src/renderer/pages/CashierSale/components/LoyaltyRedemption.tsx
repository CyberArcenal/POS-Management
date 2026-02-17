import React from 'react';

interface LoyaltyRedemptionProps {
  selectedCustomer: boolean; // true if customer exists
  loyaltyPointsAvailable: number;
  useLoyalty: boolean;
  loyaltyPointsToRedeem: number;
  maxRedeemable: number;
  onUseLoyaltyChange: (checked: boolean) => void;
  onPointsChange: (points: number) => void;
}

const LoyaltyRedemption: React.FC<LoyaltyRedemptionProps> = ({
  selectedCustomer,
  loyaltyPointsAvailable,
  useLoyalty,
  loyaltyPointsToRedeem,
  maxRedeemable,
  onUseLoyaltyChange,
  onPointsChange,
}) => {
  if (!selectedCustomer || loyaltyPointsAvailable <= 0) return null;

  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="useLoyalty"
        checked={useLoyalty}
        onChange={(e) => onUseLoyaltyChange(e.target.checked)}
        className="rounded border-[var(--border-color)] bg-[var(--input-bg)]"
      />
      <label htmlFor="useLoyalty" className="text-sm text-[var(--text-primary)]">
        Use loyalty points
      </label>
      {useLoyalty && (
        <input
          type="number"
          min="0"
          max={maxRedeemable}
          value={loyaltyPointsToRedeem}
          onChange={(e) => onPointsChange(Math.min(maxRedeemable, parseFloat(e.target.value) || 0))}
          className="w-20 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-sm"
          placeholder="Points"
        />
      )}
    </div>
  );
};

export default LoyaltyRedemption;