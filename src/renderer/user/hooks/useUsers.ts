import { useState, useEffect, useCallback } from 'react';
import { userService } from '../api/userService';
import type { PaginatedResponse, User, UserFilters } from '../types/user.types';

interface UseUsersProps {
  filters?: UserFilters;
  page?: number;
  pageSize?: number;
  refreshTrigger?: number;
}

export const useUsers = ({
  filters = {},
  page = 1,
  pageSize = 20,
  refreshTrigger = 0,
}: UseUsersProps = {}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<User>['pagination']>({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsFetching(true);
      setError(null);
      
      const response = await userService.getUsers(page, pageSize, filters);
      setUsers(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, refreshTrigger]);

  return {
    users,
    pagination,
    isLoading,
    isFetching,
    error,
    fetchUsers,
    setPage: (newPage: number) => {
      setPagination(prev => ({ ...prev, page: newPage }));
    },
  };
};