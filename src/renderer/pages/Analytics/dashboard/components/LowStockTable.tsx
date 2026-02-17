// src/renderer/components/dashboard/LowStockTable.tsx
import React from "react";
import type { InventoryItem } from "../../../../api/dashboard";

interface Props {
  items: InventoryItem[];
  isLoading: boolean;
}

const LowStockTable: React.FC<Props> = ({ items, isLoading }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val);

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)] h-full flex flex-col">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        Low Stock Items
      </h3>
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-10 bg-[var(--card-secondary-bg)] animate-pulse rounded"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-tertiary)]">
            No low stock items
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--card-bg)]">
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium">
                  SKU
                </th>
                <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium">
                  Name
                </th>
                <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium">
                  Qty
                </th>
                <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[var(--border-light)] hover:bg-[var(--card-hover-bg)]"
                >
                  <td className="py-2 px-3 text-[var(--text-primary)]">
                    {item.sku}
                  </td>
                  <td className="py-2 px-3 text-[var(--text-primary)]">
                    {item.name}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={
                        item.stockQty < 10
                          ? "text-[var(--danger-color)] font-bold"
                          : ""
                      }
                    >
                      {item.stockQty}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[var(--text-primary)]">
                    {formatCurrency(item.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LowStockTable;
