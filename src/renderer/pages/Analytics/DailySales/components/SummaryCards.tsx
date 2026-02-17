import React from "react";
import { DollarSign, Calendar, TrendingUp, ShoppingBag } from "lucide-react";
import type { DailySalesStats } from "../../../../api/analytics/daily_sales";

interface Props {
  stats: DailySalesStats | null;
  loading: boolean;
}

const SummaryCards: React.FC<Props> = ({ stats, loading }) => {
  const colorClasses = {
    blue: "bg-[var(--accent-blue-light)] text-[var(--accent-blue)] border-[var(--accent-blue)]/20",
    green:
      "bg-[var(--accent-green-light)] text-[var(--accent-green)] border-[var(--accent-green)]/20",
    amber:
      "bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border-[var(--accent-amber)]/20",
    purple:
      "bg-[var(--accent-purple-light)] text-[var(--accent-purple)] border-[var(--accent-purple)]/20",
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)] animate-pulse"
          >
            <div className="h-4 bg-[var(--border-color)] rounded w-24 mb-2" />
            <div className="h-6 bg-[var(--border-color)] rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards: Array<{
    title: string;
    value: string | number;
    icon: typeof DollarSign;
    color: "green" | "blue" | "amber" | "purple";
    format: (val: string | number) => string | number;
  }> = [
    {
      title: "Total Revenue",
      value: stats.totalRevenue,
      icon: DollarSign,
      color: "green",
      format: (val: string | number) =>
        new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
        }).format(val as number),
    },
    {
      title: "Total Sales",
      value: stats.totalSales,
      icon: ShoppingBag,
      color: "blue",
      format: (val: string | number) => val,
    },
    {
      title: "Average Daily Sales",
      value: stats.averageDailySales,
      icon: TrendingUp,
      color: "amber",
      format: (val: string | number) =>
        new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
        }).format(val as number),
    },
    {
      title: "Best Day",
      value: stats.bestDay
        ? `${new Date(stats.bestDay.date).toLocaleDateString()} (${new Intl.NumberFormat(
            "en-PH",
            {
              style: "currency",
              currency: "PHP",
            },
          ).format(Number(stats.bestDay.total))})`
        : "N/A",
      icon: Calendar,
      color: "purple",
      format: (val: string | number) => val,
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
                {card.format(card.value)}
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
