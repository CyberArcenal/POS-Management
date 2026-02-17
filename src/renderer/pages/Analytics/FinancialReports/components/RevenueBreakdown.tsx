import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import type { RevenueBreakdownItem } from '../../../../api/analytics/financial_reports';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  data: RevenueBreakdownItem[];
  groupBy: string;
  loading: boolean;
}

const RevenueBreakdown: React.FC<Props> = ({ data, groupBy, loading }) => {
  const formatCurrency = (val: number | string) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(val));

  if (loading) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)] h-80 flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Loading revenue breakdown...</div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)] h-80 flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">No revenue data available.</div>
      </div>
    );
  }

  // Prepare pie chart data
  const chartData = {
    labels: data.map(item => {
      if (groupBy === 'paymentMethod') return item.method || 'Unknown';
      if (groupBy === 'category') return item.category || 'Unknown';
      return item.productName || `Product ${item.productId}`;
    }),
    datasets: [
      {
        data: data.map(item => Number(item.amount || 0)),
        backgroundColor: [
          '#22c55e', '#3b82f6', '#f97316', '#a855f7', '#ec4899', '#06b6d4', '#eab308',
        ],
        borderColor: 'var(--card-bg)',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Revenue by {groupBy}</h3>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center justify-center md:w-1/2">
          <div className="w-full max-w-xs">
            <Pie data={chartData} options={{
              responsive: true,
              plugins: {
                legend: { labels: { color: 'var(--text-primary)', font: { size: 11 } } },
              },
            }} />
          </div>
        </div>
        <div className="overflow-x-auto md:w-1/2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-2 text-[var(--text-secondary)]">Name</th>
                <th className="text-right py-2 text-[var(--text-secondary)]">Amount</th>
                <th className="text-right py-2 text-[var(--text-secondary)]">Count</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx} className="border-b border-[var(--border-light)]">
                  <td className="py-2 text-[var(--text-primary)]">
                    {groupBy === 'paymentMethod' ? item.method : groupBy === 'category' ? item.category : item.productName}
                  </td>
                  <td className="py-2 text-right text-[var(--text-primary)]">{formatCurrency(item.amount || 0)}</td>
                  <td className="py-2 text-right text-[var(--text-primary)]">{item.count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenueBreakdown;