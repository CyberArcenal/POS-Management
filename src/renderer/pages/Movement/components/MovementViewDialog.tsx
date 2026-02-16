import React from "react";
import { X, Package, Calendar, User, Hash, MapPin, FileText, ExternalLink } from "lucide-react";
import { type InventoryMovement } from "../../../api/inventory";
import { formatMovementType, getMovementTypeColor } from "../hooks/useMovements";

interface MovementViewDialogProps {
  isOpen: boolean;
  movement: InventoryMovement | null;
  onClose: () => void;
}

export const MovementViewDialog: React.FC<MovementViewDialogProps> = ({
  isOpen,
  movement,
  onClose,
}) => {
  if (!isOpen || !movement) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
        <div className="relative bg-[var(--card-bg)] rounded-lg w-full max-w-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Movement Details #{movement.id}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-[var(--card-hover-bg)] rounded">
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Product Info */}
            <div className="bg-[var(--card-secondary-bg)] rounded-lg p-4 border border-[var(--border-color)]">
              <h3 className="text-md font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Product
              </h3>
              {movement.product ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-[var(--text-tertiary)]">SKU</p>
                    <p className="font-mono text-[var(--text-primary)]">{movement.product.sku}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-tertiary)]">Name</p>
                    <p className="text-[var(--text-primary)]">{movement.product.name}</p>
                  </div>
                  {movement.product.description && (
                    <div className="col-span-2">
                      <p className="text-[var(--text-tertiary)]">Description</p>
                      <p className="text-[var(--text-secondary)]">{movement.product.description}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[var(--text-secondary)]">Product ID: {movement.productId}</p>
              )}
            </div>

            {/* Movement Details */}
            <div className="bg-[var(--card-secondary-bg)] rounded-lg p-4 border border-[var(--border-color)]">
              <h3 className="text-md font-semibold text-[var(--text-primary)] mb-2">Movement</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[var(--text-tertiary)] flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Date & Time
                  </p>
                  <p className="text-[var(--text-primary)]">{new Date(movement.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[var(--text-tertiary)]">Type</p>
                  <p
                    className="inline-flex px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${getMovementTypeColor(movement.movementType)}20`,
                      color: getMovementTypeColor(movement.movementType),
                    }}
                  >
                    {formatMovementType(movement.movementType)}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-tertiary)]">Quantity</p>
                  <p
                    className={`font-semibold ${
                      movement.qtyChange > 0 ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"
                    }`}
                  >
                    {movement.qtyChange > 0 ? "+" : ""}
                    {movement.qtyChange}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-tertiary)] flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Source
                  </p>
                  <p className="text-[var(--text-primary)]">
                    {movement.notes?.includes("source:") ? movement.notes.split("source:")[1] : "System"}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-tertiary)] flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Destination
                  </p>
                  <p className="text-[var(--text-primary)]">
                    {movement.notes?.includes("dest:") ? movement.notes.split("dest:")[1] : "System"}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-tertiary)] flex items-center gap-1">
                    <User className="w-3 h-3" /> User
                  </p>
                  <p className="text-[var(--text-primary)]">
                    {/* Could be extracted from notes or API later */}
                    System
                  </p>
                </div>
                {movement.saleId && (
                  <div>
                    <p className="text-[var(--text-tertiary)] flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Linked Sale
                    </p>
                    <a
                      href={`/sales/${movement.saleId}`}
                      className="text-[var(--accent-blue)] hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      #{movement.saleId}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {movement.notes && (
              <div className="bg-[var(--card-secondary-bg)] rounded-lg p-4 border border-[var(--border-color)]">
                <h3 className="text-md font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </h3>
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                  {movement.notes}
                </p>
              </div>
            )}

            {/* Audit Info (placeholder) */}
            <div className="bg-[var(--card-secondary-bg)] rounded-lg p-4 border border-[var(--border-color)]">
              <h3 className="text-md font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Audit Trail
              </h3>
              <p className="text-xs text-[var(--text-tertiary)]">
                Created: {new Date(movement.timestamp).toLocaleString()}<br />
                Last Updated: {movement.updatedAt ? new Date(movement.updatedAt).toLocaleString() : "Never"}
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};