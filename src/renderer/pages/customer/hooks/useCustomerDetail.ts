import { useState, useCallback } from 'react';
import type { CustomerData } from '../../../api/customer';
import customerAPI from '../../../api/customer';

export const useCustomerDetail = () => {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomer = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await customerAPI.getCustomerById(id);
      
      if (response.status) {
        setCustomer(response.data);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load customer details');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCustomer = useCallback(() => {
    setCustomer(null);
    setError(null);
  }, []);

  return {
    customer,
    isLoading,
    error,
    loadCustomer,
    clearCustomer,
  };
};