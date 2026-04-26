// src/renderer/pages/Cashier/components/CashierHeader.tsx

import React from "react";
import {
  Search,
  Barcode,
  RefreshCw,
  XCircle,
  X,
  Printer,
  Lock,
  Wifi,
  WifiOff,
  ShoppingBag,
} from "lucide-react";
import Decimal from "decimal.js";
import CategorySelect from "../../../components/Selects/Category";
import { formatCurrency } from "../../../utils/formatters";
import {
  useBarcodeEnabled,
  useCashDrawerEnabled,
  useReceiptPrintingEnabled,
} from "../../../utils/posUtils";

interface CashierHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  scannedBarcode: string;
  onClearScannedBarcode: () => void;
  itemCount: number;
  total: Decimal;
  categoryId: number | null;
  onCategoryChange: (id: number | null) => void;
  loadingProducts: boolean;
  onRefresh: () => void;
  onClearFilters: () => void;
  showClearFilters: boolean;
  printerReady?: boolean;
  drawerOpen?: boolean;
  online?: boolean;
}

const CashierHeader: React.FC<CashierHeaderProps> = ({
  searchTerm,
  onSearchChange,
  searchInputRef,
  scannedBarcode,
  onClearScannedBarcode,
  itemCount,
  total,
  categoryId,
  onCategoryChange,
  loadingProducts,
  onRefresh,
  onClearFilters,
  showClearFilters,
  printerReady = true,
  drawerOpen = false,
  online = true,
}) => {
  const isBarcodeEnabled = useBarcodeEnabled();
  const cashDrawerEnabled = useCashDrawerEnabled();
  const receiptPrintingEnabled = useReceiptPrintingEnabled();

  return (
    <div className="flex-shrink-0 bg-[var(--header-bg)] border-b border-[var(--border-color)] px-3 py-2 space-y-2">
      {/* ROW 1: Search + Barcode (left) | Large Total (right) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left group: search + barcode */}
        <div className="flex flex-1 flex-wrap items-center gap-2 min-w-[240px]">
          <div className="flex-1 min-w-[140px]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-[var(--accent-blue)] w-4 h-4" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-[var(--card-bg)] border border-[var(--accent-blue)] rounded-lg pl-8 pr-3 py-2 text-sm text-[var(--accent-blue)] placeholder-[var(--text-tertiary)]"
              />
            </div>
          </div>

          {isBarcodeEnabled && (
            <div className="flex-1 min-w-[140px]">
              <div className="relative">
                <Barcode className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-[var(--accent-green)] w-4 h-4" />
                <input
                  type="text"
                  readOnly
                  value={scannedBarcode || "Scan barcode..."}
                  className="w-full bg-[var(--card-bg)] border border-[var(--accent-green)] rounded-lg pl-8 pr-7 py-2 text-sm font-mono text-[var(--accent-green)]"
                />
                {scannedBarcode && (
                  <button
                    onClick={onClearScannedBarcode}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-0.5 rounded hover:bg-[var(--card-hover-bg)] text-[var(--text-tertiary)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right group: Large Total + item count badge */}
        <div className="flex items-center gap-3 bg-[var(--card-bg)] border-2 border-[var(--accent-green)] rounded-lg px-4 py-2 shadow-md">
          <ShoppingBag className="w-5 h-5 text-[var(--accent-green)]" />
          <div className="text-right">
            <div className="text-xs text-[var(--text-tertiary)] whitespace-nowrap">
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[var(--accent-green)] whitespace-nowrap">
              {formatCurrency(total.toNumber())}
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: Category, Actions, Status, Hotkeys */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category dropdown */}
          <div className="w-60">
            <CategorySelect
              value={categoryId}
              onChange={onCategoryChange}
              placeholder="All categories"
              activeOnly
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onRefresh}
              disabled={loadingProducts}
              className="p-1.5 rounded-md bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
              title="Refresh products"
            >
              <RefreshCw className={`w-4 h-4 ${loadingProducts ? "animate-spin" : ""}`} />
            </button>
            {showClearFilters && (
              <button
                onClick={onClearFilters}
                className="p-1.5 rounded-md bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)]"
                title="Clear filters"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-2">
            {receiptPrintingEnabled && (
              <div
                className={`flex items-center gap-1 text-xs ${printerReady ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}`}
                title={printerReady ? "Printer ready" : "Printer error"}
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Printer</span>
              </div>
            )}
            {cashDrawerEnabled && (
              <div
                className={`flex items-center gap-1 text-xs ${drawerOpen ? "text-[var(--accent-amber)]" : "text-[var(--text-tertiary)]"}`}
                title={drawerOpen ? "Drawer open" : "Drawer closed"}
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Drawer</span>
              </div>
            )}
            <div
              className={`flex items-center gap-1 text-xs ${online ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}`}
              title={online ? "Online" : "Offline"}
            >
              {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Network</span>
            </div>
          </div>
        </div>

        {/* Hotkeys as compact badges */}
        <div className="flex flex-wrap gap-2 text-[11px] font-mono text-[var(--text-secondary)]">
          <kbd className="px-1.5 py-0.5 bg-[var(--card-bg)] rounded border border-[var(--border-color)]">Ctrl+D</kbd>
          <kbd className="px-1.5 py-0.5 bg-[var(--card-bg)] rounded border border-[var(--border-color)]">Ctrl+Enter</kbd>
          <kbd className="px-1.5 py-0.5 bg-[var(--card-bg)] rounded border border-[var(--border-color)]">Ctrl+Shift+N</kbd>
        </div>
      </div>
    </div>
  );
};

export default CashierHeader;