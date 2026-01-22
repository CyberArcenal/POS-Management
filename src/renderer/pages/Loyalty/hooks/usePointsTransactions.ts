import { useState, useCallback } from 'react';
import type { PointsTransaction } from '../../../api/loyalty';
import loyaltyAPI from '../../../api/loyalty';

export const usePointsTransactions = (customerId?: number) => {
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async (id?: number) => {
    const targetCustomerId = id || customerId;
    if (!targetCustomerId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await loyaltyAPI.getPointsTransactions(targetCustomerId);
      
      if (response.status) {
        setTransactions(response.data);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load points transactions');
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  const adjustPoints = async (params: {
    points_amount: number;
    transaction_type: 'earn' | 'redeem' | 'adjustment';
    description: string;
    reference_type?: string;
    reference_id?: number;
  }) => {
    if (!customerId) return null;

    try {
      const response = await loyaltyAPI.adjustCustomerPoints({
        customer_id: customerId,
        ...params,
      });
      
      if (response.status) {
        // Reload transactions
        await loadTransactions();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error adjusting points:', error);
      return null;
    }
  };

  return {
    transactions,
    isLoading,
    error,
    loadTransactions,
    adjustPoints,
  };
};