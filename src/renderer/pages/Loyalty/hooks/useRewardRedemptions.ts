import { useState, useEffect, useCallback } from 'react';
import type { RedemptionHistory, RewardItem } from '../../../api/loyalty';
import loyaltyAPI from '../../../api/loyalty';

interface UseRewardRedemptionsProps {
  filters?: {
    status?: string;
    start_date?: string;
    end_date?: string;
  };
}

export const useRewardRedemptions = ({
  filters = {},
}: UseRewardRedemptionsProps = {}) => {
  const [redemptions, setRedemptions] = useState<RedemptionHistory[]>([]);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Extract individual filter values for stable dependencies
  const { status, start_date, end_date } = filters;

  const loadRedemptions = useCallback(async () => {
    try {
      setIsFetching(true);
      const response = await loyaltyAPI.getRedemptionHistory(filters);
      
      if (response.status) {
        setRedemptions(response.data);
      }
    } catch (error) {
      console.error('Error fetching redemptions:', error);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  // Use individual filter values instead of the entire filters object
  }, [status, start_date, end_date]);

  const loadRewards = useCallback(async () => {
    try {
      const response = await loyaltyAPI.getRewardsCatalog();
      
      if (response.status) {
        setRewards(response.data);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([loadRedemptions(), loadRewards()]).finally(() => {
      setIsLoading(false);
    });
  // Use individual filter values instead of the loadRedemptions function
  }, [status, start_date, end_date]);

  const updateRedemptionStatus = async (redemptionId: number, status: string, notes?: string) => {
    try {
      const response = await loyaltyAPI.updateRedemptionStatus(redemptionId, status, notes);
      
      if (response.status) {
        // Refresh the list
        await loadRedemptions();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error updating redemption status:', error);
      return null;
    }
  };

  const redeemReward = async (params: {
    customer_id: number;
    reward_id: number;
    quantity?: number;
    notes?: string;
  }) => {
    try {
      const response = await loyaltyAPI.redeemReward(params);
      
      if (response.status) {
        // Refresh the list
        await loadRedemptions();
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Error redeeming reward:', error);
      return null;
    }
  };

  return {
    redemptions,
    rewards,
    isLoading,
    isFetching,
    loadRedemptions,
    loadRewards,
    updateRedemptionStatus,
    redeemReward,
  };
};