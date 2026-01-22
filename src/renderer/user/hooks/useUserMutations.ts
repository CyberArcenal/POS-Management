import { useState } from 'react';
import { userService } from '../api/userService';
import type { User, UserFormData } from '../types/user.types';

export const useUserMutations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = async (userData: UserFormData): Promise<User> => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await userService.createUser(userData);
      return user;
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (id: number, userData: Partial<UserFormData>): Promise<User> => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await userService.updateUser(id, userData);
      return user;
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (id: number, permanent: boolean = false): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await userService.deleteUser(id, permanent);
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserStatus = async (id: number, status: 'active' | 'inactive'): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await userService.updateUserStatus(id, status);
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRoles = async (id: number, roles: string[]): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await userService.updateUserRoles(id, roles);
    } catch (err: any) {
      setError(err.message || 'Failed to update user roles');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const bulkUpdateUsers = async (ids: number[], action: 'activate' | 'deactivate' | 'delete'): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await userService.bulkUpdateUsers(ids, action);
    } catch (err: any) {
      setError(err.message || 'Failed to perform bulk action');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async (id: number, currentPassword: string, newPassword: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await userService.updateUserPassword(id, currentPassword, newPassword);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    updateUserRoles,
    bulkUpdateUsers,
    updatePassword,
  };
};