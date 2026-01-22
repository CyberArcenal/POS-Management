// src/context/CartContext.tsx
import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { Product } from '../api/product';
import { showError, showToast } from '../utils/notification';
import productAPI from '../api/product';

export interface CartItem {
  id: number;
  productId: number;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  taxRate: number;
  stock: number;
  barcode?: string;
  costPrice?: number;
  profit?: number;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  itemCount: number;
  lastScanTime: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'UPDATE_DISCOUNT'; payload: { id: number; discount: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_ITEMS'; payload: CartItem[] }
  | { type: 'SET_LAST_SCAN'; payload: number };

interface CartContextType {
  state: CartState;
  addItem: (product: Product, quantity?: number) => Promise<boolean>;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  updateDiscount: (id: number, discount: number) => void;
  clearCart: () => void;
  applyGlobalDiscount: (percentage: number) => void;
  addItemByBarcode: (barcode: string) => Promise<boolean>;
  getCartSummary: () => {
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
    itemCount: number;
    profitEstimate: number;
  };
}

const initialState: CartState = {
  items: [],
  subtotal: 0,
  discountTotal: 0,
  taxTotal: 0,
  grandTotal: 0,
  itemCount: 0,
  lastScanTime: 0,
};

function calculateTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountTotal = items.reduce((sum, item) => sum + (item.discount * item.quantity), 0);
  const taxTotal = items.reduce((sum, item) => sum + (item.price * item.quantity * item.taxRate / 100), 0);
  const grandTotal = subtotal - discountTotal + taxTotal;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return { subtotal, discountTotal, taxTotal, grandTotal, itemCount };
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(item => item.id === action.payload.id);
      let newItems;

      if (existingItemIndex > -1) {
        newItems = [...state.items];
        const existingItem = newItems[existingItemIndex];
        newItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + action.payload.quantity,
        };
      } else {
        newItems = [...state.items, action.payload];
      }

      const totals = calculateTotals(newItems);
      return { ...state, items: newItems, ...totals };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      const totals = calculateTotals(newItems);
      return { ...state, items: newItems, ...totals };
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(1, action.payload.quantity) }
          : item
      );
      const totals = calculateTotals(newItems);
      return { ...state, items: newItems, ...totals };
    }

    case 'UPDATE_DISCOUNT': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, discount: Math.max(0, action.payload.discount) }
          : item
      );
      const totals = calculateTotals(newItems);
      return { ...state, items: newItems, ...totals };
    }

    case 'CLEAR_CART':
      return { ...initialState };

    case 'SET_ITEMS': {
      const totals = calculateTotals(action.payload);
      return { ...state, items: action.payload, ...totals };
    }

    case 'SET_LAST_SCAN':
      return { ...state, lastScanTime: action.payload };

    default:
      return state;
  }
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = async (product: Product, quantity: number = 1): Promise<boolean> => {
    try {
      // Check stock availability
      if (product.stock < quantity) {
        showError(`Insufficient stock. Available: ${product.stock}`);
        return false;
      }

      const cartItem: CartItem = {
        id: product.id,
        productId: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        quantity,
        discount: 0,
        taxRate: 12, // Default VAT in Philippines
        stock: product.stock,
        barcode: product.barcode || undefined,
        costPrice: product.cost_price || undefined,
        profit: product.cost_price ? (product.price - product.cost_price) * quantity : undefined,
      };

      dispatch({ type: 'ADD_ITEM', payload: cartItem });
      showToast(`Added ${quantity}x ${product.name} to cart`, 'success');
      return true;
    } catch (error) {
      showError('Failed to add item to cart');
      return false;
    }
  };

  const addItemByBarcode = async (barcode: string): Promise<boolean> => {
    try {
      // Prevent rapid scanning
      const now = Date.now();
      if (now - state.lastScanTime < 500) {
        return false;
      }
      dispatch({ type: 'SET_LAST_SCAN', payload: now });

      // Find product by barcode
      const response = await productAPI.getProductsByBarcode(barcode);
      if (!response.data || response.data.length === 0) {
        showError(`No product found with barcode: ${barcode}`);
        return false;
      }

      const product = response.data[0];
      return await addItem(product);
    } catch (error) {
      showError('Failed to scan product');
      return false;
    }
  };

  const removeItem = (id: number) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
    showToast('Item removed from cart', 'info');
  };

  const updateQuantity = (id: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const updateDiscount = (id: number, discount: number) => {
    dispatch({ type: 'UPDATE_DISCOUNT', payload: { id, discount } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    showToast('Cart cleared', 'info');
  };

  const applyGlobalDiscount = (percentage: number) => {
    const newItems = state.items.map(item => ({
      ...item,
      discount: (item.price * percentage) / 100,
    }));
    dispatch({ type: 'SET_ITEMS', payload: newItems });
    showToast(`Applied ${percentage}% discount to all items`, 'success');
  };

  const getCartSummary = () => {
    const profitEstimate = state.items.reduce((sum, item) => {
      if (item.profit) return sum + item.profit;
      return sum;
    }, 0);

    return {
      ...calculateTotals(state.items),
      profitEstimate,
    };
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        updateDiscount,
        clearCart,
        applyGlobalDiscount,
        addItemByBarcode,
        getCartSummary,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};