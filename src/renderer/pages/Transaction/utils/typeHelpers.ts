// src/features/transactions/utils/typeHelpers.ts

// Helper para i-convert ang Sale API types sa aming Transaction types
export const sanitizeTransactionData = (data: any) => {
  return {
    ...data,
    customer_name: data.customer_name || null,
    customer_phone: data.customer_phone || null,
    customer_email: data.customer_email || null,
    notes: data.notes || null,
    subtotal: data.subtotal || 0,
    discount_amount: data.discount_amount || 0,
    tax_amount: data.tax_amount || 0,
    amount_paid: data.amount_paid || 0,
    payment_change: data.payment_change || 0,
    payment_status: data.payment_status || null,
  };
};

// Helper para i-convert ang filters
export const convertFiltersForApi = (filters: any) => {
  const result: any = {};
  
  Object.keys(filters).forEach(key => {
    const value = filters[key];
    
    // Handle null/undefined values
    if (value === null || value === undefined || value === '') {
      result[key] = undefined;
    } 
    // Handle string to number conversion
    else if ((key === 'min_total' || key === 'max_total') && typeof value === 'string') {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        result[key] = num;
      }
    }
    // Handle string values
    else if (typeof value === 'string') {
      result[key] = value.trim() === '' ? undefined : value;
    }
    // Handle other values
    else {
      result[key] = value;
    }
  });
  
  return result;
};