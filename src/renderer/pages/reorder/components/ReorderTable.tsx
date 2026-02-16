// src/renderer/pages/reorder/components/ReorderTable.tsx
import React from 'react';
import { Package, CheckSquare, Square } from 'lucide-react';
import type { LowStockProduct } from '../hooks/useReorder';
import Decimal from 'decimal.js';

interface ReorderTableProps {
  products: LowStockProduct[];
  selectedIds: Set<number>;
  onToggleSelect: (productId: number) => void;
  onSelectAll: () => void;
}

export const ReorderTable: React.FC<ReorderTableProps> = ({
  products,
  selectedIds,
  onToggleSelect,
  onSelectAll,
}) => {
  const allSelected = products.length > 0 && selectedIds.size === products.length;

  if (products.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-8 text-center">
        <Package className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
        <p className="text-[var(--text-primary)] font-medium">No low‑stock products</p>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">All products are above reorder level.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-[var(--table-header-bg)]">
          <tr>
            <th className="w-8 px-4 py-3">
              <button onClick={onSelectAll} className="text-[var(--text-tertiary)] hover:text-[var(--accent-blue)]">
                {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              </button>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase">Product</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase">SKU</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase">Current Stock</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase">Reorder Level</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase">Reorder Qty</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase">Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-color)]">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-[var(--table-row-hover)]">
              <td className="w-8 px-4 py-3">
                <button
                  onClick={() => onToggleSelect(product.id)}
                  className="text-[var(--text-tertiary)] hover:text-[var(--accent-blue)]"
                >
                  {selectedIds.has(product.id) ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </td>
              <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{product.name}</td>
              <td className="px-4 py-3 text-sm font-mono text-[var(--text-secondary)]">{product.sku}</td>
              <td className="px-4 py-3 text-right text-sm text-[var(--text-primary)]">{product.stockQty}</td>
              <td className="px-4 py-3 text-right text-sm text-[var(--text-secondary)]">{product.reorderLevel}</td>
              <td className="px-4 py-3 text-right text-sm font-medium text-[var(--accent-blue)]">{product.reorderQty}</td>
              <td className="px-4 py-3 text-right text-sm text-[var(--accent-green)]">₱{new Decimal(product.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};