import React from "react";
import { Package, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { formatMovementType } from "../hooks/useMovements";

interface SummaryCardsProps {
  summary: {
    totalToday: number;
    byType: Record<string, number>;
    mostMovedProduct: { name: string; count: number } | null;
  };
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  const cards = [
    {
      title: "Movements Today",
      value: summary.totalToday,
      icon: Package,
      color: "var(--accent-blue)",
      bgColor: "var(--accent-blue-light)",
    },
    {
      title: "Sales",
      value: summary.byType["sale"] || 0,
      icon: TrendingDown, // sale is decrease
      color: "var(--accent-blue)",
      bgColor: "var(--accent-blue-light)",
    },
    {
      title: "Returns",
      value: summary.byType["refund"] || 0,
      icon: TrendingUp, // refund is increase
      color: "var(--accent-red)",
      bgColor: "var(--accent-red-light)",
    },
    {
      title: "Adjustments",
      value: summary.byType["adjustment"] || 0,
      icon: RefreshCw,
      color: "var(--accent-amber)",
      bgColor: "var(--accent-amber-light)",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4 flex items-center gap-4"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: card.bgColor }}
            >
              <Icon className="w-6 h-6" style={{ color: card.color }} />
            </div>
            <div>
              <p className="text-sm text-[var(--text-tertiary)]">{card.title}</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{card.value}</p>
            </div>
          </div>
        );
      })}

      {/* Most moved product card (optional) */}
      {summary.mostMovedProduct && (
        <div className="col-span-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
          <p className="text-sm text-[var(--text-tertiary)]">Most Moved Product</p>
          <p className="text-lg font-semibold text-[var(--text-primary)] truncate">
            {summary.mostMovedProduct.name}
          </p>
          <p className="text-xs text-[var(--accent-green)]">
            {summary.mostMovedProduct.count} units moved
          </p>
        </div>
      )}
    </div>
  );
};