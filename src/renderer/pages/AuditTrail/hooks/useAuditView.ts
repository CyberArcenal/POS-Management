import { useState, useCallback } from "react";
import type { AuditLogEntry } from "../../../api/audit";
import auditAPI from "../../../api/audit";

export const useAuditView = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [log, setLog] = useState<AuditLogEntry | null>(null);
  const [loading, setLoading] = useState(false);

  const open = useCallback(async (log: AuditLogEntry) => {
    setIsOpen(true);
    setLoading(true);
    try {
      // Fetch full details using the ID
      const response = await auditAPI.getById(log.id);
      if (response.status && response.data) {
        setLog(response.data); // full details including oldData, newData, etc.
      } else {
        console.error("Failed to load audit log details", response.message);
        // fallback to the basic log if fetch fails
        setLog(log);
      }
    } catch (error) {
      console.error("Failed to load audit log details", error);
      setLog(log);
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setLog(null);
  }, []);

  return { isOpen, log, loading, open, close };
};