import React from "react";
import { Search, RefreshCw } from "lucide-react";
import type { CustomerFilters } from "../hooks/useCustomers";

interface FilterBarProps {
  filters: CustomerFilters;
  onFilterChange: (key: keyof CustomerFilters, value: any) => void;
  onReload: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReload,
}) => {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4 mb-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search by name, contact, ID..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg pl-10 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
          />
        </div>

        {/* Status Filter – now uses actual status values */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange("status", e.target.value as CustomerFilters["status"])}
          className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
        >
          <option value="all">All Status</option>
          <option value="vip">VIP</option>
          <option value="elite">Elite</option>
          <option value="regular">Regular</option>
        </select>

        {/* Sort By */}
        <select
          value={filters.sortBy}
          onChange={(e) => onFilterChange("sortBy", e.target.value as CustomerFilters["sortBy"])}
          className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
        >
          <option value="name">Sort by Name</option>
          <option value="points">Sort by Points</option>
          <option value="createdAt">Sort by Newest</option>
        </select>

        {/* Sort Order */}
        <select
          value={filters.sortOrder}
          onChange={(e) => onFilterChange("sortOrder", e.target.value as "ASC" | "DESC")}
          className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
        >
          <option value="ASC">Ascending</option>
          <option value="DESC">Descending</option>
        </select>

        {/* Points Range (optional) */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min points"
            value={filters.minPoints || ""}
            onChange={(e) => onFilterChange("minPoints", e.target.value ? Number(e.target.value) : undefined)}
            className="w-24 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
          />
          <span className="text-[var(--text-tertiary)]">-</span>
          <input
            type="number"
            placeholder="Max points"
            value={filters.maxPoints || ""}
            onChange={(e) => onFilterChange("maxPoints", e.target.value ? Number(e.target.value) : undefined)}
            className="w-24 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
          />
        </div>

        {/* Reload button */}
        <button
          onClick={onReload}
          className="p-2 bg-[var(--card-hover-bg)] rounded-lg hover:bg-[var(--border-color)] transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-[var(--text-secondary)]" />
        </button>
      </div>
    </div>
  );
};