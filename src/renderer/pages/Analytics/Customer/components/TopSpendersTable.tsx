import React from 'react';
import { TrendingUp } from 'lucide-react';
import type { TopCustomerSpending } from '../../../../api/analytics/customer_insight';

interface Props {
  data: TopCustomerSpending[];
}

const TopSpendersTable: React.FC<Props> = ({ data }) => {
  const formatCurrency = (val: number | string) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(val));

  if (!data.length) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" /> Top Spenders
        </h3>
        <p className="text-[var(--text-secondary)]">No data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" /> Top Spenders
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[var(--card-bg)]">
            <tr className="border-b border-[var(--border-color)]">
              <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium">Customer</th>
              <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium">Purchase Count</th>
              <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium">Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {data.map((customer) => (
              <tr key={customer.customerId} className="border-b border-[var(--border-light)] hover:bg-[var(--card-hover-bg)]">
                <td className="py-2 px-3 text-[var(--text-primary)] font-medium">{customer.customerName}</td>
                <td className="py-2 px-3 text-[var(--text-primary)]">{customer.purchaseCount}</td>
                <td className="py-2 px-3 text-[var(--text-primary)]">{formatCurrency(customer.totalSpent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopSpendersTable;