import { Maximize, Plus } from "lucide-react";
import React, { useState } from "react";

interface LoyaltyRedemptionProps {
  selectedCustomer: boolean; // true if customer exists
  loyaltyPointsAvailable: number;
  useLoyalty: boolean;
  loyaltyPointsToRedeem: number;
  maxRedeemable: number;
  onUseLoyaltyChange: (checked: boolean) => void;
  onPointsChange: (points: number) => void;
  onUseAll?: () => void;
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
  const [isUseAll, setIsUseAll] = useState(false);

  const onMax = () => {
    setIsUseAll(!isUseAll);
    onPointsChange(isUseAll ? 0 : maxRedeemable);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="useLoyalty"
        checked={useLoyalty}
        onChange={(e) => onUseLoyaltyChange(e.target.checked)}
        className="rounded border-[var(--border-color)] bg-[var(--input-bg)]"
      />
      <label
        htmlFor="useLoyalty"
        className="text-sm text-[var(--text-primary)]"
      >
        Use loyalty points
      </label>
      {useLoyalty && (
        <>
          <input
            type="number"
            min="0"
            max={maxRedeemable}
            value={loyaltyPointsToRedeem}
            onChange={(e) =>
              onPointsChange(
                Math.min(maxRedeemable, parseFloat(e.target.value) || 0),
              )
            }
            className="w-20 border-[var(--accent-blue)]! bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-2 text-sm text-[var(--text-primary)]"
            placeholder="Points"
          />
          <button
            onClick={() => onMax()}
            className={`flex items-center justify-center gap-1 px-2 py-2 rounded border ${
              isUseAll
                ? "border-[var(--accent-blue)] bg-[var(--accent-blue-light)] text-[var(--accent-blue)]"
                : "border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)]"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs">All</span>
          </button>
        </>
      )}
    </div>
  );
};

export default LoyaltyRedemption;
