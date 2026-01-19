import React from 'react';
import StatCard from './StatCard';
import type { QuickStatsData } from '../../../../api/dashboard';

interface StatCardsGridProps {
    data: QuickStatsData | null;
    loading: boolean;
}

const StatCardsGrid: React.FC<StatCardsGridProps> = ({ data, loading }) => {
    const stats = [
        {
            title: 'Today\'s Revenue',
            value: data?.sales.today.revenue || 0,
            change: data?.sales.today.vsYesterday.revenue || 0,
            icon: 'sales',
            color: 'green' as const,
            format: 'currency' as const,
        },
        {
            title: 'Today\'s Transactions',
            value: data?.sales.today.transactions || 0,
            change: data?.sales.today.vsYesterday.transactions || 0,
            icon: 'transactions',
            color: 'blue' as const,
            format: 'number' as const,
        },
        {
            title: 'Avg. Transaction',
            value: data?.performance.avgTransactionValue || 0,
            change: 5.2,
            icon: 'sales',
            color: 'purple' as const,
            format: 'currency' as const,
        },
        {
            title: 'Low Stock Items',
            value: data?.inventory.lowStock || 0,
            change: -2.1,
            icon: 'inventory',
            color: 'orange' as const,
            format: 'number' as const,
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
                <div
                    key={stat.title}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    <StatCard {...stat} loading={loading} />
                </div>
            ))}
        </div>
    );
};

export default StatCardsGrid;