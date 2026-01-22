import { useState, useEffect, useCallback } from 'react';
import type { LoyaltyCustomer } from '../../../api/loyalty';
import loyaltyAPI from '../../../api/loyalty';

interface UseLoyaltyCustomersProps {
  filters?: {
    tier?: string;
    min_points?: number;
    max_points?: number;
    search?: string;
  };
  page?: number;
  pageSize?: number;
  refreshTrigger?: number;
}

export const useLoyaltyCustomers = ({
  filters = {},
  page = 1,
  pageSize = 20,
  refreshTrigger = 0,
}: UseLoyaltyCustomersProps = {}) => {
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([]);
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

  // Extract individual filter values for stable dependencies
  const { tier, min_points, max_points, search } = filters;

  const fetchLoyaltyCustomers = useCallback(async () => {
    try {
      setIsFetching(true);
      const response = await loyaltyAPI.getLoyaltyCustomers(filters);
      
      if (response.status) {
        setCustomers(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching loyalty customers:', error);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  // Use individual filter values instead of the entire filters object
  }, [tier, min_points, max_points, search]);

  useEffect(() => {
    setIsLoading(true);
    fetchLoyaltyCustomers();
  // Use individual filter values and refreshTrigger instead of fetchLoyaltyCustomers
  }, [refreshTrigger, tier, min_points, max_points, search]);

  const setPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      // In a real implementation, this would trigger a refetch
      fetchLoyaltyCustomers();
    }
  };

  const enrollCustomer = async (customerId: number) => {
    try {
      const response = await loyaltyAPI.enrollCustomerInLoyalty(customerId);
      if (response.status) {
        fetchLoyaltyCustomers(); // Refresh the list
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error enrolling customer:', error);
      return null;
    }
  };

  return {
    customers,
    pagination,
    isLoading,
    isFetching,
    fetchLoyaltyCustomers,
    setPage,
    enrollCustomer,
  };
};