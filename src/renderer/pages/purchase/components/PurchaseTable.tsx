// src/renderer/pages/purchase/components/PurchaseTable.tsx
import React from "react";
import { Eye, Edit, Trash2, ShoppingCart, Tag } from "lucide-react";
import { type Purchase } from "../../../api/purchase";
import Decimal from "decimal.js";

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusStyles = {
    pending: "bg-[var(--status-pending-bg)] text-[var(--status-pending)]",
    approved: "bg-[var(--status-processing-bg)] text-[var(--status-processing)]",
    completed: "bg-[var(--status-completed-bg)] text-[var(--status-completed)]",
    cancelled: "bg-[var(--status-cancelled-bg)] text-[var(--status-cancelled)]",
  };
  const style = statusStyles[status as keyof typeof statusStyles] || "";
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${style}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

interface PurchaseTableProps {
  purchases: Purchase[];
  onView: (purchase: Purchase) => void;
  onStatusUpdate: (purchase: Purchase) => void;
  onEdit: (purchase: Purchase) => void;
  onDelete: (purchase: Purchase) => void;
}

export const PurchaseTable: React.FC<PurchaseTableProps> = ({
  purchases,
  onView,
  onStatusUpdate,
  onEdit,
  onDelete,
}) => {
  if (purchases.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-8 text-center">
        <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
        <p className="text-[var(--text-primary)] font-medium">
          No purchases found
        </p>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          Try adjusting your filters or add a new purchase
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg overflow-hidden flex flex-col">
      <table className="w-full table-fixed">
        <thead className="bg-[var(--table-header-bg)]">
          <tr>
            <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Ref #
            </th>
            <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Date
            </th>
            <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Supplier
            </th>
            <th className="w-1/6 px-4 py-3 text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Status
            </th>
            <th className="w-1/6 px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Total
            </th>
            <th className="w-1/6 px-4 py-3 text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
      </table>
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full table-fixed">
          <tbody className="divide-y divide-[var(--border-color)]">
            {purchases.map((purchase) => (
              <tr
                key={purchase.id}
                onClick={() => onView(purchase)}
                className="hover:bg-[var(--table-row-hover)] transition-colors cursor-pointer"
              >
                <td className="w-1/6 px-4 py-3 text-sm font-mono text-[var(--text-primary)]">
                  {purchase.referenceNo || "—"}
                </td>
                <td className="w-1/6 px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {new Date(purchase.orderDate).toLocaleDateString()}
                </td>
                <td className="w-1/5 px-4 py-3 text-sm text-[var(--text-secondary)] truncate">
                  {purchase.supplier?.name || "—"}
                </td>
                <td className="w-1/6 px-4 py-3 text-center">
                  <StatusBadge status={purchase.status} />
                </td>
                <td className="w-1/6 px-4 py-3 text-right text-sm font-semibold text-[var(--accent-green)]">
                  ₱{new Decimal(purchase.totalAmount).toFixed(2)}
                </td>
                <td className="w-1/6 px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(purchase);
                      }}
                      className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-blue)]"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusUpdate(purchase);
                      }}
                      className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-blue)]"
                      title="Update Status"
                    >
                      <Tag className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(purchase);
                      }}
                      className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-purple)]"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(purchase);
                      }}
                      className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-red)]"
                      title="Delete (Cancel)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
