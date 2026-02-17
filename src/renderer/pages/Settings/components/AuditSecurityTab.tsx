// src/renderer/pages/Settings/components/AuditSecurityTab.tsx
import React from "react";
import type { AuditSecuritySettings } from "../../../api/system_config";

interface Props {
  settings: AuditSecuritySettings;
  onUpdate: (field: keyof AuditSecuritySettings, value: any) => void;
}

const AuditSecurityTab: React.FC<Props> = ({ settings, onUpdate }) => {
  const handleLogEventsChange = (value: string) => {
    const events = value.split(",").map((e) => e.trim()).filter(Boolean);
    onUpdate("log_events", events);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">Audit & Security Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="audit_log_enabled"
            checked={settings.audit_log_enabled || false}
            onChange={(e) => onUpdate("audit_log_enabled", e.target.checked)}
            className="windows-checkbox"
          />
          <label htmlFor="audit_log_enabled" className="text-sm text-[var(--text-secondary)]">
            Enable Audit Log
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Log Retention (days)
          </label>
          <input
            type="number"
            value={settings.log_retention_days ?? 30}
            onChange={(e) => onUpdate("log_retention_days", parseInt(e.target.value) || 0)}
            className="windows-input w-full"
            min="0"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Log Events (comma separated)
          </label>
          <input
            type="text"
            value={settings.log_events?.join(", ") || "login, logout, create, update, delete"}
            onChange={(e) => handleLogEventsChange(e.target.value)}
            className="windows-input w-full"
            placeholder="login, logout, create, update, delete"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="force_https"
            checked={settings.force_https || false}
            onChange={(e) => onUpdate("force_https", e.target.checked)}
            className="windows-checkbox"
          />
          <label htmlFor="force_https" className="text-sm text-[var(--text-secondary)]">
            Force HTTPS
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="session_encryption_enabled"
            checked={settings.session_encryption_enabled || false}
            onChange={(e) => onUpdate("session_encryption_enabled", e.target.checked)}
            className="windows-checkbox"
          />
          <label htmlFor="session_encryption_enabled" className="text-sm text-[var(--text-secondary)]">
            Enable Session Encryption
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="gdpr_compliance_enabled"
            checked={settings.gdpr_compliance_enabled || false}
            onChange={(e) => onUpdate("gdpr_compliance_enabled", e.target.checked)}
            className="windows-checkbox"
          />
          <label htmlFor="gdpr_compliance_enabled" className="text-sm text-[var(--text-secondary)]">
            GDPR Compliance Mode
          </label>
        </div>
      </div>
    </div>
  );
};

export default AuditSecurityTab;