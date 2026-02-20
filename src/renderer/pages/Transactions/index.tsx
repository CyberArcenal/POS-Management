import React, { useState } from "react";
import { PlusCircle, Download, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

// Hooks
import {
  useTransactions,
  type TransactionFilters,
} from "./hooks/useTransactions";
import { useTransactionDetails } from "./hooks/useTransactionDetails";

// Components
import { FilterBar } from "./components/FilterBar";
import { SummaryMetrics } from "./components/SummaryMetrics";
import { TransactionsTable } from "./components/TransactionsTable";
import { TransactionDetailsDrawer } from "./components/TransactionDetailsDrawer";
import { dialogs } from "../../utils/dialogs";
import saleAPI from "../../api/sale";
import Pagination from "../../components/Shared/Pagination1";

const TransactionsPage: React.FC = () => {
  const { transactions, filters, setFilters, loading, error, reload } =
    useTransactions({
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      search: "",
      paymentMethod: "",
      status: "",
    });

  const { selectedTransaction, detailsOpen, openDetails, closeDetails } =
    useTransactionDetails();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [10, 20, 50, 100];

  const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // reset to first page on filter change
  };

  const handlePrint = async (transaction: any) => {
    // Implement print logic
    await dialogs.alert({ title: "Print", message: "Printing receipt..." });
  };

  const handleRefund = (transaction: any) => {
    dialogs
      .confirm({
        title: "Process Refund",
        message: `Refund transaction #${transaction.id}?`,
      })
      .then((confirmed) => {
        if (confirmed) {
          // Call refund API
        }
      });
  };

  const handleNewSale = () => {
    window.location.href = "/pos/cashier"; // or use router
  };

  const handleExport = async () => {
    try {
      const response = await saleAPI.exportCSV({
        startDate: filters.startDate,
        endDate: filters.endDate,
        paymentMethod: filters.paymentMethod || undefined,
        status: filters.status || undefined,
        search: filters.search || undefined,
      });
      if (response.status) {
        const blob = new Blob([response.data.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = response.data.filename;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      await dialogs.alert({ title: "Export Failed", message: err.message });
    }
  };

  // Pagination calculations
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const totalItems = transactions.length;
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
          Transactions
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleNewSale}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] transition-colors hidden"
          >
            <PlusCircle className="w-4 h-4" />
            New Sale
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--card-hover-bg)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--border-color)] transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <SummaryMetrics transactions={transactions} />

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReload={reload}
      />

      {/* Transactions Table */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-[var(--accent-red)]" />
            <p className="text-[var(--text-primary)] font-medium">
              Error loading transactions
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
          <div className="flex-1 overflow-hidden">
            <TransactionsTable
              transactions={paginatedTransactions}
              onViewDetails={openDetails}
              onPrint={handlePrint}
              onRefund={handleRefund}
            />
          </div>

          {/* Pagination - identical to product page */}
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

      {/* Transaction Details Drawer */}
      <TransactionDetailsDrawer
        transaction={selectedTransaction}
        isOpen={detailsOpen}
        onClose={closeDetails}
        onPrint={handlePrint}
        onRefund={handleRefund}
      />
    </div>
  );
};

export default TransactionsPage;
