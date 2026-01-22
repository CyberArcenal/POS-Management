import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Package, DollarSign, Clock } from 'lucide-react';
import ReturnItemRow from './ReturnItemRow';
import RefundButton from './RefundButton';

interface ReturnDetailModalProps {
  transaction: any;
  isOpen: boolean;
  onClose: () => void;
  onProcessRefund: (data: any) => Promise<void>;
  currentUser: any;
}

const ReturnDetailModal: React.FC<ReturnDetailModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onProcessRefund,
  currentUser
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [itemQuantities, setItemQuantities] = useState<Record<number, number>>({});
  const [itemReasons, setItemReasons] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    if (transaction?.items) {
      // Initialize quantities with available amounts
      const initialQuantities: Record<number, number> = {};
      transaction.items.forEach((item: any) => {
        initialQuantities[item.id] = Math.min(1, item.quantity_available);
      });
      setItemQuantities(initialQuantities);
    }
  }, [transaction]);
  
  if (!isOpen || !transaction) return null;
  
  const handleItemToggle = (itemId: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };
  
  const handleQuantityChange = (itemId: number, quantity: number) => {
    const item = transaction.items.find((i: any) => i.id === itemId);
    if (item) {
      const maxQuantity = item.quantity_available;
      const newQuantity = Math.max(0, Math.min(quantity, maxQuantity));
      setItemQuantities(prev => ({
        ...prev,
        [itemId]: newQuantity
      }));
    }
  };
  
  const handleReasonChange = (itemId: number, reason: string) => {
    setItemReasons(prev => ({
      ...prev,
      [itemId]: reason
    }));
  };
  
  const calculateRefundTotal = () => {
    let total = 0;
    selectedItems.forEach(itemId => {
      const item = transaction.items.find((i: any) => i.id === itemId);
      const quantity = itemQuantities[itemId] || 0;
      if (item) {
        total += (item.unit_price * quantity);
      }
    });
    return total;
  };
  
  const handleProcessRefund = async () => {
    if (selectedItems.size === 0) {
      alert('Please select at least one item to return');
      return;
    }
    
    const itemsToRefund = Array.from(selectedItems).map(itemId => {
      const item = transaction.items.find((i: any) => i.id === itemId);
      return {
        id: itemId,
        product_id: item.product_id,
        quantity: itemQuantities[itemId] || 0,
        reason: itemReasons[itemId] || 'Customer request'
      };
    }).filter(item => item.quantity > 0);
    
    if (itemsToRefund.length === 0) {
      alert('Please specify quantities for selected items');
      return;
    }
    
    setIsProcessing(true);
    try {
      await onProcessRefund({
        items: itemsToRefund,
        notes,
        refund_type: itemsToRefund.length === transaction.items.length ? 'full' : 'partial'
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const refundTotal = calculateRefundTotal();
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="return-detail-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-left">
            <h2 className="modal-title">
              Return Transaction #{transaction.receipt_number}
            </h2>
            <div className="transaction-meta">
              <span className="customer-name">{transaction.customer_name}</span>
              <span className="transaction-date">
                {new Date(transaction.datetime).toLocaleDateString()}
              </span>
              <span className="original-total">
                Original: ₱{Number(transaction.total).toFixed(2)}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-close-modal">
            <X size={24} />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="modal-content">
          {/* Items Selection */}
          <div className="section items-selection">
            <h3 className="section-title">
              <Package size={20} />
              Select Items to Return
            </h3>
            <div className="items-list">
              {transaction.items?.map((item: any) => (
                <ReturnItemRow
                  key={item.id}
                  item={item}
                  isSelected={selectedItems.has(item.id)}
                  quantity={itemQuantities[item.id] || 0}
                  reason={itemReasons[item.id] || ''}
                  onToggle={() => handleItemToggle(item.id)}
                  onQuantityChange={(qty) => handleQuantityChange(item.id, qty)}
                  onReasonChange={(reason) => handleReasonChange(item.id, reason)}
                />
              ))}
            </div>
          </div>
          
          {/* Refund Summary */}
          <div className="section refund-summary">
            <h3 className="section-title">
              <DollarSign size={20} />
              Refund Summary
            </h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Items Selected</span>
                <span className="summary-value">{selectedItems.size}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Refund Amount</span>
                <span className="summary-value highlight">
                  ₱{refundTotal.toFixed(2)}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Payment Method</span>
                <span className="summary-value">
                  {transaction.payment_method}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Refund To</span>
                <span className="summary-value">
                  {transaction.payment_method === 'cash' ? 'Cash' : 'Original Method'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Notes & Reason */}
          <div className="section notes-section">
            <h3 className="section-title">
              <AlertTriangle size={20} />
              Additional Notes
            </h3>
            <textarea
              className="notes-textarea"
              placeholder="Enter reason for return, customer feedback, or any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          
          {/* Processing Info */}
          <div className="section processing-info">
            <div className="info-item">
              <Clock size={16} />
              <span>Processed by: {currentUser?.name}</span>
            </div>
            <div className="info-item">
              <CheckCircle size={16} />
              <span>Time: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel" disabled={isProcessing}>
            Cancel
          </button>
          <RefundButton
            onProcessRefund={handleProcessRefund}
            disabled={selectedItems.size === 0 || isProcessing || refundTotal <= 0}
            isLoading={isProcessing}
            refundAmount={refundTotal}
          />
        </div>
      </div>
    </div>
  );
};

export default ReturnDetailModal;