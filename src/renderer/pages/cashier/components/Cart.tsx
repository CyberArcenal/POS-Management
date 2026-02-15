import React from 'react';
import { ShoppingCart } from 'lucide-react';
import Decimal from 'decimal.js';
import type { CartItem as CartItemType, Customer, PaymentMethod } from '../types';
import CartItem from './CartItem';
import CustomerSearch from './CustomerSearch';
import LoyaltyRedemption from './LoyaltyRedemption';
import PaymentMethodSelector from './PaymentMethodSelector';
import TotalsDisplay from './TotalsDisplay';
import CheckoutButton from './CheckoutButton';
import {
  calculateSubtotal,
  calculateCartTotal,
  calculateMaxRedeemable,
} from '../utils';

interface CartProps {
  cart: CartItemType[];
  globalDiscount: number;
  globalTax: number;
  notes: string;
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
  onUpdateDiscount: (id: number, discount: number) => void;
  onUpdateTax: (id: number, tax: number) => void;
  onGlobalDiscountChange: (value: number) => void;
  onGlobalTaxChange: (value: number) => void;
  onNotesChange: (value: string) => void;

  customers: Customer[];
  selectedCustomer: Customer | null;
  customerSearch: string;
  showCustomerDropdown: boolean;
  loadingCustomers: boolean;
  customerDropdownRef: React.RefObject<HTMLDivElement | null>;  // updated
  onCustomerSearch: (value: string) => void;
  onCustomerFocus: () => void;
  onCustomerSelect: (customer: Customer) => void;

  loyaltyPointsAvailable: number;
  loyaltyPointsToRedeem: number;
  useLoyalty: boolean;
  onUseLoyaltyChange: (checked: boolean) => void;
  onLoyaltyPointsChange: (points: number) => void;

  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;

  isProcessing: boolean;
  onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({
  cart,
  globalDiscount,
  globalTax,
  notes,
  onUpdateQuantity,
  onRemove,
  onUpdateDiscount,
  onUpdateTax,
  onGlobalDiscountChange,
  onGlobalTaxChange,
  onNotesChange,
  customers,
  selectedCustomer,
  customerSearch,
  showCustomerDropdown,
  loadingCustomers,
  customerDropdownRef,
  onCustomerSearch,
  onCustomerFocus,
  onCustomerSelect,
  loyaltyPointsAvailable,
  loyaltyPointsToRedeem,
  useLoyalty,
  onUseLoyaltyChange,
  onLoyaltyPointsChange,
  paymentMethod,
  onPaymentMethodChange,
  isProcessing,
  onCheckout,
}) => {
  const subtotal = calculateSubtotal(cart);
  const loyaltyDeduction = useLoyalty ? new Decimal(loyaltyPointsToRedeem) : new Decimal(0);
  const total = calculateCartTotal(cart, globalDiscount, globalTax, loyaltyDeduction);
  const maxRedeemable = calculateMaxRedeemable(loyaltyPointsAvailable, cart, globalDiscount, globalTax);

  return (
    <div className="flex flex-col h-full bg-[var(--cart-bg)] border-l border-[var(--border-color)]">
      <div className="p-4 border-b border-[var(--border-color)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Current Sale
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="text-center text-[var(--text-tertiary)] py-8">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Cart is empty</p>
            <p className="text-sm">Click products to add</p>
          </div>
        ) : (
          cart.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemove}
              onUpdateDiscount={onUpdateDiscount}
              onUpdateTax={onUpdateTax}
            />
          ))
        )}
      </div>

      <div className="p-4 border-t border-[var(--border-color)] space-y-3">
        <CustomerSearch
          customerSearch={customerSearch}
          showDropdown={showCustomerDropdown}
          customers={customers}
          loading={loadingCustomers}
          selectedCustomer={selectedCustomer}
          dropdownRef={customerDropdownRef}
          onSearchChange={onCustomerSearch}
          onFocus={onCustomerFocus}
          onSelect={onCustomerSelect}
        />

        {selectedCustomer && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-tertiary)]">Loyalty points:</span>
            <span className="font-medium text-[var(--accent-purple)]">{loyaltyPointsAvailable}</span>
          </div>
        )}

        <LoyaltyRedemption
          selectedCustomer={!!selectedCustomer}
          loyaltyPointsAvailable={loyaltyPointsAvailable}
          useLoyalty={useLoyalty}
          loyaltyPointsToRedeem={loyaltyPointsToRedeem}
          maxRedeemable={maxRedeemable}
          onUseLoyaltyChange={onUseLoyaltyChange}
          onPointsChange={onLoyaltyPointsChange}
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-[var(--text-tertiary)] mb-1">Discount %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={globalDiscount}
              onChange={(e) => onGlobalDiscountChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-tertiary)] mb-1">Tax %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={globalTax}
              onChange={(e) => onGlobalTaxChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
            />
          </div>
        </div>

        <PaymentMethodSelector
          paymentMethod={paymentMethod}
          onChange={onPaymentMethodChange}
        />

        <div>
          <label className="block text-xs text-[var(--text-tertiary)] mb-1">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Optional notes"
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
          />
        </div>
      </div>

      <div className="p-4 border-t border-[var(--border-color)] bg-[var(--cart-header)]">
        <TotalsDisplay
          subtotal={subtotal}
          globalDiscount={globalDiscount}
          globalTax={globalTax}
          useLoyalty={useLoyalty}
          loyaltyPointsToRedeem={loyaltyPointsToRedeem}
          total={total}
        />

        <CheckoutButton
          isProcessing={isProcessing}
          disabled={cart.length === 0}
          total={total}
          onClick={onCheckout}
        />
      </div>
    </div>
  );
};

export default Cart;