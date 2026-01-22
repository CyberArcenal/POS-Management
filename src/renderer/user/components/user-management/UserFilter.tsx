import React from 'react';
import type { UserFilters } from '../../types/user.types';

interface UserFilterProps {
  filters: UserFilters;
  onFilterChange: (filters: UserFilters) => void;
  onReset: () => void;
}

export const UserFilter: React.FC<UserFilterProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const roles = ['admin', 'manager', 'cashier', 'inventory', 'user'];
  const statuses = ['active', 'inactive', 'suspended'];

  const handleChange = (key: keyof UserFilters, value: string) => {
    onFilterChange({ ...filters, [key]: value || undefined });
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Filter Users</h3>
        <button
          onClick={onReset}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
        >
          Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Search
          </label>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="Search by email or name..."
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Role Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Role
          </label>
          <select
            value={filters.role || ''}
            onChange={(e) => handleChange('role', e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Department
          </label>
          <input
            type="text"
            value={filters.department || ''}
            onChange={(e) => handleChange('department', e.target.value)}
            placeholder="Enter department..."
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};