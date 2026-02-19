import React from 'react';
import { RefreshCw, Loader2 } from 'lucide-react'; // added Loader2
import { StatusBadge, LoadingBadge } from './StatusBadge';

interface DeviceCardProps {
  title: string;
  icon: React.ReactNode;
  status: {
    driverLoaded?: boolean | null;
    isReady?: boolean | null;
    isOpen?: boolean | null;
  };
  available?: boolean | null;
  loading: {
    main?: boolean;
    available?: boolean;
  };
  onReload: () => void;
  onCheckAvailability?: () => void;
  additionalActions?: React.ReactNode;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  title,
  icon,
  status,
  available,
  loading,
  onReload,
  onCheckAvailability,
  additionalActions,
}) => {
  return (
    <div
      className={`bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-5 transition-all ${
        loading.main ? 'animate-pulse-border' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="text-[var(--accent-blue)]">{icon}</div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        </div>
        <button
          onClick={onReload}
          disabled={loading.main}
          className="p-2 hover:bg-[var(--card-hover-bg)] rounded-lg transition-colors disabled:opacity-50"
          title="Reload driver"
        >
          <RefreshCw
            className={`w-4 h-4 text-[var(--text-secondary)] ${
              loading.main ? 'animate-spin' : ''
            }`}
          />
        </button>
      </div>

      <div className="space-y-3">
        {/* Driver loaded */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--text-tertiary)]">Driver loaded</span>
          {status.driverLoaded === undefined ? (
            <LoadingBadge />
          ) : (
            <StatusBadge status={status.driverLoaded} />
          )}
        </div>

        {/* Ready / Open status */}
        {status.isReady !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--text-tertiary)]">Ready</span>
            {status.isReady === undefined ? (
              <LoadingBadge />
            ) : (
              <StatusBadge status={status.isReady} />
            )}
          </div>
        )}
        {status.isOpen !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--text-tertiary)]">Drawer open</span>
            {status.isOpen === undefined ? (
              <LoadingBadge />
            ) : (
              <StatusBadge
                status={status.isOpen}
                trueLabel="Open"
                falseLabel="Closed"
                trueColor="var(--status-pending)"
                falseColor="var(--status-completed)"
              />
            )}
          </div>
        )}

        {/* Availability */}
        {available !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--text-tertiary)]">Available</span>
            {loading.available ? (
              <LoadingBadge />
            ) : (
              <StatusBadge status={available} />
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        {onCheckAvailability && (
          <button
            onClick={onCheckAvailability}
            disabled={loading.available}
            className="flex-1 px-3 py-1.5 text-xs border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)] transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {loading.available ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Checking...
              </>
            ) : (
              'Check availability'
            )}
          </button>
        )}
        {additionalActions}
      </div>
    </div>
  );
};