// src/hooks/useCart.ts
// Note: This is now just a wrapper for the context
import {
  useCart as useCartContext,
  type CartItem,
} from "../contexts/CartContext";

export const useCart = useCartContext;

// src/hooks/usePayment.ts
import { useState, useCallback } from "react";
import type { Sale } from "../api/sales";
import { hideLoading, showError, showLoading } from "../utils/notification";
import saleAPI from "../api/sales";
import productAPI from "../api/product";

export type PaymentMethod =
  | "cash"
  | "card"
  | "gcash"
  | "maya"
  | "paymaya"
  | "credit";

export interface PaymentDetails {
  method: PaymentMethod;
  amountTendered: number;
  referenceNumber?: string;
  transactionId?: string;
  notes?: string;
}

export interface SaleResult {
  success: boolean;
  sale?: Sale;
  receiptNumber?: string;
  change?: number;
  error?: string;
}

export function usePayment() {
  const [processing, setProcessing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);

  const processPayment = useCallback(
    async (
      cartItems: CartItem[],
      paymentDetails: PaymentDetails,
      customerInfo?: {
        name?: string;
        phone?: string;
        email?: string;
      },
    ): Promise<SaleResult> => {
      setProcessing(true);
      showLoading("Processing payment...");

      try {
        // Validate payment
        const subtotal = cartItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
        const discountTotal = cartItems.reduce(
          (sum, item) => sum + item.discount * item.quantity,
          0,
        );
        const taxTotal = cartItems.reduce(
          (sum, item) =>
            sum + (item.price * item.quantity * item.taxRate) / 100,
          0,
        );
        const grandTotal = subtotal - discountTotal + taxTotal;

        if (
          paymentDetails.method === "cash" &&
          paymentDetails.amountTendered < grandTotal
        ) {
          throw new Error(
            `Insufficient payment. Need ₱${grandTotal.toFixed(2)}, received ₱${paymentDetails.amountTendered.toFixed(2)}`,
          );
        }

        // Convert cart items to sale items format
        const saleItems = cartItems.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.price,
          discount_amount: item.discount * item.quantity,
          discount_percentage:
            item.discount > 0 ? (item.discount / item.price) * 100 : 0,
        }));

        // Create sale
        const saleResponse = await saleAPI.createSale({
          items: saleItems,
          payment_method: paymentDetails.method,
          discount: discountTotal,
          tax: taxTotal,
          notes: paymentDetails.notes,
          customer_info: customerInfo,
        });

        if (!saleResponse.status) {
          throw new Error(saleResponse.message || "Failed to create sale");
        }

        // Process payment
        const paymentResponse = await saleAPI.processPayment({
          sale_id: saleResponse.data.id,
          payment_method: paymentDetails.method,
          amount_paid: paymentDetails.amountTendered,
          transaction_id: paymentDetails.transactionId,
          payment_notes: paymentDetails.notes,
        });

        if (!paymentResponse.status) {
          throw new Error(
            paymentResponse.message || "Failed to process payment",
          );
        }

        // Sync inventory
        try {
          await productAPI.updateInventoryStock({
            saleData: {
              id: saleResponse.data.id,
              reference_number: saleResponse.data.reference_number,
            },
            items: cartItems.map((item) => ({
              product_id: item.productId,
              quantity: item.quantity,
            })),
            action: "sale",
          });
        } catch (inventoryError) {
          console.warn("Inventory sync failed:", inventoryError);
          // Continue anyway - sale is already created
        }

        const change =
          paymentDetails.method === "cash"
            ? paymentDetails.amountTendered - grandTotal
            : 0;

        const receiptNumber =
          saleResponse.data.reference_number || `SALE-${saleResponse.data.id}`;
        setLastReceipt(receiptNumber);

        hideLoading();
        setProcessing(false);

        return {
          success: true,
          sale: saleResponse.data,
          receiptNumber,
          change,
        };
      } catch (error: any) {
        hideLoading();
        setProcessing(false);
        showError(error.message || "Payment processing failed");

        return {
          success: false,
          error: error.message,
        };
      }
    },
    [],
  );

  const validateCartStock = useCallback(
    async (cartItems: CartItem[]): Promise<boolean> => {
      try {
        for (const item of cartItems) {
          const response = await productAPI.checkProductAvailability(
            item.productId,
            item.quantity,
          );
          if (!response.data.available) {
            showError(
              `${item.name}: Insufficient stock. Available: ${response.data.currentStock}`,
            );
            return false;
          }
        }
        return true;
      } catch (error) {
        showError("Failed to validate stock");
        return false;
      }
    },
    [],
  );

  const calculateChange = useCallback(
    (grandTotal: number, amountTendered: number): number => {
      return Math.max(0, amountTendered - grandTotal);
    },
    [],
  );

  const generateReceipt = useCallback(async (saleId: number) => {
    try {
      const response = await saleAPI.generateReceipt(saleId);
      return response.data;
    } catch (error) {
      showError("Failed to generate receipt");
      return null;
    }
  }, []);

  return {
    processing,
    lastReceipt,
    processPayment,
    validateCartStock,
    calculateChange,
    generateReceipt,
  };
}
