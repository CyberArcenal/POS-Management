// src/renderer/pages/Settings/index.tsx
import React, { useState } from "react";
import { useSettings } from "./hooks/useSettings";
import { SettingType } from "../../api/system_config";
import SettingsTabs from "./components/SettingsTabs";
import GeneralTab from "./components/GeneralTab";
import UsersRolesTab from "./components/UsersRolesTab";
import InventoryTab from "./components/InventoryTab";
import SalesTab from "./components/SalesTab";
import NotificationsTab from "./components/NotificationsTab";
import CashierTab from "./components/CashierTab";
import DataReportsTab from "./components/DataReportsTab";
import IntegrationsTab from "./components/IntegrationsTab";
import AuditSecurityTab from "./components/AuditSecurityTab";
import UserSecurityTab from "./components/UserSecurityTab";
import SettingsHeader from "./components/SettingsHeader";

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingType>("general");
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
    updateUsersRoles,
    updateInventory,
    updateSales,
    updateCashier,
    updateNotifications,
    updateDataReports,
    updateIntegrations,
    updateAuditSecurity,
    updateUserSecurity,
    saveSettings,
    resetToDefaults,
    exportSettings,
    importSettings,
    testSmtpConnection,
    testSmsConnection,
  } = useSettings();

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

        <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="bg-[var(--card-bg)] border border-[var(--border-color)]/20 rounded-lg p-6">
          {activeTab === "general" && (
            <GeneralTab settings={groupedConfig.general} onUpdate={updateGeneral} />
          )}
          {activeTab === "users_roles" && (
            <UsersRolesTab settings={groupedConfig.users_roles} onUpdate={updateUsersRoles} />
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
          {activeTab === "user_security" && (
            <UserSecurityTab settings={groupedConfig.user_security} onUpdate={updateUserSecurity} />
          )}
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;