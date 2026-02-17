import React from 'react';
import { BarChart2, Users, Calendar } from 'lucide-react';
import type { ReturnRefundStats } from '../../../../api/analytics/return_refund_reports';

interface Props {
  stats: ReturnRefundStats | null;
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
      {/* By Refund Method */}
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-5 h-5 text-[var(--accent-blue)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">By Refund Method</h3>
        </div>
        {stats.byMethod.length === 0 ? (
          <p className="text-[var(--text-secondary)]">No data</p>
        ) : (
          <ul className="space-y-2">
            {stats.byMethod.map(item => (
              <li key={item.method} className="flex justify-between text-sm">
                <span className="text-[var(--text-primary)] capitalize">{item.method}</span>
                <span className="text-[var(--accent-blue)] font-medium">
                  {item.count} ({formatCurrency(item.amount)})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* By Month */}
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-[var(--accent-green)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Monthly Trend</h3>
        </div>
        {stats.byMonth.length === 0 ? (
          <p className="text-[var(--text-secondary)]">No data</p>
        ) : (
          <ul className="space-y-2 max-h-40 overflow-y-auto">
            {stats.byMonth.map(item => (
              <li key={item.month} className="flex justify-between text-sm">
                <span className="text-[var(--text-primary)]">{item.month}</span>
                <span className="text-[var(--accent-green)] font-medium">
                  {item.count} ({formatCurrency(item.amount)})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Top Customers */}
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-[var(--accent-amber)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Top Customers</h3>
        </div>
        {stats.topCustomers.length === 0 ? (
          <p className="text-[var(--text-secondary)]">No data</p>
        ) : (
          <ul className="space-y-2 max-h-40 overflow-y-auto">
            {stats.topCustomers.map(item => (
              <li key={item.customerId} className="flex justify-between text-sm">
                <span className="text-[var(--text-primary)] truncate max-w-[120px]">{item.customerName}</span>
                <span className="text-[var(--accent-amber)] font-medium">
                  {item.returnCount} ({formatCurrency(item.totalReturned)})
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