import { useState } from 'react';
import saleAPI from '../../../api/sale';
import { dialogs } from '../../../utils/dialogs';
import type { CartItem, Customer, PaymentMethod } from '../types';
import Decimal from 'decimal.js';

export const useCheckout = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async (
    cart: CartItem[],
    selectedCustomer: Customer | null,
    paymentMethod: PaymentMethod,
    notes: string,
    loyaltyRedeemed: number,
    total: Decimal,
    onSuccess: () => void
  ) => {
    if (cart.length === 0) {
      await dialogs.alert({
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
      const items = cart.map((item) => ({
        productId: item.id,
        quantity: item.cartQuantity,
        unitPrice: item.price,
        discount: item.lineDiscount,
        tax: item.lineTax,
      }));

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
        await dialogs.alert({
          title: 'Sale Completed',
          message: `Sale #${response.data.id} has been recorded.`,
        });
        onSuccess();
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Checkout error', error);
      await dialogs.alert({
        title: 'Checkout Failed',
        message: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, handleCheckout };
};