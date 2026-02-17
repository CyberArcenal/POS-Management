// src/renderer/pages/Settings/components/SalesTab.tsx
import React from "react";
import { type SalesSettings } from "../../../api/system_config";

interface Props {
  settings: SalesSettings;
  onUpdate: (field: keyof SalesSettings, value: any) => void;
}

const SalesTab: React.FC<Props> = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">Sales Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Tax Rate (%)
          </label>
          <input
            type="number"
            value={settings.tax_rate ?? 0}
            onChange={(e) => onUpdate("tax_rate", parseFloat(e.target.value) || 0)}
            className="windows-input w-full"
            min="0"
            max="100"
            step="0.1"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="discount_enabled"
            checked={settings.discount_enabled || false}
            onChange={(e) => onUpdate("discount_enabled", e.target.checked)}
            className="windows-checkbox"
          />
          <label htmlFor="discount_enabled" className="text-sm text-[var(--text-secondary)]">
            Enable Discounts
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Max Discount Percent
          </label>
          <input
            type="number"
            value={settings.max_discount_percent ?? 50}
            onChange={(e) => onUpdate("max_discount_percent", parseFloat(e.target.value) || 0)}
            className="windows-input w-full"
            min="0"
            max="100"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allow_refunds"
            checked={settings.allow_refunds || false}
            onChange={(e) => onUpdate("allow_refunds", e.target.checked)}
            className="windows-checkbox"
          />
          <label htmlFor="allow_refunds" className="text-sm text-[var(--text-secondary)]">
            Allow Refunds
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Refund Window (days)
          </label>
          <input
            type="number"
            value={settings.refund_window_days ?? 7}
            onChange={(e) => onUpdate("refund_window_days", parseInt(e.target.value) || 0)}
            className="windows-input w-full"
            min="0"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="loyalty_points_enabled"
            checked={settings.loyalty_points_enabled || false}
            onChange={(e) => onUpdate("loyalty_points_enabled", e.target.checked)}
            className="windows-checkbox"
          />
          <label htmlFor="loyalty_points_enabled" className="text-sm text-[var(--text-secondary)]">
            Enable Loyalty Points
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Loyalty Points Rate (per currency unit)
          </label>
          <input
            type="number"
            value={settings.loyalty_points_rate ?? 1}
            onChange={(e) => onUpdate("loyalty_points_rate", parseFloat(e.target.value) || 0)}
            className="windows-input w-full"
            min="0"
            step="0.01"
          />
        </div>
      </div>
    </div>
  );
};

export default SalesTab;