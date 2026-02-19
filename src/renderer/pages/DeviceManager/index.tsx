import React from "react";
import { Printer, CreditCard, AlertCircle } from "lucide-react";
import { useDevices } from "./hooks/useDevices";
import { DeviceCard } from "./components/DeviceCard";
import { dialogs } from "../../utils/dialogs";

const DeviceManagerPage: React.FC = () => {
  const {
    printerStatus,
    cashDrawerStatus,
    printerAvailable,
    cashDrawerAvailable,
    loading,
    error,
    reloadPrinter,
    reloadCashDrawer,
    checkPrinterAvailable,
    checkCashDrawerAvailable,
  } = useDevices();

  // Test actions (could be extended to actually print/open)
  const testPrinter = async () => {
    await window.backendAPI.printerTestPrint();
  };

  const openDrawer = async () => {
    await window.backendAPI.cashDrawerOpen();
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background-color)] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Device Manager
        </h1>
        <div className="text-sm text-[var(--text-tertiary)]">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Global error */}
      {error && (
        <div className="mb-4 p-3 bg-[var(--status-cancelled-bg)] border border-[var(--accent-red)] rounded-lg flex items-center gap-2 text-[var(--accent-red)]">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Device grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Printer Card */}
        <DeviceCard
          title="Receipt Printer"
          icon={<Printer className="w-6 h-6" />}
          status={{
            driverLoaded: printerStatus?.driverLoaded,
            isReady: printerStatus?.isReady,
          }}
          available={printerAvailable}
          loading={{
            main: loading.printer,
            available: loading.available,
          }}
          onReload={reloadPrinter}
          onCheckAvailability={checkPrinterAvailable}
          additionalActions={
            <button
              onClick={testPrinter}
              className="flex-1 px-3 py-1.5 text-xs bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] transition-colors"
            >
              Test Print
            </button>
          }
        />

        {/* Cash Drawer Card */}
        <DeviceCard
          title="Cash Drawer"
          icon={<CreditCard className="w-6 h-6" />}
          status={{
            driverLoaded: cashDrawerStatus?.driverLoaded,
            isOpen: cashDrawerStatus?.isOpen,
          }}
          available={cashDrawerAvailable}
          loading={{
            main: loading.drawer,
            available: loading.available,
          }}
          onReload={reloadCashDrawer}
          onCheckAvailability={checkCashDrawerAvailable}
          additionalActions={
            <button
              onClick={openDrawer}
              className="flex-1 px-3 py-1.5 text-xs bg-[var(--accent-green)] text-white rounded-lg hover:bg-[var(--accent-green-hover)] transition-colors"
            >
              Open Drawer
            </button>
          }
        />
      </div>

      {/* Optional note about device setup */}
      <div className="mt-6 p-4 bg-[var(--card-secondary-bg)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-tertiary)]">
        <p>
          <strong>Note:</strong> Device drivers must be installed separately.
          Use the reload buttons after connecting or updating drivers. The
          "Available" status indicates whether the device is detected by the
          system.
        </p>
      </div>
    </div>
  );
};

export default DeviceManagerPage;
