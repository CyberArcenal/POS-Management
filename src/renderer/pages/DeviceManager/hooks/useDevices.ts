import { useState, useCallback, useEffect } from "react";

export interface PrinterStatus {
  driverLoaded: boolean;
  isReady: boolean;
}

export interface CashDrawerStatus {
  driverLoaded: boolean;
  isOpen: boolean;
}

export function useDevices() {
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus | null>(
    null,
  );
  const [cashDrawerStatus, setCashDrawerStatus] =
    useState<CashDrawerStatus | null>(null);
  const [printerAvailable, setPrinterAvailable] = useState<boolean | null>(
    null,
  );
  const [cashDrawerAvailable, setCashDrawerAvailable] = useState<
    boolean | null
  >(null);
  const [loading, setLoading] = useState({
    printer: false,
    drawer: false,
    available: false,
  });
  const [error, setError] = useState<string | null>(null);

  const api = window.backendAPI;

  const reloadPrinter = useCallback(async () => {
    if (!api?.printerReload) return;
    setLoading((prev) => ({ ...prev, printer: true }));
    try {
      const status = await api.printerReload();
      setPrinterStatus(status);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to reload printer");
      api.log?.error("Printer reload failed", err);
    } finally {
      setLoading((prev) => ({ ...prev, printer: false }));
    }
  }, [api]);

  const reloadCashDrawer = useCallback(async () => {
    if (!api?.cashDrawerReload) return;
    setLoading((prev) => ({ ...prev, drawer: true }));
    try {
      const status = await api.cashDrawerReload();
      setCashDrawerStatus(status);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to reload cash drawer");
      api.log?.error("Cash drawer reload failed", err);
    } finally {
      setLoading((prev) => ({ ...prev, drawer: false }));
    }
  }, [api]);

  const checkPrinterAvailable = useCallback(async () => {
    if (!api?.printerAvailable) return;
    setLoading((prev) => ({ ...prev, available: true }));
    try {
      const available = await api.printerAvailable();
      setPrinterAvailable(available);
    } catch (err: any) {
      api.log?.error("Printer availability check failed", err);
    } finally {
      setLoading((prev) => ({ ...prev, available: false }));
    }
  }, [api]);

  const checkCashDrawerAvailable = useCallback(async () => {
    if (!api?.cashDrawerAvailable) return;
    setLoading((prev) => ({ ...prev, available: true }));
    try {
      const available = await api.cashDrawerAvailable();
      setCashDrawerAvailable(available);
    } catch (err: any) {
      api.log?.error("Cash drawer availability check failed", err);
    } finally {
      setLoading((prev) => ({ ...prev, available: false }));
    }
  }, [api]);

  // Initial load
  useEffect(() => {
    reloadPrinter();
    reloadCashDrawer();
    checkPrinterAvailable();
    checkCashDrawerAvailable();
  }, [
    reloadPrinter,
    reloadCashDrawer,
    checkPrinterAvailable,
    checkCashDrawerAvailable,
  ]);

  return {
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
  };
}
