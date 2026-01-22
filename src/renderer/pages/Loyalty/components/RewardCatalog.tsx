import React, { useState } from 'react';
import type { RewardItem } from '../../../api/loyalty';

interface RewardCatalogProps {
  rewards: RewardItem[];
  onRedeem: (reward: RewardItem) => void;
  onEdit: (reward: RewardItem) => void;
  onAddNew: () => void;
}

export const RewardCatalog: React.FC<RewardCatalogProps> = ({
  rewards,
  onRedeem,
  onEdit,
  onAddNew,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['all', ...Array.from(new Set(rewards.map(r => r.category)))];

  const filteredRewards = rewards.filter(reward => {
    if (categoryFilter !== 'all' && reward.category !== categoryFilter) return false;
    if (searchTerm && !reward.reward_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'discount': 'bg-gradient-to-r from-green-500 to-emerald-600',
      'product': 'bg-gradient-to-r from-blue-500 to-cyan-600',
      'service': 'bg-gradient-to-r from-purple-500 to-pink-600',
      'voucher': 'bg-gradient-to-r from-amber-500 to-orange-600',
    };
    return colors[category] || 'bg-gradient-to-r from-gray-500 to-gray-600';
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Reward Catalog</h3>
        <button
          onClick={onAddNew}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Reward
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search rewards..."
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                categoryFilter === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Rewards Grid */}
      {filteredRewards.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400">No rewards found</div>
          <button
            onClick={onAddNew}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Create your first reward
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRewards.map((reward) => (
            <div
              key={reward.id}
              className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden hover:border-blue-500 transition-colors"
            >
              {/* Reward Header */}
              <div className={`h-32 ${getCategoryColor(reward.category)} p-4`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-3 py-1 bg-black bg-opacity-30 rounded-full text-sm text-white">
                      {reward.category.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {reward.points_cost.toLocaleString()}
                    </div>
                    <div className="text-sm text-white text-opacity-80">points</div>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-xl font-bold text-white">{reward.reward_name}</h4>
                </div>
              </div>

              {/* Reward Body */}
              <div className="p-4">
                <p className="text-gray-300 mb-4">{reward.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-400">Cash Value</div>
                    <div className="text-lg font-bold text-green-400">
                      ${reward.cash_value.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Stock</div>
                    <div className={`text-lg font-bold ${
                      reward.stock_quantity > 10 ? 'text-green-400' : 
                      reward.stock_quantity > 0 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {reward.stock_quantity}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      reward.is_active ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm text-gray-300">
                      {reward.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {reward.validity_period_days} days validity
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onRedeem(reward)}
                    disabled={!reward.is_active || reward.stock_quantity === 0}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Redeem
                  </button>
                  <button
                    onClick={() => onEdit(reward)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 pt-6 border-t border-gray-700">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{rewards.length}</div>
            <div className="text-sm text-gray-400">Total Rewards</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {rewards.filter(r => r.is_active).length}
            </div>
            <div className="text-sm text-gray-400">Active Rewards</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {rewards.filter(r => r.stock_quantity > 0).length}
            </div>
            <div className="text-sm text-gray-400">In Stock</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              ${rewards.reduce((sum, r) => sum + r.cash_value, 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">Total Value</div>
          </div>
        </div>
      </div>
    </div>
  );
};