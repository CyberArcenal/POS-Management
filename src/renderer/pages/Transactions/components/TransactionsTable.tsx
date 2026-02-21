import React from "react";
import {
  Eye,
  Printer,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Clock,
  Ban,
  Wallet,
  CreditCard,
  Banknote,
} from "lucide-react";
import Decimal from "decimal.js";
import { format } from "date-fns";
import type { Sale } from "../../../api/sale";
import type { PaymentMethod, SaleStatus } from "../hooks/useTransactions";
import { useSettings } from "../../../contexts/SettingsContext";
import { useIsRefundable } from "../../../utils/posUtils";

// Helper components (StatusBadge, PaymentMethodIcon) – can be moved to separate files if desired
export const StatusBadge: React.FC<{ status: SaleStatus }> = ({ status }) => {
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

export const PaymentMethodIcon: React.FC<{ method: PaymentMethod }> = ({
  method,
}) => {
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

interface TransactionsTableProps {
  transactions: Sale[];
  onViewDetails: (transaction: Sale) => void;
  onPrint: (transaction: Sale) => void;
  onRefund: (transaction: Sale) => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  onViewDetails,
  onPrint,
  onRefund,
}) => {
  const { settings, getSetting, updateSetting } = useSettings();
  const refundWindowDays = getSetting("sales", "refund_window_days", 7);
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
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(tx);
                }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(tx);
                      }}
                      className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-blue)] hidden"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPrint(tx);
                      }}
                      className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-purple)]"
                      title="Print Receipt"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    {tx.status === "paid" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRefund(tx);
                        }}
                        disabled={!useIsRefundable(tx)}
                        className={`p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-red)] ${
                          !useIsRefundable(tx) ? "hidden" : ""
                        }`}
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
