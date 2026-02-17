import React from 'react';
import { XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProductStock } from '../../../../api/analytics/inventory_reports';

interface Props {
  data: ProductStock[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const OutOfStockTable: React.FC<Props> = ({
  data,
  loading,
  page,
  totalPages,
  onPageChange,
}) => {
  if (loading) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)] h-64 flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Loading out-of-stock items...</div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border-color)] flex items-center gap-2">
        <XCircle className="w-5 h-5 text-[var(--danger-color)]" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Out of Stock</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[var(--card-bg)]">
            <tr className="border-b border-[var(--border-color)]">
              <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">SKU</th>
              <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Product</th>
              <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Category</th>
              <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={4} className="py-8 text-center text-[var(--text-secondary)]">No out-of-stock items.</td></tr>
            ) : (
              data.map(product => (
                <tr key={product.id} className="border-b border-[var(--border-light)] hover:bg-[var(--card-hover-bg)]">
                  <td className="py-3 px-5 text-[var(--text-primary)]">{product.sku}</td>
                  <td className="py-3 px-5 text-[var(--text-primary)] font-medium">{product.name}</td>
                  <td className="py-3 px-5 text-[var(--text-primary)]">{product.category?.name || '-'}</td>
                  <td className="py-3 px-5 text-[var(--text-primary)]">{new Date(product.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-[var(--border-color)] flex items-center justify-between">
          <div></div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-2 bg-[var(--card-secondary-bg)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--card-hover-bg)] disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-[var(--text-primary)]">Page {page} of {totalPages}</span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="p-2 bg-[var(--card-secondary-bg)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--card-hover-bg)] disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutOfStockTable;