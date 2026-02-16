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
  Title
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
  // Colors from theme
  const colors = [
    "var(--accent-blue)",
    "var(--accent-green)",
    "var(--accent-amber)",
    "var(--accent-purple)",
    "var(--accent-red)",
  ];

  // Pie chart: points distribution
  const pieData = {
    labels: pointsDistribution.map((d) => d.range),
    datasets: [
      {
        data: pointsDistribution.map((d) => d.count),
        backgroundColor: colors,
        borderColor: "var(--border-color)",
        borderWidth: 1,
      },
    ],
  };

  // Line chart: monthly trends (earned vs redeemed)
  const lineData = {
    labels: monthlyTrends.map((t) => t.month),
    datasets: [
      {
        label: "Points Earned",
        data: monthlyTrends.map((t) => t.earned),
        borderColor: "var(--accent-green)",
        backgroundColor: "var(--accent-green-light)",
        tension: 0.4,
      },
      {
        label: "Points Redeemed",
        data: monthlyTrends.map((t) => t.redeemed),
        borderColor: "var(--accent-red)",
        backgroundColor: "var(--accent-red-light)",
        tension: 0.4,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "var(--text-secondary)" },
      },
    },
    scales: {
      x: { ticks: { color: "var(--text-tertiary)" } },
      y: { ticks: { color: "var(--text-tertiary)" } },
    },
  };

  // Bar chart: top customers by net points
  const barData = {
    labels: topCustomers.slice(0, 5).map((c) => c.name),
    datasets: [
      {
        label: "Net Points",
        data: topCustomers.slice(0, 5).map((c) => c.netPoints),
        backgroundColor: "var(--accent-blue)",
        borderColor: "var(--accent-blue-hover)",
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { ticks: { color: "var(--text-tertiary)" } },
      y: { ticks: { color: "var(--text-tertiary)" } },
    },
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Points Distribution */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <h3 className="text-md font-semibold text-[var(--text-primary)] mb-4">Points Distribution</h3>
        <div className="h-64">
          <Pie data={pieData} options={{ maintainAspectRatio: false }} />
        </div>
      </div>

      {/* Redemption Trends */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <h3 className="text-md font-semibold text-[var(--text-primary)] mb-4">Monthly Trends</h3>
        <div className="h-64">
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

      {/* Top Customers */}
      <div className="col-span-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4">
        <h3 className="text-md font-semibold text-[var(--text-primary)] mb-4">Top Customers by Net Points</h3>
        <div className="h-64">
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    </div>
  );
};