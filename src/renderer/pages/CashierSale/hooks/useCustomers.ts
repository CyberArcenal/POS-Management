import { useState, useRef, useEffect } from "react";
import customerAPI, { type Customer } from "../../../api/customer";

export const useCustomers = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const selectCustomer = (customer: Customer | null) => {
    setSelectedCustomer(customer);
  };

  return {
    selectedCustomer,
    selectCustomer,
    setSelectedCustomer,
  };
};
