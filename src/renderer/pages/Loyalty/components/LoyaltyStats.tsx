import React from 'react';
import type { LoyaltyStats as LoyaltyStatsType } from '../../../api/loyalty';

interface LoyaltyStatsProps {
  stats: LoyaltyStatsType;
}

export const LoyaltyStats: React.FC<LoyaltyStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Members */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 border border-blue-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-white">{stats.total_members.toLocaleString()}</div>
            <div className="text-blue-200 mt-1">Total Members</div>
          </div>
          <div className="p-3 bg-blue-700 rounded-lg">
            <svg className="w-8 h-8 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.67 3.623a10.953 10.953 0 01-1.67.377 6 6 0 01-7.743-7.743 10.953 10.953 0 011.67-.377 6 6 0 017.743 7.743z" />
            </svg>
          </div>
        </div>
        <div className="mt-4 text-sm text-blue-300">
          <span className="font-semibold">{stats.active_members}</span> active members
        </div>
      </div>

      {/* Points Issued */}
      <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-xl p-6 border border-green-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-white">{stats.total_points_issued.toLocaleString()}</div>
            <div className="text-green-200 mt-1">Points Issued</div>
          </div>
          <div className="p-3 bg-green-700 rounded-lg">
            <svg className="w-8 h-8 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="mt-4 text-sm text-green-300">
          <span className="font-semibold">{stats.outstanding_points.toLocaleString()}</span> points outstanding
        </div>
      </div>

      {/* Points Redeemed */}
      <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl p-6 border border-purple-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-white">{stats.total_points_redeemed.toLocaleString()}</div>
            <div className="text-purple-200 mt-1">Points Redeemed</div>
          </div>
          <div className="p-3 bg-purple-700 rounded-lg">
            <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
            </svg>
          </div>
        </div>
        <div className="mt-4 text-sm text-purple-300">
          <span className="font-semibold">{stats.redemptions_this_month}</span> redemptions this month
        </div>
      </div>

      {/* Average Points */}
      <div className="bg-gradient-to-br from-amber-900 to-amber-800 rounded-xl p-6 border border-amber-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-white">{stats.average_points_per_member.toLocaleString()}</div>
            <div className="text-amber-200 mt-1">Avg Points/Member</div>
          </div>
          <div className="p-3 bg-amber-700 rounded-lg">
            <svg className="w-8 h-8 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
            </svg>
          </div>
        </div>
        <div className="mt-4 text-sm text-amber-300">
          <span className="font-semibold">{stats.points_expiring_soon}</span> points expiring soon
        </div>
      </div>
    </div>
  );
};