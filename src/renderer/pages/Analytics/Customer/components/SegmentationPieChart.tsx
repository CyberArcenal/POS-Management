import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import type { CustomerSegmentation } from '../../../../api/analytics/customer_insight';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  segmentation: CustomerSegmentation;
}

const SegmentationPieChart: React.FC<Props> = ({ segmentation }) => {
  const data = {
    labels: ['High Value', 'Medium Value', 'Low Value', 'Inactive'],
    datasets: [
      {
        data: [
          segmentation.highValue,
          segmentation.mediumValue,
          segmentation.lowValue,
          segmentation.inactive,
        ],
   backgroundColor: [
          '#22c55e', // bright green
          '#3b82f6', // bright blue
          '#f97316', // bright orange
          '#94a3b8', // light gray
        ],
        borderColor: 'var(--card-bg)',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: 'var(--text-primary)',
          font: { size: 12 },
        },
        
        position: 'bottom' as const,
      },
      
      tooltip: {
        backgroundColor: 'var(--card-bg)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-secondary)',
        borderColor: 'var(--border-color)',
        borderWidth: 1,
      },
    },
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)] h-full flex flex-col">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Customer Segmentation</h3>
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="w-full max-w-xs">
          <Pie data={data} options={options} />
        </div>
      </div>
    </div>
  );
};

export default SegmentationPieChart;