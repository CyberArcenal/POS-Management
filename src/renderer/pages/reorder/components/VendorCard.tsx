// src/renderer/pages/reorder/components/VendorCard.tsx
import React from 'react';
import { Package, AlertTriangle } from 'lucide-react';
import type { SupplierGroup } from '../hooks/useReorder';

interface VendorCardProps {
  group: SupplierGroup;
  isSelected: boolean;
  onSelect: () => void;
}

export const VendorCard: React.FC<VendorCardProps> = ({ group, isSelected, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'border-[var(--accent-blue)] bg-[var(--accent-blue-light)]'
          : 'border-[var(--border-color)] bg-[var(--card-bg)] hover:border-[var(--accent-blue)]'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">{group.supplier.name}</h3>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            {group.supplier.contactInfo || 'No contact info'}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-[var(--status-pending-bg)] text-[var(--status-pending)] px-2 py-1 rounded-full text-xs font-medium">
          <AlertTriangle className="w-3 h-3" />
          {group.lowStockCount} low stock
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1 text-[var(--text-secondary)]">
          <Package className="w-4 h-4" />
          <span>{group.products.length} products</span>
        </div>
      </div>
    </div>
  );
};