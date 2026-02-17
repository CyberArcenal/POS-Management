import { useState, useRef, useEffect } from 'react';
import customerAPI, { type Customer } from '../../../api/customer';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const customerDropdownRef = useRef<HTMLDivElement>(null);

  const loadCustomers = async (search = '') => {
    setLoadingCustomers(true);
    try {
      const response = await customerAPI.getAll({ search, limit: 20 });
      if (response.status && response.data) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('Failed to load customers', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleCustomerSearch = (value: string) => {
    setCustomerSearch(value);
    loadCustomers(value);
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadCustomers();
  }, []);

  return {
    customers,
    selectedCustomer,
    customerSearch,
    showCustomerDropdown,
    loadingCustomers,
    customerDropdownRef,
    handleCustomerSearch,
    selectCustomer,
    setShowCustomerDropdown,
    setSelectedCustomer,   // <-- added
    setCustomerSearch,     // <-- added
  };
};