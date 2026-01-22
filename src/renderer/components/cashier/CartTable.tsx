// src/components/cashier/CartTable.tsx
import React from 'react';
import { useCart } from '../../hooks/useCart';
import type { CartItem } from '../../contexts/CartContext';

interface CartTableProps {
  onItemClick?: (item: CartItem) => void;
  showActions?: boolean;
  compact?: boolean;
}

const CartTable: React.FC<CartTableProps> = ({
  onItemClick,
  showActions = true,
  compact = false,
}) => {
  const { state, removeItem, updateQuantity, updateDiscount } = useCart();
  const { items } = state;

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-var(--card-bg) rounded-lg border border-var(--border-color)">
        <div className="text-var(--text-tertiary) mb-3">
          <svg className="w-16 h-16 mx-auto opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-var(--text-secondary) mb-2">Cart is Empty</h3>
        <p className="text-sm text-var(--text-tertiary)">Scan items or add products to get started</p>
      </div>
    );
  }

  return (
    <div className="cart-table-container bg-var(--card-bg) rounded-lg border border-var(--border-color) overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full transaction-table">
          <thead>
            <tr>
              <th className="text-left py-3 px-4">Item</th>
              <th className="text-center py-3 px-4">Price</th>
              <th className="text-center py-3 px-4">Qty</th>
              <th className="text-center py-3 px-4">Discount</th>
              <th className="text-center py-3 px-4">Subtotal</th>
              {showActions && <th className="text-center py-3 px-4">Actions</th>}
            </tr>
          </thead>
          <tbody className="pos-scrollbar">
            {items.map((item) => (
              <tr
                key={item.id}
                onClick={() => onItemClick?.(item)}
                className="hover:bg-var(--table-row-hover) transition-colors cursor-pointer"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {!compact && (
                      <div className="w-10 h-10 bg-var(--card-secondary-bg) rounded flex items-center justify-center">
                        <span className="text-sm font-medium text-var(--text-secondary)">
                          {item.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-var(--text-primary)">{item.name}</div>
                      <div className="text-sm text-var(--text-tertiary)">{item.sku}</div>
                      {item.stock <= 5 && (
                        <div className={`text-xs mt-1 ${item.stock === 0 ? 'text-var(--accent-red)' : 'text-var(--accent-amber)'}`}>
                          Stock: {item.stock}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="text-center py-3 px-4">
                  <div className="font-medium text-var(--text-primary)">₱{item.price.toFixed(2)}</div>
                </td>
                <td className="text-center py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.id, item.quantity - 1);
                      }}
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 flex items-center justify-center bg-var(--card-secondary-bg) hover:bg-var(--card-hover-bg) rounded disabled:opacity-50"
                    >
                      <span className="text-lg">−</span>
                    </button>
                    <div className="w-12 text-center font-medium">{item.quantity}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateQuantity(item.id, item.quantity + 1);
                      }}
                      disabled={item.quantity >= item.stock}
                      className="w-8 h-8 flex items-center justify-center bg-var(--card-secondary-bg) hover:bg-var(--card-hover-bg) rounded disabled:opacity-50"
                    >
                      <span className="text-lg">+</span>
                    </button>
                  </div>
                </td>
                <td className="text-center py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-var(--text-tertiary)">₱</span>
                    <input
                      type="number"
                      value={item.discount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        updateDiscount(item.id, Math.min(value, item.price));
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-20 px-2 py-1 bg-var(--input-bg) border border-var(--input-border) rounded text-center"
                      min="0"
                      max={item.price}
                      step="0.01"
                    />
                  </div>
                </td>
                <td className="text-center py-3 px-4">
                  <div className="font-bold text-var(--text-primary)">
                    ₱{((item.price - item.discount) * item.quantity).toFixed(2)}
                  </div>
                  {item.discount > 0 && (
                    <div className="text-xs text-var(--text-tertiary) line-through">
                      ₱{(item.price * item.quantity).toFixed(2)}
                    </div>
                  )}
                </td>
                {showActions && (
                  <td className="text-center py-3 px-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(item.id);
                      }}
                      className="p-2 text-var(--accent-red) hover:bg-var(--accent-red-light) rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CartTable;