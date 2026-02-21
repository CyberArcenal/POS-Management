import React, { useState } from "react";
import { useSettings } from "./hooks/useSettings";
import SettingsHeader from "./components/SettingsHeader";
import SettingsTabs from "./components/SettingsTabs";
import GeneralTab from "./components/GeneralTab";
import InventoryTab from "./components/InventoryTab";
import SalesTab from "./components/SalesTab";
import CashierTab from "./components/CashierTab";
import NotificationsTab from "./components/NotificationsTab";
import DataReportsTab from "./components/DataReportsTab";
import IntegrationsTab from "./components/IntegrationsTab";
import AuditSecurityTab from "./components/AuditSecurityTab";
import SystemInfoCard from "./components/SystemInfoCard";
import type { SettingType } from "../../api/system_config";

// Map category keys to display labels
const TAB_LABELS: Record<string, string> = {
  general: "General",
  users_roles: "Users & Roles",
  inventory: "Inventory",
  sales: "Sales",
  cashier: "Cashier",
  notifications: "Notifications",
  data_reports: "Data & Reports",
  integrations: "Integrations",
  audit_security: "Audit & Security",
  user_security: "User Security",
};

const SettingsPage: React.FC = () => {
  const {
    groupedConfig,
    systemInfo,
    loading,
    saving,
    error,
    successMessage,
    setError,
    setSuccessMessage,
    updateGeneral,
    updateInventory,
    updateSales,
    updateCashier,
    updateNotifications,
    updateDataReports,
    updateIntegrations,
    updateAuditSecurity,
    saveSettings,
    resetToDefaults,
    exportSettings,
    importSettings,
    testSmtpConnection,
    testSmsConnection,
  } = useSettings();

  // Determine which tabs to show based on what the API returned
  const availableTabs = Object.keys(groupedConfig).filter(
    (key) => TAB_LABELS[key] // only show if we have a label
  );

  const [activeTab, setActiveTab] = useState<string>(availableTabs[0] || "general");

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importSettings(file);
      e.target.value = "";
    }
  };

  if (loading && !groupedConfig.general) {
    return (
      <div className="min-h-screen bg-[var(--background-color)] flex items-center justify-center">
        <div className="text-[var(--text-primary)]">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background-color)]">
      <main className="mx-auto px-2 py-2">
        <SettingsHeader
          onSave={saveSettings}
          onReset={resetToDefaults}
          onExport={exportSettings}
          onImport={handleImport}
          saving={saving}
        />

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto underline">
              Dismiss
            </button>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="ml-auto underline">
              Dismiss
            </button>
          </div>
        )}

        {/* {systemInfo && <SystemInfoCard info={systemInfo} />} */}

        <SettingsTabs
          activeTab={activeTab as SettingType}
          onTabChange={setActiveTab}
        />

        <div className="bg-[var(--card-bg)] border border-[var(--border-color)]/20 rounded-lg p-6">
          {activeTab === "general" && (
            <GeneralTab settings={groupedConfig.general} onUpdate={updateGeneral} />
          )}
          {activeTab === "inventory" && (
            <InventoryTab settings={groupedConfig.inventory} onUpdate={updateInventory} />
          )}
          {activeTab === "sales" && (
            <SalesTab settings={groupedConfig.sales} onUpdate={updateSales} />
          )}
          {activeTab === "cashier" && (
            <CashierTab settings={groupedConfig.cashier} onUpdate={updateCashier} />
          )}
          {activeTab === "notifications" && (
            <NotificationsTab
              settings={groupedConfig.notifications}
              onUpdate={updateNotifications}
              onTestSmtp={testSmtpConnection}
              onTestSms={testSmsConnection}
            />
          )}
          {activeTab === "data_reports" && (
            <DataReportsTab settings={groupedConfig.data_reports} onUpdate={updateDataReports} />
          )}
          {activeTab === "integrations" && (
            <IntegrationsTab settings={groupedConfig.integrations} onUpdate={updateIntegrations} />
          )}
          {activeTab === "audit_security" && (
            <AuditSecurityTab settings={groupedConfig.audit_security} onUpdate={updateAuditSecurity} />
          )}
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;