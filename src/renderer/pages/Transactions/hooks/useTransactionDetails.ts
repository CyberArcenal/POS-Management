import { useState } from "react";
import type { Sale } from "../../../api/sale";

export function useTransactionDetails() {
  const [selectedTransaction, setSelectedTransaction] = useState<Sale | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const openDetails = (transaction: Sale) => {
    setSelectedTransaction(transaction);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedTransaction(null);
  };

  return {
    selectedTransaction,
    detailsOpen,
    openDetails,
    closeDetails,
  };
}