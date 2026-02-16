// src/renderer/pages/purchase/components/FilterBar.tsx
import React, { useEffect, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import type { PurchaseFilters } from '../hooks/usePurchases';
import supplierAPI, { type Supplier } from '../../../api/supplier';

interface FilterBarProps {
  filters: PurchaseFilters;
  onFilterChange: <K extends keyof PurchaseFilters>(key: K, value: PurchaseFilters[K]) => void;
  onReload: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReload,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    supplierAPI.getActive().then(res => {
      if (res.status) setSuppliers(res.data);
    });
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="flex-1 min-w-[200px] relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search by reference..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
        />
      </div>

      <select
        value={filters.status}
        onChange={(e) => onFilterChange('status', e.target.value)}
        className="px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
      >
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>

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

      <input
        type="date"
        value={filters.startDate}
        onChange={(e) => onFilterChange('startDate', e.target.value)}
        className="px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
        placeholder="Start Date"
      />
      <input
        type="date"
        value={filters.endDate}
        onChange={(e) => onFilterChange('endDate', e.target.value)}
        className="px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
        placeholder="End Date"
      />

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