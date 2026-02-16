// src/renderer/pages/stock/components/StockFilterBar.tsx
import React from 'react';
import { Search, RefreshCw } from 'lucide-react';
import type { StockFilters } from '../hooks/useStockLevels';
import type { Supplier } from '../../../api/supplier';
import type { Category } from '../../../api/category';

interface StockFilterBarProps {
  filters: StockFilters;
  suppliers: Supplier[];
  categories: Category[];
  onFilterChange: <K extends keyof StockFilters>(key: K, value: StockFilters[K]) => void;
  onReload: () => void;
}

export const StockFilterBar: React.FC<StockFilterBarProps> = ({
  filters,
  suppliers,
  categories,
  onFilterChange,
  onReload,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="flex-1 min-w-[200px] relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
        />
      </div>

      <select
        value={filters.supplierId}
        onChange={(e) => onFilterChange('supplierId', e.target.value ? Number(e.target.value) : '')}
        className="px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
      >
        <option value="">All Suppliers</option>
        {suppliers.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      <select
        value={filters.categoryId}
        onChange={(e) => onFilterChange('categoryId', e.target.value ? Number(e.target.value) : '')}
        className="px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
      >
        <option value="">All Categories</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select
        value={filters.stockStatus}
        onChange={(e) => onFilterChange('stockStatus', e.target.value as any)}
        className="px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
      >
        <option value="all">All Stock</option>
        <option value="instock">In Stock (&gt;5)</option>
        <option value="lowstock">Low Stock (1-5)</option>
        <option value="outstock">Out of Stock (0)</option>
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