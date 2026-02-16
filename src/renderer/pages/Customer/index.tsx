import React, { useState } from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";

// Hooks
import { useCustomers, type CustomerFilters } from "./hooks/useCustomers";
import { useCustomerForm } from "./hooks/useCustomerForm";
import { useCustomerView } from "./hooks/useCustomerView";
import type { Customer } from "../../api/customer";
import { dialogs } from "../../utils/dialogs";
import customerAPI from "../../api/customer";
import { FilterBar } from "./components/FilterBar";
import { CustomerTable } from "./components/CustomerTable";
import { CustomerFormDialog } from "./components/CustomerFormDialog";
import { CustomerViewDialog } from "./components/CustomerViewDialog";

// Components

const CustomerPage: React.FC = () => {
  const {
    customers,
    filters,
    setFilters,
    loading,
    error,
    reload,
    metrics,
  } = useCustomers({
    search: "",
    status: "all", // 'all' | 'vip' | 'loyal' | 'regular' | 'new'
    sortBy: "name",
    sortOrder: "ASC",
    minPoints: undefined,
    maxPoints: undefined,
  });

  const formDialog = useCustomerForm();
  const viewDialog = useCustomerView();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleFilterChange = (key: keyof CustomerFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleDelete = async (customer: Customer) => {
    const confirmed = await dialogs.confirm({
      title: "Delete Customer",
      message: `Are you sure you want to delete ${customer.name}? This action cannot be undone.`,
    });
    if (!confirmed) return;

    try {
      await customerAPI.delete(customer.id, "system");
      dialogs.alert({
        title: "Success",
        message: "Customer deleted successfully.",
      });
      reload();
    } catch (err: any) {
      dialogs.alert({ title: "Error", message: err.message });
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(customers.length / pageSize);
  const paginatedCustomers = customers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="h-full flex flex-col bg-[var(--background-color)] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Customer Directory
        </h1>
        <button
          onClick={formDialog.openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
          <p className="text-sm text-[var(--text-tertiary)]">Total Customers</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{metrics.total}</p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
          <p className="text-sm text-[var(--text-tertiary)]">VIP</p>
          <p className="text-2xl font-bold text-[var(--customer-vip)]">{metrics.vipCount}</p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
          <p className="text-sm text-[var(--text-tertiary)]">Loyal</p>
          <p className="text-2xl font-bold text-[var(--customer-loyal)]">{metrics.loyalCount}</p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
          <p className="text-sm text-[var(--text-tertiary)]">New (this month)</p>
          <p className="text-2xl font-bold text-[var(--customer-new)]">{metrics.newThisMonth}</p>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReload={reload}
      />

      {/* Customer Table */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-[var(--accent-red)]" />
            <p className="text-[var(--text-primary)] font-medium">
              Error loading customers
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
          <div className="flex-1">
            <CustomerTable
              customers={paginatedCustomers}
              onView={viewDialog.open}
              onEdit={formDialog.openEdit}
              onDelete={handleDelete}
            />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-[var(--text-tertiary)]">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, customers.length)} of{" "}
                {customers.length} customers
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
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
                  )
                )}
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

      {/* Dialogs */}
      <CustomerFormDialog
        isOpen={formDialog.isOpen}
        mode={formDialog.mode}
        customerId={formDialog.customerId}
        initialData={
          formDialog.initialData
            ? {
                name: formDialog.initialData.name,
                contactInfo: formDialog.initialData.contactInfo || undefined,
                loyaltyPointsBalance: formDialog.initialData.loyaltyPointsBalance,
              }
            : undefined
        }
        onClose={formDialog.close}
        onSuccess={() => {
          formDialog.close();
          reload();
        }}
      />

      <CustomerViewDialog
        customer={viewDialog.customer}
        sales={viewDialog.sales}
        loyaltyTransactions={viewDialog.loyaltyTransactions}
        loading={viewDialog.loading}
        isOpen={viewDialog.isOpen}
        onClose={viewDialog.close}
      />
    </div>
  );
};

export default CustomerPage;