import React from 'react';
import { Award } from 'lucide-react';
import type { TopCustomerLoyalty } from '../../../../api/analytics/customer_insight';

interface Props {
  data: TopCustomerLoyalty[];
}

const TopLoyaltyTable: React.FC<Props> = ({ data }) => {
  if (!data.length) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
          <Award className="w-5 h-5" /> Top Loyalty Members
        </h3>
        <p className="text-[var(--text-secondary)]">No data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <Award className="w-5 h-5" /> Top Loyalty Members
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[var(--card-bg)]">
            <tr className="border-b border-[var(--border-color)]">
              <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium">Customer</th>
              <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium">Loyalty Points</th>
            </tr>
          </thead>
          <tbody>
            {data.map((customer) => (
              <tr key={customer.customerId} className="border-b border-[var(--border-light)] hover:bg-[var(--card-hover-bg)]">
                <td className="py-2 px-3 text-[var(--text-primary)] font-medium">{customer.customerName}</td>
                <td className="py-2 px-3 text-[var(--text-primary)]">{customer.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopLoyaltyTable;