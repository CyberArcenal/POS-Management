// src/renderer/components/dashboard/ActivityTimeline.tsx
import React from 'react';
import { ShoppingCart, Package, Clock } from 'lucide-react';
import type { ActivityEntry } from '../../../api/dashboard';

interface Props {
  activities: ActivityEntry[];
  isLoading: boolean;
}

const ActivityTimeline: React.FC<Props> = ({ activities, isLoading }) => {
  const typeColors = {
    sale: 'text-[var(--status-completed)] bg-[var(--status-completed-bg)]',
    inventory: 'text-[var(--accent-blue)] bg-[var(--accent-blue-light)]',
    audit: 'text-[var(--accent-purple)] bg-[var(--accent-purple-light)]',
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)] h-full flex flex-col">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Activities</h3>
      <div className="flex-1 overflow-y-auto max-h-80 pr-1">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 bg-[var(--card-secondary-bg)] rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-[var(--card-secondary-bg)] rounded w-3/4 mb-2" />
                  <div className="h-3 bg-[var(--card-secondary-bg)] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-tertiary)]">No recent activities</div>
        ) : (
          <div className="space-y-3">
            {activities.map(act => (
              <div key={act.id} className="flex items-start gap-3">
                <div className={`p-1.5 rounded-full ${typeColors[act.type]}`}>
                  {act.type === 'sale' && <ShoppingCart className="w-4 h-4" />}
                  {act.type === 'inventory' && <Package className="w-4 h-4" />}
                  {act.type === 'audit' && <Clock className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[var(--text-primary)]">{act.description}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{act.formattedTime}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;