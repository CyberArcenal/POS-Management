import React, { useState, useEffect } from "react";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import { useLoyalty, type LoyaltyFilters } from "./hooks/useLoyalty";

import { LoyaltyOverview } from "./components/LoyaltyOverview";
import { useLoyaltyAdjustment } from "./hooks/useLoyaltyAdjustment";
import { useCustomerLoyaltyView } from "./hooks/useCustomerLoyaltyView";
import { LoyaltyTransactionsTable } from "./components/LoyaltyTransactionsTable";
import { LoyaltyAnalytics } from "./components/LoyaltyAnalytics";
import { LoyaltyAdjustmentDialog } from "./components/LoyaltyAdjustmentDialog";
import { CustomerLoyaltyViewDialog } from "./components/CustomerLoyaltyViewDialog";
import Pagination from "../../components/Shared/Pagination1";

const CustomerLoyaltyPage: React.FC = () => {
  const {
    transactions,
    statistics,
    filters,
    setFilters,
    loading,
    error,
    reload,
    topCustomers,
    pointsDistribution,
    monthlyTrends,
  } = useLoyalty({
    type: "all", // 'all' | 'earn' | 'redeem'
    customerId: undefined,
    startDate: undefined,
    endDate: undefined,
    search: "",
  });

  const adjustmentDialog = useLoyaltyAdjustment();
  const viewDialog = useCustomerLoyaltyView();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [10, 20, 50, 100];

  const handleFilterChange = (key: keyof LoyaltyFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(transactions.length / pageSize);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const totalItems = transactions.length;

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
          Loyalty Program Management
        </h1>
        <button
          onClick={adjustmentDialog.open}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adjust Points
        </button>
      </div>

      {/* Overview Cards */}
      {!loading && !error && statistics && (
        <LoyaltyOverview statistics={statistics} />
      )}

      {/* Filters */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by customer name..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="all">All Transactions</option>
            <option value="earn">Earned Only</option>
            <option value="redeem">Redeemed Only</option>
          </select>

          {/* Date Range */}
          <input
            type="date"
            value={filters.startDate || ""}
            onChange={(e) =>
              handleFilterChange("startDate", e.target.value || undefined)
            }
            className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
          />
          <span className="text-[var(--text-tertiary)]">to</span>
          <input
            type="date"
            value={filters.endDate || ""}
            onChange={(e) =>
              handleFilterChange("endDate", e.target.value || undefined)
            }
            className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
          />

          {/* Reload */}
          <button
            onClick={reload}
            className="px-4 py-2 bg-[var(--card-hover-bg)] rounded-lg hover:bg-[var(--border-color)] transition-colors text-[var(--text-secondary)]"
          >
            Refresh
          </button>
        </div>
      </div>

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
              Error loading loyalty data
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
          {/* Transactions Table */}
          <div className="flex-1">
            <LoyaltyTransactionsTable
              transactions={paginatedTransactions}
              onViewCustomer={viewDialog.open}
            />
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

          {/* Analytics Section */}
          {/* <div className="mt-8">
            <LoyaltyAnalytics
              pointsDistribution={pointsDistribution}
              monthlyTrends={monthlyTrends}
              topCustomers={topCustomers}
            />
          </div> */}
        </>
      )}

      {/* Dialogs */}
      <LoyaltyAdjustmentDialog
        isOpen={adjustmentDialog.isOpen}
        onClose={adjustmentDialog.close}
        onSuccess={() => {
          adjustmentDialog.close();
          reload();
        }}
      />

      <CustomerLoyaltyViewDialog
        isOpen={viewDialog.isOpen}
        customer={viewDialog.customer}
        transactions={viewDialog.transactions}
        loading={viewDialog.loading}
        onClose={viewDialog.close}
      />
    </div>
  );
};

export default CustomerLoyaltyPage;
