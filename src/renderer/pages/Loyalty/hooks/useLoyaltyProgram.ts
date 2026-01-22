import { useState, useEffect, useCallback } from 'react';
import type { LoyaltyStats, LoyaltyTier } from '../../../api/loyalty';
import loyaltyAPI from '../../../api/loyalty';

export const useLoyaltyProgram = () => {
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProgramData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [statsResponse, tiersResponse] = await Promise.all([
        loyaltyAPI.getLoyaltyStats(),
        loyaltyAPI.getLoyaltyTiers(),
      ]);
      
      if (statsResponse.status) {
        setStats(statsResponse.data);
      }
      
      if (tiersResponse.status) {
        setTiers(tiersResponse.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load loyalty program data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProgramData();
  }, [loadProgramData]);

  const refresh = () => {
    loadProgramData();
  };

  return {
    stats,
    tiers,
    isLoading,
    error,
    refresh,
  };
};