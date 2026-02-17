import React from 'react';
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
import { Line } from 'react-chartjs-2';
import type { DailySalesChartPoint } from '../../../../api/analytics/daily_sales';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface Props {
  data: DailySalesChartPoint[];
  loading: boolean;
}

const SalesChart: React.FC<Props> = ({ data, loading }) => {
  const chartData = {
    labels: data.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Total Sales',
        data: data.map(item => Number(item.total)),
        borderColor: 'var(--accent-blue)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Transaction Count',
        data: data.map(item => Number(item.count)),
        borderColor: 'var(--accent-green)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1',
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
      },
    },
    scales: {
      x: {
        grid: { color: 'var(--border-light)' },
        ticks: { color: 'var(--text-secondary)' },
      },
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        grid: { color: 'var(--border-light)' },
        ticks: {
          color: 'var(--text-secondary)',
          callback: (value: any) => `₱${value}`,
        },
      },
      y1: {
        type: 'linear' as const,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: { color: 'var(--text-secondary)' },
      },
    },
  };

  if (loading) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)] h-80 flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">Loading chart...</div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)] h-80 flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">No data available for chart.</div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Sales Trend</h3>
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default SalesChart;