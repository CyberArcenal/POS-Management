import React, { useState, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useProducts } from './hooks/useProducts';
import { useCustomers } from './hooks/useCustomers';
import { useCart } from './hooks/useCart';
import { useLoyalty as useLoyaltyMethod } from './hooks/useLoyalty';
import { useCheckout } from './hooks/useCheckout';
import ProductGrid from './components/ProductGrid';
import Cart from './components/Cart';
import Decimal from 'decimal.js';

const Cashier: React.FC = () => {
  const {
    filteredProducts,
    searchTerm,
    setSearchTerm,
    loadingProducts,
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

  const { isProcessing, handleCheckout } = useCheckout();

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet'>('cash');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const onCheckout = async () => {
    // total will be recalculated inside handleCheckout, we pass a placeholder 0
    await handleCheckout(
      cart,
      selectedCustomer,
      paymentMethod,
      notes,
      useLoyalty ? loyaltyPointsToRedeem : 0,
      new Decimal(0),
      () => {
        clearCart();
        setSelectedCustomer(null);
        setCustomerSearch('');
        setPaymentMethod('cash');
      }
    );
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background-color)]">
      <div className="flex-shrink-0 bg-[var(--header-bg)] border-b border-[var(--border-color)] p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products by name, SKU, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--topbar-search-bg)] border border-[var(--topbar-search-border)] rounded-lg pl-10 pr-4 py-2 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
            />
          </div>
          <div className="text-sm text-[var(--text-tertiary)]">
            {filteredProducts.length} products
          </div>
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
            onCheckout={onCheckout}
          />
        </div>
      </div>
    </div>
  );
};

export default Cashier;