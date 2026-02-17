import React from 'react';
import { Users, Award, TrendingUp, UserPlus } from 'lucide-react';
import type { CustomerSummary } from '../../../../api/analytics/customer_insight';

interface Props {
  summary: CustomerSummary;
}

const SummaryCards: React.FC<Props> = ({ summary }) => {
  const cards = [
    {
      title: 'Total Customers',
      value: summary.totalCustomers,
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Active Customers',
      value: summary.activeCustomers,
      icon: TrendingUp,
      color: 'green',
    },
    {
      title: 'Avg Loyalty Points',
      value: summary.averageLoyaltyPoints.toFixed(1),
      icon: Award,
      color: 'amber',
    },
    {
      title: 'New This Month',
      value: summary.newCustomersThisMonth,
      icon: UserPlus,
      color: 'purple',
    },
  ];

  const colorClasses = {
    blue: 'bg-[var(--accent-blue-light)] text-[var(--accent-blue)] border-[var(--accent-blue)]/20',
    green: 'bg-[var(--accent-green-light)] text-[var(--accent-green)] border-[var(--accent-green)]/20',
    amber: 'bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border-[var(--accent-amber)]/20',
    purple: 'bg-[var(--accent-purple-light)] text-[var(--accent-purple)] border-[var(--accent-purple)]/20',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`rounded-xl p-5 border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium opacity-80">{card.title}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
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