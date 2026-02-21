import { useState } from "react";
import type { Customer } from "../../../api/customer";

type FormMode = "add" | "edit";

export const useCustomerForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<FormMode>("add");
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [initialData, setInitialData] = useState<Partial<Customer> | undefined>();

  const openAdd = () => {
    setMode("add");
    setCustomerId(undefined);
    setInitialData(undefined);
    setIsOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setMode("edit");
    setCustomerId(customer.id);
    setInitialData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      loyaltyPointsBalance: customer.loyaltyPointsBalance,
    });
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setCustomerId(undefined);
    setInitialData(undefined);
  };

  return {
    isOpen,
    mode,
    customerId,
    initialData,
    openAdd,
    openEdit,
    close,
  };
};