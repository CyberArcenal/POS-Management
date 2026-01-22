import { useState, useEffect, useCallback } from 'react';
import type { CustomerData, CustomerFilters } from '../../../api/customer';
import customerAPI from '../../../api/customer';

interface UseCustomersProps {
  filters?: CustomerFilters;
  page?: number;
  pageSize?: number;
  refreshTrigger?: number;
}

export const useCustomers = ({
  filters = {},
  page = 1,
  pageSize = 20,
  refreshTrigger = 0,
}: UseCustomersProps = {}) => {
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [pagination, setPagination] = useState({
    count: 0,
    current_page: 1,
    total_pages: 1,
    page_size: 20,
    next: false,
    previous: false,
  });

const fetchCustomers = useCallback(async () => {
  try {
    setIsFetching(true);
    setIsLoading(true);
    setError(null); // i-reset ang error
    
    const response = await customerAPI.findPage(filters, page, pageSize);
    
    // Siguraduhing valid ang response
    if (!response) {
      throw new Error('Walang response mula sa server');
    }
    
    if (response.status) {
      setCustomers(response.data);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } else {
      setError(response.message || 'Hindi makakuha ng customers');
    }
  } catch (error: any) {
    console.error('Error sa pagkuha ng customers:', error);
    
    // Special handling para sa HTML response
    if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
      setError('Ang server ay nagbalik ng invalid response. Paki-check ang API endpoint.');
    } else {
      setError(error.message || 'Hindi makakuha ng customers');
    }
  } finally {
    setIsLoading(false);
    setIsFetching(false);
  }
}, [filters, page, pageSize]);

  useEffect(() => {
    setIsLoading(true);
    fetchCustomers();
  }, [fetchCustomers, refreshTrigger]);

  const setPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      // In a real implementation, this would trigger a refetch
      // For now, we'll just update the page state
      fetchCustomers();
    }
  };

  return {
    customers,
    pagination,
    isLoading,
    isFetching,
    error,
    fetchCustomers,
    setPage,
  };
};


