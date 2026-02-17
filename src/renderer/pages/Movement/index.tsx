import React, { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useMovements, type MovementFilters } from "./hooks/useMovements";
import { useMovementView } from "./hooks/useMovementView";

// Components
import { SummaryCards } from "./components/SummaryCards";
import { FilterBar } from "./components/FilterBar";
import { MovementTable } from "./components/MovementTable";
import { MovementViewDialog } from "./components/MovementViewDialog";
import { Pagination } from "../../components/Shared/Pagination";

const MovementPage: React.FC = () => {
  const {
    movements,
    filters,
    setFilters,
    loading,
    error,
    reload,
    summary,
  } = useMovements({
    movementType: "all",
    startDate: undefined,
    endDate: undefined,
    search: "",
    direction: "all", // 'all' | 'increase' | 'decrease'
  });

  const viewDialog = useMovementView();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleFilterChange = (key: keyof MovementFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(movements.length / pageSize);
  const paginatedMovements = movements.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="h-full flex flex-col bg-[var(--background-color)] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Inventory Movements
        </h1>
      </div>

      {/* Summary Cards */}
      {!loading && !error && <SummaryCards summary={summary} />}

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReload={reload}
      />

      {/* Main Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-[var(--accent-red)]" />
            <p className="text-[var(--text-primary)] font-medium">
              Error loading movements
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">{error}</p>
            <button
              onClick={reload}
              className="mt-4 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Movement Table (sticky header + scrollable body) */}
          <div className="flex-1">
            <MovementTable
              movements={paginatedMovements}
              onView={viewDialog.open}
            />
          </div>

          {/* Pagination Component */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={movements.length}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* View Dialog */}
      <MovementViewDialog
        isOpen={viewDialog.isOpen}
        movement={viewDialog.movement}
        onClose={viewDialog.close}
      />
    </div>
  );
};

export default MovementPage;
