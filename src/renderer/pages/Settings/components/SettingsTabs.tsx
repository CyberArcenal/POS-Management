// src/renderer/pages/Settings/components/SettingsTabs.tsx
import React from "react";
import { SettingType } from "../../../api/system_config";

const tabs: { id: SettingType; label: string }[] = [
  { id: "general", label: "General" },
  { id: "inventory", label: "Inventory" },
  { id: "sales", label: "Sales" },
  { id: "cashier", label: "Cashier" },
  { id: "notifications", label: "Notifications" },
  { id: "data_reports", label: "Data & Reports" },
  { id: "integrations", label: "Integrations" },
  { id: "audit_security", label: "Audit & Security" },
];

interface Props {
  activeTab: SettingType;
  onTabChange: (tab: SettingType) => void;
}

const SettingsTabs: React.FC<Props> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4 border-b border-[var(--border-color)] pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 rounded-t-lg transition-colors duration-200 text-sm font-medium ${
            activeTab === tab.id
              ? "bg-[var(--primary-color)] text-white"
              : "text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)] hover:text-white"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default SettingsTabs;