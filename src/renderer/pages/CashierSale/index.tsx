import React, { useState, useRef, useEffect } from "react";
import { Search, Loader2, Barcode, RefreshCw, XCircle, X } from "lucide-react";
import Decimal from "decimal.js";
import { useProducts } from "./hooks/useProducts";
import { useCustomers } from "./hooks/useCustomers";
import { useCart } from "./hooks/useCart";
import { useLoyalty as useLoyaltyMethod } from "./hooks/useLoyalty";
import { useCheckout } from "./hooks/useCheckout";
import ProductGrid from "./components/ProductGrid";
import Cart from "./components/Cart";
import CheckoutDialog from "./components/CheckoutDialog";
import { calculateCartTotal } from "./utils";
import type { CartItem } from "./types";
import PaymentSuccessDialog from "./components/PaymentSuccessDialog";
import CategorySelect from "../../components/Selects/Category"; // adjust path as needed
import CashierHeader from "./components/CashierHeader";
import { useSettings } from "../../contexts/SettingsContext";
import { useBarcodeEnabled } from "../../utils/posUtils";

const Cashier: React.FC = () => {
  const {
    filteredProducts,
    searchTerm,
    setSearchTerm,
    categoryId,
    setCategoryId,
    loadingProducts,
    loadProducts,
    clearFilters,
  } = useProducts();
  const isBarcodeEnabled = useBarcodeEnabled();
  const { selectedCustomer, selectCustomer, setSelectedCustomer } =
    useCustomers();

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

  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "card" | "wallet"
  >("cash");
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

  // Barcode mode toggle
  const [barcodeMode, setBarcodeMode] = useState(true);
  const [scannedBarcode, setScannedBarcode] = useState<string>("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const itemCount = cart.reduce((acc, item) => acc + item.cartQuantity, 0);
  // Compute final total
  const loyaltyDeduction = useLoyalty
    ? new Decimal(loyaltyPointsToRedeem)
    : new Decimal(0);
  const finalTotal = calculateCartTotal(
    cart,
    globalDiscount,
    globalTax,
    loyaltyDeduction,
  );
  const handleCheckoutClick = () => {
    if (cart.length === 0) {
      alert("Please add items to the cart.");
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
        const change =
          paymentMethod === "cash" && paidAmount !== undefined
            ? new Decimal(paidAmount).minus(finalTotal)
            : undefined;

        setSuccessData({
          sale,
          paidAmount,
          change,
          paymentMethod,
          total: finalTotal,
          cartItems: cart,
        });
        setShowSuccessDialog(true);
      },
    );
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    setSuccessData(null);
    clearCart();
    setSelectedCustomer(null);
    setPaymentMethod("cash");
    setUseLoyalty(false);
    setLoyaltyPointsToRedeem(0);
    loadProducts();
  };

  // Barcode scanner logic (only when barcodeMode is true)
  useEffect(() => {
    if (!barcodeMode) return;
    if (!isBarcodeEnabled) return;

    let scanBuffer = "";
    let scanTimeout: ReturnType<typeof setTimeout>;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === "Enter") {
        if (scanBuffer.length > 0) {
          window.backendAPI
            .barcode({ method: "emit", params: { barcode: scanBuffer } })
            .catch(console.error);
          handleBarcodeScanned(scanBuffer);
          scanBuffer = "";
        }
        return;
      }

      if (e.key.length === 1) {
        scanBuffer += e.key;
        clearTimeout(scanTimeout);
        scanTimeout = setTimeout(() => {
          if (scanBuffer.length > 0) {
            window.backendAPI
              .barcode({ method: "emit", params: { barcode: scanBuffer } })
              .catch(console.error);
            scanBuffer = "";
          }
        }, 100);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const handleBarcodeScanned = (barcode: string) => {
      if (!isBarcodeEnabled) return;
      const product = filteredProducts.find((p) => p.sku === barcode);
      if (product) {
        addToCart(product);
      } else {
        setSearchTerm(barcode);
      }
    };

    window.backendAPI.onBarcodeScanned(handleBarcodeScanned);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(scanTimeout);
      // Ideally remove the listener, but if the API doesn't provide an off method,
      // we assume it's handled globally. In a real app you'd want to unregister.
    };
  }, [barcodeMode, filteredProducts, addToCart, setSearchTerm]);
  return (
    <div className="h-full flex flex-col bg-[var(--background-color)]">
      {/* Header with search, category filter, barcode display, and actions */}
      <CashierHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchInputRef={searchInputRef}
        scannedBarcode={scannedBarcode}
        onClearScannedBarcode={() => setScannedBarcode("")}
        itemCount={itemCount}
        total={finalTotal}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        barcodeMode={barcodeMode}
        onToggleBarcodeMode={() => setBarcodeMode(!barcodeMode)}
        loadingProducts={loadingProducts}
        onRefresh={loadProducts}
        onClearFilters={clearFilters}
        showClearFilters={!!(searchTerm || categoryId)}
        // status indicators (mock for now, can be replaced with real hooks)
        printerReady={true}
        drawerOpen={false}
        online={true}
      />

      {/* Rest of the component (ProductGrid, Cart, etc.) remains unchanged */}
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
            selectedCustomer={selectedCustomer}
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
