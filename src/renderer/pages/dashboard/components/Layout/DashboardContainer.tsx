
import React from 'react';
import '../Animations.css';

interface DashboardContainerProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    className?: string;
}

const DashboardContainer: React.FC<DashboardContainerProps> = ({ 
    children, 
    title, 
    subtitle, 
    className = '' 
}) => {
    return (
        <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
            {/* Animated background elements */}
            <div className="fixed inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20 dark:from-blue-900/5 dark:to-purple-900/5 pointer-events-none" />
            
            {/* Animated grid pattern */}
            <div className="fixed inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.01] pointer-events-none" />
            
            <div className="relative">
                {/* Header Section */}
                {title && (
                    <div className="px-4 py-4 sm:px-6 lg:px-8 animate-fade-in-down">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                                        {title}
                                    </h1>
                                    {subtitle && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                                
                                {/* Live indicator */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-subtle"></div>
                                        <span>Live</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Main Content */}
                <div className="px-4 sm:px-6 lg:px-8 pb-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="space-y-5">
                            {React.Children.map(children, (child, index) => (
                                <div 
                                    key={index}
                                    className="animate-fade-in-up"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {child}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .bg-grid-pattern {
                    background-image: 
                        linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                        linear-gradient(to bottom, #e5e7eb 1px, transparent 1px);
                    background-size: 50px 50px;
                }
                .dark .bg-grid-pattern {
                    background-image: 
                        linear-gradient(to right, #374151 1px, transparent 1px),
                        linear-gradient(to bottom, #374151 1px, transparent 1px);
                }
                
                /* Smooth scrolling */
                * {
                    scroll-behavior: smooth;
                }
                
                /* Optimize animations */
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default DashboardContainer;