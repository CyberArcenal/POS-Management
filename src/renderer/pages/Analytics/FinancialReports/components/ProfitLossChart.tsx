import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ProfitLossItem } from '../../../../api/analytics/financial_reports';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface Props {
  data: ProfitLossItem[];
  groupBy: string;
  loading: boolean;
}

const ProfitLossChart: React.FC<Props> = ({ data, groupBy, loading }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

  if (loading) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)] h-80 flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Loading profit/loss chart...</div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)] h-80 flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">No profit/loss data available.</div>
      </div>
    );
  }

  const labels = data.map(item => {
    if (groupBy === 'day') return new Date(item.period).toLocaleDateString();
    if (groupBy === 'week') return `Week ${item.period}`;
    return item.period; // month: "2025-12"
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Revenue',
        data: data.map(item => item.revenue),
        borderColor: 'var(--accent-green)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Refunds',
        data: data.map(item => item.refunds),
        borderColor: 'var(--accent-amber)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Net Revenue',
        data: data.map(item => item.netRevenue),
        borderColor: 'var(--accent-blue)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { labels: { color: 'var(--text-primary)' } },
      tooltip: {
        backgroundColor: 'var(--card-bg)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-secondary)',
        borderColor: 'var(--border-color)',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) label += formatCurrency(context.parsed.y);
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'var(--border-light)' },
        ticks: { color: 'var(--text-secondary)' },
      },
      y: {
        grid: { color: 'var(--border-light)' },
        ticks: {
          color: 'var(--text-secondary)',
          callback: (value: any) => `₱${value}`,
        },
      },
    },
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Profit & Loss Over Time</h3>
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default ProfitLossChart;