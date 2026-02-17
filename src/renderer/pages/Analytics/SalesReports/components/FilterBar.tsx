import React from 'react';
import { Filter } from 'lucide-react';

interface Props {
  customerId?: number;
  status: string;
  paymentMethod: string;
  startDate: string;
  endDate: string;
  searchTerm: string;
  minAmount?: number;
  maxAmount?: number;
  onFilterChange: (filters: any) => void;
}

const FilterBar: React.FC<Props> = ({
  customerId,
  status,
  paymentMethod,
  startDate,
  endDate,
  searchTerm,
  minAmount,
  maxAmount,
  onFilterChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFilterChange({
      customerId: name === 'customerId' ? value : customerId,
      status: name === 'status' ? value : status,
      paymentMethod: name === 'paymentMethod' ? value : paymentMethod,
      startDate: name === 'startDate' ? value : startDate,
      endDate: name === 'endDate' ? value : endDate,
      searchTerm: name === 'searchTerm' ? value : searchTerm,
      minAmount: name === 'minAmount' ? value : minAmount,
      maxAmount: name === 'maxAmount' ? value : maxAmount,
    });
  };

  const statuses = ['', 'paid', 'pending', 'cancelled', 'refunded'];
  const paymentMethods = ['', 'Cash', 'Card', 'GCash', 'Maya', 'Bank Transfer'];

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-[var(--text-secondary)]" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Filters</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Customer ID</label>
          <input
            type="number"
            name="customerId"
            value={customerId || ''}
            onChange={handleChange}
            placeholder="e.g., 5"
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--input-focus)]"
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Status</label>
          <select
            name="status"
            value={status}
            onChange={handleChange}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--input-focus)]"
          >
            {statuses.map(s => (
              <option key={s} value={s}>{s || 'All'}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Payment Method</label>
          <select
            name="paymentMethod"
            value={paymentMethod}
            onChange={handleChange}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--input-focus)]"
          >
            {paymentMethods.map(m => (
              <option key={m} value={m}>{m || 'All'}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Search</label>
          <input
            type="text"
            name="searchTerm"
            value={searchTerm}
            onChange={handleChange}
            placeholder="Customer, notes, etc."
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
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Min Amount</label>
          <input
            type="number"
            name="minAmount"
            value={minAmount || ''}
            onChange={handleChange}
            placeholder="0"
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--input-focus)]"
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Max Amount</label>
          <input
            type="number"
            name="maxAmount"
            value={maxAmount || ''}
            onChange={handleChange}
            placeholder="10000"
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--input-focus)]"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;