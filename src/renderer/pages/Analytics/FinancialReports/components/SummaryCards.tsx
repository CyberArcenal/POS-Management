import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import type { FinancialSummary } from '../../../../api/analytics/financial_reports';

interface Props {
  summary: FinancialSummary | null;
  loading: boolean;
}

const SummaryCards: React.FC<Props> = ({ summary, loading }) => {
  const colorClasses = {
    green: 'bg-[var(--accent-green-light)] text-[var(--accent-green)] border-[var(--accent-green)]/20',
    blue: 'bg-[var(--accent-blue-light)] text-[var(--accent-blue)] border-[var(--accent-blue)]/20',
    amber: 'bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border-[var(--accent-amber)]/20',
    purple: 'bg-[var(--accent-purple-light)] text-[var(--accent-purple)] border-[var(--accent-purple)]/20',
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
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
      title: 'Total Revenue',
      value: summary.totalRevenue,
      icon: DollarSign,
      color: 'green',
      format: (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val),
    },
    {
      title: 'Net Revenue',
      value: summary.netRevenue,
      icon: TrendingUp,
      color: 'blue',
      format: (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val),
    },
    {
      title: 'Gross Profit',
      value: summary.grossProfit,
      icon: TrendingUp,
      color: 'amber',
      format: (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val),
    },
    {
      title: 'Profit Margin',
      value: summary.profitMargin,
      icon: Percent,
      color: 'purple',
      format: (val: number) => `${val.toFixed(2)}%`,
    },
    {
      title: 'Refunds',
      value: summary.totalRefunds,
      icon: TrendingDown,
      color: 'amber',
      format: (val: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <p className="text-2xl font-bold mt-1">{card.format(card.value)}</p>
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