import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { returnsAPI } from '../api/returns';
import inventoryTransactionAPI from '../../../api/inventory_transaction';
import auditTrailAPI from '../../../api/audit';

export interface ReturnItem {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity_sold: number;
  quantity_refunded: number;
  quantity_available: number;
  unit_price: number;
  total_price: number;
  reason?: string;
}

export interface ReturnTransaction {
  id: number;
  receipt_number: string;
  sale_id: number;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  datetime: string;
  total: number;
  status: 'completed' | 'cancelled' | 'refunded' | 'pending';
  payment_method: string;
  payment_status: string;
  items: ReturnItem[];
  created_at: string;
  can_be_refunded: boolean;
  refund_deadline?: string;
}

export interface ReturnFilters {
  search: string;
  start_date: string;
  end_date: string;
  status: string;
  payment_method: string;
  customer_id?: number;
  receipt_number?: string;
  min_amount?: number;
  max_amount?: number;
}

interface ReturnContextType {
  transactions: ReturnTransaction[];
  selectedTransaction: ReturnTransaction | null;
  filters: ReturnFilters;
  loading: boolean;
  error: string | null;
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    page_size: number;
  };
  
  // Actions
  setFilters: (filters: Partial<ReturnFilters>) => void;
  selectTransaction: (transaction: ReturnTransaction) => void;
  clearSelection: () => void;
  loadTransactions: (page?: number) => Promise<void>;
  processRefund: (data: {
    items: Array<{
      id: number;
      quantity: number;
      reason: string;
    }>;
    notes?: string;
    refund_type?: 'full' | 'partial';
  }) => Promise<{
    success: boolean;
    message: string;
    data?: any;
  }>;
}

const ReturnContext = createContext<ReturnContextType | undefined>(undefined);

export const useReturnContext = () => {
  const context = useContext(ReturnContext);
  if (!context) {
    throw new Error('useReturnContext must be used within ReturnProvider');
  }
  return context;
};

interface ReturnProviderProps {
  children: ReactNode;
}

export const ReturnProvider: React.FC<ReturnProviderProps> = ({ children }) => {
  const [transactions, setTransactions] = useState<ReturnTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<ReturnTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    page_size: 20
  });
  
  const [filters, setFilters] = useState<ReturnFilters>({
    search: '',
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    status: '',
    payment_method: '',
  });
  
  const loadTransactions = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await returnsAPI.getRefundableTransactions({
        ...filters,
        page,
        limit: pagination.page_size
      });
      
      if (response.status) {
        setTransactions(response.data.transactions || []);
        setPagination(response.data.pagination || {
          current_page: page,
          total_pages: 1,
          total_count: response.data.transactions?.length || 0,
          page_size: pagination.page_size
        });
      } else {
        throw new Error(response.message || 'Failed to load transactions');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading transactions');
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const processRefund = async (data: {
    items: Array<{
      id: number;
      quantity: number;
      reason: string;
    }>;
    notes?: string;
    refund_type?: 'full' | 'partial';
  }) => {
    if (!selectedTransaction) {
      return { success: false, message: 'No transaction selected' };
    }
    
    try {
      setLoading(true);
      
      // 1. Process the refund through sales API
      const refundResponse = await returnsAPI.processRefund({
        sale_id: selectedTransaction.sale_id,
        items: data.items,
        reason: data.notes,
        refund_type: data.refund_type || 'partial'
      });
      
      if (!refundResponse.status) {
        throw new Error(refundResponse.message || 'Refund processing failed');
      }
      
      // 2. Log inventory adjustment for each item
      const inventoryPromises = data.items.map(item => 
        inventoryTransactionAPI.createTransactionLog({
          product_id: item.id,
          action: 'return_in',
          change_amount: item.quantity,
          quantity_before: 0, // Will be populated by backend
          quantity_after: 0,  // Will be populated by backend
          reference_id: selectedTransaction.receipt_number,
          reference_type: 'return',
          notes: `Return: ${item.reason}`
        })
      );
      
      await Promise.all(inventoryPromises);
      
      // 3. Log audit trail
    //   await auditTrailAPI.logAuditEvent({
    //     action: 'process_refund',
    //     entity: 'sale',
    //     entity_id: selectedTransaction.sale_id,
    //     details: {
    //       receipt_number: selectedTransaction.receipt_number,
    //       refund_amount: refundResponse.data?.refund_amount,
    //       items: data.items,
    //       notes: data.notes,
    //       performed_by: 'current_user' // Should be actual user
    //     }
    //   });
      
      // 4. Refresh transactions list
      await loadTransactions(pagination.current_page);
      
      return {
        success: true,
        message: 'Refund processed successfully',
        data: refundResponse.data
      };
      
    } catch (err: any) {
      console.error('Error processing refund:', err);
      return {
        success: false,
        message: err.message || 'Failed to process refund'
      };
    } finally {
      setLoading(false);
    }
  };
  
  const selectTransaction = (transaction: ReturnTransaction) => {
    setSelectedTransaction(transaction);
  };
  
  const clearSelection = () => {
    setSelectedTransaction(null);
  };
  
  const updateFilters = (newFilters: Partial<ReturnFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  // Load transactions when filters change
  useEffect(() => {
    loadTransactions(1);
  }, [filters]);
  
  const value: ReturnContextType = {
    transactions,
    selectedTransaction,
    filters,
    loading,
    error,
    pagination,
    
    setFilters: updateFilters,
    selectTransaction,
    clearSelection,
    loadTransactions,
    processRefund
  };
  
  return (
    <ReturnContext.Provider value={value}>
      {children}
    </ReturnContext.Provider>
  );
};