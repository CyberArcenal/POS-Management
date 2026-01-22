import React, { useCallback, useEffect } from 'react';
import { CustomerProvider, useCustomerContext } from './context/CustomerContext';
import { useCustomers } from './hooks/useCustomers';
import { CustomerFilter } from './components/CustomerFilter';
import { ExportButton } from './components/ExportButton';
import { CustomerTable } from './components/CustomerTable';
import { CustomerDetailModal } from './components/CustomerDetailModal';
import { CustomerForm } from './components/CustomerForm';

const CustomerDirectoryContent: React.FC = () => {
  const {
    filters,
    setFilters,
    selectedCustomerId,
    setSelectedCustomerId,
    isFormOpen,
    setIsFormOpen,
    editingCustomer,
    setEditingCustomer,
    refreshTrigger,
    triggerRefresh,
  } = useCustomerContext();

  const {
    customers,
    pagination,
    isLoading,
    isFetching,
    error,
    fetchCustomers,
    setPage,
  } = useCustomers({
    filters,
    page: 1,
    pageSize: 20,
    refreshTrigger,
  });

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleFilterReset = () => {
    setFilters({});
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingCustomer(null);
    triggerRefresh();
  };

  const handlePageChange = useCallback((page: number) => {
    setPage(page);
  }, [setPage]);

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="flex-none p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Customer Directory</h1>
            <p className="text-gray-400 mt-1">Manage your customer database</p>
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
            <button
              onClick={handleAddCustomer}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Customer
            </button>
            <ExportButton filters={filters} />
          </div>
        </div>
        {/* I-display ang error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-300">{error}</span>
              <button
                onClick={() => fetchCustomers()}
                className="ml-4 px-3 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-sm"
              >
                Subukan Muli
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6">
          {/* Filters */}
          <CustomerFilter
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
                </span> of <span className="font-semibold text-white">{pagination.count}</span> customers
              </div>
              <div className="text-sm text-gray-400">
                Page <span className="font-semibold text-white">{pagination.current_page}</span> of{' '}
                <span className="font-semibold text-white">{pagination.total_pages}</span>
              </div>
            </div>
          )}

          {/* Customer Table */}
          <CustomerTable
            customers={customers}
            isLoading={isLoading}
            isFetching={isFetching}
            onSelectCustomer={setSelectedCustomerId}
            onEditCustomer={handleEditCustomer}
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
                        className={`w-10 h-10 rounded-lg transition-colors ${pagination.current_page === pageNum
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

      {/* Modals */}
      <CustomerDetailModal
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
      />

      {isFormOpen && (
        <CustomerForm
          editingCustomer={editingCustomer}
          onSuccess={handleFormSuccess}
          onClose={() => {
            setIsFormOpen(false);
            setEditingCustomer(null);
          }}
        />
      )}
    </div>
  );
};

export const CustomerDirectoryPage: React.FC = () => {
  return (
    <CustomerProvider>
      <CustomerDirectoryContent />
    </CustomerProvider>
  );
};