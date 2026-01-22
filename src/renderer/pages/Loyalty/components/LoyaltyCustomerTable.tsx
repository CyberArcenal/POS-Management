import React from 'react';
import type { LoyaltyCustomer } from '../../../api/loyalty';

interface LoyaltyCustomerTableProps {
  customers: LoyaltyCustomer[];
  isLoading: boolean;
  isFetching: boolean;
  onSelectCustomer: (customer: LoyaltyCustomer) => void;
  onAdjustPoints: (customer: LoyaltyCustomer) => void;
  onRedeemReward: (customer: LoyaltyCustomer) => void;
}

export const LoyaltyCustomerTable: React.FC<LoyaltyCustomerTableProps> = ({
  customers,
  isLoading,
  isFetching,
  onSelectCustomer,
  onAdjustPoints,
  onRedeemReward,
}) => {
  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      'bronze': '#cd7f32',
      'silver': '#c0c0c0',
      'gold': '#ffd700',
      'platinum': '#e5e4e2',
      'diamond': '#b9f2ff',
    };
    return colors[tier.toLowerCase()] || '#6b7280';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Tier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Points
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Progress
              </th>
              <th className="px6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {customers.map((customer) => (
              <tr 
                key={customer.id}
                className="hover:bg-gray-750 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: getTierColor(customer.tier) + '20' }}>
                      <span className="font-bold" style={{ color: getTierColor(customer.tier) }}>
                        {customer.customer_name[0]}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">
                        {customer.customer_name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {customer.customer_code}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: getTierColor(customer.tier) + '20',
                      color: getTierColor(customer.tier),
                      border: `1px solid ${getTierColor(customer.tier)}40`,
                    }}
                  >
                    {customer.tier.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-lg font-bold text-white">
                    {customer.current_points.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400">
                    Available: {customer.available_points.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">
                    {customer.last_points_activity ? formatDate(customer.last_points_activity) : 'No activity'}
                  </div>
                  <div className="text-xs text-gray-400">
                    Member since {formatDate(customer.membership_start_date)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, (customer.current_points / customer.next_tier_points_needed) * 100)}%`,
                        backgroundColor: getTierColor(customer.tier),
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {customer.next_tier_points_needed > 0
                      ? `${(customer.next_tier_points_needed - customer.current_points).toLocaleString()} points to next tier`
                      : 'Top tier reached'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectCustomer(customer)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onAdjustPoints(customer)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs transition-colors"
                    >
                      Adjust
                    </button>
                    <button
                      onClick={() => onRedeemReward(customer)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs transition-colors"
                    >
                      Redeem
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {customers.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-gray-400">No loyalty members found</div>
          <div className="text-gray-500 text-sm mt-2">
            Enroll customers to start building your loyalty program
          </div>
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