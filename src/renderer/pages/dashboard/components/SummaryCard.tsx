// src/renderer/components/dashboard/SummaryCard.tsx
import React from 'react';

interface Props {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  isLoading?: boolean;
}

const SummaryCard: React.FC<Props> = ({ title, value, icon: Icon, color, isLoading }) => {
  const colorClasses = {
    blue: 'bg-[var(--accent-blue-light)] text-[var(--accent-blue)] border-[var(--accent-blue)]/20',
    green: 'bg-[var(--accent-green-light)] text-[var(--accent-green)] border-[var(--accent-green)]/20',
    amber: 'bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border-[var(--accent-amber)]/20',
    red: 'bg-[var(--accent-red-light)] text-[var(--accent-red)] border-[var(--accent-red)]/20',
    purple: 'bg-[var(--accent-purple-light)] text-[var(--accent-purple)] border-[var(--accent-purple)]/20',
  };

  return (
    <div
      className={`rounded-xl p-5 border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${colorClasses[color]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          {isLoading ? (
            <div className="h-8 w-20 bg-current/20 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-2xl font-bold mt-1">{value}</p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-black/10">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;