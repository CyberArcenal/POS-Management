// src/renderer/pages/Settings/components/NotificationsTab.tsx
import React from "react";
import type { NotificationsSettings } from "../../../api/system_config";

interface Props {
  settings: NotificationsSettings;
  onUpdate: (field: keyof NotificationsSettings, value: any) => void;
  onTestSmtp?: () => void;
  onTestSms?: () => void;
}

const NotificationsTab: React.FC<Props> = ({
  settings,
  onUpdate,
  onTestSmtp,
  onTestSms,
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">Notification Settings</h3>

      {/* General toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="email_enabled"
            checked={settings.email_enabled || false}
            onChange={(e) => onUpdate("email_enabled", e.target.checked)}
            className="windows-checkbox"
          />
          <label htmlFor="email_enabled" className="text-sm text-[var(--text-secondary)]">
            Enable Email Notifications
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="sms_enabled"
            checked={settings.sms_enabled || false}
            onChange={(e) => onUpdate("sms_enabled", e.target.checked)}
            className="windows-checkbox"
          />
          <label htmlFor="sms_enabled" className="text-sm text-[var(--text-secondary)]">
            Enable SMS Notifications
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="push_notifications_enabled"
            checked={settings.push_notifications_enabled || false}
            onChange={(e) => onUpdate("push_notifications_enabled", e.target.checked)}
            className="windows-checkbox"
          />
          <label htmlFor="push_notifications_enabled" className="text-sm text-[var(--text-secondary)]">
            Enable Push Notifications
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="low_stock_alert_enabled"
            checked={settings.low_stock_alert_enabled || false}
            onChange={(e) => onUpdate("low_stock_alert_enabled", e.target.checked)}
            className="windows-checkbox"
          />
          <label htmlFor="low_stock_alert_enabled" className="text-sm text-[var(--text-secondary)]">
            Enable Low Stock Alerts
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="daily_sales_summary_enabled"
            checked={settings.daily_sales_summary_enabled || false}
            onChange={(e) => onUpdate("daily_sales_summary_enabled", e.target.checked)}
            className="windows-checkbox"
          />
          <label htmlFor="daily_sales_summary_enabled" className="text-sm text-[var(--text-secondary)]">
            Enable Daily Sales Summary
          </label>
        </div>
      </div>

      {/* Email SMTP Settings */}
      <div className="border-t border-[var(--border-color)] pt-4">
        <h4 className="text-md font-medium text-[var(--text-primary)] mb-3">Email (SMTP) Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              SMTP Host
            </label>
            <input
              type="text"
              value={settings.email_smtp_host || ""}
              onChange={(e) => onUpdate("email_smtp_host", e.target.value)}
              className="windows-input w-full"
              placeholder="smtp.gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              SMTP Port
            </label>
            <input
              type="number"
              value={settings.email_smtp_port || 587}
              onChange={(e) => onUpdate("email_smtp_port", parseInt(e.target.value) || 0)}
              className="windows-input w-full"
              placeholder="587"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              From Address
            </label>
            <input
              type="email"
              value={settings.email_from_address || ""}
              onChange={(e) => onUpdate("email_from_address", e.target.value)}
              className="windows-input w-full"
              placeholder="noreply@example.com"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              onClick={onTestSmtp}
              className="windows-button windows-button-secondary text-sm"
            >
              Test SMTP Connection
            </button>
          </div>
        </div>
      </div>

      {/* SMS (Twilio) Settings */}
      <div className="border-t border-[var(--border-color)] pt-4">
        <h4 className="text-md font-medium text-[var(--text-primary)] mb-3">SMS (Twilio) Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              SMS Provider
            </label>
            <input
              type="text"
              value={settings.sms_provider || "twilio"}
              onChange={(e) => onUpdate("sms_provider", e.target.value)}
              className="windows-input w-full"
              placeholder="twilio"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Account SID
            </label>
            <input
              type="text"
              value={(settings as any).twilio_account_sid || ""}
              onChange={(e) => onUpdate("twilio_account_sid", e.target.value)}
              className="windows-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Auth Token
            </label>
            <input
              type="password"
              value={(settings as any).twilio_auth_token || ""}
              onChange={(e) => onUpdate("twilio_auth_token", e.target.value)}
              className="windows-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={(settings as any).twilio_phone_number || ""}
              onChange={(e) => onUpdate("twilio_phone_number", e.target.value)}
              className="windows-input w-full"
              placeholder="+1234567890"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Messaging Service SID
            </label>
            <input
              type="text"
              value={(settings as any).twilio_messaging_service_sid || ""}
              onChange={(e) => onUpdate("twilio_messaging_service_sid", e.target.value)}
              className="windows-input w-full"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              onClick={onTestSms}
              className="windows-button windows-button-secondary text-sm"
            >
              Test SMS Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsTab;