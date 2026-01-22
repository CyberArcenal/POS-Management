import React, { useState, useEffect } from 'react';
import { UserProvider, useUserContext } from './context/UserContext';
import { useUserMutations } from './hooks/useUserMutations';
import { useUsers } from './hooks/useUsers';
import type { User } from './types/user.types';
import { UserFilter } from './components/user-management/UserFilter';
import { UserStats } from './components/user-management/UserStats';
import { UserTable } from './components/user-management/UserTable';
import { UserDetailModal } from './components/user-management/UserDetailModal';
import { BulkActionsBar } from './components/user-management/BulkActionsBar';

const UserManagementContent: React.FC = () => {
  const {
    selectedUsers,
    setSelectedUsers,
    filters,
    setFilters,
    refreshTrigger,
    triggerRefresh,
    currentEditingUser,
    setCurrentEditingUser,
  } = useUserContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    managers: 0,
    cashiers: 0,
  });

  const { users, pagination, isLoading, isFetching, fetchUsers, setPage } = useUsers({
    filters,
    page: 1,
    pageSize: 20,
    refreshTrigger,
  });

  const {
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    bulkUpdateUsers,
    isLoading: isMutating,
  } = useUserMutations();

  useEffect(() => {
    // Calculate stats from users
    const stats = {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status !== 'active').length,
      admins: users.filter(u => u.roles?.includes('admin')).length,
      managers: users.filter(u => u.roles?.includes('manager')).length,
      cashiers: users.filter(u => u.roles?.includes('cashier')).length,
    };
    setUserStats(stats);
  }, [users]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setSelectedUsers([]);
  };

  const handleFilterReset = () => {
    setFilters({});
    setSelectedUsers([]);
  };

  const handleSelectUser = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, id]);
    } else {
      setSelectedUsers(selectedUsers.filter(userId => userId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleEditUser = (user: User) => {
    setCurrentEditingUser(user);
    setIsModalOpen(true);
  };

  const handleViewDetails = (user: User) => {
    // For now, same as edit. Could be expanded to a read-only view
    setCurrentEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Are you sure you want to delete user "${user.display_name}"?`)) {
      try {
        await deleteUser(user.id, false);
        triggerRefresh();
        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await updateUserStatus(user.id, newStatus);
      triggerRefresh();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const handleBulkActivate = async () => {
    try {
      await bulkUpdateUsers(selectedUsers, 'activate');
      triggerRefresh();
      setSelectedUsers([]);
    } catch (error) {
      console.error('Failed to bulk activate users:', error);
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      await bulkUpdateUsers(selectedUsers, 'deactivate');
      triggerRefresh();
      setSelectedUsers([]);
    } catch (error) {
      console.error('Failed to bulk deactivate users:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
      try {
        await bulkUpdateUsers(selectedUsers, 'delete');
        triggerRefresh();
        setSelectedUsers([]);
      } catch (error) {
        console.error('Failed to bulk delete users:', error);
      }
    }
  };

  const handleAddUser = () => {
    setCurrentEditingUser(null);
    setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    setCurrentEditingUser(null);
    triggerRefresh();
  };

  const handlePageChange = (page: number) => {
    setPage(page);
    setSelectedUsers([]);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex-none mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">User Management</h1>
            <p className="text-gray-400 mt-1">Manage system users, roles, and permissions</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={triggerRefresh}
              disabled={isFetching}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={handleAddUser}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <UserStats stats={userStats} />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {/* Filters */}
          <UserFilter
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
          />

          {/* User Count */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-300">
              Showing <span className="font-semibold text-white">
                {((pagination.page - 1) * pagination.limit) + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span> of <span className="font-semibold text-white">{pagination.total}</span> users
            </div>
            <div className="text-sm text-gray-400">
              Page <span className="font-semibold text-white">{pagination.page}</span> of{' '}
              <span className="font-semibold text-white">{pagination.total_pages}</span>
            </div>
          </div>

          {/* User Table */}
          <UserTable
            users={users}
            isLoading={isLoading}
            isFetching={isFetching}
            selectedUsers={selectedUsers}
            onSelectUser={handleSelectUser}
            onSelectAll={handleSelectAll}
            onEditUser={handleEditUser}
            onViewDetails={handleViewDetails}
            onDeleteUser={handleDeleteUser}
            onToggleStatus={handleToggleStatus}
          />

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-center mt-8">
              <nav className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || isFetching}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded-lg transition-colors"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.total_pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.total_pages - 2) {
                      pageNum = pagination.total_pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-lg transition-colors ${
                          pagination.page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {pagination.total_pages > 5 && pagination.page < pagination.total_pages - 2 && (
                    <>
                      <span className="text-gray-500">...</span>
                      <button
                        onClick={() => handlePageChange(pagination.total_pages)}
                        className="w-10 h-10 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                      >
                        {pagination.total_pages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.total_pages || isFetching}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded-lg transition-colors"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedUsers.length}
        onBulkActivate={handleBulkActivate}
        onBulkDeactivate={handleBulkDeactivate}
        onBulkDelete={handleBulkDelete}
      />

      {/* User Detail Modal */}
      <UserDetailModal
        user={currentEditingUser}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCurrentEditingUser(null);
        }}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export const UserManagementPage: React.FC = () => {
  return (
    <UserProvider>
      <UserManagementContent />
    </UserProvider>
  );
};