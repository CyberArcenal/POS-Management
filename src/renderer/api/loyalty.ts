// loyaltyAPI.ts - Frontend API for Loyalty Program

import type { CustomerData } from "./customer";

export interface LoyaltyProgramSettings {
  id: number;
  program_name: string;
  program_description: string;
  points_currency_name: string;
  points_per_currency: number;
  minimum_redemption_points: number;
  expiration_months: number;
  signup_bonus_points: number;
  birthday_bonus_points: number;
  anniversary_bonus_points: number;
  tier_requirements: Record<string, number>;
  tier_benefits: Record<string, string[]>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTier {
  tier_id: string;
  tier_name: string;
  min_points: number;
  max_points: number;
  color: string;
  benefits: string[];
  discount_percentage: number;
  bonus_points_multiplier: number;
  priority_processing: boolean;
  free_shipping: boolean;
  exclusive_offers: boolean;
}

export interface LoyaltyCustomer {
  id: number;
  customer_id: number;
  customer_code: string;
  customer_name: string;
  tier: string;
  current_points: number;
  total_points_earned: number;
  total_points_redeemed: number;
  available_points: number;
  pending_points: number;
  points_expiring_soon: number;
  next_tier_points_needed: number;
  last_points_activity: string;
  membership_start_date: string;
  membership_end_date: string | null;
  customer: CustomerData;
}

export interface PointsTransaction {
  id: number;
  customer_id: number;
  transaction_type: 'earn' | 'redeem' | 'expire' | 'adjustment' | 'bonus';
  points_amount: number;
  balance_before: number;
  balance_after: number;
  reference_type: 'sale' | 'return' | 'manual' | 'birthday' | 'anniversary' | 'signup';
  reference_id: number | null;
  description: string;
  expiration_date: string | null;
  status: 'active' | 'pending' | 'expired' | 'cancelled';
  created_at: string;
  created_by: number | null;
}

export interface RewardItem {
  id: number;
  reward_code: string;
  reward_name: string;
  description: string;
  category: 'discount' | 'product' | 'service' | 'voucher';
  points_cost: number;
  cash_value: number;
  stock_quantity: number;
  max_redemptions_per_customer: number;
  is_active: boolean;
  validity_period_days: number;
  image_url: string | null;
  terms_conditions: string;
  created_at: string;
  updated_at: string;
}

export interface RedemptionHistory {
  id: number;
  redemption_code: string;
  customer_id: number;
  customer_name: string;
  reward_id: number;
  reward_name: string;
  points_cost: number;
  status: 'pending' | 'approved' | 'completed' | 'cancelled' | 'expired';
  redemption_date: string;
  fulfillment_date: string | null;
  fulfillment_method: 'in_store' | 'ship' | 'digital';
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface LoyaltyStats {
  total_members: number;
  active_members: number;
  total_points_issued: number;
  total_points_redeemed: number;
  outstanding_points: number;
  average_points_per_member: number;
  redemptions_today: number;
  redemptions_this_month: number;
  signups_today: number;
  tier_distribution: Array<{
    tier: string;
    count: number;
    percentage: number;
  }>;
  points_expiring_soon: number;
  total_reward_value: number;
}

export interface PointsEarningRule {
  id: number;
  rule_name: string;
  rule_type: 'purchase' | 'category' | 'product' | 'action';
  points_multiplier: number;
  minimum_purchase: number | null;
  applicable_categories: string[] | null;
  applicable_products: number[] | null;
  valid_days: string[] | null;
  valid_period: {
    start: string;
    end: string;
  } | null;
  is_active: boolean;
}

export interface LoyaltyPayload {
  method: string;
  params?: Record<string, any>;
}

class LoyaltyAPI {
  // Program Settings
  async getLoyaltySettings(): Promise<{
    status: boolean;
    message: string;
    data: LoyaltyProgramSettings;
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.loyalty) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "getLoyaltySettings",
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get loyalty settings");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get loyalty settings");
    }
  }

  async updateLoyaltySettings(settings: Partial<LoyaltyProgramSettings>): Promise<{
    status: boolean;
    message: string;
    data: LoyaltyProgramSettings;
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.loyalty) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "updateLoyaltySettings",
        params: { settings },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update loyalty settings");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update loyalty settings");
    }
  }

  // Loyalty Customers
  async getLoyaltyCustomers(filters?: {
    tier?: string;
    min_points?: number;
    max_points?: number;
    search?: string;
    status?: 'active' | 'inactive';
  }): Promise<{
    status: boolean;
    message: string;
    data: LoyaltyCustomer[];
    pagination?: any;
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.loyalty) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "getLoyaltyCustomers",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get loyalty customers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get loyalty customers");
    }
  }

  async getLoyaltyCustomerById(customerId: number): Promise<{
    status: boolean;
    message: string;
    data: LoyaltyCustomer;
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.loyalty) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "getLoyaltyCustomerById",
        params: { customer_id: customerId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get loyalty customer");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get loyalty customer");
    }
  }

  async enrollCustomerInLoyalty(customerId: number): Promise<{
    status: boolean;
    message: string;
    data: {
      loyalty_customer: LoyaltyCustomer;
      points_credited: number;
    };
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.loyalty) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "enrollCustomerInLoyalty",
        params: { customer_id: customerId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to enroll customer");
    } catch (error: any) {
      throw new Error(error.message || "Failed to enroll customer");
    }
  }

  // Points Management
  async adjustCustomerPoints(params: {
    customer_id: number;
    points_amount: number;
    transaction_type: 'earn' | 'redeem' | 'adjustment';
    description: string;
    reference_type?: string;
    reference_id?: number;
  }): Promise<{
    status: boolean;
    message: string;
    data: {
      transaction: PointsTransaction;
      customer: LoyaltyCustomer;
    };
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.loyalty) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "adjustCustomerPoints",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to adjust points");
    } catch (error: any) {
      throw new Error(error.message || "Failed to adjust points");
    }
  }

  async getPointsTransactions(customerId: number, filters?: {
    start_date?: string;
    end_date?: string;
    transaction_type?: string;
  }): Promise<{
    status: boolean;
    message: string;
    data: PointsTransaction[];
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.loyalty) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "getPointsTransactions",
        params: { customer_id: customerId, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get points transactions");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get points transactions");
    }
  }

  // Rewards Management
  async getRewardsCatalog(filters?: {
    category?: string;
    min_points?: number;
    max_points?: number;
    is_active?: boolean;
  }): Promise<{
    status: boolean;
    message: string;
    data: RewardItem[];
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.loyalty) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "getRewardsCatalog",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get rewards catalog");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get rewards catalog");
    }
  }

  async createReward(rewardData: Partial<RewardItem>): Promise<{
    status: boolean;
    message: string;
    data: RewardItem;
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.loyalty) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "createReward",
        params: { reward_data: rewardData },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create reward");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create reward");
    }
  }

  async updateReward(rewardId: number, rewardData: Partial<RewardItem>): Promise<{
    status: boolean;
    message: string;
    data: RewardItem;
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.loyalty) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "updateReward",
        params: { reward_id: rewardId, reward_data: rewardData },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update reward");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update reward");
    }
  }

  // Redemptions
  async redeemReward(params: {
    customer_id: number;
    reward_id: number;
    quantity?: number;
    notes?: string;
  }): Promise<{
    status: boolean;
    message: string;
    data: RedemptionHistory;
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.loyalty) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "redeemReward",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to redeem reward");
    } catch (error: any) {
      throw new Error(error.message || "Failed to redeem reward");
    }
  }

  async getRedemptionHistory(filters?: {
    customer_id?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{
    status: boolean;
    message: string;
    data: RedemptionHistory[];
    pagination?: any;
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.loyalty) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "getRedemptionHistory",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get redemption history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get redemption history");
    }
  }

  async updateRedemptionStatus(redemptionId: number, status: string, notes?: string): Promise<{
    status: boolean;
    message: string;
    data: RedemptionHistory;
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.loyalty) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "updateRedemptionStatus",
        params: { redemption_id: redemptionId, status, notes },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update redemption status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update redemption status");
    }
  }

  // Statistics
  async getLoyaltyStats(date_range?: {
    start_date?: string;
    end_date?: string;
  }): Promise<{
    status: boolean;
    message: string;
    data: LoyaltyStats;
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.loyalty) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "getLoyaltyStats",
        params: { date_range },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get loyalty stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get loyalty stats");
    }
  }

  async getLoyaltyTiers(): Promise<{
    status: boolean;
    message: string;
    data: LoyaltyTier[];
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.loyalty) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "getLoyaltyTiers",
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get loyalty tiers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get loyalty tiers");
    }
  }

  // Earning Rules
  async getPointsEarningRules(): Promise<{
    status: boolean;
    message: string;
    data: PointsEarningRule[];
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.loyalty) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "getPointsEarningRules",
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get earning rules");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get earning rules");
    }
  }

  // Utilities
  async calculatePointsFromAmount(amount: number): Promise<number> {
    try {
      const settings = await this.getLoyaltySettings();
      return Math.floor(amount * settings.data.points_per_currency);
    } catch (error) {
      console.error("Error calculating points:", error);
      return Math.floor(amount * 10); // Default 10 points per currency unit
    }
  }

  async checkCustomerRedemptionEligibility(customerId: number, rewardId: number): Promise<{
    eligible: boolean;
    reason?: string;
    points_balance: number;
    points_needed: number;
    can_afford: boolean;
  }> {
    try {
      const [customerResponse, rewardResponse] = await Promise.all([
        this.getLoyaltyCustomerById(customerId),
        this.getRewardsCatalog({})
      ]);

      const customer = customerResponse.data;
      const reward = rewardResponse.data.find(r => r.id === rewardId);

      if (!reward) {
        return {
          eligible: false,
          reason: "Reward not found",
          points_balance: customer.current_points,
          points_needed: 0,
          can_afford: false,
        };
      }

      const can_afford = customer.available_points >= reward.points_cost;
      const is_active = reward.is_active;
      const has_stock = reward.stock_quantity > 0;

      return {
        eligible: can_afford && is_active && has_stock,
        reason: !can_afford ? "Insufficient points" : 
                !is_active ? "Reward is not active" :
                !has_stock ? "Reward out of stock" : undefined,
        points_balance: customer.available_points,
        points_needed: reward.points_cost,
        can_afford,
      };
    } catch (error) {
      console.error("Error checking eligibility:", error);
      return {
        eligible: false,
        reason: "Error checking eligibility",
        points_balance: 0,
        points_needed: 0,
        can_afford: false,
      };
    }
  }

  async getPointsExpiringSoon(customerId: number): Promise<PointsTransaction[]> {
    try {
      const transactions = await this.getPointsTransactions(customerId);
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      return transactions.data.filter(transaction => 
        transaction.expiration_date && 
        new Date(transaction.expiration_date) <= thirtyDaysFromNow &&
        transaction.status === 'active'
      );
    } catch (error) {
      console.error("Error getting expiring points:", error);
      return [];
    }
  }

  async sendPointsExpirationReminder(customerId: number): Promise<boolean> {
    try {
      if (!window.backendAPI || !window.backendAPI.loyalty) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.loyalty({
        method: "sendPointsExpirationReminder",
        params: { customer_id: customerId },
      });

      return response.status;
    } catch (error) {
      console.error("Error sending expiration reminder:", error);
      return false;
    }
  }

  async getCustomerRedemptionHistory(customerId: number): Promise<RedemptionHistory[]> {
    try {
      const response = await this.getRedemptionHistory({ customer_id: customerId });
      return response.data;
    } catch (error) {
      console.error("Error getting customer redemption history:", error);
      return [];
    }
  }
}

const loyaltyAPI = new LoyaltyAPI();

export default loyaltyAPI;