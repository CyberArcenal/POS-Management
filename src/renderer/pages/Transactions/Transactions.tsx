// src/renderer/pages/pos/Transactions.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  Printer,
  RotateCcw,
  Download,
  PlusCircle,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Ban,
  RefreshCw,
  Wallet,
  CreditCard,
  Banknote,
} from "lucide-react";
import Decimal from "decimal.js";
import { format } from "date-fns";
import saleAPI, { type Sale, type SaleItem } from "../../api/sale";
import { dialogs } from "../../utils/dialogs";

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

type PaymentMethod = "cash" | "card" | "wallet";
type SaleStatus = "initiated" | "paid" | "refunded" | "voided";

interface TransactionFilters {
  startDate: string;
  endDate: string;
  search: string;
  paymentMethod: PaymentMethod | "";
  status: SaleStatus | "";
}

// ----------------------------------------------------------------------
// Custom Hooks
// ----------------------------------------------------------------------

function useTransactions(initialFilters: TransactionFilters) {
  const [transactions, setTransactions] = useState<Sale[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Sale[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await saleAPI.getAll({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        paymentMethod: filters.paymentMethod || undefined,
        status: filters.status || undefined,
        search: filters.search || undefined,
        sortBy: "timestamp",
        sortOrder: "DESC",
      });
      if (response.status) {
        setTransactions(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load transactions");
      await dialogs.alert({ title: "Error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Apply filters locally (or rely on backend)
  useEffect(() => {
    setFilteredTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    loadTransactions();
  }, [
    filters.startDate,
    filters.endDate,
    filters.paymentMethod,
    filters.status,
    filters.search,
  ]);

  return {
    transactions: filteredTransactions,
    filters,
    setFilters,
    loading,
    error,
    reload: loadTransactions,
  };
}

function useTransactionDetails() {
  const [selectedTransaction, setSelectedTransaction] = useState<Sale | null>(
    null,
  );
  const [detailsOpen, setDetailsOpen] = useState(false);

  const openDetails = (transaction: Sale) => {
    setSelectedTransaction(transaction);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedTransaction(null);
  };

  return {
    selectedTransaction,
    detailsOpen,
    openDetails,
    closeDetails,
  };
}

// ----------------------------------------------------------------------
// Helper Components
// ----------------------------------------------------------------------

const StatusBadge: React.FC<{ status: SaleStatus }> = ({ status }) => {
  const config = {
    initiated: {
      bg: "bg-[var(--status-processing-bg)]",
      text: "text-[var(--status-processing)]",
      icon: Clock,
      label: "Initiated",
    },
    paid: {
      bg: "bg-[var(--status-completed-bg)]",
      text: "text-[var(--status-completed)]",
      icon: CheckCircle,
      label: "Paid",
    },
    refunded: {
      bg: "bg-[var(--status-refunded-bg)]",
      text: "text-[var(--status-refunded)]",
      icon: RotateCcw,
      label: "Refunded",
    },
    voided: {
      bg: "bg-[var(--status-cancelled-bg)]",
      text: "text-[var(--status-cancelled)]",
      icon: Ban,
      label: "Voided",
    },
  }[status];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

const PaymentMethodIcon: React.FC<{ method: PaymentMethod }> = ({ method }) => {
  switch (method) {
    case "cash":
      return <Banknote className="w-4 h-4 text-[var(--payment-cash)]" />;
    case "card":
      return <CreditCard className="w-4 h-4 text-[var(--payment-card)]" />;
    case "wallet":
      return <Wallet className="w-4 h-4 text-[var(--payment-digital)]" />;
    default:
      return null;
  }
};

const FilterBar: React.FC<{
  filters: TransactionFilters;
  onFilterChange: (key: keyof TransactionFilters, value: any) => void;
  onReload: () => void;
}> = ({ filters, onFilterChange, onReload }) => {
  const [dateRange, setDateRange] = useState<
    "today" | "week" | "month" | "custom"
  >("today");

  const handleDateRangeChange = (
    range: "today" | "week" | "month" | "custom",
  ) => {
    setDateRange(range);
    const now = new Date();
    let start = "";
    let end = format(now, "yyyy-MM-dd");
    if (range === "today") {
      start = format(now, "yyyy-MM-dd");
    } else if (range === "week") {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);
      start = format(weekStart, "yyyy-MM-dd");
    } else if (range === "month") {
      const monthStart = new Date(now);
      monthStart.setMonth(now.getMonth() - 1);
      start = format(monthStart, "yyyy-MM-dd");
    }
    onFilterChange("startDate", start);
    onFilterChange("endDate", end);
  };

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4 mb-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
          <select
            value={dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value as any)}
            className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Custom date inputs (shown only when custom) */}
        {dateRange === "custom" && (
          <>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange("startDate", e.target.value)}
              className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
            />
            <span className="text-[var(--text-tertiary)]">–</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange("endDate", e.target.value)}
              className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
            />
          </>
        )}

        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search by ID, customer, SKU..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg pl-10 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
          />
        </div>

        {/* Payment Method Filter */}
        <select
          value={filters.paymentMethod}
          onChange={(e) => onFilterChange("paymentMethod", e.target.value)}
          className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
        >
          <option value="">All Payments</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="wallet">Wallet</option>
        </select>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange("status", e.target.value)}
          className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)]"
        >
          <option value="">All Status</option>
          <option value="initiated">Initiated</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
          <option value="voided">Voided</option>
        </select>

        {/* Reload button */}
        <button
          onClick={onReload}
          className="p-2 bg-[var(--card-hover-bg)] rounded-lg hover:bg-[var(--border-color)] transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-[var(--text-secondary)]" />
        </button>
      </div>
    </div>
  );
};

const SummaryMetrics: React.FC<{ transactions: Sale[] }> = ({
  transactions,
}) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const todayTransactions = transactions.filter(
    (t) => t.timestamp.startsWith(today) && t.status === "paid",
  );
  const totalRevenue = todayTransactions.reduce(
    (sum, t) => sum.plus(t.totalAmount),
    new Decimal(0),
  );
  const avgValue =
    todayTransactions.length > 0
      ? totalRevenue.div(todayTransactions.length)
      : new Decimal(0);
  const refundCount = transactions.filter(
    (t) => t.status === "refunded" && t.timestamp.startsWith(today),
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <p className="text-sm text-[var(--text-tertiary)]">
          Today's Transactions
        </p>
        <p className="text-2xl font-bold text-[var(--text-primary)]">
          {todayTransactions.length}
        </p>
      </div>
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <p className="text-sm text-[var(--text-tertiary)]">Today's Revenue</p>
        <p className="text-2xl font-bold text-[var(--accent-green)]">
          ₱{totalRevenue.toFixed(2)}
        </p>
      </div>
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <p className="text-sm text-[var(--text-tertiary)]">Average Ticket</p>
        <p className="text-2xl font-bold text-[var(--accent-blue)]">
          ₱{avgValue.toFixed(2)}
        </p>
      </div>
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <p className="text-sm text-[var(--text-tertiary)]">Refunds Today</p>
        <p className="text-2xl font-bold text-[var(--accent-red)]">
          {refundCount}
        </p>
      </div>
    </div>
  );
};

const TransactionsTable: React.FC<{
  transactions: Sale[];
  onViewDetails: (transaction: Sale) => void;
  onPrint: (transaction: Sale) => void;
  onRefund: (transaction: Sale) => void;
}> = ({ transactions, onViewDetails, onPrint, onRefund }) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
        <p className="text-[var(--text-primary)] font-medium">
          No transactions found
        </p>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--table-header-bg)] border-b border-[var(--border-color)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Payment
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="hover:bg-[var(--table-row-hover)] transition-colors"
              >
                <td className="px-4 py-3 text-sm font-mono text-[var(--text-primary)]">
                  #{tx.id}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {format(new Date(tx.timestamp), "MMM dd, yyyy HH:mm")}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {tx.customer?.name || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <PaymentMethodIcon
                      method={tx.paymentMethod as PaymentMethod}
                    />
                    <span className="text-sm text-[var(--text-secondary)] capitalize">
                      {tx.paymentMethod}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={tx.status as SaleStatus} />
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-[var(--accent-green)]">
                  ₱{new Decimal(tx.totalAmount).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onViewDetails(tx)}
                      className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-blue)]"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onPrint(tx)}
                      className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-purple)]"
                      title="Print Receipt"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    {tx.status === "paid" && (
                      <button
                        onClick={() => onRefund(tx)}
                        className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-red)]"
                        title="Refund"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TransactionDetailsDrawer: React.FC<{
  transaction: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ transaction, isOpen, onClose }) => {
  if (!isOpen || !transaction) return null;

  const subtotal = transaction.saleItems.reduce(
    (sum, item) => sum.plus(new Decimal(item.unitPrice).times(item.quantity)),
    new Decimal(0),
  );
  const totalDiscount = transaction.saleItems.reduce(
    (sum, item) => sum.plus(new Decimal(item.discount || 0)),
    new Decimal(0),
  );
  const totalTax = transaction.saleItems.reduce(
    (sum, item) => sum.plus(new Decimal(item.tax || 0)),
    new Decimal(0),
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[var(--card-bg)] border-l border-[var(--border-color)] shadow-xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Transaction Details
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[var(--card-hover-bg)] rounded"
            >
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Basic Info */}
            <div className="bg-[var(--card-secondary-bg)] rounded-lg p-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-tertiary)]">
                  Transaction ID
                </span>
                <span className="text-sm font-mono text-[var(--text-primary)]">
                  #{transaction.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-tertiary)]">
                  Date & Time
                </span>
                <span className="text-sm text-[var(--text-primary)]">
                  {format(
                    new Date(transaction.timestamp),
                    "MMM dd, yyyy HH:mm:ss",
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-tertiary)]">
                  Cashier
                </span>
                <span className="text-sm text-[var(--text-primary)]">
                  System
                </span>{" "}
                {/* You might have user field */}
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-tertiary)]">
                  Customer
                </span>
                <span className="text-sm text-[var(--text-primary)]">
                  {transaction.customer ? transaction.customer.name : "Walk-in"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-tertiary)]">
                  Payment Method
                </span>
                <div className="flex items-center gap-1">
                  <PaymentMethodIcon
                    method={transaction.paymentMethod as PaymentMethod}
                  />
                  <span className="text-sm text-[var(--text-primary)] capitalize">
                    {transaction.paymentMethod}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-tertiary)]">
                  Status
                </span>
                <StatusBadge status={transaction.status as SaleStatus} />
              </div>
              {transaction.notes && (
                <div className="pt-2 border-t border-[var(--border-color)]">
                  <span className="text-sm text-[var(--text-tertiary)] block mb-1">
                    Notes
                  </span>
                  <p className="text-sm text-[var(--text-primary)] bg-[var(--input-bg)] p-2 rounded">
                    {transaction.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                Items
              </h3>
              <div className="bg-[var(--card-secondary-bg)] rounded-lg divide-y divide-[var(--border-color)]">
                {transaction.saleItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {item.quantity} x ₱
                        {new Decimal(item.unitPrice).toFixed(2)}
                        {item.discount > 0 && ` - ${item.discount}%`}
                        {item.tax > 0 && ` + ${item.tax}%`}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[var(--accent-green)]">
                      ₱{new Decimal(item.lineTotal).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-[var(--card-secondary-bg)] rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-tertiary)]">Subtotal</span>
                <span className="text-[var(--text-primary)]">
                  ₱{subtotal.toFixed(2)}
                </span>
              </div>
              {totalDiscount.gt(0) && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-tertiary)]">Discount</span>
                  <span className="text-[var(--accent-amber)]">
                    -₱{totalDiscount.toFixed(2)}
                  </span>
                </div>
              )}
              {totalTax.gt(0) && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-tertiary)]">Tax</span>
                  <span className="text-[var(--accent-blue)]">
                    +₱{totalTax.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-[var(--border-color)]">
                <span className="text-[var(--text-primary)]">Total</span>
                <span className="text-[var(--accent-green)]">
                  ₱{new Decimal(transaction.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Loyalty */}
            {transaction.customer && (
              <div className="bg-[var(--card-secondary-bg)] rounded-lg p-3">
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  Loyalty
                </h3>
                <p className="text-sm text-[var(--text-tertiary)]">
                  Points earned:{" "}
                  <span className="text-[var(--accent-purple)] font-medium">
                    +???
                  </span>
                </p>
                {/* You may not have loyalty points in sale; adjust if needed */}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[var(--border-color)] flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)]"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
            {transaction.status === "paid" && (
              <button
                onClick={() => {
                  onClose();
                  // Trigger refund flow
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent-red)] text-white rounded-lg hover:bg-[var(--accent-red-hover)]"
              >
                <RotateCcw className="w-4 h-4" />
                Refund
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Main Page Component
// ----------------------------------------------------------------------

const Transactions: React.FC = () => {
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

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handlePrint = async (transaction: Sale) => {
    // Implement print receipt logic (maybe call saleAPI.generateReceipt)
    await dialogs.alert({ title: "Print", message: "Printing receipt..." });
  };

  const handleRefund = (transaction: Sale) => {
    // Implement refund flow (maybe open refund modal)
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
    // Navigate to cashier page
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
        // Create download link
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
        <div className="flex-1 overflow-hidden">
          <TransactionsTable
            transactions={transactions}
            onViewDetails={openDetails}
            onPrint={handlePrint}
            onRefund={handleRefund}
          />
        </div>
      )}

      {/* Transaction Details Drawer */}
      <TransactionDetailsDrawer
        transaction={selectedTransaction}
        isOpen={detailsOpen}
        onClose={closeDetails}
      />
    </div>
  );
};

export default Transactions;
