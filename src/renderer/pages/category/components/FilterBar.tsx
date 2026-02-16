// src/renderer/pages/category/components/FilterBar.tsx
import React from 'react';
import { Search, RefreshCw } from 'lucide-react';
import type { CategoryFilters } from '../hooks/useCategories';

interface FilterBarProps {
  filters: CategoryFilters;
  onFilterChange: <K extends keyof CategoryFilters>(key: K, value: CategoryFilters[K]) => void;
  onReload: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReload,
}) => {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search categories by name or description..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
        />
      </div>

      <select
        value={filters.status}
        onChange={(e) => onFilterChange('status', e.target.value as any)}
        className="px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <button
        onClick={onReload}
        className="p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg hover:bg-[var(--card-hover-bg)]"
        title="Refresh"
      >
        <RefreshCw className="w-4 h-4 text-[var(--text-primary)]" />
      </button>
    </div>
  );
};