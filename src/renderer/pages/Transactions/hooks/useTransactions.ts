import { useState, useEffect, useCallback } from "react";
import saleAPI, { type Sale } from "../../../api/sale";
import { dialogs } from "../../../utils/dialogs";

export type PaymentMethod = "cash" | "card" | "wallet";
export type SaleStatus = "initiated" | "paid" | "refunded" | "voided";

export interface TransactionFilters {
  startDate: string;
  endDate: string;
  search: string;
  paymentMethod: PaymentMethod | "";
  status: SaleStatus | "";
}

export function useTransactions(initialFilters: TransactionFilters) {
  const [transactions, setTransactions] = useState<Sale[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Sale[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await saleAPI.getAll({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        paymentMethod: filters.paymentMethod || undefined,
        status: filters.status || undefined,
        search: filters.search || undefined,
        sortBy: "timestamp",
        sortOrder: "DESC",
      });
      if (response.status) {
        setTransactions(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load transactions");
      await dialogs.alert({ title: "Error", message: err.message });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Apply local filters (if any) – currently we rely on backend filtering
  useEffect(() => {
    setFilteredTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    transactions: filteredTransactions,
    filters,
    setFilters,
    loading,
    error,
    reload: loadTransactions,
  };
}