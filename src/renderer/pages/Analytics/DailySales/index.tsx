import React, { useState, useEffect, useCallback } from 'react';
import { Download } from 'lucide-react';

import FilterBar from './components/FilterBar';
import type { DailySalesChartPoint, DailySalesEntry, DailySalesStats } from '../../../api/analytics/daily_sales';
import dailySalesAPI from '../../../api/analytics/daily_sales';
import SummaryCards from './components/SummaryCards';
import SalesChart from './components/SalesChart';
import SalesTable from './components/SalesTable';

const DailySalesPage: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [stats, setStats] = useState<DailySalesStats | null>(null);
  const [chartData, setChartData] = useState<DailySalesChartPoint[]>([]);
  const [tableData, setTableData] = useState<DailySalesEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await dailySalesAPI.getStats({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        paymentMethod: paymentMethod || undefined,
        status: status || undefined,
      });
      if (res.status) setStats(res.data);
      else throw new Error(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingStats(false);
    }
  }, [startDate, endDate, paymentMethod, status]);

  const fetchChart = useCallback(async () => {
    setLoadingChart(true);
    try {
      const res = await dailySalesAPI.getDailySalesChart({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        paymentMethod: paymentMethod || undefined,
        status: status || undefined,
      });
      if (res.status) setChartData(res.data);
      else throw new Error(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingChart(false);
    }
  }, [startDate, endDate, paymentMethod, status]);

  const fetchTable = useCallback(async () => {
    setLoadingTable(true);
    try {
      const res = await dailySalesAPI.getDailySales({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        paymentMethod: paymentMethod || undefined,
        status: status || undefined,
        page,
        limit,
      });
      if (res.status) {
        setTableData(res.data);
        setTotal(res.total);
        setTotalPages(Math.ceil(res.total / limit));
      } else throw new Error(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingTable(false);
    }
  }, [startDate, endDate, paymentMethod, status, page, limit]);

  useEffect(() => {
    fetchStats();
    fetchChart();
    fetchTable();
  }, [fetchStats, fetchChart, fetchTable]);

  const handleFilterChange = (filters: any) => {
    setStartDate(filters.startDate);
    setEndDate(filters.endDate);
    setPaymentMethod(filters.paymentMethod);
    setStatus(filters.status);
    setPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await dailySalesAPI.exportCSV({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        paymentMethod: paymentMethod || undefined,
        status: status || undefined,
      });
      if (res.status && res.data.length) {
        const headers = Object.keys(res.data[0]).join(',');
        const csv = res.data.map(row => Object.values(row).join(',')).join('\n');
        const blob = new Blob([headers + '\n' + csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `daily_sales_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert('No data to export');
      }
    } catch (err: any) {
      alert('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[var(--background-color)] min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Daily Sales</h1>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <FilterBar
        startDate={startDate}
        endDate={endDate}
        paymentMethod={paymentMethod}
        status={status}
        onFilterChange={handleFilterChange}
      />

      {error && (
        <div className="bg-[var(--danger-bg)] text-[var(--danger-color)] p-4 rounded-lg border border-[var(--danger-border)]">
          Error: {error}
        </div>
      )}

      <SummaryCards stats={stats} loading={loadingStats} />
      <SalesChart data={chartData} loading={loadingChart} />
      <SalesTable
        data={tableData}
        loading={loadingTable}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
};

export default DailySalesPage;