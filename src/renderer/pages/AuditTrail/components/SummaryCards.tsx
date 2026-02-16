import React from "react";
import { Users, Database, Calendar } from "lucide-react";

interface SummaryCardsProps {
  summary: {
    totalToday: number;
    byAction: Record<string, number>;
    mostActiveUser: { user: string; count: number } | null;
    mostAffectedEntity: { entity: string; count: number } | null;
  };
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary }) => {
  // Get top 3 actions by count
  const topActions = Object.entries(summary.byAction)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const cards = [
    {
      title: "Actions Today",
      value: summary.totalToday,
      icon: Calendar,
      color: "var(--accent-blue)",
      bgColor: "var(--accent-blue-light)",
    },
    {
      title: "Most Active User",
      value: summary.mostActiveUser
        ? `${summary.mostActiveUser.user} (${summary.mostActiveUser.count})`
        : "N/A",
      icon: Users,
      color: "var(--accent-green)",
      bgColor: "var(--accent-green-light)",
    },
    {
      title: "Top Affected Entity",
      value: summary.mostAffectedEntity
        ? `${summary.mostAffectedEntity.entity} (${summary.mostAffectedEntity.count})`
        : "N/A",
      icon: Database,
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
              <p className="text-lg font-bold text-[var(--text-primary)] truncate max-w-[150px]">
                {card.value}
              </p>
            </div>
          </div>
        );
      })}

      {/* Top Actions card */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <p className="text-sm text-[var(--text-tertiary)] mb-2">Top Actions</p>
        <div className="space-y-1">
          {topActions.map(([action, count]) => (
            <div key={action} className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">{action}</span>
              <span className="font-medium text-[var(--text-primary)]">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};