import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import type { ExpenseBreakdownItem } from '../../../../api/analytics/financial_reports';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  data: ExpenseBreakdownItem[];
  loading: boolean;
}

const ExpenseBreakdown: React.FC<Props> = ({ data, loading }) => {
  const formatCurrency = (val: number | string) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(val));

  if (loading) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)] h-80 flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Loading expenses...</div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)] h-80 flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">No expense data available.</div>
      </div>
    );
  }

  const chartData = {
    labels: data.map(item => item.supplierName || `Supplier ${item.supplierId}`),
    datasets: [
      {
        data: data.map(item => Number(item.amount)),
        backgroundColor: [
          '#f97316', '#a855f7', '#ec4899', '#06b6d4', '#eab308', '#84cc16',
        ],
        borderColor: 'var(--card-bg)',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Expenses by Supplier</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center justify-center">
          <div className="w-full max-w-xs">
            <Pie data={chartData} options={{
              responsive: true,
              plugins: {
                legend: { labels: { color: 'var(--text-primary)', font: { size: 11 } } },
              },
            }} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-2 text-[var(--text-secondary)]">Supplier</th>
                <th className="text-right py-2 text-[var(--text-secondary)]">Amount</th>
                <th className="text-right py-2 text-[var(--text-secondary)]">Transactions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx} className="border-b border-[var(--border-light)]">
                  <td className="py-2 text-[var(--text-primary)]">{item.supplierName || 'Unknown'}</td>
                  <td className="py-2 text-right text-[var(--text-primary)]">{formatCurrency(item.amount)}</td>
                  <td className="py-2 text-right text-[var(--text-primary)]">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseBreakdown;