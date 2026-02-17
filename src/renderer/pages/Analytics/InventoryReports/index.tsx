import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import type {
  InventorySummary,
  ProductStock,
  InventoryMovement,
  InventoryStats,
} from '../../../api/analytics/inventory_reports';
import FilterBar from './components/FilterBar';
import inventoryReportsAPI from '../../../api/analytics/inventory_reports';
import ExportButton from './components/ExportButton';
import LowStockTable from './components/LowStockTable';
import SummaryCards from './components/SummaryCards';
import OutOfStockTable from './components/OutOfStockTable';
import StatsCards from './components/StatsCards';
import MovementsTable from './components/MovementsTable';


const InventoryReportsPage: React.FC = () => {
  // Filters
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [supplierId, setSupplierId] = useState<number | undefined>();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data states
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [lowStock, setLowStock] = useState<ProductStock[]>([]);
  const [outOfStock, setOutOfStock] = useState<ProductStock[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);

  // Pagination states (optional, can add more if needed)
  const [lowStockPage, setLowStockPage] = useState(1);
  const [lowStockTotalPages, setLowStockTotalPages] = useState(1);
  const [outOfStockPage, setOutOfStockPage] = useState(1);
  const [outOfStockTotalPages, setOutOfStockTotalPages] = useState(1);
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsTotalPages, setMovementsTotalPages] = useState(1);
  const limit = 10;

  // Loading states
  const [loading, setLoading] = useState({
    summary: false,
    lowStock: false,
    outOfStock: false,
    movements: false,
    stats: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch functions
  const fetchSummary = useCallback(async () => {
    setLoading(prev => ({ ...prev, summary: true }));
    try {
      const res = await inventoryReportsAPI.getSummary();
      if (res.status) setSummary(res.data);
      else throw new Error(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, summary: false }));
    }
  }, []);

  const fetchLowStock = useCallback(async () => {
    setLoading(prev => ({ ...prev, lowStock: true }));
    try {
      const res = await inventoryReportsAPI.getLowStockAlerts({
        categoryId,
        supplierId,
        page: lowStockPage,
        limit,
      });
      if (res.status) {
        setLowStock(res.data);
        setLowStockTotalPages(Math.ceil(res.total / limit));
      } else throw new Error(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, lowStock: false }));
    }
  }, [categoryId, supplierId, lowStockPage, limit]);

  const fetchOutOfStock = useCallback(async () => {
    setLoading(prev => ({ ...prev, outOfStock: true }));
    try {
      const res = await inventoryReportsAPI.getOutOfStock({
        categoryId,
        supplierId,
        page: outOfStockPage,
        limit,
      });
      if (res.status) {
        setOutOfStock(res.data);
        setOutOfStockTotalPages(Math.ceil(res.total / limit));
      } else throw new Error(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, outOfStock: false }));
    }
  }, [categoryId, supplierId, outOfStockPage, limit]);

  const fetchMovements = useCallback(async () => {
    setLoading(prev => ({ ...prev, movements: true }));
    try {
      const res = await inventoryReportsAPI.getMovements({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: movementsPage,
        limit,
      });
      if (res.status) {
        setMovements(res.data);
        setMovementsTotalPages(Math.ceil(res.total / limit));
      } else throw new Error(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, movements: false }));
    }
  }, [startDate, endDate, movementsPage, limit]);

  const fetchStats = useCallback(async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      const res = await inventoryReportsAPI.getStats({
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

  // Initial load and filter changes
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  useEffect(() => {
    fetchOutOfStock();
  }, [fetchOutOfStock]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleFilterChange = (filters: any) => {
    setCategoryId(filters.categoryId ? Number(filters.categoryId) : undefined);
    setSupplierId(filters.supplierId ? Number(filters.supplierId) : undefined);
    setStartDate(filters.startDate);
    setEndDate(filters.endDate);
    // Reset pages
    setLowStockPage(1);
    setOutOfStockPage(1);
    setMovementsPage(1);
  };

  const handleRefresh = () => {
    setError(null);
    fetchSummary();
    fetchLowStock();
    fetchOutOfStock();
    fetchMovements();
    fetchStats();
  };

  const anyLoading = Object.values(loading).some(v => v);

  return (
    <div className="p-6 space-y-6 bg-[var(--background-color)] min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Inventory Reports</h1>
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
            categoryId={categoryId}
            supplierId={supplierId}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      </div>

      <FilterBar
        categoryId={categoryId}
        supplierId={supplierId}
        startDate={startDate}
        endDate={endDate}
        onFilterChange={handleFilterChange}
      />

      {error && (
        <div className="bg-[var(--danger-bg)] text-[var(--danger-color)] p-4 rounded-lg border border-[var(--danger-border)]">
          Error: {error}
        </div>
      )}

      <SummaryCards summary={summary} loading={loading.summary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LowStockTable
          data={lowStock}
          loading={loading.lowStock}
          page={lowStockPage}
          totalPages={lowStockTotalPages}
          onPageChange={setLowStockPage}
        />
        <OutOfStockTable
          data={outOfStock}
          loading={loading.outOfStock}
          page={outOfStockPage}
          totalPages={outOfStockTotalPages}
          onPageChange={setOutOfStockPage}
        />
      </div>

      <StatsCards stats={stats} loading={loading.stats} />

      <MovementsTable
        data={movements}
        loading={loading.movements}
        page={movementsPage}
        totalPages={movementsTotalPages}
        onPageChange={setMovementsPage}
      />
    </div>
  );
};

export default InventoryReportsPage;