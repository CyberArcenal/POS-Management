// src/renderer/pages/category/components/CategoryViewDialog.tsx
import React from 'react';
import { X, Package, Loader2 } from 'lucide-react';
import type { Category } from '../../../api/category';
import type { Product } from '../../../api/product';
import Decimal from 'decimal.js';

interface CategoryViewDialogProps {
  category: Category | null;
  products: Product[];
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryViewDialog: React.FC<CategoryViewDialogProps> = ({
  category,
  products,
  loading,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-[var(--card-bg)] rounded-lg w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Category Details: {category.name}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[var(--card-hover-bg)] rounded"
            >
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[var(--card-secondary-bg)] p-4 rounded-lg">
              <p className="text-sm text-[var(--text-tertiary)]">Name</p>
              <p className="text-lg font-semibold text-[var(--text-primary)]">{category.name}</p>
            </div>
            <div className="bg-[var(--card-secondary-bg)] p-4 rounded-lg">
              <p className="text-sm text-[var(--text-tertiary)]">Status</p>
              <p className={`text-lg font-semibold ${category.isActive ? 'text-[var(--status-completed)]' : 'text-[var(--status-cancelled)]'}`}>
                {category.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className="col-span-2 bg-[var(--card-secondary-bg)] p-4 rounded-lg">
              <p className="text-sm text-[var(--text-tertiary)]">Description</p>
              <p className="text-[var(--text-primary)]">{category.description || '—'}</p>
            </div>
          </div>

          {/* Products List */}
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Products in this Category ({products.length})
          </h3>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-blue)]" />
              </div>
            ) : products.length === 0 ? (
              <p className="text-center text-[var(--text-tertiary)] py-8">No products in this category.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-2 text-xs font-medium text-[var(--text-tertiary)]">SKU</th>
                    <th className="text-left py-2 text-xs font-medium text-[var(--text-tertiary)]">Name</th>
                    <th className="text-right py-2 text-xs font-medium text-[var(--text-tertiary)]">Price</th>
                    <th className="text-right py-2 text-xs font-medium text-[var(--text-tertiary)]">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="py-2 text-sm font-mono text-[var(--text-primary)]">{product.sku}</td>
                      <td className="py-2 text-sm text-[var(--text-secondary)]">{product.name}</td>
                      <td className="py-2 text-right text-sm text-[var(--accent-green)]">₱{new Decimal(product.price).toFixed(2)}</td>
                      <td className="py-2 text-right text-sm text-[var(--text-primary)]">{product.stockQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};