import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import type {
  FinancialSummary,
  RevenueBreakdownItem,
  ProfitLossItem,
  ExpenseBreakdownItem,
  FinancialChartDataPoint,
} from '../../../api/analytics/financial_reports';
import FilterBar from './components/FilterBar';
import financialReportsAPI from '../../../api/analytics/financial_reports';
import ExportButton from './components/ExportButton';
import RevenueBreakdown from './components/RevenueBreakdown';
import ExpenseBreakdown from './components/ExpenseBreakdown';
import ProfitLossChart from './components/ProfitLossChart';
import SummaryCards from './components/SummaryCards';

const FinancialReportsPage: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [revenueGroupBy, setRevenueGroupBy] = useState<'paymentMethod' | 'category' | 'product'>('paymentMethod');
  const [profitGroupBy, setProfitGroupBy] = useState<'day' | 'week' | 'month'>('day');

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdownItem[]>([]);
  const [profitLoss, setProfitLoss] = useState<ProfitLossItem[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdownItem[]>([]);
  const [chartData, setChartData] = useState<FinancialChartDataPoint[]>([]);

  const [loading, setLoading] = useState({
    summary: false,
    revenue: false,
    profit: false,
    expense: false,
    chart: false,
  });
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(prev => ({ ...prev, summary: true }));
    try {
      const res = await financialReportsAPI.getSummary({
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

  const fetchRevenueBreakdown = useCallback(async () => {
    setLoading(prev => ({ ...prev, revenue: true }));
    try {
      const res = await financialReportsAPI.getRevenueBreakdown({
        groupBy: revenueGroupBy,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 20,
      });
      if (res.status) setRevenueBreakdown(res.data);
      else throw new Error(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, revenue: false }));
    }
  }, [revenueGroupBy, startDate, endDate]);

  const fetchProfitLoss = useCallback(async () => {
    setLoading(prev => ({ ...prev, profit: true }));
    try {
      const res = await financialReportsAPI.getProfitLoss({
        groupBy: profitGroupBy,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.status) setProfitLoss(res.data);
      else throw new Error(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, profit: false }));
    }
  }, [profitGroupBy, startDate, endDate]);

  const fetchExpenseBreakdown = useCallback(async () => {
    setLoading(prev => ({ ...prev, expense: true }));
    try {
      const res = await financialReportsAPI.getExpenseBreakdown({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.status) setExpenseBreakdown(res.data);
      else throw new Error(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, expense: false }));
    }
  }, [startDate, endDate]);

  const fetchChartData = useCallback(async () => {
    setLoading(prev => ({ ...prev, chart: true }));
    try {
      const res = await financialReportsAPI.getChartData({
        chartType: 'revenue',
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.status) setChartData(res.data);
      else throw new Error(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, chart: false }));
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchSummary();
    fetchRevenueBreakdown();
    fetchProfitLoss();
    fetchExpenseBreakdown();
    fetchChartData();
  }, [fetchSummary, fetchRevenueBreakdown, fetchProfitLoss, fetchExpenseBreakdown, fetchChartData]);

  const handleRefresh = () => {
    setError(null);
    fetchSummary();
    fetchRevenueBreakdown();
    fetchProfitLoss();
    fetchExpenseBreakdown();
    fetchChartData();
  };

  const handleFilterChange = (filters: any) => {
    setStartDate(filters.startDate);
    setEndDate(filters.endDate);
    setRevenueGroupBy(filters.revenueGroupBy);
    setProfitGroupBy(filters.profitGroupBy);
  };

  const anyLoading = Object.values(loading).some(v => v);

  return (
    <div className="p-6 space-y-6 bg-[var(--background-color)] min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Financial Reports</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={anyLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--card-secondary-bg)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${anyLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <ExportButton startDate={startDate} endDate={endDate} />
        </div>
      </div>

      <FilterBar
        startDate={startDate}
        endDate={endDate}
        revenueGroupBy={revenueGroupBy}
        profitGroupBy={profitGroupBy}
        onFilterChange={handleFilterChange}
      />

      {error && (
        <div className="bg-[var(--danger-bg)] text-[var(--danger-color)] p-4 rounded-lg border border-[var(--danger-border)]">
          Error: {error}
        </div>
      )}

      <SummaryCards summary={summary} loading={loading.summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueBreakdown data={revenueBreakdown} groupBy={revenueGroupBy} loading={loading.revenue} />
        <ExpenseBreakdown data={expenseBreakdown} loading={loading.expense} />
      </div>

      <ProfitLossChart data={profitLoss} groupBy={profitGroupBy} loading={loading.profit} />
    </div>
  );
};

export default FinancialReportsPage;