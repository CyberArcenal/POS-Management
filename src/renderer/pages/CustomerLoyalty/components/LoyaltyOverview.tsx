import React from "react";
import { Award, TrendingUp, Users, RefreshCw } from "lucide-react";
import type { LoyaltyStatisticsResponse } from "../../../api/loyalty";

interface LoyaltyOverviewProps {
  statistics: LoyaltyStatisticsResponse["data"];
}

export const LoyaltyOverview: React.FC<LoyaltyOverviewProps> = ({ statistics }) => {
  const cards = [
    {
      title: "Total Points Earned",
      value: statistics.totalEarned.toLocaleString(),
      icon: Award,
      color: "var(--accent-green)",
      bgColor: "var(--accent-green-light)",
    },
    {
      title: "Total Points Redeemed",
      value: statistics.totalRedeemed.toLocaleString(),
      icon: TrendingUp,
      color: "var(--accent-red)",
      bgColor: "var(--accent-red-light)",
    },
    {
      title: "Net Points",
      value: statistics.netPoints.toLocaleString(),
      icon: RefreshCw,
      color: "var(--accent-blue)",
      bgColor: "var(--accent-blue-light)",
    },
    {
      title: "Total Transactions",
      value: (statistics.transactionCounts.earn + statistics.transactionCounts.redeem).toLocaleString(),
      icon: Users,
      color: "var(--accent-purple)",
      bgColor: "var(--accent-purple-light)",
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
    </div>
  );
};