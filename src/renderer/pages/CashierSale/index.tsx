import React, { useState, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import Decimal from 'decimal.js';
import { useProducts } from './hooks/useProducts';
import { useCustomers } from './hooks/useCustomers';
import { useCart } from './hooks/useCart';
import { useLoyalty as useLoyaltyMethod } from './hooks/useLoyalty';
import { useCheckout } from './hooks/useCheckout';
import ProductGrid from './components/ProductGrid';
import Cart from './components/Cart';
import CheckoutDialog from './components/CheckoutDialog';
import { calculateCartTotal } from './utils';
import type { CartItem } from './types';
import PaymentSuccessDialog from './components/PaymentSuccessDialog';

const Cashier: React.FC = () => {
  const {
    filteredProducts,
    searchTerm,
    setSearchTerm,
    loadingProducts,
    loadProducts,
  } = useProducts();

  const {
    customers,
    selectedCustomer,
    customerSearch,
    showCustomerDropdown,
    loadingCustomers,
    customerDropdownRef,
    handleCustomerSearch,
    selectCustomer,
    setShowCustomerDropdown,
    setSelectedCustomer,
    setCustomerSearch,
  } = useCustomers();

  const {
    cart,
    globalDiscount,
    globalTax,
    notes,
    setGlobalDiscount,
    setGlobalTax,
    setNotes,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    updateLineDiscount,
    updateLineTax,
    clearCart,
  } = useCart();

  const {
    loyaltyPointsAvailable,
    loyaltyPointsToRedeem,
    useLoyalty,
    setLoyaltyPointsToRedeem,
    setUseLoyalty,
  } = useLoyaltyMethod(selectedCustomer?.id);

  const { isProcessing, processCheckout } = useCheckout();

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet'>('cash');
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);

  // Success dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successData, setSuccessData] = useState<{
    sale: any;
    paidAmount?: number;
    change?: Decimal;
    paymentMethod: string;
    total: Decimal;
    cartItems: CartItem[];
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Compute final total
  const loyaltyDeduction = useLoyalty ? new Decimal(loyaltyPointsToRedeem) : new Decimal(0);
  const finalTotal = calculateCartTotal(cart, globalDiscount, globalTax, loyaltyDeduction);

  const handleCheckoutClick = () => {
    if (cart.length === 0) {
      alert('Please add items to the cart.');
      return;
    }
    setShowCheckoutDialog(true);
  };

  const handleConfirmCheckout = async (paidAmount?: number) => {
    setShowCheckoutDialog(false);
    await processCheckout(
      cart,
      selectedCustomer,
      paymentMethod,
      notes,
      useLoyalty ? loyaltyPointsToRedeem : 0,
      (sale) => {
        // Compute change for cash
        const change = paymentMethod === 'cash' && paidAmount !== undefined
          ? new Decimal(paidAmount).minus(finalTotal)
          : undefined;

        setSuccessData({
          sale,
          paidAmount,
          change,
          paymentMethod,
          total: finalTotal,
          cartItems: cart, // current cart items
        });
        setShowSuccessDialog(true);
      }
    );
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    setSuccessData(null);
    // Clear cart and reset after dialog closes
    clearCart();
    setSelectedCustomer(null);
    setCustomerSearch('');
    setPaymentMethod('cash');
    setUseLoyalty(false);
    setLoyaltyPointsToRedeem(0);
    loadProducts();
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background-color)]">
      {/* Header / Search */}
      <div className="flex-shrink-0 bg-[var(--header-bg)] border-b border-[var(--border-color)] p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)] w-5 h-5" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search products by name, SKU, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--topbar-search-bg)] border border-[var(--topbar-search-border)] rounded-lg pl-10 pr-4 py-2 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-blue)]"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {loadingProducts ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
            </div>
          ) : (
            <ProductGrid products={filteredProducts} onAddToCart={addToCart} />
          )}
        </div>

        <div className="w-96 flex-shrink-0 overflow-y-auto">
          <Cart
            cart={cart}
            globalDiscount={globalDiscount}
            globalTax={globalTax}
            notes={notes}
            onUpdateQuantity={updateCartQuantity}
            onRemove={removeFromCart}
            onUpdateDiscount={updateLineDiscount}
            onUpdateTax={updateLineTax}
            onGlobalDiscountChange={setGlobalDiscount}
            onGlobalTaxChange={setGlobalTax}
            onNotesChange={setNotes}
            customers={customers}
            selectedCustomer={selectedCustomer}
            customerSearch={customerSearch}
            showCustomerDropdown={showCustomerDropdown}
            loadingCustomers={loadingCustomers}
            customerDropdownRef={customerDropdownRef}
            onCustomerSearch={handleCustomerSearch}
            onCustomerFocus={() => setShowCustomerDropdown(true)}
            onCustomerSelect={selectCustomer}
            loyaltyPointsAvailable={loyaltyPointsAvailable}
            loyaltyPointsToRedeem={loyaltyPointsToRedeem}
            useLoyalty={useLoyalty}
            onUseLoyaltyChange={setUseLoyalty}
            onLoyaltyPointsChange={setLoyaltyPointsToRedeem}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            isProcessing={isProcessing}
            onCheckout={handleCheckoutClick}
          />
        </div>
      </div>

      <CheckoutDialog
        isOpen={showCheckoutDialog}
        onClose={() => setShowCheckoutDialog(false)}
        onConfirm={handleConfirmCheckout}
        total={finalTotal}
        cartItems={cart}
        paymentMethod={paymentMethod}
        isProcessing={isProcessing}
      />

      {successData && (
        <PaymentSuccessDialog
          isOpen={showSuccessDialog}
          onClose={handleSuccessDialogClose}
          saleId={successData.sale.id}
          total={successData.total}
          paidAmount={successData.paidAmount}
          change={successData.change}
          paymentMethod={successData.paymentMethod}
          items={successData.cartItems}
        />
      )}
    </div>
  );
};

export default Cashier;