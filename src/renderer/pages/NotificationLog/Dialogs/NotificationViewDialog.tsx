import React from 'react';
import { X, Mail, AlertCircle, User, Hash, FileText } from 'lucide-react';
import { formatDate } from '../../../utils/formatters';
import type { NotificationLogEntry } from '../../../api/notification_log';

interface NotificationViewDialogProps {
  log: NotificationLogEntry;
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationViewDialog: React.FC<NotificationViewDialogProps> = ({
  log,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const statusColors = {
    queued: 'text-yellow-400',
    sent: 'text-green-400',
    failed: 'text-red-400',
    resend: 'text-blue-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)]/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto windows-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--primary-color)]/10 text-[var(--primary-color)]">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Notification Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--card-hover-bg)] text-[var(--text-tertiary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${statusColors[log.status]}`}>
              {log.status.toUpperCase()}
            </span>
            <span className="text-sm text-[var(--text-tertiary)]">
              ID: #{log.id}
            </span>
          </div>

          
          {/* Subject */}
          <div className="flex items-start gap-3">
            <Mail className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-[var(--text-tertiary)] uppercase">Subject</p>
              <p className="text-[var(--text-primary)] font-medium">{log.subject || '(No subject)'}</p>
            </div>
          </div>

          {/* Payload / Body */}
          {log.payload && (
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-[var(--text-tertiary)] uppercase">Payload</p>
                <pre className="mt-1 p-3 bg-[var(--card-secondary-bg)] rounded-lg text-xs text-[var(--text-secondary)] overflow-x-auto whitespace-pre-wrap">
                  {log.payload}
                </pre>
              </div>
            </div>
          )}

          {/* Error Message */}
          {log.error_message && (
            <div className="flex items-start gap-3 bg-red-500/10 p-3 rounded-lg border border-red-500/30">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
              <div>
                <p className="text-xs text-red-400 uppercase">Error</p>
                <p className="text-sm text-red-300">{log.error_message}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--border-color)]/10">
            <div>
              <p className="text-xs text-[var(--text-tertiary)] uppercase">Created</p>
              <p className="text-sm text-[var(--text-primary)]">{formatDate(log.created_at)}</p>
            </div>
            {log.sent_at && (
              <div>
                <p className="text-xs text-[var(--text-tertiary)] uppercase">Sent</p>
                <p className="text-sm text-[var(--text-primary)]">{formatDate(log.sent_at)}</p>
              </div>
            )}
            {log.last_error_at && (
              <div>
                <p className="text-xs text-[var(--text-tertiary)] uppercase">Last Error</p>
                <p className="text-sm text-[var(--text-primary)]">{formatDate(log.last_error_at)}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-[var(--text-tertiary)] uppercase">Retry Count</p>
              <p className="text-sm text-[var(--text-primary)]">{log.retry_count}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)] uppercase">Resend Count</p>
              <p className="text-sm text-[var(--text-primary)]">{log.resend_count}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-tertiary)] uppercase">Updated</p>
              <p className="text-sm text-[var(--text-primary)]">{formatDate(log.updated_at)}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-[var(--border-color)]/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--card-secondary-bg)] hover:bg-[var(--card-hover-bg)] text-[var(--text-primary)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};