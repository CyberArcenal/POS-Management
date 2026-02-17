// src/renderer/pages/pos/Cashier.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Wallet,
  Banknote,
  X,
  Check,
  Loader2,
  Receipt,
  Percent,
  Tag,
  ShoppingCart,
  Package,
  AlertCircle,
} from 'lucide-react';
import Decimal from 'decimal.js';
import productAPI, { type Product } from '../../api/product';
import saleAPI from '../../api/sale';
import customerAPI, { type Customer } from '../../api/customer';
import loyaltyAPI from '../../api/loyalty';
import { dialogs } from '../../utils/dialogs';
import { posAuthStore } from '../../lib/authStore';

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------

interface CartItem extends Product {
  cartQuantity: number;
  lineDiscount: number; // per item discount (percentage or fixed? we'll use percentage for simplicity)
  lineTax: number;      // tax percentage
}

interface CustomerOption extends Customer {
  // additional display fields if needed
}

// ----------------------------------------------------------------------
// Cashier Page Component
// ----------------------------------------------------------------------

const Cashier: React.FC = () => {
  // --------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'wallet'>('cash');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(0); // percentage
  const [globalTax, setGlobalTax] = useState(0); // percentage
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0);
  const [loyaltyPointsAvailable, setLoyaltyPointsAvailable] = useState(0);
  const [useLoyalty, setUseLoyalty] = useState(false);

  // Refs for dropdown
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------

  // Load initial products
  useEffect(() => {
    loadProducts();
    loadCustomers();
    // Click outside to close customer dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products.slice(0, 20)); // show first 20
    } else {
      const lower = searchTerm.toLowerCase();
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.sku.toLowerCase().includes(lower) ||
          (p.description && p.description.toLowerCase().includes(lower))
      );
      setFilteredProducts(filtered.slice(0, 20));
    }
  }, [searchTerm, products]);

  // When customer selected, fetch loyalty points
  useEffect(() => {
    if (selectedCustomer) {
      loyaltyAPI
        .getCustomerSummary(selectedCustomer.id)
        .then((res) => {
          setLoyaltyPointsAvailable(res.data.customer.loyaltyPointsBalance);
        })
        .catch((err) => {
          console.error('Failed to fetch loyalty points', err);
          setLoyaltyPointsAvailable(0);
        });
    } else {
      setLoyaltyPointsAvailable(0);
      setLoyaltyPointsToRedeem(0);
      setUseLoyalty(false);
    }
  }, [selectedCustomer]);

  // --------------------------------------------------------------------
  // API Calls
  // --------------------------------------------------------------------

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await productAPI.getActive({ limit: 100 }); // load up to 100 active products
      if (response.status && response.data) {
        setProducts(response.data);
        setFilteredProducts(response.data.slice(0, 20));
      }
    } catch (error) {
      console.error('Failed to load products', error);
      dialogs.alert({
        title: 'Error',
        message: 'Could not load products. Please try again.',
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadCustomers = async (search = '') => {
    setLoadingCustomers(true);
    try {
      const response = await customerAPI.getAll({ search, limit: 20 });
      if (response.status && response.data) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('Failed to load customers', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleCustomerSearch = (value: string) => {
    setCustomerSearch(value);
    loadCustomers(value);
  };

  // --------------------------------------------------------------------
  // Cart Operations
  // --------------------------------------------------------------------

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        // Check stock
        if (existing.cartQuantity + 1 > product.stockQty) {
          dialogs.alert({
            title: 'Insufficient Stock',
            message: `Only ${product.stockQty} available.`,
          });
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, cartQuantity: item.cartQuantity + 1 }
            : item
        );
      } else {
        if (product.stockQty < 1) {
          dialogs.alert({
            title: 'Out of Stock',
            message: `${product.name} is out of stock.`,
          });
          return prev;
        }
        return [
          ...prev,
          {
            ...product,
            cartQuantity: 1,
            lineDiscount: 0,
            lineTax: 0,
          },
        ];
      }
    });
  };

  const updateCartQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) => {
      const item = prev.find((i) => i.id === productId);
      if (!item) return prev;
      if (newQuantity > item.stockQty) {
        dialogs.alert({
          title: 'Insufficient Stock',
          message: `Only ${item.stockQty} available.`,
        });
        return prev;
      }
      return prev.map((item) =>
        item.id === productId ? { ...item, cartQuantity: newQuantity } : item
      );
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateLineDiscount = (productId: number, discountPercent: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, lineDiscount: Math.max(0, Math.min(100, discountPercent)) } : item
      )
    );
  };

  const updateLineTax = (productId: number, taxPercent: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, lineTax: Math.max(0, Math.min(100, taxPercent)) } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setNotes('');
    setGlobalDiscount(0);
    setGlobalTax(0);
    setUseLoyalty(false);
    setLoyaltyPointsToRedeem(0);
  };

  // --------------------------------------------------------------------
  // Calculations
  // --------------------------------------------------------------------

  const calculateSubtotal = (): Decimal => {
    return cart.reduce(
      (sum, item) => sum.plus(new Decimal(item.price).times(item.cartQuantity)),
      new Decimal(0)
    );
  };

  const calculateLineTotal = (item: CartItem): Decimal => {
    const base = new Decimal(item.price).times(item.cartQuantity);
    // apply line discount
    const afterDiscount = base.times(new Decimal(1).minus(item.lineDiscount / 100));
    // apply line tax
    const afterTax = afterDiscount.times(new Decimal(1).plus(item.lineTax / 100));
    return afterTax;
  };

  const calculateCartTotal = (): Decimal => {
    const subtotal = calculateSubtotal();
    // global discount
    const afterGlobalDiscount = subtotal.times(new Decimal(1).minus(globalDiscount / 100));
    // global tax on discounted subtotal
    const afterGlobalTax = afterGlobalDiscount.times(new Decimal(1).plus(globalTax / 100));
    // subtract loyalty redemption (assuming 1 point = 1 unit of currency)
    const loyaltyDeduction = useLoyalty ? new Decimal(loyaltyPointsToRedeem) : new Decimal(0);
    return Decimal.max(afterGlobalTax.minus(loyaltyDeduction), 0);
  };

  const total = calculateCartTotal();

  // Validate loyalty points
  const maxRedeemable = Decimal.min(
    new Decimal(loyaltyPointsAvailable),
    calculateCartTotal() // cannot exceed total after global tax
  ).toNumber();

  // --------------------------------------------------------------------
  // Checkout
  // --------------------------------------------------------------------

  const handleCheckout = async () => {
    if (cart.length === 0) {
      dialogs.alert({
        title: 'Empty Cart',
        message: 'Please add items to the cart before checkout.',
      });
      return;
    }

    const confirm = await dialogs.confirm({
      title: 'Complete Sale',
      message: `Total amount: ₱${total.toFixed(2)}\nProceed with payment?`,
    });
    if (!confirm) return;

    setIsProcessing(true);
    try {
      // Prepare sale items
      const items = cart.map((item) => ({
        productId: item.id,
        quantity: item.cartQuantity,
        unitPrice: item.price,
        discount: item.lineDiscount, // assuming discount is percent; backend may expect absolute value – adjust accordingly
        tax: item.lineTax,            // same for tax
      }));

      // Loyalty redeemed amount (if any)
      const loyaltyRedeemed = useLoyalty ? loyaltyPointsToRedeem : 0;

      const response = await saleAPI.create(
        {
          items,
          customerId: selectedCustomer?.id,
          paymentMethod,
          notes,
          loyaltyRedeemed,
        },
        'cashier'
      );

      if (response.status) {
        // Success
        await dialogs.alert({
          title: 'Sale Completed',
          message: `Sale #${response.data.id} has been recorded.`,
        });
        // Optionally print receipt or open receipt modal
        clearCart();
        setSelectedCustomer(null);
        setCustomerSearch('');
        setPaymentMethod('cash');
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Checkout error', error);
      dialogs.alert({
        title: 'Checkout Failed',
        message: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // --------------------------------------------------------------------
  // Render Helpers
  // --------------------------------------------------------------------

  const renderProductGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4">
      {filteredProducts.map((product) => (
        <button
          key={product.id}
          onClick={() => addToCart(product)}
          disabled={product.stockQty === 0}
          className={`group relative bg-[var(--product-card-bg)] border border-[var(--product-card-border)] rounded-xl p-4 hover:border-[var(--accent-blue)] transition-all duration-200 hover:shadow-lg ${
            product.stockQty === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <Package className="w-10 h-10 text-[var(--accent-blue)] mb-2" />
            <h3 className="font-medium text-sm text-[var(--text-primary)] line-clamp-2 min-h-[2.5rem]">
              {product.name}
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">{product.sku}</p>
            <p className="text-lg font-bold text-[var(--accent-green)] mt-2">
              ₱{new Decimal(product.price).toFixed(2)}
            </p>
            <p
              className={`text-xs mt-1 ${
                product.stockQty > 10
                  ? 'text-[var(--stock-instock)]'
                  : product.stockQty > 0
                  ? 'text-[var(--stock-lowstock)]'
                  : 'text-[var(--stock-outstock)]'
              }`}
            >
              Stock: {product.stockQty}
            </p>
          </div>
          {product.stockQty > 0 && (
            <div className="absolute inset-0 bg-[var(--accent-blue)]/0 group-hover:bg-[var(--accent-blue)]/5 rounded-xl transition-all duration-200" />
          )}
        </button>
      ))}
    </div>
  );

  const renderCart = () => (
    <div className="flex flex-col h-full bg-[var(--cart-bg)] border-l border-[var(--border-color)]">
      <div className="p-4 border-b border-[var(--border-color)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Current Sale
        </h2>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="text-center text-[var(--text-tertiary)] py-8">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Cart is empty</p>
            <p className="text-sm">Click products to add</p>
          </div>
        ) : (
          cart.map((item) => {
            const lineTotal = calculateLineTotal(item);
            return (
              <div
                key={item.id}
                className="bg-[var(--card-secondary-bg)] border border-[var(--border-color)] rounded-lg p-3 hover:border-[var(--accent-blue)] transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-[var(--text-primary)]">{item.name}</h4>
                    <p className="text-xs text-[var(--text-tertiary)]">{item.sku}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-[var(--text-tertiary)] hover:text-[var(--accent-red)] p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center border border-[var(--border-color)] rounded-lg">
                    <button
                      onClick={() => updateCartQuantity(item.id, item.cartQuantity - 1)}
                      className="px-2 py-1 text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] rounded-l-lg"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 text-[var(--text-primary)] font-medium">
                      {item.cartQuantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.id, item.cartQuantity + 1)}
                      className="px-2 py-1 text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] rounded-r-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="font-bold text-[var(--accent-green)]">
                    ₱{lineTotal.toFixed(2)}
                  </span>
                </div>

                {/* Line discounts/tax */}
                <div className="mt-2 flex gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[var(--accent-amber)]" />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.lineDiscount}
                      onChange={(e) => updateLineDiscount(item.id, parseFloat(e.target.value) || 0)}
                      className="w-16 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-1 py-0.5 text-[var(--text-primary)]"
                    />
                    <span className="text-[var(--text-tertiary)]">%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Percent className="w-3 h-3 text-[var(--accent-blue)]" />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.lineTax}
                      onChange={(e) => updateLineTax(item.id, parseFloat(e.target.value) || 0)}
                      className="w-16 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-1 py-0.5 text-[var(--text-primary)]"
                    />
                    <span className="text-[var(--text-tertiary)]">%</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Customer Selection */}
      <div className="p-4 border-t border-[var(--border-color)] space-y-3">
        <div className="relative" ref={customerDropdownRef}>
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-[var(--text-tertiary)]" />
            <span className="text-sm text-[var(--text-primary)]">Customer</span>
          </div>
          <input
            type="text"
            placeholder="Search customer..."
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              handleCustomerSearch(e.target.value);
              setShowCustomerDropdown(true);
            }}
            onFocus={() => setShowCustomerDropdown(true)}
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
          />
          {showCustomerDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {loadingCustomers ? (
                <div className="p-2 text-center text-[var(--text-tertiary)]">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Loading...
                </div>
              ) : customers.length > 0 ? (
                customers.map((cust) => (
                  <div
                    key={cust.id}
                    className={`p-2 hover:bg-[var(--card-hover-bg)] cursor-pointer ${
                      selectedCustomer?.id === cust.id ? 'bg-[var(--accent-blue)]/20' : ''
                    }`}
                    onClick={() => {
                      setSelectedCustomer(cust);
                      setCustomerSearch(cust.name);
                      setShowCustomerDropdown(false);
                    }}
                  >
                    <p className="font-medium text-[var(--text-primary)]">{cust.name}</p>
                    {cust.contactInfo && (
                      <p className="text-xs text-[var(--text-tertiary)]">{cust.contactInfo}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-2 text-center text-[var(--text-tertiary)]">No customers found</div>
              )}
            </div>
          )}
          {selectedCustomer && (
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-[var(--text-tertiary)]">Loyalty points:</span>
              <span className="font-medium text-[var(--accent-purple)]">{loyaltyPointsAvailable}</span>
            </div>
          )}
        </div>

        {/* Loyalty redemption */}
        {selectedCustomer && loyaltyPointsAvailable > 0 && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useLoyalty"
              checked={useLoyalty}
              onChange={(e) => setUseLoyalty(e.target.checked)}
              className="rounded border-[var(--border-color)] bg-[var(--input-bg)]"
            />
            <label htmlFor="useLoyalty" className="text-sm text-[var(--text-primary)]">
              Use loyalty points
            </label>
            {useLoyalty && (
              <input
                type="number"
                min="0"
                max={maxRedeemable}
                value={loyaltyPointsToRedeem}
                onChange={(e) => setLoyaltyPointsToRedeem(Math.min(maxRedeemable, parseFloat(e.target.value) || 0))}
                className="w-20 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-sm"
                placeholder="Points"
              />
            )}
          </div>
        )}

        {/* Global discount/tax */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-[var(--text-tertiary)] mb-1">Discount %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={globalDiscount}
              onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
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
              onChange={(e) => setGlobalTax(parseFloat(e.target.value) || 0)}
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
            />
          </div>
        </div>

        {/* Payment method */}
        <div>
          <label className="block text-xs text-[var(--text-tertiary)] mb-1">Payment Method</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg border ${
                paymentMethod === 'cash'
                  ? 'border-[var(--accent-green)] bg-[var(--accent-green-light)] text-[var(--accent-green)]'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)]'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span className="text-xs">Cash</span>
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg border ${
                paymentMethod === 'card'
                  ? 'border-[var(--accent-blue)] bg-[var(--accent-blue-light)] text-[var(--accent-blue)]'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)]'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span className="text-xs">Card</span>
            </button>
            <button
              onClick={() => setPaymentMethod('wallet')}
              className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg border ${
                paymentMethod === 'wallet'
                  ? 'border-[var(--accent-purple)] bg-[var(--accent-purple-light)] text-[var(--accent-purple)]'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)]'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span className="text-xs">Wallet</span>
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs text-[var(--text-tertiary)] mb-1">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
          />
        </div>
      </div>

      {/* Totals & Checkout */}
      <div className="p-4 border-t border-[var(--border-color)] bg-[var(--cart-header)]">
        <div className="space-y-1 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-tertiary)]">Subtotal:</span>
            <span className="text-[var(--text-primary)]">₱{calculateSubtotal().toFixed(2)}</span>
          </div>
          {globalDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-tertiary)]">Discount ({globalDiscount}%):</span>
              <span className="text-[var(--accent-amber)]">
                -₱{calculateSubtotal().times(globalDiscount / 100).toFixed(2)}
              </span>
            </div>
          )}
          {globalTax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-tertiary)]">Tax ({globalTax}%):</span>
              <span className="text-[var(--accent-blue)]">
                +₱{calculateSubtotal().times(globalTax / 100).toFixed(2)}
              </span>
            </div>
          )}
          {useLoyalty && loyaltyPointsToRedeem > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-tertiary)]">Loyalty redemption:</span>
              <span className="text-[var(--accent-purple)]">-₱{loyaltyPointsToRedeem.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-[var(--border-color)]">
            <span className="text-[var(--text-primary)]">Total:</span>
            <span className="text-[var(--accent-green)]">₱{total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={isProcessing || cart.length === 0}
          className="w-full bg-gradient-to-r from-[var(--accent-green)] to-[var(--accent-green-hover)] text-white py-3 rounded-lg font-semibold hover:from-[var(--accent-green-hover)] hover:to-[var(--accent-green-dark)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Receipt className="w-5 h-5" />
              Checkout (₱{total.toFixed(2)})
            </>
          )}
        </button>
      </div>
    </div>
  );

  // --------------------------------------------------------------------
  // Main Render
  // --------------------------------------------------------------------

  return (
    <div className="h-full flex flex-col bg-[var(--background-color)]">
      {/* Top Bar with Search */}
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

      {/* Main Content: Product Grid (left) and Cart (right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto">
          {loadingProducts ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
            </div>
          ) : (
            renderProductGrid()
          )}
        </div>

        {/* Cart (right sidebar) */}
        <div className="w-96 flex-shrink-0 overflow-y-auto">{renderCart()}</div>
      </div>
    </div>
  );
};

export default Cashier;