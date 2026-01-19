import React, { useEffect, useRef } from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { useDashboardCharts } from '../../hooks/useDashboardCharts';

interface SalesTrendChartProps {
    data: any;
    loading: boolean;
}

const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ data, loading }) => {
    const { formatSalesTrendData, getChartOptions } = useDashboardCharts();
    const chartRef = useRef<any>(null);

    const chartData = formatSalesTrendData(data);
    const options = getChartOptions('line');

    useEffect(() => {
        // Force chart update when data changes
        if (chartRef.current && chartData) {
            chartRef.current.update();
        }
    }, [chartData]);

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 h-[400px] animate-pulse">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
                <div className="h-full bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Trend</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Revenue and transaction volume over time
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    {data?.summary?.totalRevenue && (
                        <div className="flex items-center text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            <span>{`+${((data.summary.totalRevenue / 10000) * 100).toFixed(1)}%`}</span>
                        </div>
                    )}
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </div>

            <div className="h-[300px]">
                {chartData ? (
                    <Line ref={chartRef} data={chartData} options={options} />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                        No data available
                    </div>
                )}
            </div>

            {data?.summary && (
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            ${(data.summary.totalRevenue || 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {(data.summary.totalTransactions || 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            ${(data.trend?.[0]?.avgTransactionValue || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Value</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesTrendChart;