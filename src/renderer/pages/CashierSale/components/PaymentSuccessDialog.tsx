import React, { useState } from "react";
import { CheckCircle, X, Printer } from "lucide-react";
import Decimal from "decimal.js";
import type { CartItem } from "../types";
import { formatCurrency } from "../../../utils/formatters";
import { useReceiptPrintingEnabled } from "../../../utils/posUtils"; // ✅
import { hideLoading, showLoading } from "../../../utils/notification";
import { dialogs } from "../../../utils/dialogs";

interface PaymentSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: number;
  total: Decimal;
  paidAmount?: number;
  change?: Decimal;
  paymentMethod: string;
  items: CartItem[];
}

const PaymentSuccessDialog: React.FC<PaymentSuccessDialogProps> = ({
  isOpen,
  onClose,
  saleId,
  total,
  paidAmount,
  change,
  paymentMethod,
  items,
}) => {
  const receiptPrintingEnabled = useReceiptPrintingEnabled(); // ✅
  const [isLoading, setIsloading] = useState(false);

  if (!isOpen) return null;

  const isCash = paymentMethod === "cash";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-2xl bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-[var(--accent-green-light)]">
              <CheckCircle className="w-8 h-8 text-[var(--accent-green)]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              Payment Successful!
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--card-hover-bg)] text-[var(--text-tertiary)]"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body – large numbers */}
        <div className="p-8 space-y-8">
          <div className="text-center">
            <div className="text-sm text-[var(--text-tertiary)] mb-1">
              Sale #
            </div>
            <div className="text-4xl font-mono font-bold text-[var(--accent-blue)]">
              {saleId.toString().padStart(6, "0")}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-sm text-[var(--text-tertiary)]">Total</div>
              <div className="text-5xl font-bold text-[var(--text-primary)]">
                {formatCurrency(total.toFixed(2))}
              </div>
            </div>

            {isCash && (
              <>
                <div className="text-center">
                  <div className="text-sm text-[var(--text-tertiary)]">
                    Amount Paid
                  </div>
                  <div className="text-5xl font-bold text-[var(--accent-green)]">
                    {formatCurrency((paidAmount || 0).toFixed(2))}
                  </div>
                </div>

                <div className="text-center col-span-2">
                  <div className="text-sm text-[var(--text-tertiary)]">
                    Change
                  </div>
                  <div className="text-7xl font-bold text-[var(--accent-amber)]">
                    {formatCurrency(change?.toFixed(2) || "0.00")}
                  </div>
                </div>
              </>
            )}

            {!isCash && (
              <div className="text-center col-span-2">
                <div className="text-sm text-[var(--text-tertiary)]">
                  Payment Method
                </div>
                <div className="text-4xl font-bold text-[var(--accent-purple)] capitalize">
                  {paymentMethod}
                </div>
              </div>
            )}
          </div>

          {/* Item list */}
          <div className="bg-[var(--card-secondary-bg)] rounded-lg p-4 max-h-48 overflow-y-auto notes-scrollbar">
            <p className="text-sm font-medium text-[var(--text-tertiary)] mb-2">
              Items
            </p>
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm py-1">
                <span className="text-[var(--text-secondary)]">
                  {item.name} x{item.cartQuantity}
                </span>
                <span className="text-[var(--text-primary)] font-mono">
                  {formatCurrency(
                    new Decimal(item.price).times(item.cartQuantity).toFixed(2),
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-[var(--border-color)]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)] hover:text-[var(--text-primary)] transition-colors"
          >
            Close
          </button>
          {receiptPrintingEnabled && ( // ✅ kondisyonal na print button
            <button
              onClick={async () => {
                // TODO: print receipt functionality
                onClose();
                try {
                  setIsloading(true);
                  showLoading("Printing Receipt..");
                  await window.backendAPI.printerPrint(saleId);
                } catch (err) {
                  hideLoading();
                  setIsloading(false);
                  await dialogs.error("Printer Unavailable.", "Print Failed.");
                } finally {
                  setIsloading(false);
                  hideLoading();
                }
              }}
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-lg bg-[var(--accent-blue)] text-white font-semibold hover:bg-[var(--accent-blue-hover)] transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              {isLoading ? `Printing...` : `Print Receipt`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessDialog;
