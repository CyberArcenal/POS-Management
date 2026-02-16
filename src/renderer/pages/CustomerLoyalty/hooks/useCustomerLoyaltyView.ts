import { useState, useCallback } from "react";
import loyaltyAPI, { type LoyaltyTransaction } from "../../../api/loyalty";
import customerAPI, { type Customer } from "../../../api/customer";

export const useCustomerLoyaltyView = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const open = useCallback(async (customerId: number) => {
    setIsOpen(true);
    setLoading(true);

    try {
      // Fetch customer details
      const custResponse = await customerAPI.getById(customerId);
      if (custResponse.status) {
        setCustomer(custResponse.data);
      }

      // Fetch loyalty transactions for this customer
      const txResponse = await loyaltyAPI.getByCustomer({ customerId, limit: 100 });
      if (txResponse.status) {
        setTransactions(txResponse.data);
      }
    } catch (error) {
      console.error("Failed to load customer loyalty details", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setCustomer(null);
    setTransactions([]);
  }, []);

  return { isOpen, customer, transactions, loading, open, close };
};