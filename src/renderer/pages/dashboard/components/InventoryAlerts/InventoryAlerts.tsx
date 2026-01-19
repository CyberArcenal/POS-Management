import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import type { InventoryOverviewData } from '../../../../api/dashboard';

interface InventoryAlertsProps {
    data: InventoryOverviewData | null;
    loading: boolean;
}

const InventoryAlerts: React.FC<InventoryAlertsProps> = ({ data, loading }) => {
    const getStockStatus = (stock: number, minStock: number) => {
        if (stock === 0) return { level: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', icon: AlertCircle };
        if (stock <= minStock) return { level: 'Low Stock', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: AlertTriangle };
        if (stock <= minStock * 2) return { level: 'Attention', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: Info };
        return { level: 'In Stock', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', icon: CheckCircle };
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 h-full animate-pulse">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    const alerts = data?.stockAlerts || [];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 h-full animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inventory Alerts</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Items needing attention</p>
                </div>
                {data?.summary && (
                    <div className="flex space-x-2">
                        <div className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-sm font-medium">
                            {data.summary.outOfStock} Out
                        </div>
                        <div className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full text-sm font-medium">
                            {data.summary.lowStock} Low
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {alerts.slice(0, 4).map((alert, index) => {
                    const status = getStockStatus(alert.currentStock, alert.minStock);
                    const Icon = status.icon;

                    return (
                        <div
                            key={alert.id}
                            className={`p-4 rounded-lg border ${status.bg} border-gray-200 dark:border-gray-700 hover:scale-[1.02] transition-all duration-300 group animate-fade-in-up`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg ${status.bg}`}>
                                        <Icon className={`h-5 w-5 ${status.color}`} />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {alert.name}
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{alert.sku}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-lg font-bold ${status.color}`}>
                                        {alert.currentStock}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        /{alert.minStock} min
                                    </div>
                                </div>
                            </div>

                            {alert.currentStock <= alert.minStock && (
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Need to order: <span className="font-semibold">{alert.needed} units</span>
                                    </span>
                                    <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                                        Reorder →
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {data?.summary && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {data.summary.totalProducts}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Products</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                ${data.summary.totalValue?.toLocaleString() || '0'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Total Value</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {data.summary.inStock}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">In Stock</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryAlerts;