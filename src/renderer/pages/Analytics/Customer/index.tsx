import React, { useState, useEffect } from 'react';
import SummaryCards from './components/SummaryCards';
import TopSpendersTable from './components/TopSpendersTable';
import TopLoyaltyTable from './components/TopLoyaltyTable';
import SegmentationPieChart from './components/SegmentationPieChart';
import CustomerTable from './components/CustomerTable';
import type { CustomerSegmentation, CustomerSummary, TopCustomerLoyalty, TopCustomerSpending } from '../../../api/analytics/customer_insight';
import customerInsightsAPI from '../../../api/analytics/customer_insight';

const CustomerInsights: React.FC = () => {
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [topSpenders, setTopSpenders] = useState<TopCustomerSpending[]>([]);
  const [topLoyalty, setTopLoyalty] = useState<TopCustomerLoyalty[]>([]);
  const [segmentation, setSegmentation] = useState<CustomerSegmentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [sumRes, spendRes, loyaltyRes, segRes] = await Promise.all([
          customerInsightsAPI.getSummary(),
          customerInsightsAPI.getTopBySpending({ limit: 5 }),
          customerInsightsAPI.getTopByLoyaltyPoints({ limit: 5 }),
          customerInsightsAPI.getSegmentation(),
        ]);

        if (sumRes.status) setSummary(sumRes.data);
        if (spendRes.status) setTopSpenders(spendRes.data as TopCustomerSpending[]);
        if (loyaltyRes.status) setTopLoyalty(loyaltyRes.data as TopCustomerLoyalty[]);
        if (segRes.status) setSegmentation(segRes.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--border-color)]">
          Loading customer insights...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--danger-color)]/30 text-[var(--danger-color)]">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[var(--background-color)] min-h-screen">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Customer Insights</h1>

      {summary && <SummaryCards summary={summary} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TopSpendersTable data={topSpenders} />
          <TopLoyaltyTable data={topLoyalty} />
        </div>
        <div>
          {segmentation && <SegmentationPieChart segmentation={segmentation} />}
        </div>
      </div>

      <CustomerTable />
    </div>
  );
};

export default CustomerInsights;