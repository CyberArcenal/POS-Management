import React, { useState, useEffect } from 'react';
import type { LoyaltyCustomer } from '../../../api/loyalty';

interface PointsTransactionModalProps {
  customer: LoyaltyCustomer | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const PointsTransactionModal: React.FC<PointsTransactionModalProps> = ({
  customer,
  onClose,
  onSuccess,
}) => {
  const [pointsAmount, setPointsAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'earn' | 'redeem' | 'adjustment'>('earn');
  const [description, setDescription] = useState('');
  const [referenceType, setReferenceType] = useState('manual');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setDescription(`Manual ${transactionType} for ${customer.customer_name}`);
    }
  }, [customer, transactionType]);

  if (!customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pointsAmount || isNaN(Number(pointsAmount))) {
      setError('Please enter a valid points amount');
      return;
    }

    const points = parseInt(pointsAmount);
    if (points <= 0) {
      setError('Points amount must be positive');
      return;
    }

    if (transactionType === 'redeem' && points > customer.available_points) {
      setError('Cannot redeem more points than available');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // This would call your API
      // await loyaltyAPI.adjustCustomerPoints({
      //   customer_id: customer.customer_id,
      //   points_amount: transactionType === 'redeem' ? -points : points,
      //   transaction_type: transactionType,
      //   description,
      //   reference_type: referenceType,
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to adjust points');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
          onClick={onClose}
        />

        <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Adjust Points
                </h3>
                <p className="text-gray-400">
                  {customer.customer_name} • {customer.customer_code}
                </p>
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

            {/* Current Points Display */}
            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Current Points</div>
                  <div className="text-2xl font-bold text-white">
                    {customer.current_points.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Available Points</div>
                  <div className="text-2xl font-bold text-green-400">
                    {customer.available_points.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Transaction Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Transaction Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransactionType('earn')}
                    className={`py-3 rounded-lg transition-colors ${
                      transactionType === 'earn'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs">Earn Points</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionType('redeem')}
                    className={`py-3 rounded-lg transition-colors ${
                      transactionType === 'redeem'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                      </svg>
                      <span className="text-xs">Redeem Points</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionType('adjustment')}
                    className={`py-3 rounded-lg transition-colors ${
                      transactionType === 'adjustment'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="text-xs">Adjustment</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Points Amount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Points Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={pointsAmount}
                    onChange={(e) => setPointsAmount(e.target.value)}
                    placeholder="Enter points amount"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-xl font-semibold focus:outline-none focus:border-blue-500"
                    min="1"
                    max={transactionType === 'redeem' ? customer.available_points : undefined}
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    points
                  </div>
                </div>
                {transactionType === 'redeem' && (
                  <div className="text-sm text-gray-400 mt-2">
                    Available for redemption: {customer.available_points.toLocaleString()} points
                  </div>
                )}
              </div>

              {/* Reference Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Reference Type
                </label>
                <select
                  value={referenceType}
                  onChange={(e) => setReferenceType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="manual">Manual Adjustment</option>
                  <option value="purchase">Purchase</option>
                  <option value="return">Return</option>
                  <option value="birthday">Birthday Bonus</option>
                  <option value="anniversary">Anniversary Bonus</option>
                  <option value="signup">Signup Bonus</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter description for this transaction"
                  required
                />
              </div>

              {/* New Balance Preview */}
              {pointsAmount && !isNaN(Number(pointsAmount)) && (
                <div className="bg-gray-900 rounded-lg p-4 mb-6">
                  <div className="text-sm text-gray-400 mb-2">New Balance Preview:</div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Current Balance:</span>
                    <span className="text-xl font-bold text-white">
                      {customer.current_points.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-300">
                      {transactionType === 'earn' ? 'Points to Add:' : 'Points to Deduct:'}
                    </span>
                    <span className={`text-xl font-bold ${
                      transactionType === 'earn' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transactionType === 'earn' ? '+' : '-'}{parseInt(pointsAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700">
                    <span className="text-gray-300">New Balance:</span>
                    <span className="text-2xl font-bold text-blue-400">
                      {(
                        transactionType === 'earn' 
                          ? customer.current_points + parseInt(pointsAmount)
                          : customer.current_points - parseInt(pointsAmount)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {isSubmitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Confirm {transactionType === 'earn' ? 'Earn' : transactionType === 'redeem' ? 'Redeem' : 'Adjust'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};