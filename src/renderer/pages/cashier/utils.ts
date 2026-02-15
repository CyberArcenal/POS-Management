import Decimal from 'decimal.js';
import type { CartItem } from './types';

export const calculateSubtotal = (cart: CartItem[]): Decimal => {
  return cart.reduce(
    (sum, item) => sum.plus(new Decimal(item.price).times(item.cartQuantity)),
    new Decimal(0)
  );
};

export const calculateLineTotal = (item: CartItem): Decimal => {
  const base = new Decimal(item.price).times(item.cartQuantity);
  const afterDiscount = base.times(new Decimal(1).minus(item.lineDiscount / 100));
  const afterTax = afterDiscount.times(new Decimal(1).plus(item.lineTax / 100));
  return afterTax;
};

export const calculateCartTotal = (
  cart: CartItem[],
  globalDiscount: number,
  globalTax: number,
  loyaltyDeduction: Decimal
): Decimal => {
  const subtotal = calculateSubtotal(cart);
  const afterGlobalDiscount = subtotal.times(new Decimal(1).minus(globalDiscount / 100));
  const afterGlobalTax = afterGlobalDiscount.times(new Decimal(1).plus(globalTax / 100));
  return Decimal.max(afterGlobalTax.minus(loyaltyDeduction), 0);
};

export const calculateMaxRedeemable = (
  loyaltyPointsAvailable: number,
  cart: CartItem[],
  globalDiscount: number,
  globalTax: number
): number => {
  const totalBeforeLoyalty = calculateCartTotal(
    cart,
    globalDiscount,
    globalTax,
    new Decimal(0)
  );
  return Decimal.min(new Decimal(loyaltyPointsAvailable), totalBeforeLoyalty).toNumber();
};