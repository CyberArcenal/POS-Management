import type { Sale } from "../api/sale";
import { useSettings } from "../contexts/SettingsContext";

// ============================================================================
// Pure utility functions (no React dependencies)
// ============================================================================

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
};

export const calculateChange = (total: number, tendered: number): number => {
  return Math.max(0, tendered - total);
};

export const generateReceiptNumber = (saleId: number): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `RCPT-${year}${month}${day}-${saleId.toString().padStart(6, "0")}`;
};

export const validateBarcode = (barcode: string): boolean => {
  // EAN-13 validation
  if (barcode.length !== 13) return false;

  const digits = barcode.split("").map(Number);
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[12];
};

export const calculateProfit = (
  costPrice: number | null,
  sellingPrice: number,
  quantity: number,
): number | null => {
  if (!costPrice || costPrice <= 0) return null;
  return (sellingPrice - costPrice) * quantity;
};

export const getStockStatus = (current: number, min: number): string => {
  if (current === 0) return "out_of_stock";
  if (current <= min) return "low_stock";
  return "in_stock";
};

// ============================================================================
// Custom hooks for settings (to be used inside React components)
// ============================================================================

/**
 * Hook to check if barcode scanning is enabled in cashier settings.
 * Defaults to true if not set.
 */
export const useBarcodeEnabled = (): boolean => {
  const { getSetting } = useSettings();
  return getSetting<boolean>("cashier", "enable_barcode_scanning", true);
};

/**
 * Hook to check if discounts are enabled in sales settings.
 * Defaults to true if not set.
 */
export const useDiscountEnabled = (): boolean => {
  const { getSetting } = useSettings();
  return getSetting<boolean>("sales", "discount_enabled", true);
};

/**
 * Hook to get the maximum discount percentage allowed.
 * Defaults to 100 if not set.
 */
export const useMaxDiscountPercent = (): number => {
  const { getSetting } = useSettings();
  return getSetting<number>("sales", "max_discount_percent", 100);
};

/**
 * Hook to check if refunds are allowed.
 * Defaults to true if not set.
 */
export const useRefundAllowed = (): boolean => {
  const { getSetting } = useSettings();
  return getSetting<boolean>("sales", "allow_refunds", true);
};

/**
 * Hook to get the refund window in days.
 * Defaults to 7 if not set.
 */
export const useRefundWindowDays = (): number => {
  const { getSetting } = useSettings();
  return getSetting<number>("sales", "refund_window_days", 7);
};

/**
 * Hook to check if loyalty points are enabled.
 * Defaults to false if not set.
 */
export const useLoyaltyPointsEnabled = (): boolean => {
  const { getSetting } = useSettings();
  return getSetting<boolean>("sales", "loyalty_points_enabled", false);
};

/**
 * Hook to get the loyalty points rate (points per currency unit).
 * Defaults to 0 if not set.
 */
export const useLoyaltyPointsRate = (): number => {
  const { getSetting } = useSettings();
  return getSetting<number>("sales", "loyalty_points_rate", 0);
};

/**
 * Hook to check if auto‑reorder is enabled in inventory settings.
 * Defaults to false if not set.
 */
export const useAutoReorderEnabled = (): boolean => {
  const { getSetting } = useSettings();
  return getSetting<boolean>("inventory", "auto_reorder_enabled", false);
};

/**
 * Hook to get the stock alert threshold.
 * Defaults to 10 if not set.
 */
export const useStockAlertThreshold = (): number => {
  const { getSetting } = useSettings();
  return getSetting<number>("inventory", "stock_alert_threshold", 10);
};

/**
 * Hook to check if negative stock is allowed.
 * Defaults to false if not set.
 */
export const useAllowNegativeStock = (): boolean => {
  const { getSetting } = useSettings();
  return getSetting<boolean>("inventory", "allow_negative_stock", false);
};

/**
 * Hook to check if the cash drawer is enabled.
 * Defaults to true if not set.
 */
export const useCashDrawerEnabled = (): boolean => {
  const { getSetting } = useSettings();
  return getSetting<boolean>("cashier", "enable_cash_drawer", true);
};

/**
 * Hook to check if receipt printing is enabled.
 * Defaults to true if not set.
 */
export const useReceiptPrintingEnabled = (): boolean => {
  const { getSetting } = useSettings();
  return getSetting<boolean>("cashier", "enable_receipt_printing", true);
};

/**
 * Hook to get the receipt printer type.
 * Defaults to "thermal" if not set.
 */
export const useReceiptPrinterType = (): string => {
  const { getSetting } = useSettings();
  return getSetting<string>("cashier", "receipt_printer_type", "thermal");
};

/**
 * Hook to check if touchscreen mode is enabled.
 * Defaults to false if not set.
 */
export const useTouchscreenMode = (): boolean => {
  const { getSetting } = useSettings();
  return getSetting<boolean>("cashier", "enable_touchscreen_mode", false);
};

/**
 * Hook to check if quick sale is enabled.
 * Defaults to false if not set.
 */
export const useQuickSaleEnabled = (): boolean => {
  const { getSetting } = useSettings();
  return getSetting<boolean>("cashier", "quick_sale_enabled", false);
};

/**
 * Hook to check if a given sale is still refundable based on the refund window setting.
 * @param tx The sale transaction object (must contain a `createdAt` field).
 */
export const useIsRefundable = (tx: Sale): boolean => {
  const refundWindowDays = useRefundWindowDays();
  const created = new Date(tx.createdAt).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  return diffDays <= refundWindowDays; // true if still within window
};
