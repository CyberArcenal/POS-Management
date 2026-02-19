import React, { useState } from "react";
import { PlusCircle, Download, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

// Hooks
import { useTransactions, type TransactionFilters } from "./hooks/useTransactions";
import { useTransactionDetails } from "./hooks/useTransactionDetails";

// Components
import { FilterBar } from "./components/FilterBar";
import { SummaryMetrics } from "./components/SummaryMetrics";
import { TransactionsTable } from "./components/TransactionsTable";
import { TransactionDetailsDrawer } from "./components/TransactionDetailsDrawer";
import { dialogs } from "../../utils/dialogs";
import saleAPI from "../../api/sale";

const TransactionsPage: React.FC = () => {
  const { transactions, filters, setFilters, loading, error, reload } = useTransactions({
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    search: "",
    paymentMethod: "",
    status: "",
  });

  const { selectedTransaction, detailsOpen, openDetails, closeDetails } = useTransactionDetails();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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
  const totalPages = Math.ceil(transactions.length / pageSize);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="h-full flex flex-col bg-[var(--background-color)] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Transactions</h1>
        <div className="flex gap-2">
          <button
            onClick={handleNewSale}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] transition-colors"
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
      <FilterBar filters={filters} onFilterChange={handleFilterChange} onReload={reload} />

      {/* Transactions Table */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-[var(--accent-red)]" />
            <p className="text-[var(--text-primary)] font-medium">Error loading transactions</p>
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-[var(--text-tertiary)]">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, transactions.length)} of {transactions.length}{" "}
                transactions
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded-lg ${
                      currentPage === page
                        ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]"
                        : "border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)]"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
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