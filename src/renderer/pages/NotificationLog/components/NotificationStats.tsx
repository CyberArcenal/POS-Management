import React from "react";
import { Mail, AlertCircle, CheckCircle, Clock } from "lucide-react";
import type {
    NotificationStats as NotificationStatsData
} from "../../../api/notification_log";
interface NotificationStatsProps {
  stats: NotificationStatsData | null;
  loading?: boolean;
}

export const NotificationStats: React.FC<NotificationStatsProps> = ({
  stats,
  loading,
}) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-[var(--card-bg)] rounded-lg shimmer"
          ></div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Notifications",
      value: stats.total,
      icon: Mail,
      color: "text-[var(--primary-color)]",
    },
    {
      title: "Last 24 Hours",
      value: stats.last24h,
      icon: Clock,
      color: "text-blue-400",
    },
    {
      title: "Avg. Retries (Failed)",
      value: stats.avgRetryFailed.toFixed(2),
      icon: AlertCircle,
      color: "text-orange-400",
    },
    {
      title: "Sent",
      value: stats.byStatus?.sent || 0,
      icon: CheckCircle,
      color: "text-green-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-[var(--card-bg)] border border-[var(--border-color)]/20 rounded-lg p-4 flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              {card.title}
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {card.value}
            </p>
          </div>
          <div
            className={`p-3 rounded-full bg-[var(--card-secondary-bg)] ${card.color}`}
          >
            <card.icon className="w-5 h-5" />
          </div>
        </div>
      ))}
    </div>
  );
};
