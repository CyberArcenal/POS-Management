import React from "react";
import { Eye, Package } from "lucide-react";
import { type InventoryMovement } from "../../../api/inventory";
import { formatMovementType, getMovementTypeColor } from "../hooks/useMovements";

interface MovementTableProps {
  movements: InventoryMovement[];
  onView: (movement: InventoryMovement) => void;
}

export const MovementTable: React.FC<MovementTableProps> = ({
  movements,
  onView,
}) => {
  if (movements.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-8 text-center">
        <Package className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
        <p className="text-[var(--text-primary)] font-medium">No movements found</p>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg overflow-hidden flex flex-col">
      {/* Fixed Header */}
      <table className="w-full table-fixed">
        <thead className="bg-[var(--table-header-bg)]">
          <tr>
            <th className="w-20 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">ID</th>
            <th className="w-36 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Date & Time</th>
            <th className="w-1/4 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Product</th>
            <th className="w-20 px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Quantity</th>
            <th className="w-24 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Type</th>
            <th className="w-24 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Source</th>
            <th className="w-24 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Destination</th>
            <th className="w-24 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">User</th>
            <th className="w-20 px-4 py-3 text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
      </table>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full table-fixed">
          <tbody className="divide-y divide-[var(--border-color)]">
            {movements.map((movement) => (
              <tr
                key={movement.id}
                className="hover:bg-[var(--table-row-hover)] transition-colors"
              >
                <td className="w-20 px-4 py-3 text-sm font-mono text-[var(--text-primary)]">#{movement.id}</td>
                <td className="w-36 px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {new Date(movement.timestamp).toLocaleString()}
                </td>
                <td className="w-1/4 px-4 py-3 text-sm text-[var(--text-secondary)] font-medium">
                  {movement.product ? (
                    <div>
                      <span className="font-mono text-[var(--text-tertiary)]">{movement.product.sku}</span>
                      <br />
                      <span>{movement.product.name}</span>
                    </div>
                  ) : (
                    `Product ID: ${movement.productId}`
                  )}
                </td>
                <td className="w-20 px-4 py-3 text-right text-sm font-semibold">
                  <span
                    className={
                      movement.qtyChange > 0
                        ? "text-[var(--accent-green)]"
                        : "text-[var(--accent-red)]"
                    }
                  >
                    {movement.qtyChange > 0 ? "+" : ""}
                    {movement.qtyChange}
                  </span>
                </td>
                <td className="w-24 px-4 py-3 text-sm">
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${getMovementTypeColor(movement.movementType)}20`,
                      color: getMovementTypeColor(movement.movementType),
                    }}
                  >
                    {formatMovementType(movement.movementType)}
                  </span>
                </td>
                <td className="w-24 px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {/* For now, show "System" or derive from notes? */}
                  {movement.notes?.includes("source:") ? movement.notes.split("source:")[1] : "System"}
                </td>
                <td className="w-24 px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {/* For now, show "System" or derive from notes? */}
                  {movement.notes?.includes("dest:") ? movement.notes.split("dest:")[1] : "System"}
                </td>
                <td className="w-24 px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {/* The API doesn't include user, so we show "system" or extract from notes */}
                  System
                </td>
                <td className="w-20 px-4 py-3 text-center">
                  <button
                    onClick={() => onView(movement)}
                    className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-blue)]"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};