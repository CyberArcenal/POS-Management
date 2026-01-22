// src/pages/CashierSalePage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useCart, usePayment, type PaymentDetails } from '../../hooks/useCart';
import { posAuthStore } from '../../lib/authStore';
import type { Sale } from '../../api/sales';
import { showError, showSuccess } from '../../utils/notification';
import { dialogs } from '../../utils/dialogs';
import ScannerInput from '../../components/cashier/ScannerInput';
import TotalsPanel from '../../components/cashier/TotalsPanel';
import CartTable from '../../components/cashier/CartTable';
import PaymentModal from '../../components/cashier/PaymentModal';
import ReceiptPreview from '../../components/cashier/ReceiptPreview';
import { CartProvider } from '../../contexts/CartContext';
import { version } from "../../../../package.json";



const CashierPageContent: React.FC = () => {
  const { state, clearCart, getCartSummary } = useCart();
  const { processPayment, validateCartStock, generateReceipt, lastReceipt } = usePayment();
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [changeAmount, setChangeAmount] = useState(0);
  const [currentUser, setCurrentUser] = useState(posAuthStore.getUserDisplayInfo());
  const scannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'F10' && !showPaymentModal && !showReceipt) {
      e.preventDefault();
      handleCheckout();
    }
    if (e.key === 'F1') {
      e.preventDefault();
      // Show help modal
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [showPaymentModal, showReceipt, state.items.length]);

  useEffect(() => {
    const user = posAuthStore.getUserDisplayInfo();
    if (!user) {
      window.location.hash = '/pos/login';
      return;
    }
    setCurrentUser(user);
  }, []);

  const handleCheckout = async () => {
    if (state.items.length === 0) {
      showError('Cart is empty');
      return;
    }

    const stockValid = await validateCartStock(state.items);
    if (!stockValid) {
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (paymentDetails: PaymentDetails) => {
    setProcessingPayment(true);
    
    try {
      const result = await processPayment(
        state.items,
        paymentDetails,
        { name: 'Walk-in Customer' }
      );

      if (result.success && result.sale) {
        setLastSale(result.sale);
        setChangeAmount(result.change || 0);
        setShowPaymentModal(false);
        setShowReceipt(true);
        clearCart();
        
        showSuccess(`Sale completed! Receipt #${result.receiptNumber}`);
      } else {
        showError(result.error || 'Payment failed');
      }
    } catch (error: any) {
      showError(error.message || 'Payment processing failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setLastSale(null);
  };

  const handleClearCart = async () => {
    const confirmed = await dialogs.confirm({
      title: 'Clear Cart',
      message: 'Are you sure you want to clear all items from the cart?',
      icon: 'warning',
    });
    
    if (confirmed) {
      clearCart();
    }
  };

  const cartSummary = getCartSummary();

// src/pages/CashierSalePage.tsx - Updated return statement
return (
  <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
    {/* Simple Status Bar */}
    <div className="flex-none h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-gray-300">Cashier Terminal</div>
        <div className="text-xs px-2 py-1 bg-blue-900/30 text-blue-300 rounded border border-blue-800/50">
          {state.itemCount} items
        </div>
        <div className="text-xs text-gray-400">
          Cashier: <span className="text-blue-300">{currentUser?.name}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-xs text-gray-400">
          {new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })} | {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <button
          onClick={handleClearCart}
          disabled={state.items.length === 0}
          className="px-3 py-1.5 text-sm bg-red-600/20 hover:bg-red-600/30 disabled:opacity-30 disabled:cursor-not-allowed text-red-300 hover:text-white rounded border border-red-700/50 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear Cart
        </button>
      </div>
    </div>

    {/* Main Content Area - FIXED NO SCROLL */}
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel - Scanner & Cart (Scrolls internally) */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-gray-700">
        {/* Scanner (Fixed Height) */}
        <div className="flex-none p-4">
          <div className="mb-2">
            <div className="text-sm text-gray-400 mb-1 flex items-center justify-between">
              <span>Scan Product</span>
              <span className="text-xs px-2 py-1 bg-gray-700 rounded">F2 to Focus</span>
            </div>
            <ScannerInput
              ref={scannerRef}
              autoFocus={true}
              onScanSuccess={(barcode) => {
                console.log(`Scanned: ${barcode}`);
              }}
              onScanError={(error) => {
                showError(error);
              }}
            />
          </div>
        </div>

        {/* Cart Header (Fixed) */}
        <div className="flex-none px-4 py-3 border-y border-gray-700 bg-gray-800/50 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-300">
            Cart Items
          </div>
          <div className="text-sm text-gray-400">
            Total: <span className="font-bold text-green-400">₱{cartSummary.subtotal.toFixed(2)}</span>
          </div>
        </div>
        
        {/* CART SCROLL AREA - This is the only part that scrolls */}
        <div className="flex-1 overflow-hidden min-h-0">
          <div className="h-full overflow-y-auto pos-scrollbar">
            <CartTable 
              compact={false}
              onItemClick={(item) => {
                // Optional: Show item details modal
                console.log('Item clicked:', item);
              }}
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Totals (Enhanced, No Scroll) */}
      <div className="w-96 flex flex-col bg-gray-800">
        {/* Totals Panel - Takes up most space */}
        <div className="flex-1 p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2 pb-2 border-b border-gray-700">
              Order Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Subtotal</span>
                <span className="text-lg font-semibold">₱{cartSummary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Discount</span>
                <span className="text-lg font-semibold text-green-400">-₱{cartSummary.discountTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Tax (12%)</span>
                <span className="text-lg font-semibold">₱{cartSummary.taxTotal.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-700 pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Grand Total</span>
                  <span className="text-4xl font-bold text-white">₱{cartSummary.grandTotal.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-400 text-right">
                  {state.itemCount} item{state.itemCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Checkout Button */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <button
              onClick={handleCheckout}
              disabled={state.items.length === 0}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              CHECKOUT (F10)
            </button>
            
            {/* Keyboard Shortcuts Help */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="text-xs text-gray-400 mb-2">Keyboard Shortcuts</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-xs bg-gray-900/50 p-2 rounded">
                  <div className="text-blue-300 font-medium">F2</div>
                  <div className="text-gray-400">Focus Scanner</div>
                </div>
                <div className="text-xs bg-gray-900/50 p-2 rounded">
                  <div className="text-blue-300 font-medium">F10</div>
                  <div className="text-gray-400">Checkout</div>
                </div>
                <div className="text-xs bg-gray-900/50 p-2 rounded">
                  <div className="text-blue-300 font-medium">ESC</div>
                  <div className="text-gray-400">Cancel/Close</div>
                </div>
                <div className="text-xs bg-gray-900/50 p-2 rounded">
                  <div className="text-blue-300 font-medium">F1</div>
                  <div className="text-gray-400">Help</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Footer */}
        <div className="flex-none h-10 bg-gray-900 border-t border-gray-700 flex items-center justify-center">
          <div className="text-xs text-gray-500">
            POS {version} • Terminal #{currentUser?.terminalId || '001'}
          </div>
        </div>
      </div>
    </div>

    {/* Modals - Keep your existing PaymentModal and ReceiptPreview */}
    <PaymentModal
      isOpen={showPaymentModal}
      onClose={() => setShowPaymentModal(false)}
      onPaymentSubmit={handlePaymentSubmit}
      grandTotal={cartSummary.grandTotal}
      loading={processingPayment}
    />

    {lastSale && (
      <ReceiptPreview
        sale={lastSale}
        cartItems={state.items}
        change={changeAmount}
        onPrint={handlePrintReceipt}
        onClose={handleCloseReceipt}
      />
    )}
  </div>
);
};

const CashierSalePage: React.FC = () => {
  return (
    <CartProvider>
      <CashierPageContent />
    </CartProvider>
  );
};

// React Router Integration
export const CashierRoute = () => ({
  path: '/pos/cashier',
  element: <CashierSalePage />,
  protected: true,
  requiredPermissions: ['can_process_sales'],
  breadcrumb: 'Cashier POS',
});

export default CashierSalePage;