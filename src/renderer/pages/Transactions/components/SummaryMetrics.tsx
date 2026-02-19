import React from "react";
import Decimal from "decimal.js";
import { format } from "date-fns";
import type { Sale } from "../../../api/sale";

interface SummaryMetricsProps {
  transactions: Sale[];
}

export const SummaryMetrics: React.FC<SummaryMetricsProps> = ({ transactions }) => {
  const today = format(new Date(), "yyyy-MM-dd");

  const todayTransactions = transactions.filter((t) => {
    const transactionDate =
      (t.timestamp as any) instanceof Date
        ? format(t.timestamp, "yyyy-MM-dd")
        : (t.timestamp as string).split("T")[0];
    return transactionDate === today && t.status === "paid";
  });

  const totalRevenue = todayTransactions.reduce(
    (sum, t) => sum.plus(t.totalAmount),
    new Decimal(0)
  );

  const avgValue =
    todayTransactions.length > 0
      ? totalRevenue.div(todayTransactions.length)
      : new Decimal(0);

  const refundCount = transactions.filter((t) => {
    const transactionDate =
      (t.timestamp as any) instanceof Date
        ? format(t.timestamp, "yyyy-MM-dd")
        : (t.timestamp as string).split("T")[0];
    return t.status === "refunded" && transactionDate === today;
  }).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <p className="text-sm text-[var(--text-tertiary)]">Today's Transactions</p>
        <p className="text-2xl font-bold text-[var(--text-primary)]">
          {todayTransactions.length}
        </p>
      </div>
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <p className="text-sm text-[var(--text-tertiary)]">Today's Revenue</p>
        <p className="text-2xl font-bold text-[var(--accent-green)]">
          ₱{totalRevenue.toFixed(2)}
        </p>
      </div>
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <p className="text-sm text-[var(--text-tertiary)]">Average Ticket</p>
        <p className="text-2xl font-bold text-[var(--accent-blue)]">
          ₱{avgValue.toFixed(2)}
        </p>
      </div>
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <p className="text-sm text-[var(--text-tertiary)]">Refunds Today</p>
        <p className="text-2xl font-bold text-[var(--accent-red)]">
          {refundCount}
        </p>
      </div>
    </div>
  );
};