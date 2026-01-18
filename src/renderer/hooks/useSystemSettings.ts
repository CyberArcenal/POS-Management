// src/hooks/useSystemSettings.ts

import { useSystemSettings } from "../contexts/SystemInfoContext";
import { systemCache } from "../utils/cacheUtils";


// Custom hook for sidebar usage
export const useSidebarSettings = () => {
  const { siteName, logo, currency, publicSettings } = useSystemSettings();

  return {
    siteName,
    logo,
    currency,
    displayName: publicSettings?.system?.site_name || siteName,
    displayCurrency: publicSettings?.system?.currency || currency,
  };
};

// Custom hook for tax-related components
export const useTaxSettings = () => {
  const { taxEnabled, taxRate } = useSystemSettings();

  return {
    taxEnabled,
    taxRate,
    formattedTaxRate: `${taxRate}%`,
    shouldShowTax: taxEnabled && taxRate > 0,
  };
};

// Custom hook for shipping-related components
export const useShippingSettings = () => {
  const { shippingThreshold } = useSystemSettings();

  return {
    shippingThresholdEnabled: shippingThreshold,
    thresholdAmount: 1000, // You can get this from settings if available
    freeShippingEligible: shippingThreshold,
  };
};

// New hook for currency formatting using cache
export const useCachedCurrency = () => {
  const getCurrency = () => systemCache.getCurrency();

  return {
    getCurrency,
    currency: getCurrency(),
    symbol: getCurrencySymbol(getCurrency()),
  };
};

// Helper function for currency symbols
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
  };
  return symbolMap[currency] || currency;
}
