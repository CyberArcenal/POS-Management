import React from 'react';
import { Package, Users, Clock } from 'lucide-react';
import type { SalesStats } from '../../../../api/analytics/sales_reports';

interface Props {
  stats: SalesStats | null;
  loading: boolean;
}

const StatsCards: React.FC<Props> = ({ stats, loading }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

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
      {/* Top Products */}
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-[var(--accent-blue)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Top Products</h3>
        </div>
        {stats.topProducts.length === 0 ? (
          <p className="text-[var(--text-secondary)]">No data</p>
        ) : (
          <ul className="space-y-2 max-h-40 overflow-y-auto">
            {stats.topProducts.slice(0, 5).map(item => (
              <li key={item.productId} className="flex justify-between text-sm">
                <span className="text-[var(--text-primary)] truncate max-w-[150px]">{item.productName}</span>
                <span className="text-[var(--accent-blue)] font-medium">
                  {item.totalQuantity} sold ({formatCurrency(item.totalRevenue)})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Top Customers */}
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-[var(--accent-green)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Top Customers</h3>
        </div>
        {stats.topCustomers.length === 0 ? (
          <p className="text-[var(--text-secondary)]">No data</p>
        ) : (
          <ul className="space-y-2 max-h-40 overflow-y-auto">
            {stats.topCustomers.slice(0, 5).map(item => (
              <li key={item.customerId} className="flex justify-between text-sm">
                <span className="text-[var(--text-primary)] truncate max-w-[150px]">{item.customerName}</span>
                <span className="text-[var(--accent-green)] font-medium">
                  {item.purchaseCount} ({formatCurrency(item.totalSpent)})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Hourly Distribution */}
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-[var(--accent-amber)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Hourly Sales</h3>
        </div>
        {stats.hourlyDistribution.length === 0 ? (
          <p className="text-[var(--text-secondary)]">No data</p>
        ) : (
          <ul className="space-y-2 max-h-40 overflow-y-auto">
            {stats.hourlyDistribution.map(item => (
              <li key={item.hour} className="flex justify-between text-sm">
                <span className="text-[var(--text-primary)]">{item.hour}:00</span>
                <span className="text-[var(--accent-amber)] font-medium">
                  {item.count} ({formatCurrency(item.amount)})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StatsCards;