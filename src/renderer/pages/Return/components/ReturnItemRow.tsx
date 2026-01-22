import React from 'react';
import { Package, DollarSign, Hash } from 'lucide-react';

interface ReturnItemRowProps {
  item: any;
  isSelected: boolean;
  quantity: number;
  reason: string;
  onToggle: () => void;
  onQuantityChange: (quantity: number) => void;
  onReasonChange: (reason: string) => void;
}

const ReturnItemRow: React.FC<ReturnItemRowProps> = ({
  item,
  isSelected,
  quantity,
  reason,
  onToggle,
  onQuantityChange,
  onReasonChange
}) => {
  const maxQuantity = item.quantity_available;
  const unitPrice = item.unit_price;
  const subtotal = unitPrice * quantity;
  
  return (
    <div className={`return-item-row ${isSelected ? 'selected' : ''}`}>
      <div className="item-selector">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="item-checkbox"
        />
      </div>
      
      <div className="item-details">
        <div className="item-header">
          <Package size={16} />
          <span className="item-name">{item.product_name}</span>
          <span className="item-sku">{item.sku}</span>
        </div>
        
        <div className="item-meta">
          <div className="meta-item">
            <Hash size={14} />
            <span>Sold: {item.quantity_sold}</span>
          </div>
          <div className="meta-item">
            <Hash size={14} />
            <span>Available: {maxQuantity}</span>
          </div>
          <div className="meta-item">
            <DollarSign size={14} />
            <span>Price: ₱{unitPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div className="item-quantity">
        <div className="quantity-controls">
          <button
            onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
            className="btn-quantity minus"
            disabled={quantity <= 0}
          >
            -
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              onQuantityChange(Math.min(maxQuantity, Math.max(0, value)));
            }}
            min="0"
            max={maxQuantity}
            className="quantity-input"
          />
          <button
            onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + 1))}
            className="btn-quantity plus"
            disabled={quantity >= maxQuantity}
          >
            +
          </button>
        </div>
        <div className="quantity-hint">Max: {maxQuantity}</div>
      </div>
      
      <div className="item-subtotal">
        <span className="subtotal-amount">₱{subtotal.toFixed(2)}</span>
      </div>
      
      <div className="item-reason">
        <select
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          className="reason-select"
          disabled={!isSelected}
        >
          <option value="">Select reason...</option>
          <option value="defective">Defective/Damaged</option>
          <option value="wrong_item">Wrong Item</option>
          <option value="customer_change">Customer Changed Mind</option>
          <option value="quality">Quality Issues</option>
          <option value="late_delivery">Late Delivery</option>
          <option value="other">Other</option>
        </select>
        {reason === 'other' && isSelected && (
          <input
            type="text"
            placeholder="Specify reason..."
            className="other-reason-input"
            onChange={(e) => onReasonChange(e.target.value)}
          />
        )}
      </div>
    </div>
  );
};

export default ReturnItemRow;