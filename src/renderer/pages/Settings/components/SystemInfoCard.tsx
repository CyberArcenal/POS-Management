// src/renderer/pages/Settings/components/SystemInfoCard.tsx
import React from "react";
import type { SystemInfoData } from "../../../api/system_config";
import { Info, Clock, Tag, Server, Shield, Bug } from "lucide-react";

interface Props {
  info: SystemInfoData;
}

const SystemInfoCard: React.FC<Props> = ({ info }) => {
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-[var(--card-bg)] to-[var(--card-secondary-bg)] border border-[var(--border-color)]/20 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-5 h-5 text-[var(--primary-color)]" />
        <h2 className="text-md font-semibold text-[var(--text-primary)]">System Information</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="flex items-start gap-2">
          <Tag className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5" />
          <div>
            <p className="text-[var(--text-tertiary)] text-xs">Version</p>
            <p className="text-[var(--text-primary)] font-medium">{info.version}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Server className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5" />
          <div>
            <p className="text-[var(--text-tertiary)] text-xs">Environment</p>
            <p className="text-[var(--text-primary)] font-medium capitalize">
              {info.environment}
              {info.debug_mode && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs bg-[var(--accent-amber-light)] text-[var(--accent-amber)] px-2 py-0.5 rounded-full">
                  <Bug className="w-3 h-3" />
                  Debug
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5" />
          <div>
            <p className="text-[var(--text-tertiary)] text-xs">Current Time</p>
            <p className="text-[var(--text-primary)] font-medium">
              {new Date(info.current_time).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-[var(--text-tertiary)] mt-0.5" />
          <div>
            <p className="text-[var(--text-tertiary)] text-xs">Timezone</p>
            <p className="text-[var(--text-primary)] font-medium">{info.timezone}</p>
          </div>
        </div>
      </div>

      {info.setting_types && info.setting_types.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--border-color)]/20">
          <p className="text-xs text-[var(--text-tertiary)] mb-1">Setting Categories</p>
          <div className="flex flex-wrap gap-2">
            {info.setting_types.map((type) => (
              <span
                key={type}
                className="px-2 py-1 bg-[var(--card-hover-bg)] text-[var(--text-secondary)] text-xs rounded-md border border-[var(--border-color)]/30"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemInfoCard;