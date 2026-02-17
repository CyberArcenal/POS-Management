import React from 'react';
import { User, Loader2 } from 'lucide-react';
import type { Customer } from '../types';

interface CustomerSearchProps {
  customerSearch: string;
  showDropdown: boolean;
  customers: Customer[];
  loading: boolean;
  selectedCustomer: Customer | null;
  dropdownRef: React.RefObject<HTMLDivElement | null>;  // allow null
  onSearchChange: (value: string) => void;
  onFocus: () => void;
  onSelect: (customer: Customer) => void;
}

const CustomerSearch: React.FC<CustomerSearchProps> = ({
  customerSearch,
  showDropdown,
  customers,
  loading,
  selectedCustomer,
  dropdownRef,
  onSearchChange,
  onFocus,
  onSelect,
}) => {
  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-2 mb-1">
        <User className="w-4 h-4 text-[var(--text-tertiary)]" />
        <span className="text-sm text-[var(--text-primary)]">Customer</span>
      </div>
      <input
        type="text"
        placeholder="Search customer..."
        value={customerSearch}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={onFocus}
        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
      />
      {showDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {loading ? (
            <div className="p-2 text-center text-[var(--text-tertiary)]">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              Loading...
            </div>
          ) : customers.length > 0 ? (
            customers.map((cust) => (
              <div
                key={cust.id}
                className={`p-2 hover:bg-[var(--card-hover-bg)] cursor-pointer ${
                  selectedCustomer?.id === cust.id ? 'bg-[var(--accent-blue)]/20' : ''
                }`}
                onClick={() => onSelect(cust)}
              >
                <p className="font-medium text-[var(--text-primary)]">{cust.name}</p>
                {cust.contactInfo && (
                  <p className="text-xs text-[var(--text-tertiary)]">{cust.contactInfo}</p>
                )}
              </div>
            ))
          ) : (
            <div className="p-2 text-center text-[var(--text-tertiary)]">No customers found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSearch;