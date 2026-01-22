import { useState, useCallback } from 'react';
import customerAPI, { type CustomerCreateData, type CustomerUpdateData } from '../../../api/customer';

export const useCustomerForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createCustomer = useCallback(async (customerData: CustomerCreateData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);

      const response = await customerAPI.createCustomer(customerData);
      
      if (response.status) {
        setSuccess(true);
        return response.data;
      } else {
        setError(response.message);
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create customer');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateCustomer = useCallback(async (customerId: number, customerData: CustomerUpdateData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);

      const response = await customerAPI.updateCustomer(customerId, customerData);
      
      if (response.status) {
        setSuccess(true);
        return response.data;
      } else {
        setError(response.message);
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update customer');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    isSubmitting,
    error,
    success,
    createCustomer,
    updateCustomer,
    reset,
  };
};