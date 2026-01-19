import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
  type ChartOptions,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
);

export const useDashboardCharts = () => {
  const chartRefs = useRef<Record<string, any>>({});

  // Chart color schemes
  const colorSchemes = {
    primary: {
      border: 'rgb(59, 130, 246)',
      background: 'rgba(59, 130, 246, 0.1)',
      gradient: (ctx: CanvasRenderingContext2D) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        return gradient;
      },
    },
    success: {
      border: 'rgb(16, 185, 129)',
      background: 'rgba(16, 185, 129, 0.1)',
      gradient: (ctx: CanvasRenderingContext2D) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        return gradient;
      },
    },
    warning: {
      border: 'rgb(245, 158, 11)',
      background: 'rgba(245, 158, 11, 0.1)',
      gradient: (ctx: CanvasRenderingContext2D) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(245, 158, 11, 0.3)');
        gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
        return gradient;
      },
    },
    danger: {
      border: 'rgb(239, 68, 68)',
      background: 'rgba(239, 68, 68, 0.1)',
      gradient: (ctx: CanvasRenderingContext2D) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
        return gradient;
      },
    },
    purple: {
      border: 'rgb(139, 92, 246)',
      background: 'rgba(139, 92, 246, 0.1)',
      gradient: (ctx: CanvasRenderingContext2D) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
        return gradient;
      },
    },
  };

  // Common chart options for line/bar charts
  const getLineBarChartOptions = (): ChartOptions<'line' | 'bar'> => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: 'var(--text-secondary)',
            font: {
              family: 'inherit',
              size: 12,
            },
            usePointStyle: true,
            padding: 20,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(59, 130, 246, 0.5)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          usePointStyle: true,
          displayColors: true,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== undefined && context.parsed.y !== null) {
                label += new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(context.parsed.y);
              }
              return label;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(203, 213, 225, 0.1)',
            display: true,
          },
          ticks: {
            color: 'var(--text-tertiary)',
            font: {
              size: 11,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(203, 213, 225, 0.1)',
            display: true,
          },
          ticks: {
            color: 'var(--text-tertiary)',
            font: {
              size: 11,
            },
            callback: function(value) {
              if (value === null || value === undefined) return '';
              return '$' + value;
            },
          },
        },
      },
      interaction: {
        intersect: false,
        mode: 'index' as const,
      },
      animations: {
        tension: {
          duration: 1000,
          easing: 'easeOutCubic' as const,
        },
      },
    };
  };

  // Doughnut chart options
  const getDoughnutChartOptions = (): ChartOptions<'doughnut'> => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            color: 'var(--text-secondary)',
            font: {
              family: 'inherit',
              size: 12,
            },
            usePointStyle: true,
            padding: 20,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(30, 41, 59, 0.95)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(59, 130, 246, 0.5)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          usePointStyle: true,
          displayColors: true,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw as number;
              return `${label}: $${value.toLocaleString()}`;
            },
          },
        },
      },
    };
  };

  // Get chart options based on type
  const getChartOptions = (type: 'line' | 'bar' | 'doughnut' = 'line'): ChartOptions<any> => {
    if (type === 'doughnut') {
      return getDoughnutChartOptions();
    }
    return getLineBarChartOptions();
  };

  // Sales trend data formatter
  const formatSalesTrendData = (trendData: any) => {
    if (!trendData?.trend) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    return {
      labels: trendData.trend.map((item: any) => item.period),
      datasets: [
        {
          label: 'Revenue',
          data: trendData.trend.map((item: any) => item.totalRevenue),
          borderColor: colorSchemes.primary.border,
          backgroundColor: colorSchemes.primary.gradient(ctx),
          fill: true,
          tension: 0.4,
          pointBackgroundColor: colorSchemes.primary.border,
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Transactions',
          data: trendData.trend.map((item: any) => item.transactionCount),
          borderColor: colorSchemes.purple.border,
          backgroundColor: 'transparent',
          tension: 0.4,
          borderDash: [5, 5],
          pointBackgroundColor: colorSchemes.purple.border,
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  };

  // Sales by category data formatter
  const formatCategoryData = (categoryData: any) => {
    if (!categoryData?.categories) return null;

    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#F97316', '#EC4899', '#6366F1', '#14B8A6'
    ];

    return {
      labels: categoryData.categories.map((cat: any) => cat.category),
      datasets: [
        {
          data: categoryData.categories.map((cat: any) => cat.totalRevenue),
          backgroundColor: colors,
          borderColor: colors.map(color => color + '80'),
          borderWidth: 1,
          hoverOffset: 15,
        },
      ],
    };
  };

  // Hourly pattern data formatter
  const formatHourlyData = (hourlyData: any) => {
    if (!hourlyData?.pattern) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    return {
      labels: hourlyData.pattern.map((item: any) => `${item.hour}:00`),
      datasets: [
        {
          label: 'Revenue',
          data: hourlyData.pattern.map((item: any) => item.totalRevenue),
          backgroundColor: colorSchemes.primary.gradient(ctx),
          borderColor: colorSchemes.primary.border,
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    };
  };

  // Payment methods data formatter
  const formatPaymentMethodsData = (paymentData: any) => {
    if (!paymentData) return null;

    const colors: Record<string, string> = {
      'Cash': '#10B981',
      'Card': '#3B82F6',
      'Digital Wallet': '#8B5CF6',
      'Credit': '#F59E0B',
      'Cash on Delivery': '#F97316',
    };

    return {
      labels: paymentData.map((item: any) => item.paymentMethod),
      datasets: [
        {
          data: paymentData.map((item: any) => item.total),
          backgroundColor: paymentData.map((item: any) => 
            colors[item.paymentMethod] || '#64748B'
          ),
          borderColor: 'white',
          borderWidth: 2,
        },
      ],
    };
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      Object.values(chartRefs.current).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      });
    };
  }, []);

  return {
    chartRefs,
    colorSchemes,
    getChartOptions,
    formatSalesTrendData,
    formatCategoryData,
    formatHourlyData,
    formatPaymentMethodsData,
  };
};