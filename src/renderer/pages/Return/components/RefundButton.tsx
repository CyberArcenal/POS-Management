import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

interface RefundButtonProps {
  onProcessRefund: () => Promise<void>;
  disabled: boolean;
  isLoading: boolean;
  refundAmount: number;
}

const RefundButton: React.FC<RefundButtonProps> = ({
  onProcessRefund,
  disabled,
  isLoading,
  refundAmount
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleClick = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    
    try {
      await onProcessRefund();
      setShowConfirm(false);
    } catch (error) {
      // Error is handled by parent
    }
  };
  
  const handleCancel = () => {
    setShowConfirm(false);
  };
  
  return (
    <div className="refund-button-container">
      {showConfirm ? (
        <div className="confirmation-dialog">
          <div className="confirmation-header">
            <AlertTriangle size={24} className="warning-icon" />
            <h4>Confirm Refund</h4>
          </div>
          <p className="confirmation-message">
            Are you sure you want to process a refund of <strong>₱{refundAmount.toFixed(2)}</strong>?
            This action cannot be undone.
          </p>
          <div className="confirmation-actions">
            <button onClick={handleCancel} className="btn-cancel-confirm">
              Cancel
            </button>
            <button 
              onClick={handleClick}
              disabled={isLoading}
              className="btn-confirm-refund"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Confirm Refund
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleClick}
          disabled={disabled}
          className="btn-process-refund"
        >
          {isLoading ? (
            <>
              <RefreshCw className="animate-spin" size={16} />
              Processing Refund...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Process Refund
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default RefundButton;