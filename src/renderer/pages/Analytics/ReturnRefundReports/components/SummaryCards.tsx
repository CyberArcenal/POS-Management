import React from 'react';
import { RotateCcw, DollarSign, Receipt, TrendingDown } from 'lucide-react';
import type { ReturnRefundSummary } from '../../../../api/analytics/return_refund_reports';

interface Props {
  summary: ReturnRefundSummary | null;
  loading: boolean;
}

const SummaryCards: React.FC<Props> = ({ summary, loading }) => {
  const colorClasses = {
    amber: 'bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border-[var(--accent-amber)]/20',
    blue: 'bg-[var(--accent-blue-light)] text-[var(--accent-blue)] border-[var(--accent-blue)]/20',
    purple: 'bg-[var(--accent-purple-light)] text-[var(--accent-purple)] border-[var(--accent-purple)]/20',
    red: 'bg-[var(--danger-bg)] text-[var(--danger-color)] border-[var(--danger-color)]/20',
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)] animate-pulse">
            <div className="h-4 bg-[var(--border-color)] rounded w-24 mb-2" />
            <div className="h-6 bg-[var(--border-color)] rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const cards = [
    {
      title: 'Total Returns',
      value: summary.totalCount,
      icon: RotateCcw,
      color: 'amber',
    },
    {
      title: 'Total Amount',
      value: summary.totalAmount,
      icon: DollarSign,
      color: 'blue',
      format: (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val),
    },
    {
      title: 'Average Amount',
      value: summary.averageAmount,
      icon: Receipt,
      color: 'purple',
      format: (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val),
    },
    {
      title: 'Most Common Status',
      value: summary.statusBreakdown?.sort((a, b) => b.count - a.count)[0]?.status || 'N/A',
      icon: TrendingDown,
      color: 'red',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`rounded-xl p-5 border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
            colorClasses[card.color as keyof typeof colorClasses]
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">{card.title}</p>
              <p className="text-2xl font-bold mt-1">
                {card.format ? card.format(card.value) : card.value}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-black/10">
              <card.icon className="w-6 h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;