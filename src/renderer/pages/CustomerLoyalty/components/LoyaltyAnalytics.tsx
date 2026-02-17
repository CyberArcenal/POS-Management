import React from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler,
} from "chart.js";
import { Pie, Line, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler
);

interface PointsDistribution {
  range: string;
  count: number;
}

interface MonthlyTrend {
  month: string;
  earned: number;
  redeemed: number;
  count: number;
}

interface TopCustomer {
  customerId: number;
  name: string;
  netPoints: number;
  transactionCount: number;
}

interface LoyaltyAnalyticsProps {
  pointsDistribution: PointsDistribution[];
  monthlyTrends: MonthlyTrend[];
  topCustomers: TopCustomer[];
}

export const LoyaltyAnalytics: React.FC<LoyaltyAnalyticsProps> = ({
  pointsDistribution,
  monthlyTrends,
  topCustomers,
}) => {
  // Bright, vibrant colors
  const pieColors = [
    "#22c55e", // green
    "#3b82f6", // blue
    "#f97316", // orange
    "#a855f7", // purple
    "#ef4444", // red
  ];

  // Pie chart: points distribution
  const pieData = {
    labels: pointsDistribution.map((d) => d.range),
    datasets: [
      {
        data: pointsDistribution.map((d) => d.count),
        backgroundColor: pieColors,
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: "var(--text-primary)",
          font: { size: 12 },
        },
        position: "bottom" as const,
      },
      tooltip: {
        backgroundColor: "var(--card-bg)",
        titleColor: "var(--text-primary)",
        bodyColor: "var(--text-secondary)",
        borderColor: "var(--border-color)",
        borderWidth: 1,
      },
    },
  };

  // Line chart: monthly trends (earned vs redeemed)
  const lineData = {
    labels: monthlyTrends.map((t) => t.month),
    datasets: [
      {
        label: "Points Earned",
        data: monthlyTrends.map((t) => t.earned),
        borderColor: "#22c55e",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#22c55e",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "Points Redeemed",
        data: monthlyTrends.map((t) => t.redeemed),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#ef4444",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "var(--text-primary)" },
        position: "top" as const,
      },
      tooltip: {
        backgroundColor: "var(--card-bg)",
        titleColor: "var(--text-primary)",
        bodyColor: "var(--text-secondary)",
        borderColor: "var(--border-color)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: "var(--text-tertiary)" },
        grid: { color: "var(--border-light)" },
      },
      y: {
        ticks: { color: "var(--text-tertiary)" },
        grid: { color: "var(--border-light)" },
      },
    },
  };

  // Bar chart: top customers by net points
  const barData = {
    labels: topCustomers.slice(0, 5).map((c) => c.name),
    datasets: [
      {
        label: "Net Points",
        data: topCustomers.slice(0, 5).map((c) => c.netPoints),
        backgroundColor: "#3b82f6",
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "var(--card-bg)",
        titleColor: "var(--text-primary)",
        bodyColor: "var(--text-secondary)",
        borderColor: "var(--border-color)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: "var(--text-tertiary)" },
        grid: { display: false },
      },
      y: {
        ticks: { color: "var(--text-tertiary)" },
        grid: { color: "var(--border-light)" },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Points Distribution */}
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Points Distribution</h3>
        <div className="flex justify-center items-center h-64">
          <div className="w-full max-w-xs">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Monthly Trends</h3>
        <div className="h-64">
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

      {/* Top Customers */}
      <div className="lg:col-span-2 bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Top Customers by Net Points</h3>
        <div className="h-64">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    </div>
  );
};