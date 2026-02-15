import { useState, useEffect } from 'react';
import loyaltyAPI from '../../../api/loyalty';

export const useLoyalty = (customerId?: number) => {
  const [loyaltyPointsAvailable, setLoyaltyPointsAvailable] = useState(0);
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0);
  const [useLoyalty, setUseLoyalty] = useState(false);

  // Fetch points when customer changes
  useEffect(() => {
    if (customerId) {
      loyaltyAPI
        .getCustomerSummary(customerId)
        .then((res) => {
          setLoyaltyPointsAvailable(res.data.customer.loyaltyPointsBalance);
        })
        .catch((err) => {
          console.error('Failed to fetch loyalty points', err);
          setLoyaltyPointsAvailable(0);
        });
    } else {
      setLoyaltyPointsAvailable(0);
      setLoyaltyPointsToRedeem(0);
      setUseLoyalty(false);
    }
  }, [customerId]);

  return {
    loyaltyPointsAvailable,
    loyaltyPointsToRedeem,
    useLoyalty,
    setLoyaltyPointsToRedeem,
    setUseLoyalty,
  };
};