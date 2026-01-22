// src/features/transactions/context/TransactionContext.tsx
import React, { createContext, useContext, useState, type ReactNode} from 'react';
import type { FilterState } from '../api/types';

interface TransactionContextType {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  selectedTransactionId: number | null;
  setSelectedTransactionId: (id: number | null) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

const initialFilters: FilterState = {
  start_date: null,
  end_date: null,
  reference_number: '',
  customer_name: '',
  status: '',
  payment_method: '',
  min_total: '',
  max_total: '',
  search: '',
};

interface TransactionProviderProps {
  children: ReactNode;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const value = {
    filters,
    setFilters,
    selectedTransactionId,
    setSelectedTransactionId,
    refreshTrigger,
    triggerRefresh,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactionContext = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactionContext must be used within TransactionProvider');
  }
  return context;
};