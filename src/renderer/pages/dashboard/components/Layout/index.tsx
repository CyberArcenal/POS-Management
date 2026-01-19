import React from 'react';

interface DashboardSectionProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  subtitle,
  actions,
  children,
  className = '',
}) => {
  return (
    <section className={`mb-8 animate-fade-in ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
      {children}
    </section>
  );
};

export const DashboardGrid: React.FC<{
  children: React.ReactNode;
  cols?: number;
  gap?: number;
  className?: string;
}> = ({ children, cols = 2, gap = 6, className = '' }) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  const gridGap = {
    2: 'gap-2',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  };

  return (
    <div className={`grid ${gridCols[cols as keyof typeof gridCols]} ${gridGap[gap as keyof typeof gridGap]} ${className}`}>
      {children}
    </div>
  );
};

export const DashboardCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}> = ({ children, className = '', hover = true, padding = 'md' }) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={`
      bg-white dark:bg-gray-800 
      rounded-2xl border border-gray-200 dark:border-gray-700 
      ${paddingClasses[padding]} 
      ${hover ? 'hover-lift' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};