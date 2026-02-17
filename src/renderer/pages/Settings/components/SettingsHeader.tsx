// src/renderer/pages/Settings/components/SettingsHeader.tsx
import React, { useRef } from "react";
import { Save, RotateCcw, Download, Upload, Loader2 } from "lucide-react";

interface Props {
  onSave: () => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saving: boolean;
}

const SettingsHeader: React.FC<Props> = ({
  onSave,
  onReset,
  onExport,
  onImport,
  saving,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-[var(--card-bg)] border border-[var(--border-color)]/20 rounded-lg">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">System Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Configure your POS system preferences
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Import Button */}
        <button
          onClick={handleImportClick}
          className="windows-button windows-button-secondary flex items-center gap-2 px-4 py-2 text-sm"
          title="Import settings from JSON file"
        >
          <Upload className="w-4 h-4" />
          Import
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onImport}
          accept=".json,application/json"
          className="hidden"
        />

        {/* Export Button */}
        <button
          onClick={onExport}
          className="windows-button windows-button-secondary flex items-center gap-2 px-4 py-2 text-sm"
          title="Export settings to JSON file"
        >
          <Download className="w-4 h-4" />
          Export
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="windows-button windows-button-secondary flex items-center gap-2 px-4 py-2 text-sm text-[var(--danger-color)] hover:bg-[var(--danger-color)]/10"
          title="Reset all settings to defaults"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={saving}
          className="windows-button windows-button-primary flex items-center gap-2 px-6 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SettingsHeader;