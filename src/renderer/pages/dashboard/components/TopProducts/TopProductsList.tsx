import React from 'react';
import { TrendingUp, Star, Package } from 'lucide-react';
import type { TopSellingProductsData } from '../../../../api/dashboard';

interface TopProductsListProps {
    data: TopSellingProductsData | null;
    loading: boolean;
}

const TopProductsList: React.FC<TopProductsListProps> = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 h-full animate-pulse">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
                ))}
            </div>
        );
    }

    const products = data?.products?.slice(0, 5) || [];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 h-full animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Products</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Best selling items this month</p>
                </div>
                <div className="flex items-center text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>Best Sellers</span>
                </div>
            </div>

            <div className="space-y-4">
                {products.map((product, index) => (
                    <div
                        key={product.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors group animate-fade-in-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <Package className="h-5 w-5 text-white" />
                                </div>
                                {index < 3 && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                                        <Star className="h-3 w-3 text-white fill-current" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {product.name}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{product.sku}</p>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="font-bold text-gray-900 dark:text-white">
                                ${product.totalRevenue.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {product.totalSold} sold
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {data?.summary && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Items Sold</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                            {data.summary.totalItemsSold.toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                            ${data.summary.totalRevenue.toLocaleString()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TopProductsList;