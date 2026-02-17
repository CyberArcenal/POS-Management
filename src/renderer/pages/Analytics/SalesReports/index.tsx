import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import type { SaleEntry, SalesStats, SalesSummary } from '../../../api/analytics/sales_reports';
import salesReportAPI from '../../../api/analytics/sales_reports';
import ExportButton from './components/ExportButton';
import FilterBar from './components/FilterBar';
import SummaryCards from './components/SummaryCards';
import StatsCards from './components/StatsCards';
import SalesTable from './components/SalesTable';

const SalesReportsPage: React.FC = () => {
  // Filters
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [status, setStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [minAmount, setMinAmount] = useState<number | undefined>();
  const [maxAmount, setMaxAmount] = useState<number | undefined>();

  // Data states
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [sales, setSales] = useState<SaleEntry[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Loading states
  const [loading, setLoading] = useState({
    summary: false,
    stats: false,
    sales: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch functions
  const fetchSummary = useCallback(async () => {
    setLoading(prev => ({ ...prev, summary: true }));
    try {
      const res = await salesReportAPI.getSummary({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.status) setSummary(res.data);
      else throw new Error(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, summary: false }));
    }
  }, [startDate, endDate]);

  const fetchStats = useCallback(async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      const res = await salesReportAPI.getStats({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.status) setStats(res.data);
      else throw new Error(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, [startDate, endDate]);

  const fetchSales = useCallback(async () => {
    setLoading(prev => ({ ...prev, sales: true }));
    try {
      const res = await salesReportAPI.getAll({
        customerId,
        status: status || undefined,
        paymentMethod: paymentMethod || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        minAmount,
        maxAmount,
        searchTerm: searchTerm || undefined,
        page,
        limit,
      });
      if (res.status) {
        setSales(res.data);
        setTotal(res.total);
        setTotalPages(Math.ceil(res.total / limit));
      } else throw new Error(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, sales: false }));
    }
  }, [
    customerId,
    status,
    paymentMethod,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    searchTerm,
    page,
    limit,
  ]);

  // Initial load and filter changes
  useEffect(() => {
    fetchSummary();
    fetchStats();
    fetchSales();
  }, [
    fetchSummary,
    fetchStats,
    fetchSales,
    // Dependencies are already in the fetch functions
  ]);

  const handleFilterChange = (filters: any) => {
    setCustomerId(filters.customerId ? Number(filters.customerId) : undefined);
    setStatus(filters.status);
    setPaymentMethod(filters.paymentMethod);
    setStartDate(filters.startDate);
    setEndDate(filters.endDate);
    setSearchTerm(filters.searchTerm);
    setMinAmount(filters.minAmount ? Number(filters.minAmount) : undefined);
    setMaxAmount(filters.maxAmount ? Number(filters.maxAmount) : undefined);
    setPage(1);
  };

  const handleRefresh = () => {
    setError(null);
    fetchSummary();
    fetchStats();
    fetchSales();
  };

  const anyLoading = Object.values(loading).some(v => v);

  return (
    <div className="p-6 space-y-6 bg-[var(--background-color)] min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Sales Report</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={anyLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--card-secondary-bg)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${anyLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <ExportButton
            customerId={customerId}
            status={status}
            paymentMethod={paymentMethod}
            startDate={startDate}
            endDate={endDate}
            minAmount={minAmount}
            maxAmount={maxAmount}
            searchTerm={searchTerm}
          />
        </div>
      </div>

      <FilterBar
        customerId={customerId}
        status={status}
        paymentMethod={paymentMethod}
        startDate={startDate}
        endDate={endDate}
        searchTerm={searchTerm}
        minAmount={minAmount}
        maxAmount={maxAmount}
        onFilterChange={handleFilterChange}
      />

      {error && (
        <div className="bg-[var(--danger-bg)] text-[var(--danger-color)] p-4 rounded-lg border border-[var(--danger-border)]">
          Error: {error}
        </div>
      )}

      <SummaryCards summary={summary} loading={loading.summary} />

      <StatsCards stats={stats} loading={loading.stats} />

      <SalesTable
        data={sales}
        loading={loading.sales}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
};

export default SalesReportsPage;