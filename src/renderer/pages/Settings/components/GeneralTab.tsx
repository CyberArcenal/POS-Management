// src/renderer/pages/Settings/components/GeneralTab.tsx
import React from "react";
import type { GeneralSettings } from "../../../api/system_config";

interface Props {
  settings: GeneralSettings;
  onUpdate: (field: keyof GeneralSettings, value: any) => void;
}

const GeneralTab: React.FC<Props> = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">General Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Company Name
          </label>
          <input
            type="text"
            value={settings.company_name || ""}
            onChange={(e) => onUpdate("company_name", e.target.value)}
            className="windows-input w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Store Location
          </label>
          <input
            type="text"
            value={settings.store_location || ""}
            onChange={(e) => onUpdate("store_location", e.target.value)}
            className="windows-input w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Timezone
          </label>
          <select
            value={settings.default_timezone || "Asia/Manila"}
            onChange={(e) => onUpdate("default_timezone", e.target.value)}
            className="windows-input w-full"
          >
            <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
            <option value="UTC">UTC</option>
            {/* add more as needed */}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Currency
          </label>
          <input
            type="text"
            value={settings.currency || "USD"}
            onChange={(e) => onUpdate("currency", e.target.value)}
            className="windows-input w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Language
          </label>
          <select
            value={settings.language || "en"}
            onChange={(e) => onUpdate("language", e.target.value)}
            className="windows-input w-full"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="tl">Tagalog</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Auto Logout (minutes)
          </label>
          <input
            type="number"
            value={settings.auto_logout_minutes || 30}
            onChange={(e) => onUpdate("auto_logout_minutes", parseInt(e.target.value))}
            className="windows-input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            Receipt Footer Message
          </label>
          <textarea
            value={settings.receipt_footer_message || ""}
            onChange={(e) => onUpdate("receipt_footer_message", e.target.value)}
            rows={2}
            className="windows-input w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default GeneralTab;