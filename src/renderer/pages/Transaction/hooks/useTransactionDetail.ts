// src/features/transactions/hooks/useTransactionDetail.ts
import { useState, useEffect } from 'react';
import { transactionApi } from '../api/transactionApi';
import type { Transaction } from '../api/types';
import { showError } from '../../../utils/notification';

interface UseTransactionDetailReturn {
  transaction: Transaction | null;
  isLoading: boolean;
  error: string | null;
  loadTransaction: (id: number) => Promise<void>;
  clearTransaction: () => void;
}

export const useTransactionDetail = (): UseTransactionDetailReturn => {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransaction = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await transactionApi.getTransactionById(id);
      setTransaction(data);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load transaction details';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearTransaction = () => {
    setTransaction(null);
    setError(null);
  };

  return {
    transaction,
    isLoading,
    error,
    loadTransaction,
    clearTransaction,
  };
};