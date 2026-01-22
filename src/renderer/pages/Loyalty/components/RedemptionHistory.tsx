import React, { useState } from 'react';
import type { RedemptionHistory } from '../../../api/loyalty';

interface RedemptionHistoryProps {
  redemptions: RedemptionHistory[];
  isLoading: boolean;
  onUpdateStatus: (redemptionId: number, status: string) => void;
}

export const RedemptionHistoryComponent: React.FC<RedemptionHistoryProps> = ({
  redemptions,
  isLoading,
  onUpdateStatus,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRedemption, setSelectedRedemption] = useState<RedemptionHistory | null>(null);

  const statusOptions = [
    { value: 'all', label: 'All Status', color: 'gray' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'approved', label: 'Approved', color: 'blue' },
    { value: 'completed', label: 'Completed', color: 'green' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' },
    { value: 'expired', label: 'Expired', color: 'gray' },
  ];

  const filteredRedemptions = redemptions.filter(redemption => {
    if (statusFilter !== 'all' && redemption.status !== statusFilter) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-500',
      'approved': 'bg-blue-500',
      'completed': 'bg-green-500',
      'cancelled': 'bg-red-500',
      'expired': 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700">
      <div className="p-6 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Redemption History</h3>
          <div className="flex gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  statusFilter === option.value
                    ? `bg-${option.color}-600 text-white`
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Redemption Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Reward
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Points
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {filteredRedemptions.map((redemption) => (
              <tr key={redemption.id} className="hover:bg-gray-750 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{redemption.redemption_code}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-white">{redemption.customer_name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-white">{redemption.reward_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-purple-400">
                    {redemption.points_cost.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-300">{formatDate(redemption.redemption_date)}</div>
                  {redemption.fulfillment_date && (
                    <div className="text-xs text-gray-500">
                      Fulfilled: {formatDate(redemption.fulfillment_date)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(redemption.status)} text-white`}>
                    {redemption.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedRedemption(redemption)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors"
                    >
                      View
                    </button>
                    {redemption.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onUpdateStatus(redemption.id, 'approved')}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onUpdateStatus(redemption.id, 'cancelled')}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {redemption.status === 'approved' && (
                      <button
                        onClick={() => onUpdateStatus(redemption.id, 'completed')}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs transition-colors"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRedemptions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400">No redemptions found</div>
        </div>
      )}

      {/* Redemption Detail Modal */}
      {selectedRedemption && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
              onClick={() => setSelectedRedemption(null)}
            />

            <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Redemption Details</h3>
                    <p className="text-gray-400">Code: {selectedRedemption.redemption_code}</p>
                  </div>
                  <button
                    onClick={() => setSelectedRedemption(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Info */}
                  <div className="bg-gray-900 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-4">Customer Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-400">Customer Name</label>
                        <p className="text-white">{selectedRedemption.customer_name}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Customer ID</label>
                        <p className="text-white">{selectedRedemption.customer_id}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Redemption Date</label>
                        <p className="text-white">{formatDate(selectedRedemption.redemption_date)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Reward Info */}
                  <div className="bg-gray-900 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-white mb-4">Reward Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-400">Reward Name</label>
                        <p className="text-white">{selectedRedemption.reward_name}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Points Cost</label>
                        <p className="text-2xl font-bold text-purple-400">
                          {selectedRedemption.points_cost.toLocaleString()} points
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Fulfillment Method</label>
                        <p className="text-white capitalize">{selectedRedemption.fulfillment_method}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Info */}
                  <div className="bg-gray-900 rounded-lg p-4 md:col-span-2">
                    <h4 className="text-lg font-semibold text-white mb-4">Status & Tracking</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm text-gray-400">Current Status</label>
                        <div className="mt-2">
                          <span className={`px-3 py-2 rounded-lg text-sm font-semibold ${getStatusColor(selectedRedemption.status)} text-white`}>
                            {selectedRedemption.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Tracking Number</label>
                        <p className="text-white mt-2">
                          {selectedRedemption.tracking_number || 'Not assigned'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Fulfillment Date</label>
                        <p className="text-white mt-2">
                          {selectedRedemption.fulfillment_date 
                            ? formatDate(selectedRedemption.fulfillment_date)
                            : 'Not fulfilled'}
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedRedemption.notes && (
                      <div className="mt-4">
                        <label className="text-sm text-gray-400">Notes</label>
                        <p className="text-white mt-2 p-3 bg-gray-800 rounded-lg">
                          {selectedRedemption.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse bg-gray-900">
                <button
                  type="button"
                  onClick={() => setSelectedRedemption(null)}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};