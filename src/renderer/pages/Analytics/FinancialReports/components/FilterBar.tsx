import React from 'react';
import { Filter } from 'lucide-react';

interface Props {
  startDate: string;
  endDate: string;
  revenueGroupBy: 'paymentMethod' | 'category' | 'product';
  profitGroupBy: 'day' | 'week' | 'month';
  onFilterChange: (filters: any) => void;
}

const FilterBar: React.FC<Props> = ({
  startDate,
  endDate,
  revenueGroupBy,
  profitGroupBy,
  onFilterChange,
}) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    onFilterChange({
      startDate: name === 'startDate' ? value : startDate,
      endDate: name === 'endDate' ? value : endDate,
      revenueGroupBy: name === 'revenueGroupBy' ? value : revenueGroupBy,
      profitGroupBy: name === 'profitGroupBy' ? value : profitGroupBy,
    });
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-[var(--text-secondary)]" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Filters</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={startDate}
            onChange={handleChange}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--input-focus)]"
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">End Date</label>
          <input
            type="date"
            name="endDate"
            value={endDate}
            onChange={handleChange}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--input-focus)]"
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Revenue Group By</label>
          <select
            name="revenueGroupBy"
            value={revenueGroupBy}
            onChange={handleChange}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--input-focus)]"
          >
            <option value="paymentMethod">Payment Method</option>
            <option value="category">Category</option>
            <option value="product">Product</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Profit/Loss Group By</label>
          <select
            name="profitGroupBy"
            value={profitGroupBy}
            onChange={handleChange}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--input-focus)]"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;