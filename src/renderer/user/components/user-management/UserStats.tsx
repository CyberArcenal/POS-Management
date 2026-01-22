import React from 'react';

interface UserStatsProps {
  stats: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
    managers: number;
    cashiers: number;
  };
}

export const UserStats: React.FC<UserStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="text-2xl font-bold text-white">{stats.total}</div>
        <div className="text-sm text-gray-400">Total Users</div>
      </div>
      
      <div className="bg-gray-800 p-4 rounded-lg border border-green-900 border-opacity-50">
        <div className="text-2xl font-bold text-green-400">{stats.active}</div>
        <div className="text-sm text-gray-400">Active</div>
      </div>
      
      <div className="bg-gray-800 p-4 rounded-lg border border-red-900 border-opacity-50">
        <div className="text-2xl font-bold text-red-400">{stats.inactive}</div>
        <div className="text-sm text-gray-400">Inactive</div>
      </div>
      
      <div className="bg-gray-800 p-4 rounded-lg border border-purple-900 border-opacity-50">
        <div className="text-2xl font-bold text-purple-400">{stats.admins}</div>
        <div className="text-sm text-gray-400">Admins</div>
      </div>
      
      <div className="bg-gray-800 p-4 rounded-lg border border-blue-900 border-opacity-50">
        <div className="text-2xl font-bold text-blue-400">{stats.managers}</div>
        <div className="text-sm text-gray-400">Managers</div>
      </div>
      
      <div className="bg-gray-800 p-4 rounded-lg border border-cyan-900 border-opacity-50">
        <div className="text-2xl font-bold text-cyan-400">{stats.cashiers}</div>
        <div className="text-sm text-gray-400">Cashiers</div>
      </div>
    </div>
  );
};