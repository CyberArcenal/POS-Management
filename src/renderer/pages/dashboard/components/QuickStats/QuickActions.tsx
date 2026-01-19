
import React from 'react';
import {
    Plus,
    FileText,
    BarChart3,
    RefreshCw,
    Download,
    Printer,
    Settings,
    ShoppingCart,
    TrendingUp,
    Package,
    UserPlus,
    Bell,
    Grid,
    Search,
    Filter,
    Database,
    CreditCard
} from 'lucide-react';

interface QuickActionsProps {
    onRefresh: () => void;
    onExport: () => void;
    onAddSale: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
    onRefresh,
    onExport,
    onAddSale
}) => {
    const actions = [
        {
            icon: ShoppingCart,
            label: 'New Sale',
            color: 'bg-gradient-to-br from-green-500 to-emerald-600',
            hoverColor: 'hover:from-green-600 hover:to-emerald-700',
            onClick: onAddSale,
        },
        {
            icon: FileText,
            label: 'Reports',
            color: 'bg-gradient-to-br from-blue-500 to-blue-600',
            hoverColor: 'hover:from-blue-600 hover:to-blue-700',
            onClick: () => { },
        },
        {
            icon: BarChart3,
            label: 'Analytics',
            color: 'bg-gradient-to-br from-purple-500 to-violet-600',
            hoverColor: 'hover:from-purple-600 hover:to-violet-700',
            onClick: () => { },
        },
        {
            icon: Package,
            label: 'Inventory',
            color: 'bg-gradient-to-br from-amber-500 to-orange-500',
            hoverColor: 'hover:from-amber-600 hover:to-orange-600',
            onClick: () => { },
        },
        {
            icon: Download,
            label: 'Export',
            color: 'bg-gradient-to-br from-cyan-500 to-blue-500',
            hoverColor: 'hover:from-cyan-600 hover:to-blue-600',
            onClick: onExport,
        },
        {
            icon: UserPlus,
            label: 'New Customer',
            color: 'bg-gradient-to-br from-pink-500 to-rose-500',
            hoverColor: 'hover:from-pink-600 hover:to-rose-600',
            onClick: () => { },
        },
        {
            icon: CreditCard,
            label: 'Payments',
            color: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
            hoverColor: 'hover:from-indigo-600 hover:to-indigo-700',
            onClick: () => { },
        },
        {
            icon: Database,
            label: 'Backup',
            color: 'bg-gradient-to-br from-gray-600 to-gray-700',
            hoverColor: 'hover:from-gray-700 hover:to-gray-800',
            onClick: () => { },
        },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6 animate-fade-in-up hover-scale">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                        <Grid className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Frequently used actions</p>
                    </div>
                </div>
                <button
                    onClick={onRefresh}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:scale-105 active:scale-95 text-sm font-medium shadow-sm"
                >
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh</span>
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {actions.map((action, index) => (
                    <button
                        key={action.label}
                        onClick={action.onClick}
                        className="group relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 rounded-lg animate-fade-in-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="quick-action-item">
                            <div className={`${action.color} ${action.hoverColor} p-3 rounded-lg shadow-sm group-hover:shadow-md transition-all duration-200 group-hover:scale-105 group-active:scale-95 h-full min-h-[90px] flex flex-col items-center justify-center gap-2`}>
                                <action.icon className="h-5 w-5 text-white" />
                                <span className="text-xs font-medium text-white text-center leading-tight px-1">
                                    {action.label}
                                </span>
                            </div>
                            
                            {/* Subtle hover effect */}
                            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                        </div>
                        
                        {/* Compact tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                            {action.label}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-gray-900 rotate-45" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuickActions;