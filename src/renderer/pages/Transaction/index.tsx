// src/features/transactions/pages/TransactionPage.tsx
import React, { useEffect } from 'react';
import { useTransactionContext } from './context/TransactionContext';
import { useTransactions } from './hooks/useTransactions';
import { useTransactionDetail } from './hooks/useTransactionDetail';
import { ExportButton } from './components/ExportButton';
import { TransactionFilter } from './components/TransactionFilter';
import { TransactionTable } from './components/TransactionTable';
import { TransactionDetailModal } from './components/TransactionDetailModal';

export const TransactionPage: React.FC = () => {
  const {
    filters,
    setFilters,
    selectedTransactionId,
    setSelectedTransactionId,
    refreshTrigger,
    triggerRefresh,
  } = useTransactionContext();

  const {
    transactions,
    pagination,
    isLoading,
    isFetching,
    fetchTransactions,
    setPage,
  } = useTransactions(filters, refreshTrigger);

  const {
    transaction: selectedTransaction,
    isLoading: isLoadingDetail,
    loadTransaction,
    clearTransaction,
  } = useTransactionDetail();

  // Load transaction details when selected
  useEffect(() => {
    if (selectedTransactionId) {
      loadTransaction(selectedTransactionId);
    } else {
      clearTransaction();
    }
  }, [selectedTransactionId]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const handleFilterReset = () => {
    handleFilterChange({
      start_date: null,
      end_date: null,
      reference_number: '',
      customer_name: '',
      status: '',
      payment_method: '',
      min_total: '',
      max_total: '',
      search: '',
    });
  };

  const handleSelectTransaction = (id: number) => {
    setSelectedTransactionId(id);
  };

  const handleCloseModal = () => {
    setSelectedTransactionId(null);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (pagination?.total_pages || 1)) {
      setPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="flex-none p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Transaction History</h1>
            <p className="text-gray-400 mt-1">View and manage all sales transactions</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={triggerRefresh}
              disabled={isFetching}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <ExportButton filters={filters} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6">
          {/* Filters */}
          <TransactionFilter
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
          />

          {/* Stats Bar */}
          {pagination && (
            <div className="flex items-center justify-between mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-300">
                Showing <span className="font-semibold text-white">
                  {((pagination.current_page - 1) * pagination.page_size) + 1}-
                  {Math.min(pagination.current_page * pagination.page_size, pagination.count)}
                </span> of <span className="font-semibold text-white">{pagination.count}</span> transactions
              </div>
              <div className="text-sm text-gray-400">
                Page <span className="font-semibold text-white">{pagination.current_page}</span> of{' '}
                <span className="font-semibold text-white">{pagination.total_pages}</span>
              </div>
            </div>
          )}

          {/* Transaction Table */}
          <TransactionTable
            transactions={transactions}
            isLoading={isLoading}
            isFetching={isFetching}
            onSelectTransaction={handleSelectTransaction}
          />

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-center mt-8">
              <nav className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={!pagination.previous || isFetching}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded-lg transition-colors"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.total_pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.current_page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.current_page >= pagination.total_pages - 2) {
                      pageNum = pagination.total_pages - 4 + i;
                    } else {
                      pageNum = pagination.current_page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg transition-colors ${
                          pagination.current_page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {pagination.total_pages > 5 && pagination.current_page < pagination.total_pages - 2 && (
                    <>
                      <span className="text-gray-500">...</span>
                      <button
                        onClick={() => handlePageChange(pagination.total_pages)}
                        className="w-10 h-10 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                      >
                        {pagination.total_pages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={!pagination.next || isFetching}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded-lg transition-colors"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isLoading={isLoadingDetail}
        onClose={handleCloseModal}
      />
    </div>
  );
};