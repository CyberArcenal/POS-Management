import { useState } from 'react';
import type { CartItem, Product } from '../types';
import { dialogs } from '../../../utils/dialogs';

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [globalTax, setGlobalTax] = useState(0);
  const [notes, setNotes] = useState('');

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
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
        item.id === productId
          ? { ...item, lineDiscount: Math.max(0, Math.min(100, discountPercent)) }
          : item
      )
    );
  };

  const updateLineTax = (productId: number, taxPercent: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, lineTax: Math.max(0, Math.min(100, taxPercent)) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setNotes('');
    setGlobalDiscount(0);
    setGlobalTax(0);
  };

  return {
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
  };
};