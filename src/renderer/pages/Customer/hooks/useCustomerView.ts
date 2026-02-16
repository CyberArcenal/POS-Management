import { useState, useCallback } from "react";
import customerAPI, { type Customer } from "../../../api/customer";
import saleAPI, { type Sale } from "../../../api/sale";
import loyaltyAPI, { type LoyaltyTransaction } from "../../../api/loyalty";

export const useCustomerView = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const open = useCallback(async (customer: Customer) => {
    setIsOpen(true);
    setCustomer(customer);
    setLoading(true);

    try {
      // Fetch customer's sales
      const salesResponse = await saleAPI.getByCustomer({ customerId: customer.id, limit: 50 });
      if (salesResponse.status) {
        setSales(salesResponse.data);
      }

      // Fetch loyalty transactions
      const loyaltyResponse = await loyaltyAPI.getByCustomer({ customerId: customer.id, limit: 50 });
      if (loyaltyResponse.status) {
        setLoyaltyTransactions(loyaltyResponse.data);
      }
    } catch (error) {
      console.error("Failed to load customer details", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setCustomer(null);
    setSales([]);
    setLoyaltyTransactions([]);
  }, []);

  return {
    isOpen,
    customer,
    sales,
    loyaltyTransactions,
    loading,
    open,
    close,
  };
};