import React from 'react';
import { TrendingUp, RotateCcw, BarChart2 } from 'lucide-react';
import type { InventoryStats } from '../../../../api/analytics/inventory_reports';

interface Props {
  stats: InventoryStats | null;
  loading: boolean;
}

const StatsCards: React.FC<Props> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)] animate-pulse h-40" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Top Selling */}
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[var(--accent-green)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Top Selling</h3>
        </div>
        {stats.topSelling.length === 0 ? (
          <p className="text-[var(--text-secondary)]">No data</p>
        ) : (
          <ul className="space-y-2">
            {stats.topSelling.slice(0, 5).map(item => (
              <li key={item.productId} className="flex justify-between text-sm">
                <span className="text-[var(--text-primary)]">{item.productName}</span>
                <span className="text-[var(--accent-green)] font-medium">{item.totalSold} sold</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Top Returned */}
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
        <div className="flex items-center gap-2 mb-4">
          <RotateCcw className="w-5 h-5 text-[var(--accent-amber)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Top Returned</h3>
        </div>
        {stats.topReturned.length === 0 ? (
          <p className="text-[var(--text-secondary)]">No data</p>
        ) : (
          <ul className="space-y-2">
            {stats.topReturned.slice(0, 5).map(item => (
              <li key={item.productId} className="flex justify-between text-sm">
                <span className="text-[var(--text-primary)]">{item.productName}</span>
                <span className="text-[var(--accent-amber)] font-medium">{item.totalReturned} returned</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Movements by Type */}
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-5 h-5 text-[var(--accent-blue)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Movements by Type</h3>
        </div>
        {stats.movementsByType.length === 0 ? (
          <p className="text-[var(--text-secondary)]">No data</p>
        ) : (
          <ul className="space-y-2">
            {stats.movementsByType.map(item => (
              <li key={item.type} className="flex justify-between text-sm">
                <span className="text-[var(--text-primary)] capitalize">{item.type}</span>
                <span className="text-[var(--accent-blue)] font-medium">{item.count} ({item.totalQtyChange} qty)</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StatsCards;