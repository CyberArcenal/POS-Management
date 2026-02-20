import React, { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuditLogs, type AuditFilters } from "./hooks/useAuditLogs";
import { useAuditView } from "./hooks/useAuditView";
import { SummaryCards } from "./components/SummaryCards";
import { FilterBar } from "./components/FilterBar";
import { AuditTable } from "./components/AuditTable";
import { AuditViewDialog } from "./components/AuditViewDialog";
import Pagination from "../../components/Shared/Pagination1";

const AuditTrailPage: React.FC = () => {
  const { logs, filters, setFilters, loading, error, reload, summary } =
    useAuditLogs({
      action: "all",
      startDate: undefined,
      endDate: undefined,
      search: "",
      entity: undefined,
      user: undefined, // changed from userId
    });

  const viewDialog = useAuditView();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [10, 20, 50, 100];

  const handleFilterChange = (key: keyof AuditFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Pagination calculations
  const paginatedLogs = logs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const totalItems = logs.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // reset to first page
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background-color)] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Audit Trail
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
              Error loading audit logs
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
          {/* Audit Table */}
          <div className="flex-1">
            <AuditTable logs={paginatedLogs} onView={viewDialog.open} />
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={pageSizeOptions}
            showPageSize={true}
          />
        </>
      )}

      {/* View Dialog */}
      <AuditViewDialog
        isOpen={viewDialog.isOpen}
        log={viewDialog.log}
        onClose={viewDialog.close}
      />
    </div>
  );
};

export default AuditTrailPage;
