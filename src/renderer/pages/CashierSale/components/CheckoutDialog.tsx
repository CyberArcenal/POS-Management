import React, { useState, useEffect, useRef } from "react";
import { X, ShoppingBag, CreditCard, Wallet, Loader2 } from "lucide-react";
import Decimal from "decimal.js";
import type { CartItem } from "../types";
import { formatCurrency } from "../../../utils/formatters";

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paidAmount?: number) => void;
  total: Decimal;
  cartItems?: CartItem[];
  paymentMethod?: string;
  isProcessing?: boolean;
}

const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  total,
  cartItems = [],
  paymentMethod = "cash",
  isProcessing = false,
}) => {
  const [paidAmount, setPaidAmount] = useState<number | null>(total.toNumber());
  const [isConfirmEnabled, setIsConfirmEnabled] = useState(false); // for 2‑second delay
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset and auto-focus when dialog opens
  useEffect(() => {
    if (isOpen) {
      setPaidAmount(total.toNumber());
      setIsConfirmEnabled(false); // disable confirm on open
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
      // 2‑second delay before enabling confirm
      const timer = setTimeout(() => setIsConfirmEnabled(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, total]);

  if (!isOpen) return null;

  const paymentMethodLabel =
    {
      cash: "Cash",
      card: "Card",
      wallet: "E-Wallet",
    }[paymentMethod] || paymentMethod;

  const itemCount = cartItems.reduce((acc, item) => acc + item.cartQuantity, 0);

  const isCash = paymentMethod === "cash";
  const numericPaid = paidAmount ?? 0;
  const isValid = !isCash || numericPaid >= total.toNumber();

  const handleConfirm = () => {
    if (isCash) {
      onConfirm(numericPaid);
    } else {
      onConfirm();
    }
  };

  const handlePaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setPaidAmount(null);
    } else {
      const num = parseFloat(value);
      setPaidAmount(isNaN(num) ? null : num);
    }
  };

  const clearPaid = () => {
    setPaidAmount(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-2xl windows-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--accent-blue-light)]">
              <ShoppingBag className="w-6 h-6 text-[var(--accent-blue)]" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Complete Sale
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--card-hover-bg)] text-[var(--text-tertiary)] transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Total Amount - Larger like success dialog */}
          <div className="text-center">
            <div className="text-sm uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
              Total Amount
            </div>
            <div className="text-5xl font-bold text-[var(--text-primary)]">
              {formatCurrency(total.toFixed(2))}
            </div>
            <div className="text-sm text-[var(--text-secondary)] mt-1">
              {itemCount} item(s) • {paymentMethodLabel}
            </div>
          </div>

          {/* Payment method icon */}
          <div className="flex justify-center">
            {paymentMethod === "cash" && (
              <div className="p-3 rounded-full bg-[var(--payment-cash)]/20">
                <Wallet className="w-8 h-8 text-[var(--payment-cash)]" />
              </div>
            )}
            {paymentMethod === "card" && (
              <div className="p-3 rounded-full bg-[var(--payment-card)]/20">
                <CreditCard className="w-8 h-8 text-[var(--payment-card)]" />
              </div>
            )}
            {paymentMethod === "wallet" && (
              <div className="p-3 rounded-full bg-[var(--payment-digital)]/20">
                <Wallet className="w-8 h-8 text-[var(--payment-digital)]" />
              </div>
            )}
          </div>

          {/* Amount Paid (only for cash) */}
          {isCash && (
            <div className="space-y-2">
              <label className="block text-sm text-[var(--text-tertiary)]">
                Amount Paid
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="number"
                  min={total.toNumber()}
                  step="0.01"
                  value={paidAmount === null ? "" : paidAmount}
                  onChange={handlePaidChange}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-4 py-3 text-3xl font-bold text-[var(--text-primary)] pr-12"
                  placeholder="Enter amount"
                />
                {paidAmount !== null && (
                  <button
                    onClick={clearPaid}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--accent-red)] p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              {!isValid && (
                <p className="text-xs text-[var(--accent-red)]">
                  Amount must be at least {formatCurrency(total.toFixed(2))}
                </p>
              )}
            </div>
          )}

          {/* Optional: quick summary of cart items */}
          {cartItems.length > 0 && (
            <div className="bg-[var(--card-secondary-bg)] rounded-lg p-4 max-h-40 overflow-y-auto notes-scrollbar">
              <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase mb-2">
                Items
              </p>
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm py-1"
                >
                  <span className="text-[var(--text-secondary)]">
                    {item.name} x{item.cartQuantity}
                  </span>
                  <span className="text-[var(--text-primary)] font-mono">
                    {formatCurrency(
                      new Decimal(item.price).times(item.cartQuantity).toFixed(2)
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Actions */}
        <div className="flex gap-3 p-6 border-t border-[var(--border-color)] bg-[var(--card-secondary-bg)]/50">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-3 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing || !isValid || !isConfirmEnabled}
            className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-[var(--accent-green)] to-[var(--accent-green-hover)] text-white font-semibold hover:from-[var(--accent-green-hover)] hover:to-[var(--accent-green-dark)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : !isConfirmEnabled ? (
              "Please wait 2s..."
            ) : (
              "Confirm Payment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutDialog;