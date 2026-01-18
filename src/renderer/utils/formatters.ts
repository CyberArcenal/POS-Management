// src/js/utils/format.ts

import { systemCache } from "./cacheUtils";


export type DateFormatOptions = string | Intl.DateTimeFormatOptions;

/**
 * Format date strings or Date objects to human-readable patterns.
 *
 * @param dateInput - ISO date string or Date object
 * @param format - pattern using yyyy, MM, dd, HH, mm, ss tokens
 * @returns formatted date string or empty string on invalid input
 */
export function formatDate(
  dateInput: string | Date | null | undefined,
  formatOrOptions: DateFormatOptions = "yyyy-MM-dd HH:mm"
): string {
  if (!dateInput) return "";
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  // Kapag string-based token format
  if (typeof formatOrOptions === "string") {
    return tokenFormat(date, formatOrOptions);
  }

  // Kapag Intl.DateTimeFormatOptions
  try {
    return new Intl.DateTimeFormat("en-PH", formatOrOptions).format(date);
  } catch {
    return date.toISOString();
  }
}

function tokenFormat(d: Date, fmt: string): string {
  const rep: Record<string, string> = {
    yyyy: String(d.getFullYear()),
    MM: String(d.getMonth() + 1).padStart(2, "0"),
    dd: String(d.getDate()).padStart(2, "0"),
    HH: String(d.getHours()).padStart(2, "0"),
    mm: String(d.getMinutes()).padStart(2, "0"),
    ss: String(d.getSeconds()).padStart(2, "0"),
  };
  return fmt.replace(/yyyy|MM|dd|HH|mm|ss/g, (m) => rep[m]);
}

/**
 * Format a number or string as currency (supports multiple currencies).
 * Now uses cached currency by default.
 *
 * @param amount - number, string, or null/undefined
 * @param currency - ISO currency code (optional, will use cached currency if not provided)
 * @param locale - optional locale (default: 'en-PH')
 * @returns Formatted currency string (e.g. ₱1,234.56 or $1,234.56)
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency?: string,
  locale: string = "en-PH"
): string {
  if (amount == null) {
    const defaultCurrency = currency || systemCache.getCurrency();
    return getCurrencySymbol(defaultCurrency) + "0.00";
  }

  const numeric =
    typeof amount === "string"
      ? parseFloat(amount.replace(/[^\d.]/g, ""))
      : Number(amount);

  if (!isFinite(numeric)) {
    const defaultCurrency = currency || systemCache.getCurrency();
    return getCurrencySymbol(defaultCurrency) + "0.00";
  }

  // Use provided currency or get from cache
  const currencyToUse = currency || systemCache.getCurrency();

  try {
    return numeric.toLocaleString(locale, {
      style: "currency",
      currency: currencyToUse,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    // Fallback to manual formatting
    const symbol = getCurrencySymbol(currencyToUse);
    return `${symbol}${numeric.toFixed(2)}`;
  }
}

/**
 * Get currency symbol for display
 */
function getCurrencySymbol(currency: string): string {
  const symbolMap: Record<string, string> = {
    PHP: "₱",
    USD: "$",
    EUR: "€",
    JPY: "¥",
    GBP: "£",
    AUD: "A$",
    CAD: "C$",
    CHF: "CHF",
    CNY: "¥",
    HKD: "HK$",
    SGD: "S$",
    KRW: "₩",
    INR: "₹",
    BRL: "R$",
    RUB: "₽",
    TRY: "₺",
  };
  return symbolMap[currency] || currency;
}

/**
 * Format a number in compact notation (e.g., 1.5K, 2.3M).
 *
 * @param value - numeric value
 * @returns compact-formatted string
 */
export function formatCompactNumber(value: number | null | undefined): string {
  if (typeof value !== "number") return "0";
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Format a Date object to YYYY-MM-DD for API requests.
 *
 * @param date - Date object
 * @returns formatted date string or empty if invalid
 */
export function formatDateForAPI(date: Date | null | undefined): string {
  if (!(date instanceof Date)) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Format date/time for display using Intl.DateTimeFormat.
 *
 * @param input - ISO date string or Date object
 * @param includeTime - whether to include time (default true)
 * @returns localized date/time string or error placeholder
 */
export function formatDateTime(
  input: string | Date | null | undefined,
  includeTime: boolean = true
): string {
  if (!input) return "N/A";
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return "Invalid Date";

  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  if (includeTime) {
    Object.assign(opts, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  try {
    return new Intl.DateTimeFormat("en-PH", opts).format(date);
  } catch {
    return "Format Error";
  }
}

/**
 * Options for formatRelativeTime
 */
export interface RelativeTimeOptions {
  locale?: string;
  style?: "long" | "short" | "narrow";
  numeric?: "always" | "auto";
}

/**
 * Format a date/string as a relative time (e.g., "5 minutes ago").
 *
 * @param input - Date object or ISO string
 * @param options - locale, style, numeric options
 * @returns formatted relative time string
 */
export function formatRelativeTime(
  input: Date | string | null | undefined,
  options: RelativeTimeOptions = {}
): string {
  if (!input) return "N/A";
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return "Invalid Date";

  const { locale = "en-PH", style = "long", numeric = "auto" } = options;
  const now = new Date();
  const diffSec = Math.round((now.getTime() - date.getTime()) / 1000);
  const absSec = Math.abs(diffSec);

  const MIN = 60;
  const HOUR = MIN * 60;
  const DAY = HOUR * 24;
  const WEEK = DAY * 7;
  const MONTH = DAY * 30;
  const YEAR = DAY * 365;

  let unit: Intl.RelativeTimeFormatUnit;
  let value: number;

  if (absSec < MIN) {
    unit = "second";
    value = diffSec;
  } else if (absSec < HOUR) {
    unit = "minute";
    value = Math.round(diffSec / MIN);
  } else if (absSec < DAY) {
    unit = "hour";
    value = Math.round(diffSec / HOUR);
  } else if (absSec < WEEK) {
    unit = "day";
    value = Math.round(diffSec / DAY);
  } else if (absSec < MONTH) {
    unit = "week";
    value = Math.round(diffSec / WEEK);
  } else if (absSec < YEAR) {
    unit = "month";
    value = Math.round(diffSec / MONTH);
  } else {
    unit = "year";
    value = Math.round(diffSec / YEAR);
  }

  if (typeof Intl?.RelativeTimeFormat === "function") {
    try {
      const rtf = new Intl.RelativeTimeFormat(locale, { style, numeric });
      return rtf.format(value, unit);
    } catch {
      // fall through to manual fallback
    }
  }

  // Manual fallback
  const labels: Record<string, [string, string]> = {
    second: ["second", "seconds"],
    minute: ["minute", "minutes"],
    hour: ["hour", "hours"],
    day: ["day", "days"],
    week: ["week", "weeks"],
    month: ["month", "months"],
    year: ["year", "years"],
  };
  const [singular, plural] = labels[unit];
  const label = Math.abs(value) === 1 ? singular : plural;
  const suffix = value > 0 ? "ago" : "from now";
  return `${Math.abs(value)} ${label} ${suffix}`;
}

/**
 * Utility function to get current currency from cache
 */
export function getCurrentCurrency(): string {
  return systemCache.getCurrency();
}

/**
 * Utility function to get current currency symbol from cache
 */
export function getCurrentCurrencySymbol(): string {
  const currency = systemCache.getCurrency();
  return getCurrencySymbol(currency);
}
