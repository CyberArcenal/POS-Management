import React from "react";
import {
  X,
  Printer,
  RotateCcw,
  Ticket, // optional icon for voucher
} from "lucide-react";
import Decimal from "decimal.js";
import { format } from "date-fns";
import type { Sale } from "../../../api/sale";
import type { PaymentMethod, SaleStatus } from "../hooks/useTransactions";
import { StatusBadge, PaymentMethodIcon } from "./TransactionsTable";
import { useSettings } from "../../../contexts/SettingsContext";
import { useIsRefundable } from "../../../utils/posUtils";

interface TransactionDetailsDrawerProps {
  transaction: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  onPrint?: (transaction: Sale) => void;
  onRefund?: (transaction: Sale) => void;
}

export const TransactionDetailsDrawer: React.FC<
  TransactionDetailsDrawerProps
> = ({ transaction, isOpen, onClose, onPrint, onRefund }) => {
  if (!isOpen || !transaction) return null;

  const subtotal = transaction.saleItems.reduce(
    (sum, item) => sum.plus(new Decimal(item.unitPrice).times(item.quantity)),
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
                </span>
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
                        {item.discount > 0 && ` - ₱${item.discount}`}
                        {item.tax > 0 && ` + ₱${item.tax}`}
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
              {transaction.totalDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-tertiary)]">Discount</span>
                  <span className="text-[var(--accent-amber)]">
                    -₱{new Decimal(transaction.totalDiscount).toFixed(2)}
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

            {/* Loyalty & Voucher */}
            {transaction.customer && (
              <div className="bg-[var(--card-secondary-bg)] rounded-lg p-3">
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  Loyalty
                </h3>
                <p className="text-sm text-[var(--text-tertiary)]">
                  Points earned:{" "}
                  <span className="text-[var(--accent-purple)] font-medium">
                    +{transaction.pointsEarn}
                  </span>
                </p>
                {transaction.usedLoyalty && transaction.loyaltyRedeemed > 0 && (
                  <p className="text-sm text-[var(--text-tertiary)]">
                    Points redeemed:{" "}
                    <span className="text-[var(--accent-amber)] font-medium">
                      -{transaction.loyaltyRedeemed}
                    </span>
                  </p>
                )}
              </div>
            )}

            {transaction.usedVoucher && transaction.voucherCode && (
              <div className="bg-[var(--card-secondary-bg)] rounded-lg p-3 flex items-start gap-2">
                <Ticket className="w-5 h-5 text-[var(--accent-purple)] mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">
                    Voucher Applied
                  </h3>
                  <p className="text-sm font-mono text-[var(--accent-purple)]">
                    {transaction.voucherCode}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[var(--border-color)] flex gap-2">
            <button
              onClick={() => onPrint?.(transaction)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)]"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
            {transaction.status === "paid" && (
              <button
                onClick={() => onRefund?.(transaction)}
                disabled={!useIsRefundable(transaction)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg 
      ${
        useIsRefundable(transaction)
          ? "bg-[var(--accent-red)] text-white hover:bg-[var(--accent-red-hover)]"
          : "bg-gray-500 text-gray-300 cursor-not-allowed"
      }`}
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
