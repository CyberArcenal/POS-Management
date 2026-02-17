// src/renderer/components/dashboard/TopProductsTable.tsx
import React from "react";
import type { TopProduct } from "../../../../api/dashboard";

interface Props {
  products: TopProduct[];
  isLoading: boolean;
}

const TopProductsTable: React.FC<Props> = ({ products, isLoading }) => {
  const formatNumber = (val: number) => val.toLocaleString();
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val);

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)] h-full flex flex-col">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        Top Products
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
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-tertiary)]">
            No sales data
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--card-bg)]">
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium">
                  Product
                </th>
                <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium">
                  Qty Sold
                </th>
                <th className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.productId}
                  className="border-b border-[var(--border-light)] hover:bg-[var(--card-hover-bg)]"
                >
                  <td className="py-2 px-3 text-[var(--text-primary)]">
                    {product.productName}
                  </td>
                  <td className="py-2 px-3 text-[var(--text-primary)]">
                    {formatNumber(product.totalQuantity)}
                  </td>
                  <td className="py-2 px-3 text-[var(--text-primary)]">
                    {formatCurrency(product.totalRevenue)}
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

export default TopProductsTable;
