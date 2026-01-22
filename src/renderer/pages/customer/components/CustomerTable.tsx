import React from 'react';
import type { CustomerData } from '../../../api/customer';

interface CustomerTableProps {
  customers: CustomerData[];
  isLoading: boolean;
  isFetching: boolean;
  onSelectCustomer: (id: number) => void;
  onEditCustomer: (customer: CustomerData) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  isLoading,
  isFetching,
  onSelectCustomer,
  onEditCustomer,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Last Purchase
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {customers.map((customer) => (
              <tr 
                key={customer.id}
                className="hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => onSelectCustomer(customer.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {customer.display_name?.[0] || customer.first_name?.[0] || 'C'}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">
                        {customer.display_name || `${customer.first_name} ${customer.last_name}`}
                      </div>
                      <div className="text-sm text-gray-400">
                        {customer.customer_code}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{customer.email || 'No email'}</div>
                  <div className="text-sm text-gray-400">{customer.phone || customer.mobile || 'No phone'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    customer.customer_type === 'business' 
                      ? 'bg-purple-100 text-purple-800' 
                      : customer.customer_type === 'wholesale'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {customer.customer_type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">
                    ${customer.current_balance.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">
                    Limit: ${customer.credit_limit.toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {customer.last_purchase_at 
                    ? new Date(customer.last_purchase_at).toLocaleDateString()
                    : 'Never'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditCustomer(customer);
                    }}
                    className="text-blue-400 hover:text-blue-300 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle view details
                      onSelectCustomer(customer.id);
                    }}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {customers.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-gray-400">No customers found</div>
        </div>
      )}

      {isFetching && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};