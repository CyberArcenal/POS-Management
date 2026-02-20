import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Purchase } from '../../../api/purchase';
import { allowedNextStatuses } from '../utils/statusTransitions';

interface StatusUpdateDialogProps {
  isOpen: boolean;
  purchase: Purchase | null;
  onClose: () => void;
  onConfirm: (newStatus: string) => void;
}

export const StatusUpdateDialog: React.FC<StatusUpdateDialogProps> = ({
  isOpen,
  purchase,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !purchase) return null;

  const allowedStatuses = allowedNextStatuses(purchase.status);
  const [selectedStatus, setSelectedStatus] = useState<string>(
    allowedStatuses.length > 0 ? allowedStatuses[0] : ''
  );

  const handleConfirm = () => {
    if (selectedStatus) {
      onConfirm(selectedStatus);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--card-bg)] rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Update Status – {purchase.referenceNo || `#${purchase.id}`}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--card-hover-bg)] rounded"
          >
            <X className="w-5 h-5 text-[var(--text-tertiary)]" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Current status: <span className="font-medium capitalize">{purchase.status}</span>
          </p>

          {allowedStatuses.length === 0 ? (
            <p className="text-sm text-[var(--status-cancelled)] bg-[var(--status-cancelled-bg)] p-3 rounded">
              This purchase is already in a final state and cannot be changed.
            </p>
          ) : (
            <div className="space-y-2">
              {allowedStatuses.map((status) => (
                <label key={status} className="flex items-center gap-2 p-2 rounded hover:bg-[var(--card-hover-bg)] cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={selectedStatus === status}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="text-[var(--accent-blue)]"
                  />
                  <span className="text-[var(--text-primary)] capitalize">{status}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-[var(--border-color)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)] rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={allowedStatuses.length === 0 || !selectedStatus}
            className="px-4 py-2 text-sm bg-[var(--accent-blue)] text-white rounded hover:bg-[var(--accent-blue-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};