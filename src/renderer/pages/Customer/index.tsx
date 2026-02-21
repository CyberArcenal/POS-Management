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
import Pagination from "../../components/Shared/Pagination1";

const CustomerPage: React.FC = () => {
  const {
    customers,
    filters,
    setFilters,
    loading,
    error,
    reload,
    metrics,
    totalsMap,
  } = useCustomers({
    search: "",
    status: "all",
    sortBy: "name",
    sortOrder: "ASC",
    minPoints: undefined,
    maxPoints: undefined,
  });

  const formDialog = useCustomerForm();
  const viewDialog = useCustomerView();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageSizeOptions = [10, 20, 50, 100];

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
  const paginatedCustomers = customers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const totalItems = customers.length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

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

      {/* Summary Metrics – updated to use eliteCount */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
          <p className="text-sm text-[var(--text-tertiary)]">Total Customers</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {metrics.total}
          </p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
          <p className="text-sm text-[var(--text-tertiary)]">VIP</p>
          <p className="text-2xl font-bold text-[var(--customer-vip)]">
            {metrics.vipCount}
          </p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
          <p className="text-sm text-[var(--text-tertiary)]">Elite</p>
          <p className="text-2xl font-bold text-[var(--customer-loyal)]">
            {metrics.eliteCount}
          </p>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
          <p className="text-sm text-[var(--text-tertiary)]">
            New (this month)
          </p>
          <p className="text-2xl font-bold text-[var(--customer-new)]">
            {metrics.newThisMonth}
          </p>
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
              getTotalSpent={(customerId: number) => totalsMap[customerId] || 0}
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
                email: formDialog.initialData.email || undefined,
                phone: formDialog.initialData.phone || undefined,
                loyaltyPointsBalance:
                  formDialog.initialData.loyaltyPointsBalance,
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
