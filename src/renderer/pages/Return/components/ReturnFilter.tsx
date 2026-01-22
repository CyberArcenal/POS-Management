import React, { useState } from 'react';
import { Search, Calendar, Filter, X } from 'lucide-react';

interface ReturnFilterProps {
  filters: any;
  onFilterChange: (filters: any) => void;
}

const ReturnFilter: React.FC<ReturnFilterProps> = ({ filters, onFilterChange }) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ search: e.target.value });
  };
  
  const handleDateChange = (type: 'start' | 'end', value: string) => {
    onFilterChange({ [`${type}_date`]: value });
  };
  
  const handleStatusChange = (status: string) => {
    onFilterChange({ status: status || '' });
  };
  
  const handlePaymentMethodChange = (method: string) => {
    onFilterChange({ payment_method: method || '' });
  };
  
  const clearFilters = () => {
    onFilterChange({
      search: '',
      status: '',
      payment_method: '',
      start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0]
    });
  };
  
  return (
    <div className="return-filter-container">
      {/* Quick Search */}
      <div className="quick-search">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="Search by receipt number, customer name, or phone..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            className="search-input"
          />
          {filters.search && (
            <button onClick={() => onFilterChange({ search: '' })} className="clear-search">
              <X size={16} />
            </button>
          )}
        </div>
        
        <button
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className={`btn-advanced ${isAdvancedOpen ? 'active' : ''}`}
        >
          <Filter size={16} />
          Advanced Filters
        </button>
      </div>
      
      {/* Advanced Filters */}
      {isAdvancedOpen && (
        <div className="advanced-filters">
          <div className="filter-group">
            <label className="filter-label">Date Range</label>
            <div className="date-inputs">
              <div className="date-input">
                <Calendar size={16} />
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                  className="date-picker"
                />
              </div>
              <span className="date-separator">to</span>
              <div className="date-input">
                <Calendar size={16} />
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleDateChange('end', e.target.value)}
                  className="date-picker"
                />
              </div>
            </div>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Status</label>
            <div className="status-buttons">
              {['', 'completed', 'pending', 'cancelled', 'refunded'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`status-btn ${filters.status === status ? 'active' : ''}`}
                >
                  {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Payment Method</label>
            <select
              value={filters.payment_method}
              onChange={(e) => handlePaymentMethodChange(e.target.value)}
              className="payment-select"
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="digital">Digital Wallet</option>
              <option value="credit">Credit</option>
            </select>
          </div>
          
          <div className="filter-actions">
            <button onClick={clearFilters} className="btn-clear">
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnFilter;