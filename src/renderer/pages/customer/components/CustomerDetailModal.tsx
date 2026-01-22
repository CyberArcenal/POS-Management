import React, { useEffect } from 'react';
import { useCustomerDetail } from '../hooks/useCustomerDetail';

interface CustomerDetailModalProps {
  customerId: number | null;
  onClose: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customerId,
  onClose,
}) => {
  const { customer, isLoading, loadCustomer, clearCustomer } = useCustomerDetail();

  useEffect(() => {
    if (customerId) {
      loadCustomer(customerId);
    } else {
      clearCustomer();
    }
  }, [customerId, loadCustomer, clearCustomer]);

  if (!customerId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : customer ? (
              <div>
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {customer.display_name || `${customer.first_name} ${customer.last_name}`}
                    </h3>
                    <p className="text-gray-400">{customer.customer_code}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Customer Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-900 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-4">Contact Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-400">Email</label>
                        <p className="text-white">{customer.email || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Phone</label>
                        <p className="text-white">{customer.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Mobile</label>
                        <p className="text-white">{customer.mobile || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-4">Address</h4>
                    <div className="space-y-2">
                      <p className="text-white">{customer.address_line1}</p>
                      <p className="text-white">{customer.address_line2}</p>
                      <p className="text-white">
                        {[customer.city, customer.state, customer.postal_code].filter(Boolean).join(', ')}
                      </p>
                      <p className="text-white">{customer.country}</p>
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-4">Account Details</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-400">Customer Type</label>
                        <p className="text-white capitalize">{customer.customer_type}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Status</label>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : customer.status === 'inactive'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {customer.status}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Credit Limit</label>
                        <p className="text-white">${customer.credit_limit.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-4">Balance Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-400">Current Balance</label>
                        <p className={`text-xl font-bold ${
                          customer.current_balance >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          ${customer.current_balance.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Available Credit</label>
                        <p className="text-white">
                          ${(customer.credit_limit - customer.current_balance).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Credit Utilization</label>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ 
                              width: `${Math.min(100, (customer.current_balance / customer.credit_limit) * 100)}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {((customer.current_balance / customer.credit_limit) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Purchase History Summary */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-4">Purchase History Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">24</div>
                      <div className="text-sm text-gray-400">Total Orders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">$4,832.50</div>
                      <div className="text-sm text-gray-400">Total Spent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">$201.35</div>
                      <div className="text-sm text-gray-400">Average Order</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">15 days</div>
                      <div className="text-sm text-gray-400">Since Last Purchase</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400">Customer not found</div>
              </div>
            )}
          </div>

          <div className="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse bg-gray-900">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};