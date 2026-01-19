import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, Users, CreditCard } from 'lucide-react';
import type { StatCardProps } from '../../types';

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    change,
    icon,
    color,
    format = 'number',
    loading = false
}) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600 border-blue-100',
        green: 'from-green-500 to-emerald-600 border-green-100',
        purple: 'from-purple-500 to-violet-600 border-purple-100',
        orange: 'from-amber-500 to-orange-500 border-amber-100',
        red: 'from-rose-500 to-pink-600 border-rose-100',
    };

    const iconComponents = {
        sales: DollarSign,
        inventory: Package,
        customers: Users,
        transactions: CreditCard,
    };

    const IconComponent = iconComponents[icon as keyof typeof iconComponents] || DollarSign;

    const formatValue = (val: number | string) => {
        if (format === 'currency') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
            }).format(Number(val));
        }
        if (format === 'percentage') {
            return `${Number(val).toFixed(1)}%`;
        }
        return new Intl.NumberFormat('en-US').format(Number(val));
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
        );
    }

    return (
        <div className="group relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                style={{ background: `linear-gradient(135deg, var(--accent-${color}), var(--accent-${color}-dark))` }} />

            <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatValue(value)}
                        </h3>
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-sm`}>
                        <IconComponent className="h-6 w-6 text-white" />
                    </div>
                </div>

                <div className="flex items-center mt-2">
                    <div className={`flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                            <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        <span className="text-sm font-medium">
                            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                        </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs last period</span>
                </div>

                {/* Animated progress bar */}
                <div className="mt-4">
                    <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ease-out rounded-full`}
                            style={{
                                width: `${Math.min(Math.abs(change) * 3, 100)}%`,
                                background: `linear-gradient(90deg, var(--accent-${color}), var(--accent-${color}-hover))`
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Glow effect on hover */}
            <div className="absolute -inset-1 opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300"
                style={{ background: `radial-gradient(circle at center, var(--accent-${color}) 0%, transparent 70%)` }} />
        </div>
    );
};

export default StatCard;