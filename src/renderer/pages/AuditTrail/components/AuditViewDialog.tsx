import React from "react";
import { X, Calendar, User, Tag, FileText, Database, Code } from "lucide-react";
import { getActionColor } from "../hooks/useAuditLogs";
import type { AuditLogEntry } from "../../../api/audit";

interface AuditViewDialogProps {
  isOpen: boolean;
  log: AuditLogEntry | null;
  onClose: () => void;
}

export const AuditViewDialog: React.FC<AuditViewDialogProps> = ({
  isOpen,
  log,
  onClose,
}) => {
  if (!isOpen || !log) return null;

  // Helper to parse JSON safely
  const parseJson = (data: string | null) => {
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return data; // return as string if not JSON
    }
  };

  const oldData = parseJson(log.oldData);
  const newData = parseJson(log.newData);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
        <div className="relative bg-[var(--card-bg)] rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Audit Log Details #{log.id}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-[var(--card-hover-bg)] rounded">
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="bg-[var(--card-secondary-bg)] rounded-lg p-4 border border-[var(--border-color)]">
                <h3 className="text-md font-semibold text-[var(--text-primary)] mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[var(--text-tertiary)] flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Timestamp
                    </p>
                    <p className="text-[var(--text-primary)]">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-tertiary)] flex items-center gap-1">
                      <User className="w-3 h-3" /> User
                    </p>
                    <p className="text-[var(--text-primary)]">
                      {log.user || (log.userId ? `User #${log.userId}` : "System")}
                      {log.userType && ` (${log.userType})`}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--text-tertiary)] flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Action
                    </p>
                    <p
                      className="inline-flex px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${getActionColor(log.action)}20`,
                        color: getActionColor(log.action),
                      }}
                    >
                      {log.action}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--text-tertiary)] flex items-center gap-1">
                      <Database className="w-3 h-3" /> Entity
                    </p>
                    <p className="text-[var(--text-primary)]">
                      {log.entity}
                      {log.entityId && ` #${log.entityId}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Changes / Description */}
              {log.changes && (
                <div className="bg-[var(--card-secondary-bg)] rounded-lg p-4 border border-[var(--border-color)]">
                  <h3 className="text-md font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Description
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                    {log.changes}
                  </p>
                </div>
              )}

              {/* Old Data */}
              {oldData && (
                <div className="bg-[var(--card-secondary-bg)] rounded-lg p-4 border border-[var(--border-color)]">
                  <h3 className="text-md font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Old Data
                  </h3>
                  <pre className="text-xs text-[var(--text-secondary)] bg-[var(--background-color)] p-2 rounded overflow-auto max-h-60">
                    {typeof oldData === 'string' ? oldData : JSON.stringify(oldData, null, 2)}
                  </pre>
                </div>
              )}

              {/* New Data */}
              {newData && (
                <div className="bg-[var(--card-secondary-bg)] rounded-lg p-4 border border-[var(--border-color)]">
                  <h3 className="text-md font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    New Data
                  </h3>
                  <pre className="text-xs text-[var(--text-secondary)] bg-[var(--background-color)] p-2 rounded overflow-auto max-h-60">
                    {typeof newData === 'string' ? newData : JSON.stringify(newData, null, 2)}
                  </pre>
                </div>
              )}

              {/* Metadata */}
              {(log.ipAddress || log.userAgent) && (
                <div className="bg-[var(--card-secondary-bg)] rounded-lg p-4 border border-[var(--border-color)]">
                  <h3 className="text-md font-semibold text-[var(--text-primary)] mb-2">Metadata</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {log.ipAddress && (
                      <>
                        <p className="text-[var(--text-tertiary)]">IP Address</p>
                        <p className="text-[var(--text-primary)]">{log.ipAddress}</p>
                      </>
                    )}
                    {log.userAgent && (
                      <>
                        <p className="text-[var(--text-tertiary)]">User Agent</p>
                        <p className="text-[var(--text-primary)]">{log.userAgent}</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end p-6 border-t border-[var(--border-color)]">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};