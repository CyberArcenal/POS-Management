import React from 'react';
import { Package, CheckSquare, Square, ShoppingCart } from 'lucide-react';
import type { Product } from '../../../api/product';
import Decimal from 'decimal.js';

const StockBadge: React.FC<{ qty: number }> = ({ qty }) => {
  if (qty <= 0) {
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-[var(--stock-outstock-bg)] text-[var(--stock-outstock)]">Out of Stock</span>;
  }
  if (qty <= 5) {
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-[var(--stock-lowstock-bg)] text-[var(--stock-lowstock)]">Low ({qty})</span>;
  }
  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-[var(--stock-instock-bg)] text-[var(--stock-instock)]">In Stock ({qty})</span>;
};

interface StockTableProps {
  products: Product[];
  selectedIds: Set<number>;
  onToggleSelect: (productId: number) => void;
  onSelectAll: () => void;
  onReorder: (product: Product) => void;
}

export const StockTable: React.FC<StockTableProps> = ({
  products,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onReorder,
}) => {
  const allSelected = products.length > 0 && selectedIds.size === products.length;

  if (products.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-8 text-center">
        <Package className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
        <p className="text-[var(--text-primary)] font-medium">No products found</p>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg flex flex-col">
      {/* Scrollable Table with Sticky Header */}
      <div className="flex-1 overflow-auto">
        <table className="w-full table-fixed">
          <thead className="bg-[var(--table-header-bg)] sticky top-0 z-10">
            <tr>
              <th className="w-12 px-4 py-3 text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                <button onClick={onSelectAll} className="text-[var(--text-tertiary)] hover:text-[var(--accent-blue)]">
                  {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>
              </th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">SKU</th>
              <th className="w-48 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Name</th>
              <th className="w-36 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Supplier</th>
              <th className="w-32 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Category</th>
              <th className="w-24 px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Price</th>
              <th className="w-24 px-4 py-3 text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Stock</th>
              <th className="w-20 px-4 py-3 text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-[var(--table-row-hover)]">
                <td className="w-12 px-4 py-3 text-center">
                  <button
                    onClick={() => onToggleSelect(product.id)}
                    className="text-[var(--text-tertiary)] hover:text-[var(--accent-blue)]"
                  >
                    {selectedIds.has(product.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                </td>
                <td className="w-24 px-4 py-3 text-sm font-mono text-[var(--text-secondary)] truncate">{product.sku}</td>
                <td className="w-48 px-4 py-3 text-sm text-[var(--text-primary)] truncate">{product.name}</td>
                <td className="w-36 px-4 py-3 text-sm text-[var(--text-secondary)] truncate">{product.supplier?.name || '—'}</td>
                <td className="w-32 px-4 py-3 text-sm text-[var(--text-secondary)] truncate">{product.category?.name || '—'}</td>
                <td className="w-24 px-4 py-3 text-right text-sm text-[var(--accent-green)]">₱{new Decimal(product.price).toFixed(2)}</td>
                <td className="w-24 px-4 py-3 text-center">
                  <StockBadge qty={product.stockQty} />
                </td>
                <td className="w-20 px-4 py-3 text-center">
                  <button
                    onClick={() => onReorder(product)}
                    className="p-1 text-[var(--text-tertiary)] hover:text-[var(--accent-blue)]"
                    title="Reorder"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
