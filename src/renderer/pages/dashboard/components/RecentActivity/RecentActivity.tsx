import React from 'react';
import { Activity, ShoppingCart, Package, User, Clock, TrendingUp } from 'lucide-react';
import type { LiveDashboardData } from '../../../../api/dashboard';

interface RecentActivityProps {
    data: LiveDashboardData | null;
    loading: boolean;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ data, loading }) => {
    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'sale':
                return ShoppingCart;
            case 'inventory':
                return Package;
            case 'user':
                return User;
            default:
                return Activity;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'sale':
                return 'text-green-600 bg-green-50 dark:bg-green-900/20';
            case 'inventory':
                return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
            case 'user':
                return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
            default:
                return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
        }
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    const activities = [
        ...(data?.recentTransactions?.map(tx => ({
            id: tx.id,
            type: 'sale',
            title: `New Sale: $${tx.total}`,
            description: `Transaction #${tx.reference}`,
            time: tx.time,
            user: tx.cashier,
        })) || []),
        {
            id: 'inventory-1',
            type: 'inventory',
            title: 'Low Stock Alert',
            description: 'Product XYZ is running low',
            time: '10:30 AM',
            user: 'System',
        },
        {
            id: 'user-1',
            type: 'user',
            title: 'New Customer Added',
            description: 'John Doe registered',
            time: '9:45 AM',
            user: 'Admin',
        },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Latest system activities</p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                    <Clock className="h-4 w-4" />
                    <span>Real-time</span>
                </div>
            </div>

            <div className="space-y-4">
                {activities.slice(0, 5).map((activity, index) => {
                    const Icon = getActivityIcon(activity.type);
                    const colorClass = getActivityColor(activity.type);

                    return (
                        <div
                            key={activity.id}
                            className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group animate-fade-in-up"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className={`p-2 rounded-lg ${colorClass}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {activity.title}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {activity.description}
                                </p>
                                <div className="flex items-center space-x-3 mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {activity.time}
                                    </span>
                                    {activity.user && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            by {activity.user}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {data?.today && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 p-4 rounded-xl">
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Today's Revenue</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                ${data.today.totalRevenue.toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 p-4 rounded-xl">
                            <div className="flex items-center space-x-2">
                                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">Active Users</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                                {data.activeUsers}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecentActivity;