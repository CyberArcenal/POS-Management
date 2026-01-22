import React, { useState, useMemo } from 'react';
import { LoyaltyProvider, useLoyaltyContext } from './context/LoyaltyContext';
import { useLoyaltyProgram } from './hooks/useLoyaltyProgram';
import { useRewardRedemptions } from './hooks/useRewardRedemptions';
import type { LoyaltyCustomer } from '../../api/loyalty';
import { useLoyaltyCustomers } from './hooks/useLoyaltyCustomers';
import { LoyaltyTiers } from './components/LoyaltyTiers';
import { LoyaltyStats } from './components/LoyaltyStats';
import { LoyaltyCustomerTable } from './components/LoyaltyCustomerTable';
import { RewardCatalog } from './components/RewardCatalog';
import { RedemptionHistoryComponent } from './components/RedemptionHistory';
import { PointsTransactionModal } from './components/PointsTransactionModal';

const LoyaltyProgramContent: React.FC = () => {
  const {
    selectedCustomerId,
    setSelectedCustomerId,
    isAdjustPointsModalOpen,
    setIsAdjustPointsModalOpen,
    isRewardsModalOpen,
    setIsRewardsModalOpen,
    refreshTrigger,
    triggerRefresh,
    activeTab,
    setActiveTab,
  } = useLoyaltyContext();

  const { stats, tiers, isLoading: isLoadingProgram } = useLoyaltyProgram();
  
  // Stabilize empty filters object with useMemo
  const loyaltyCustomersFilters = useMemo(() => ({}), []);
  const rewardRedemptionsFilters = useMemo(() => ({}), []);
  
  const { customers, isLoading: isLoadingCustomers, enrollCustomer } = useLoyaltyCustomers({ 
    filters: loyaltyCustomersFilters, 
    page: 1, 
    pageSize: 20, 
    refreshTrigger 
  });
  
  const { redemptions, rewards, isLoading: isLoadingRedemptions, updateRedemptionStatus } = useRewardRedemptions({
    filters: rewardRedemptionsFilters
  });

  const [selectedCustomer, setSelectedCustomer] = useState<LoyaltyCustomer | null>(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  const handleSelectCustomer = (customer: LoyaltyCustomer) => {
    setSelectedCustomerId(customer.customer_id);
    // You could navigate to customer detail page or open a modal
  };

  const handleAdjustPoints = (customer: LoyaltyCustomer) => {
    setSelectedCustomer(customer);
    setIsAdjustPointsModalOpen(true);
  };

  const handleRedeemReward = (customer: LoyaltyCustomer) => {
    setSelectedCustomer(customer);
    setIsRewardsModalOpen(true);
  };

  const handleEnrollCustomer = async () => {
    // In a real implementation, you would open a modal to select customer
    // For now, let's simulate enrolling a customer
    const customerId = 1; // This would come from a selection
    const result = await enrollCustomer(customerId);
    if (result) {
      alert('Customer enrolled successfully!');
      setIsEnrollModalOpen(false);
    }
  };

  const handleTransactionSuccess = () => {
    triggerRefresh();
    setIsAdjustPointsModalOpen(false);
    setSelectedCustomer(null);
  };

  if (isLoadingProgram) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="flex-none p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Loyalty Program</h1>
            <p className="text-gray-400 mt-1">Manage customer loyalty points and rewards</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={triggerRefresh}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => setIsEnrollModalOpen(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Enroll Customer
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <div className="px-6">
          <nav className="flex space-x-8">
            {['members', 'rewards', 'redemptions', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6">
          {/* Stats Overview (shown on all tabs) */}
          {stats && <LoyaltyStats stats={stats} />}

          {/* Tab Content */}
          {activeTab === 'members' ? (
            <>
              {/* Tiers Overview */}
              {stats && tiers && <LoyaltyTiers tiers={tiers} stats={stats} />}

              {/* Customer Table */}
              <LoyaltyCustomerTable
                customers={customers}
                isLoading={isLoadingCustomers}
                isFetching={false}
                onSelectCustomer={handleSelectCustomer}
                onAdjustPoints={handleAdjustPoints}
                onRedeemReward={handleRedeemReward}
              />
            </>
          ) : activeTab === 'rewards' ? (
            <RewardCatalog
              rewards={rewards}
              onRedeem={(reward) => {
                // Handle reward redemption
                console.log('Redeem reward:', reward);
              }}
              onEdit={(reward) => {
                // Handle reward editing
                console.log('Edit reward:', reward);
              }}
              onAddNew={() => {
                // Handle adding new reward
                console.log('Add new reward');
              }}
            />
          ) : activeTab === 'redemptions' ? (
            <RedemptionHistoryComponent
              redemptions={redemptions}
              isLoading={isLoadingRedemptions}
              onUpdateStatus={async (redemptionId, status) => {
                const result = await updateRedemptionStatus(redemptionId, status);
                if (result) {
                  triggerRefresh();
                }
              }}
            />
          ) : (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-6">Program Settings</h3>
              <div className="text-gray-400">
                Settings page will be implemented here
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {isAdjustPointsModalOpen && selectedCustomer && (
        <PointsTransactionModal
          customer={selectedCustomer}
          onClose={() => {
            setIsAdjustPointsModalOpen(false);
            setSelectedCustomer(null);
          }}
          onSuccess={handleTransactionSuccess}
        />
      )}

      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
              onClick={() => setIsEnrollModalOpen(false)}
            />

            <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-bold text-white">Enroll Customer in Loyalty Program</h3>
                  <button
                    onClick={() => setIsEnrollModalOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-gray-300 mb-4">
                    Select a customer to enroll in the loyalty program. They will receive signup bonus points.
                  </p>
                  
                  {/* In a real implementation, this would be a customer search/select component */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Search Customer
                      </label>
                      <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="bg-gray-900 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-2">Signup Bonus:</div>
                      <div className="text-2xl font-bold text-green-400">500 points</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsEnrollModalOpen(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEnrollCustomer}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Enroll Customer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const LoyaltyProgramPage: React.FC = () => {
  return (
    <LoyaltyProvider>
      <LoyaltyProgramContent />
    </LoyaltyProvider>
  );
};