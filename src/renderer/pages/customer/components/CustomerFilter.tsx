import React from 'react';
import type { CustomerFilters as FilterType } from '../../../api/customer';

interface CustomerFilterProps {
  filters: FilterType;
  onFilterChange: (filters: FilterType) => void;
  onReset: () => void;
}

export const CustomerFilter: React.FC<CustomerFilterProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFilterChange({
      ...filters,
      [name]: value || undefined,
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Search
          </label>
          <input
            type="text"
            name="search"
            value={filters.search || ''}
            onChange={handleInputChange}
            placeholder="Name, email, phone..."
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Customer Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Customer Type
          </label>
          <select
            name="customer_type"
            value={filters.customer_type || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="individual">Individual</option>
            <option value="business">Business</option>
            <option value="wholesale">Wholesale</option>
            <option value="retail">Retail</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Status
          </label>
          <select
            name="status"
            value={filters.status || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            City
          </label>
          <input
            type="text"
            name="city"
            value={filters.city || ''}
            onChange={handleInputChange}
            placeholder="Filter by city..."
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Balance Range */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Balance Range
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              name="min_balance"
              value={filters.min_balance || ''}
              onChange={handleInputChange}
              placeholder="Min"
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <input
              type="number"
              name="max_balance"
              value={filters.max_balance || ''}
              onChange={handleInputChange}
              placeholder="Max"
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-end gap-2">
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => onFilterChange(filters)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};