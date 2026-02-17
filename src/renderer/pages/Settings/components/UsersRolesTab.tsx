// src/renderer/pages/Settings/components/UsersRolesTab.tsx
import React from "react";
import type { UsersRolesSettings } from "../../../api/system_config";

interface Props {
  settings: UsersRolesSettings;
  onUpdate: (field: keyof UsersRolesSettings, value: any) => void;
}

const UsersRolesTab: React.FC<Props> = ({ settings, onUpdate }) => {
  // Handle array fields (roles, permissions) as simple textarea for now
  const handleRolesChange = (value: string) => {
    const roles = value.split(",").map((r) => r.trim()).filter(Boolean);
    onUpdate("roles", roles);
  };

  const handlePermissionsChange = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      onUpdate("permissions", parsed);
    } catch {
      // ignore invalid JSON
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">Users & Roles Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Roles (comma separated)
          </label>
          <input
            type="text"
            value={settings.roles?.join(", ") || ""}
            onChange={(e) => handleRolesChange(e.target.value)}
            className="windows-input w-full"
            placeholder="e.g. Admin, Cashier, Manager"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Permissions (JSON format)
          </label>
          <textarea
            value={JSON.stringify(settings.permissions || {}, null, 2)}
            onChange={(e) => handlePermissionsChange(e.target.value)}
            rows={6}
            className="windows-input w-full font-mono text-sm"
            placeholder='{"Admin": ["all"], "Cashier": ["sell", "view_reports"]}'
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Default User Role
          </label>
          <input
            type="text"
            value={settings.default_user_role || ""}
            onChange={(e) => onUpdate("default_user_role", e.target.value)}
            className="windows-input w-full"
            placeholder="e.g. Cashier"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allow_user_registration"
            checked={settings.allow_user_registration || false}
            onChange={(e) => onUpdate("allow_user_registration", e.target.checked)}
            className="windows-checkbox"
          />
          <label htmlFor="allow_user_registration" className="text-sm text-[var(--text-secondary)]">
            Allow User Registration
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="require_approval_for_new_users"
            checked={settings.require_approval_for_new_users || false}
            onChange={(e) => onUpdate("require_approval_for_new_users", e.target.checked)}
            className="windows-checkbox"
          />
          <label htmlFor="require_approval_for_new_users" className="text-sm text-[var(--text-secondary)]">
            Require Approval for New Users
          </label>
        </div>
      </div>
    </div>
  );
};

export default UsersRolesTab;