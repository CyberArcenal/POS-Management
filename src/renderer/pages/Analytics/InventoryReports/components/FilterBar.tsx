import React from 'react';
import { Filter } from 'lucide-react';

interface Props {
  categoryId?: number;
  supplierId?: number;
  startDate: string;
  endDate: string;
  onFilterChange: (filters: any) => void;
}

const FilterBar: React.FC<Props> = ({
  categoryId,
  supplierId,
  startDate,
  endDate,
  onFilterChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onFilterChange({
      categoryId: name === 'categoryId' ? value : categoryId,
      supplierId: name === 'supplierId' ? value : supplierId,
      startDate: name === 'startDate' ? value : startDate,
      endDate: name === 'endDate' ? value : endDate,
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
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Category ID</label>
          <input
            type="number"
            name="categoryId"
            value={categoryId || ''}
            onChange={handleChange}
            placeholder="e.g., 1"
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--input-focus)]"
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Supplier ID</label>
          <input
            type="number"
            name="supplierId"
            value={supplierId || ''}
            onChange={handleChange}
            placeholder="e.g., 2"
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--input-focus)]"
          />
        </div>
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
      </div>
    </div>
  );
};

export default FilterBar;