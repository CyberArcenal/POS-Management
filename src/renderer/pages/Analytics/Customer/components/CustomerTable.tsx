import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CustomerProfile } from '../../../../api/analytics/customer_insight';
import customerInsightsAPI from '../../../../api/analytics/customer_insight';

const CustomerTable: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({
    minPoints: '',
    maxPoints: '',
    hasLoyaltyPoints: false,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch customers when page, search, or filters change
  useEffect(() => {
    fetchCustomers();
  }, [page, debouncedSearch, filters]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 10,
        searchTerm: debouncedSearch || undefined,
      };
      if (filters.minPoints) params.minPoints = parseInt(filters.minPoints);
      if (filters.maxPoints) params.maxPoints = parseInt(filters.maxPoints);
      if (filters.hasLoyaltyPoints) params.hasLoyaltyPoints = true;

      const response = await customerInsightsAPI.getProfiles(params);
      if (response.status) {
        setCustomers(response.data);
        setTotal(response.total);
        setTotalPages(response.total);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ minPoints: '', maxPoints: '', hasLoyaltyPoints: false });
    setSearchTerm('');
    setPage(1);
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Customer Directory</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg pl-9 pr-3 py-1.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--input-focus)]"
            />
          </div>
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 text-sm bg-[var(--card-secondary-bg)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--card-hover-bg)] transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="px-5 py-3 bg-[var(--card-secondary-bg)] border-b border-[var(--border-color)] flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--text-secondary)]">Min Points:</label>
          <input
            type="number"
            name="minPoints"
            value={filters.minPoints}
            onChange={handleFilterChange}
            className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2 py-1 w-20 text-sm text-[var(--text-primary)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[var(--text-secondary)]">Max Points:</label>
          <input
            type="number"
            name="maxPoints"
            value={filters.maxPoints}
            onChange={handleFilterChange}
            className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2 py-1 w-20 text-sm text-[var(--text-primary)]"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            name="hasLoyaltyPoints"
            checked={filters.hasLoyaltyPoints}
            onChange={handleFilterChange}
            className="rounded border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--accent-blue)] focus:ring-[var(--accent-blue)]"
          />
          Has points only
        </label>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[var(--card-bg)]">
            <tr className="border-b border-[var(--border-color)]">
              <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Name</th>
              <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Contact</th>
              <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Loyalty Points</th>
              <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Created At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[var(--text-secondary)]">
                  Loading...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[var(--text-secondary)]">
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map((cust) => (
                <tr key={cust.id} className="border-b border-[var(--border-light)] hover:bg-[var(--card-hover-bg)]">
                  <td className="py-3 px-5 text-[var(--text-primary)] font-medium">{cust.name}</td>
                  <td className="py-3 px-5 text-[var(--text-primary)]">{cust.contactInfo}</td>
                  <td className="py-3 px-5">
                    <span className="px-2 py-1 rounded-full text-xs bg-[var(--accent-amber-light)] text-[var(--accent-amber)]">
                      {cust.loyaltyPointsBalance} pts
                    </span>
                  </td>
                  <td className="py-3 px-5 text-[var(--text-primary)]">
                    {new Date(cust.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-5 py-3 border-t border-[var(--border-color)] flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} entries
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 bg-[var(--card-secondary-bg)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--card-hover-bg)] disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-[var(--text-primary)]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 bg-[var(--card-secondary-bg)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--card-hover-bg)] disabled:opacity-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerTable;