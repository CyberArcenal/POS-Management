// src/renderer/pages/Settings/components/UserSecurityTab.tsx
import React from "react";
import type { UserSecuritySettings } from "../../../api/system_config";

interface Props {
  settings: UserSecuritySettings;
  onUpdate: (field: keyof UserSecuritySettings, value: any) => void;
}

const UserSecurityTab: React.FC<Props> = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">User Security Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Max Login Attempts
          </label>
          <input
            type="number"
            value={settings.max_login_attempts ?? 5}
            onChange={(e) => onUpdate("max_login_attempts", parseInt(e.target.value) || 0)}
            className="windows-input w-full"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Lockout Duration (minutes)
          </label>
          <input
            type="number"
            value={settings.lockout_duration_minutes ?? 15}
            onChange={(e) => onUpdate("lockout_duration_minutes", parseInt(e.target.value) || 0)}
            className="windows-input w-full"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Password Minimum Length
          </label>
          <input
            type="number"
            value={settings.password_min_length ?? 8}
            onChange={(e) => onUpdate("password_min_length", parseInt(e.target.value) || 0)}
            className="windows-input w-full"
            min="4"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="password_require_uppercase"
            checked={settings.password_require_uppercase || false}
            onChange={(e) => onUpdate("password_require_uppercase", e.target.checked)}
            className="windows-checkbox"
          />
          <label htmlFor="password_require_uppercase" className="text-sm text-[var(--text-secondary)]">
            Require Uppercase
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="password_require_numbers"
            checked={settings.password_require_numbers || false}
            onChange={(e) => onUpdate("password_require_numbers", e.target.checked)}
            className="windows-checkbox"
          />
          <label htmlFor="password_require_numbers" className="text-sm text-[var(--text-secondary)]">
            Require Numbers
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="enable_two_factor_auth"
            checked={settings.enable_two_factor_auth || false}
            onChange={(e) => onUpdate("enable_two_factor_auth", e.target.checked)}
            className="windows-checkbox"
          />
          <label htmlFor="enable_two_factor_auth" className="text-sm text-[var(--text-secondary)]">
            Enable Two-Factor Authentication
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Session Timeout (minutes)
          </label>
          <input
            type="number"
            value={settings.session_timeout_minutes ?? 30}
            onChange={(e) => onUpdate("session_timeout_minutes", parseInt(e.target.value) || 0)}
            className="windows-input w-full"
            min="0"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allow_multiple_sessions"
            checked={settings.allow_multiple_sessions || false}
            onChange={(e) => onUpdate("allow_multiple_sessions", e.target.checked)}
            className="windows-checkbox"
          />
          <label htmlFor="allow_multiple_sessions" className="text-sm text-[var(--text-secondary)]">
            Allow Multiple Sessions per User
          </label>
        </div>
      </div>
    </div>
  );
};

export default UserSecurityTab;