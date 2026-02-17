import React, { useState } from 'react';
import { Filter, RefreshCw } from 'lucide-react';
import { useNotificationLogs } from './hooks/useNotificationLogs';
import { NotificationSearch } from './components/NotificationSearch';
import { NotificationFilterPanel } from './components/NotificationFilterPanel';
import { NotificationStats } from './components/NotificationStats';
import { NotificationTable } from './components/NotificationTable';
import { NotificationViewDialog } from './Dialogs/NotificationViewDialog';
import { dialogs } from '../../utils/dialogs';
import notificationLogAPI from '../../api/notification_log';
import { showSuccess, showError } from '../../utils/notification';
import type { NotificationLogEntry } from '../../api/notification_log';
import Pagination from '../../components/Shared/Pagination1';

const NotificationLogPage: React.FC = () => {
  const {
    logs,
    pagination,
    stats,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    setPage,
    setPageSize,
    refetch,
  } = useNotificationLogs();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<NotificationLogEntry | null>(null);
  const [sendingRows, setSendingRows] = useState<Set<number>>(new Set());
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Search handler
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    updateFilters({ keyword: query });
  };

  // Filter handlers
  const handleFilterChange = (newFilters: any) => {
    updateFilters(newFilters);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    clearFilters();
  };

  // View handler
  const handleView = (log: NotificationLogEntry) => {
    setSelectedLog(log);
    setIsViewDialogOpen(true);
  };

  // ------------------------------------------------------------------
  // 🔄 RETRY – with confirmation dialog
  // ------------------------------------------------------------------
  const handleRetry = async (id: number) => {
    showSuccess('The notification has been queued for retry.');
    setSendingRows((prev) => new Set(prev).add(id));
    try {
      const response = await notificationLogAPI.retryFailed(id);
      if (response.status) {
        
        refetch();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError('Retry failed', err.message || 'Unable to retry notification');
    } finally {
      setSendingRows((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const confirmRetry = (id: number) => {
    dialogs
      .confirm({
        title: 'Retry Notification',
        message: 'Are you sure you want to retry this failed notification?',
        confirmText: 'Retry',
        cancelText: 'Cancel',
        icon: 'warning',
      })
      .then((confirmed) => {
        if (confirmed) handleRetry(id);
      });
  };

  // ------------------------------------------------------------------
  // 🔄 RESEND – with confirmation dialog
  // ------------------------------------------------------------------
  const handleResend = async (id: number) => {
    showSuccess('The notification has been resent.');
    setSendingRows((prev) => new Set(prev).add(id));
    try {
      const response = await notificationLogAPI.resend(id);
      if (response.status) {
        
        refetch();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      showError('Resend failed', err.message || 'Unable to resend notification');
    } finally {
      setSendingRows((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const confirmResend = (id: number) => {
    dialogs
      .confirm({
        title: 'Resend Notification',
        message: 'Are you sure you want to resend this notification?',
        confirmText: 'Resend',
        cancelText: 'Cancel',
        icon: 'info',
      })
      .then((confirmed) => {
        if (confirmed) handleResend(id);
      });
  };

  // ------------------------------------------------------------------
  // 🗑️ DELETE – with confirmation dialog
  // ------------------------------------------------------------------
  const handleDelete = async (id: number) => {
    try {
      const response = await notificationLogAPI.delete(id);
      if (response.status) {
        dialogs.success('Deleted', `Notification #${id} has been deleted.`);
        refetch();
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      dialogs.error('Delete failed', err.message);
    }
  };

  const confirmDelete = (id: number) => {
    dialogs
      .delete() // uses built-in delete confirmation with danger icon
      .then((confirmed) => {
        if (confirmed) handleDelete(id);
      });
  };

  return (
    <div className="min-h-screen bg-[var(--background-color)]">
      <main className="mx-auto px-2 py-2">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Notification Logs</h2>
            <p className="text-[var(--text-secondary)] mt-1">
              {pagination.total} total notifications
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                         bg-[var(--card-secondary-bg)] hover:bg-[var(--card-hover-bg)]
                         text-[var(--text-primary)] border border-[var(--border-color)]/20
                         hover:border-[var(--border-color)]/40 transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                         bg-[var(--card-secondary-bg)] hover:bg-[var(--card-hover-bg)]
                         text-[var(--text-primary)] border border-[var(--border-color)]/20
                         hover:border-[var(--border-color)]/40 transition-all duration-200"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <NotificationStats stats={stats} loading={loading} />

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <NotificationSearch value={searchQuery} onChange={handleSearchChange} />
          {searchQuery && (
            <span className="text-sm text-[var(--text-secondary)]">
              Searching: “{searchQuery}”
            </span>
          )}
        </div>

        {/* Filter Panel */}
        <NotificationFilterPanel
          filters={{
            status: filters.status,
            startDate: filters.startDate,
            endDate: filters.endDate,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
          }}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
          isOpen={isFilterOpen}
          onToggle={() => setIsFilterOpen(!isFilterOpen)}
        />

        {/* Error display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4 text-red-400">
            {error}
            <button onClick={refetch} className="ml-3 underline">
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="mt-6">
          <NotificationTable
            logs={logs}
            onView={handleView}
            onRetry={confirmRetry}      // ← confirmation then action
            onResend={confirmResend}    // ← confirmation then action
            onDelete={confirmDelete}    // ← confirmation then action
            isLoading={loading}
            sendingIds={sendingRows}
          />
        </div>

        {/* Pagination */}
        {!loading && pagination.total > 0 && (
          <Pagination
            currentPage={pagination.page}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 25, 50, 100]}
            showPageSize={true}
          />
        )}
      </main>

      {/* Only View Dialog remains */}
      {selectedLog && (
        <NotificationViewDialog
          log={selectedLog}
          isOpen={isViewDialogOpen}
          onClose={() => {
            setIsViewDialogOpen(false);
            setSelectedLog(null);
          }}
        />
      )}
    </div>
  );
};

export default NotificationLogPage;