import React from 'react';
import { ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, RefreshCw, Repeat } from 'lucide-react';
import type { InventoryMovement } from '../../../../api/analytics/inventory_reports';

interface Props {
  data: InventoryMovement[];
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const MovementsTable: React.FC<Props> = ({
  data,
  loading,
  page,
  totalPages,
  onPageChange,
}) => {
  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'sale': return <ArrowDownRight className="w-4 h-4 text-[var(--status-completed)]" />;
      case 'purchase': return <ArrowUpRight className="w-4 h-4 text-[var(--accent-green)]" />;
      case 'return': return <RefreshCw className="w-4 h-4 text-[var(--accent-amber)]" />;
      case 'adjustment': return <Repeat className="w-4 h-4 text-[var(--accent-blue)]" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)] h-64 flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Loading movements...</div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border-color)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Recent Inventory Movements</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[var(--card-bg)]">
            <tr className="border-b border-[var(--border-color)]">
              <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Time</th>
              <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Product</th>
              <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Type</th>
              <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Change</th>
              <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">New Stock</th>
              <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-[var(--text-secondary)]">No movements found.</td></tr>
            ) : (
              data.map(movement => (
                <tr key={movement.id} className="border-b border-[var(--border-light)] hover:bg-[var(--card-hover-bg)]">
                  <td className="py-3 px-5 text-[var(--text-primary)]">{new Date(movement.timestamp).toLocaleString()}</td>
                  <td className="py-3 px-5 text-[var(--text-primary)] font-medium">
                    {movement.product?.name || `Product #${movement.productId}`}
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-1">
                      {getMovementIcon(movement.movementType)}
                      <span className="capitalize">{movement.movementType}</span>
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <span className={movement.qtyChange > 0 ? 'text-[var(--accent-green)]' : 'text-[var(--danger-color)]'}>
                      {movement.qtyChange > 0 ? `+${movement.qtyChange}` : movement.qtyChange}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-[var(--text-primary)]">{movement.newStockQty}</td>
                  <td className="py-3 px-5 text-[var(--text-secondary)]">{movement.reason || '-'}</td>
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

export default MovementsTable;