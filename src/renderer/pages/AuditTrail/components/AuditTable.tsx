import React from "react";
import { Eye, FileText } from "lucide-react";
import { getActionColor } from "../hooks/useAuditLogs";
import type { AuditLogEntry } from "../../../api/audit";

interface AuditTableProps {
  logs: AuditLogEntry[];
  onView: (log: AuditLogEntry) => void;
}

export const AuditTable: React.FC<AuditTableProps> = ({
  logs,
  onView,
}) => {
  if (logs.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-8 text-center">
        <FileText className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
        <p className="text-[var(--text-primary)] font-medium">No audit logs found</p>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg overflow-hidden flex flex-col">
      {/* Fixed Header */}
      <table className="w-full table-fixed">
        <thead className="bg-[var(--table-header-bg)]">
          <tr>
            <th className="w-16 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">ID</th>
            <th className="w-36 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Date & Time</th>
            <th className="w-24 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">User</th>
            <th className="w-24 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Action</th>
            <th className="w-32 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Entity</th>
            <th className="w-20 px-4 py-3 text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
      </table>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full table-fixed">
          <tbody className="divide-y divide-[var(--border-color)]">
            {logs.map((log) => (
              <tr
                key={log.id}
                className="hover:bg-[var(--table-row-hover)] transition-colors"
                 onClick={(e) => {e.stopPropagation(); onView(log)}}
              >
                <td className="w-16 px-4 py-3 text-sm font-mono text-[var(--text-primary)]">#{log.id}</td>
                <td className="w-36 px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="w-24 px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {log.user || "System"}
                </td>
                <td className="w-24 px-4 py-3 text-sm">
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${getActionColor(log.action)}20`,
                      color: getActionColor(log.action),
                    }}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="w-32 px-4 py-3 text-sm text-[var(--text-secondary)] truncate">
                  {log.entity}
                  {log.entityId && ` #${log.entityId}`}
                </td>
                <td className="w-20 px-4 py-3 text-center">
                  <button
                    onClick={(e) => {e.stopPropagation(); onView(log)}}
                    className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-blue)]"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};