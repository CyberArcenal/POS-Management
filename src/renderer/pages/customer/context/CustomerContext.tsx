import React, { createContext, useContext, useState, type ReactNode} from 'react';

interface CustomerFilters {
  search?: string;
  customer_type?: string;
  status?: string;
  min_balance?: number;
  max_balance?: number;
  city?: string;
  customer_group?: string;
}

interface CustomerContextType {
  filters: CustomerFilters;
  setFilters: (filters: CustomerFilters) => void;
  selectedCustomerId: number | null;
  setSelectedCustomerId: (id: number | null) => void;
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  editingCustomer: any | null;
  setEditingCustomer: (customer: any | null) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <CustomerContext.Provider
      value={{
        filters,
        setFilters,
        selectedCustomerId,
        setSelectedCustomerId,
        isFormOpen,
        setIsFormOpen,
        editingCustomer,
        setEditingCustomer,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomerContext = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomerContext must be used within CustomerProvider');
  }
  return context;
};