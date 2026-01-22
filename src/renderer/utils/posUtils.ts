// src/utils/posUtils.ts
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const calculateChange = (total: number, tendered: number): number => {
  return Math.max(0, tendered - total);
};

export const generateReceiptNumber = (saleId: number): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `RCPT-${year}${month}${day}-${saleId.toString().padStart(6, '0')}`;
};

export const validateBarcode = (barcode: string): boolean => {
  // EAN-13 validation
  if (barcode.length !== 13) return false;
  
  const digits = barcode.split('').map(Number);
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
  quantity: number
): number | null => {
  if (!costPrice || costPrice <= 0) return null;
  return (sellingPrice - costPrice) * quantity;
};

export const getStockStatus = (current: number, min: number): string => {
  if (current === 0) return 'out_of_stock';
  if (current <= min) return 'low_stock';
  return 'in_stock';
};