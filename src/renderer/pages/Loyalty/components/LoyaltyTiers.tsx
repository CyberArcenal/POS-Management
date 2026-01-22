import React from 'react';
import type { LoyaltyTier } from '../../../api/loyalty';

interface LoyaltyTiersProps {
  tiers: LoyaltyTier[];
  stats: {
    tier_distribution: Array<{ tier: string; count: number; percentage: number }>;
  };
}

export const LoyaltyTiers: React.FC<LoyaltyTiersProps> = ({ tiers, stats }) => {
  const getTierColor = (tierId: string) => {
    const tier = tiers.find(t => t.tier_id === tierId);
    return tier?.color || '#6b7280';
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
      <h3 className="text-xl font-bold text-white mb-6">Loyalty Tiers</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tier Cards */}
        <div className="space-y-4">
          {tiers.map((tier) => (
            <div
              key={tier.tier_id}
              className="p-4 rounded-lg border"
              style={{
                borderColor: tier.color,
                background: `linear-gradient(135deg, ${tier.color}15, ${tier.color}05)`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: tier.color }}
                  >
                    <span className="text-white font-bold">{tier.tier_name[0]}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{tier.tier_name}</h4>
                    <p className="text-sm text-gray-400">
                      {tier.min_points.toLocaleString()} - {tier.max_points.toLocaleString()} points
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {stats.tier_distribution.find(t => t.tier === tier.tier_id)?.count || 0}
                  </div>
                  <div className="text-sm text-gray-400">members</div>
                </div>
              </div>
              
              {/* Benefits */}
              <div className="mt-4">
                <div className="text-sm font-semibold text-gray-300 mb-2">Benefits:</div>
                <ul className="space-y-1">
                  {tier.benefits.slice(0, 3).map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-400">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
                {tier.discount_percentage > 0 && (
                  <div className="mt-3 px-3 py-1 bg-gray-900 rounded-lg inline-block">
                    <span className="text-sm font-bold" style={{ color: tier.color }}>
                      {tier.discount_percentage}% Discount
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Tier Distribution Chart */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Tier Distribution</h4>
          <div className="space-y-4">
            {stats.tier_distribution.map((distribution) => (
              <div key={distribution.tier} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">
                    {tiers.find(t => t.tier_id === distribution.tier)?.tier_name || distribution.tier}
                  </span>
                  <span className="text-gray-400">
                    {distribution.count} members ({distribution.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${distribution.percentage}%`,
                      backgroundColor: getTierColor(distribution.tier),
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Tier Comparison */}
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-white mb-4">Tier Comparison</h4>
            <div className="bg-gray-900 rounded-lg p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="pb-2 text-left">Tier</th>
                    <th className="pb-2 text-left">Points Required</th>
                    <th className="pb-2 text-left">Discount</th>
                    <th className="pb-2 text-left">Multiplier</th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((tier) => (
                    <tr key={tier.tier_id} className="border-b border-gray-800">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tier.color }}
                          ></div>
                          <span className="text-white">{tier.tier_name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-gray-300">
                        {tier.min_points.toLocaleString()}+
                      </td>
                      <td className="py-3 text-green-400 font-semibold">
                        {tier.discount_percentage}%
                      </td>
                      <td className="py-3 text-blue-400 font-semibold">
                        {tier.bonus_points_multiplier}x
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};