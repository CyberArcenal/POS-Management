import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: boolean | null;
  trueLabel?: string;
  falseLabel?: string;
  trueColor?: string;
  falseColor?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  trueLabel = 'Yes',
  falseLabel = 'No',
  trueColor = 'var(--status-completed)',
  falseColor = 'var(--status-cancelled)',
}) => {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: status ? 'var(--status-completed-bg)' : 'var(--status-cancelled-bg)',
        color: status ? trueColor : falseColor,
      }}
    >
      {status ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      {status ? trueLabel : falseLabel}
    </span>
  );
};

export const LoadingBadge: React.FC = () => (
  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[var(--status-pending-bg)] text-[var(--status-pending)]">
    <AlertCircle className="w-3 h-3 animate-pulse" />
    Loading...
  </span>
);