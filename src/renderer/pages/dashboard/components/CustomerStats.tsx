// src/renderer/components/dashboard/CustomerStats.tsx
import React from 'react';
import { type CustomerStats as CustomerStatsType } from '../../../api/dashboard';

interface Props {
  stats: CustomerStatsType | null;
  isLoading: boolean;
}

const CustomerStats: React.FC<Props> = ({ stats, isLoading }) => {
  const formatNumber = (val: number) => val.toLocaleString();
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)] h-full flex flex-col">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Customer Stats</h3>
      <div className="flex-1 overflow-y-auto max-h-80 pr-1">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-10 bg-[var(--card-secondary-bg)] animate-pulse rounded" />
            <div className="h-10 bg-[var(--card-secondary-bg)] animate-pulse rounded" />
            <div className="h-10 bg-[var(--card-secondary-bg)] animate-pulse rounded" />
          </div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border-color)]">
              <span className="text-[var(--text-secondary)]">Total Customers</span>
              <span className="text-xl font-bold text-[var(--text-primary)]">
                {formatNumber(stats.totalCustomers)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border-color)]">
              <span className="text-[var(--text-secondary)]">New Today</span>
              <span className="text-lg text-[var(--accent-green)]">
                {formatNumber(stats.newCustomersToday)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border-color)]">
              <span className="text-[var(--text-secondary)]">New This Week</span>
              <span className="text-lg text-[var(--accent-blue)]">
                {formatNumber(stats.newCustomersThisWeek)}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Top Spenders</h4>
              {stats.topSpenders.slice(0, 3).map(spender => (
                <div key={spender.customerId} className="flex justify-between items-center py-1 text-sm">
                  <span className="text-[var(--text-primary)]">{spender.name}</span>
                  <span className="text-[var(--accent-amber)]">{formatCurrency(spender.totalSpent)}</span>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Loyalty Distribution</h4>
              {stats.loyaltyDistribution.map(item => (
                <div key={item.range} className="flex justify-between items-center py-1 text-sm">
                  <span className="text-[var(--text-primary)]">{item.range}</span>
                  <span className="text-[var(--text-secondary)]">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-[var(--text-tertiary)]">No customer data</div>
        )}
      </div>
    </div>
  );
};

export default CustomerStats;