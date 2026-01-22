// src/features/transactions/components/TransactionFilter.tsx
import React, { useState } from 'react';
import type { FilterState } from '../api/types';

interface TransactionFilterProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    onReset: () => void;
}

export const TransactionFilter: React.FC<TransactionFilterProps> = ({
    filters,
    onFilterChange,
    onReset,
}) => {
    const [localFilters, setLocalFilters] = useState<FilterState>(filters);

    const handleInputChange = (field: keyof FilterState, value: string) => {
        setLocalFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleDateChange = (field: 'start_date' | 'end_date', value: string) => {
        setLocalFilters(prev => ({ ...prev, [field]: value || null }));
    };

    const handleApply = () => {
        // Ensure dates are properly formatted
        const cleanedFilters = {
            ...localFilters,
            start_date: localFilters.start_date === '' ? null : localFilters.start_date,
            end_date: localFilters.end_date === '' ? null : localFilters.end_date,
        };
        onFilterChange(cleanedFilters);
    };

    const handleReset = () => {
        const resetFilters: FilterState = {
            start_date: null,
            end_date: null,
            reference_number: '',
            customer_name: '',
            status: '',
            payment_method: '',
            min_total: '',
            max_total: '',
            search: '',
        };
        setLocalFilters(resetFilters);
        onReset();
    };

    const paymentMethods = ['cash', 'card', 'gcash', 'maya', 'bank_transfer'];
    const statuses = ['completed', 'cancelled', 'refunded', 'pending', 'processing'];

    return (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Filter Transactions</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleApply}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        Apply Filters
                    </button>
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by receipt #, customer name, or notes..."
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={localFilters.search}
                    onChange={(e) => handleInputChange('search', e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                    <input
                        type="date"
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                        value={localFilters.start_date || ''}
                        onChange={(e) => handleDateChange('start_date', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                    <input
                        type="date"
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                        value={localFilters.end_date || ''}
                        onChange={(e) => handleDateChange('end_date', e.target.value)}
                    />
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                    <select
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                        value={localFilters.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                    >
                        <option value="">All Status</option>
                        {statuses.map(status => (
                            <option key={status} value={status}>
                                {status.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Payment Method */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Payment Method</label>
                    <select
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                        value={localFilters.payment_method}
                        onChange={(e) => handleInputChange('payment_method', e.target.value)}
                    >
                        <option value="">All Methods</option>
                        {paymentMethods.map(method => (
                            <option key={method} value={method}>
                                {method.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Additional Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Receipt #</label>
                    <input
                        type="text"
                        placeholder="Receipt number"
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                        value={localFilters.reference_number}
                        onChange={(e) => handleInputChange('reference_number', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Customer Name</label>
                    <input
                        type="text"
                        placeholder="Customer name"
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                        value={localFilters.customer_name}
                        onChange={(e) => handleInputChange('customer_name', e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Min Total</label>
                        <input
                            type="number"
                            placeholder="Min"
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                            value={localFilters.min_total}
                            onChange={(e) => handleInputChange('min_total', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Max Total</label>
                        <input
                            type="number"
                            placeholder="Max"
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                            value={localFilters.max_total}
                            onChange={(e) => handleInputChange('max_total', e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};