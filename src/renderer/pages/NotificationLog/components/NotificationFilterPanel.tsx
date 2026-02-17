import React from 'react';
import { Filter } from 'lucide-react';

interface NotificationFilterPanelProps {
  filters: {
    status?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  };
  onChange: (filters: any) => void;
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const NotificationFilterPanel: React.FC<NotificationFilterPanelProps> = ({
  filters,
  onChange,
  onClear,
  isOpen,
  onToggle,
}) => {
  const updateFilter = (key: string, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  if (!isOpen) return null;

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)]/20 rounded-lg p-5 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-md font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filter Notifications
        </h3>
        <button
          onClick={onClear}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-1 uppercase">
            Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => updateFilter('status', e.target.value || undefined)}
            className="w-full px-3 py-2 rounded-md border bg-[var(--card-secondary-bg)] border-[var(--border-color)]/20 
                       text-[var(--text-primary)] text-sm focus:border-[var(--primary-color)]"
          >
            <option value="">All statuses</option>
            <option value="queued">Queued</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="resend">Resend</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-1 uppercase">
            From Date
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => updateFilter('startDate', e.target.value || undefined)}
            className="w-full px-3 py-2 rounded-md border bg-[var(--card-secondary-bg)] border-[var(--border-color)]/20 
                       text-[var(--text-primary)] text-sm"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-tertiary)] mb-1 uppercase">
            To Date
          </label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => updateFilter('endDate', e.target.value || undefined)}
            className="w-full px-3 py-2 rounded-md border bg-[var(--card-secondary-bg)] border-[var(--border-color)]/20 
                       text-[var(--text-primary)] text-sm"
          />
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[var(--border-color)]/20">
        <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase">
          Sort by
        </span>
        <select
          value={filters.sortBy || 'created_at'}
          onChange={(e) => updateFilter('sortBy', e.target.value)}
          className="px-3 py-1.5 rounded-md border bg-[var(--card-secondary-bg)] border-[var(--border-color)]/20 
                     text-[var(--text-primary)] text-xs"
        >
          <option value="created_at">Created at</option>
          <option value="sent_at">Sent at</option>
          <option value="recipient_email">Recipient</option>
          <option value="status">Status</option>
          <option value="retry_count">Retry count</option>
        </select>
        <select
          value={filters.sortOrder || 'DESC'}
          onChange={(e) => updateFilter('sortOrder', e.target.value as 'ASC' | 'DESC')}
          className="px-3 py-1.5 rounded-md border bg-[var(--card-secondary-bg)] border-[var(--border-color)]/20 
                     text-[var(--text-primary)] text-xs"
        >
          <option value="ASC">Ascending</option>
          <option value="DESC">Descending</option>
        </select>
      </div>
    </div>
  );
};