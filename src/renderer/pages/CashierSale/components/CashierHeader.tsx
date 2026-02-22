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
} from "lucide-react";
import Decimal from "decimal.js";
import CategorySelect from "../../../components/Selects/Category"; // adjust path as needed
import { formatCurrency } from "../../../utils/formatters";
import {
  useBarcodeEnabled,
  useCashDrawerEnabled,
  useReceiptPrintingEnabled,
} from "../../../utils/posUtils";

interface CashierHeaderProps {
  // Search
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;

  // Barcode display
  scannedBarcode: string;
  onClearScannedBarcode: () => void;

  // Transaction summary
  itemCount: number;
  total: Decimal;

  // Category filter
  categoryId: number | null;
  onCategoryChange: (id: number | null) => void;

  // Action buttons
  barcodeMode?: boolean;
  onToggleBarcodeMode?: (isOpen: boolean) => void;
  loadingProducts: boolean;
  onRefresh: () => void;
  onClearFilters: () => void;
  showClearFilters: boolean;

  // Status indicators (mock for now, replace with real props later)
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
  const cashDrawerEnabled = useCashDrawerEnabled(); // ✅
  const receiptPrintingEnabled = useReceiptPrintingEnabled(); // ✅

  return (
    <div className="flex-shrink-0 bg-[var(--header-bg)] border-b border-[var(--border-color)] p-3">
      {/* Main header row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Search + barcode */}
        <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
          {/* Search input */}
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-2.5 top-1/2 transform -translate-y-1/2 
                             text-[var(--accent-blue)] w-4 h-4"
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[var(--card-bg)] border-2 border-[var(--accent-blue)] 
                       rounded-lg pl-8 pr-3 py-1.5 text-sm text-[var(--accent-blue)] 
                       placeholder-[var(--text-tertiary)] shadow-md text-center"
            />
          </div>

          {/* Barcode display */}
          {scannedBarcode && isBarcodeEnabled ? (
            <div className="relative w-full md:w-64">
              <Barcode
                className="absolute left-2.5 top-1/2 transform -translate-y-1/2 
                                text-[var(--accent-green)] w-4 h-4"
              />
              <input
                type="text"
                readOnly
                value={scannedBarcode}
                className="w-full bg-[var(--card-bg)] border-2 border-[var(--accent-green)] 
                         rounded-lg pl-8 pr-3 py-1.5 text-sm font-mono 
                         text-[var(--accent-green)] shadow-md text-center"
              />
              <button
                onClick={onClearScannedBarcode}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 
                         p-1 rounded-full hover:bg-[var(--card-hover-bg)] 
                         text-[var(--text-tertiary)]"
                title="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className={`relative w-full md:w-64 ${isBarcodeEnabled ? '' : 'hidden'}`}>
              <Barcode
                className="absolute left-2.5 top-1/2 transform -translate-y-1/2 
                                text-[var(--text-tertiary)] w-4 h-4"
              />
              <input
                type="text"
                readOnly
                value="..."
                className="w-full bg-[var(--card-bg)] border border-[var(--border-color)] 
                         rounded-lg pl-8 pr-3 py-1.5 text-sm font-mono 
                         text-[var(--text-tertiary)] shadow-sm text-center"
              />
            </div>
          )}
        </div>

        {/* Center: Transaction summary */}

        {/* Right: Category + actions + status */}
        <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto md:justify-end">
          {/* Category filter */}
          <div className="w-full md:w-48">
            <CategorySelect
              value={categoryId}
              onChange={onCategoryChange}
              placeholder="Filter by category"
              activeOnly
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onRefresh}
              disabled={loadingProducts}
              className="p-1.5 rounded-lg bg-[var(--card-bg)] text-[var(--text-secondary)] 
                       hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50"
              title="Refresh products"
            >
              <RefreshCw
                className={`w-4 h-4 ${loadingProducts ? "animate-spin" : ""}`}
              />
            </button>
            {showClearFilters && (
              <button
                onClick={onClearFilters}
                className="p-1.5 rounded-lg bg-[var(--card-bg)] text-[var(--text-secondary)] 
                         hover:bg-[var(--card-hover-bg)] transition-colors"
                title="Clear filters"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status indicators — conditional batay sa settings */}
          <div className="flex items-center gap-3 pl-2 border-l border-[var(--border-color)]">
            {receiptPrintingEnabled && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  printerReady
                    ? "text-[var(--accent-green)]"
                    : "text-[var(--accent-red)]"
                }`}
                title={printerReady ? "Printer ready" : "Printer error"}
              >
                <Printer className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">Printer</span>
              </div>
            )}
            {cashDrawerEnabled && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  drawerOpen
                    ? "text-[var(--accent-amber)]"
                    : "text-[var(--text-tertiary)]"
                }`}
                title={drawerOpen ? "Cash drawer open" : "Cash drawer closed"}
              >
                <Lock className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">Drawer</span>
              </div>
            )}
            <div
              className={`flex items-center gap-1 text-sm ${
                online
                  ? "text-[var(--accent-green)]"
                  : "text-[var(--accent-red)]"
              }`}
              title={online ? "Online" : "Offline"}
            >
              {online ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span className="text-xs hidden sm:inline">Network</span>
            </div>
          </div>

          <div
            className="text-3xl md:text-4xl font-extrabold px-4 py-2 rounded-lg shadow-md 
                      border-2 border-[var(--accent-green)] bg-[var(--card-bg)] 
                      text-center w-full md:w-auto text-[var(--text-tertiary)]"
          >
            Total:{" "}
            <span className="text-[var(--accent-green)]">
              {new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: "PHP",
              }).format(total.toNumber())}
            </span>
          </div>
        </div>
      </div>

      {/* Hotkeys legend strip */}
      <div className="flex-shrink-0 mt-2">
        <div className="flex flex-wrap gap-4 text-xs font-mono text-[var(--text-secondary)]">
          <span>
            <kbd className="px-1 py-0.5 bg-[var(--card-bg)] rounded border border-[var(--border-color)]">
              Ctrl+D
            </kbd>{" "}
            = Discount
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-[var(--card-bg)] rounded border border-[var(--border-color)]">
              Ctrl+Enter
            </kbd>{" "}
            = Checkout
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-[var(--card-bg)] rounded border border-[var(--border-color)]">
              Ctrl+X+N
            </kbd>{" "}
            = Multiply qty
          </span>
        </div>
      </div>
    </div>
  );
};

export default CashierHeader;