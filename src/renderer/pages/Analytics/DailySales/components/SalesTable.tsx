import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import type { DailySalesEntry } from '../../../../api/analytics/daily_sales';
import dailySalesAPI from '../../../../api/analytics/daily_sales';

interface Props {
  data: DailySalesEntry[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

const SalesTable: React.FC<Props> = ({
  data,
  loading,
  page,
  totalPages,
  total,
  onPageChange,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [details, setDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const formatCurrency = (val: number | string) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(val));

  const handleViewDetails = async (date: string) => {
    setSelectedDate(date);
    setLoadingDetails(true);
    setShowModal(true);
    try {
      const res = await dailySalesAPI.getDailySalesDetails({ date, page: 1, limit: 100 });
      if (res.status) setDetails(res.data);
      else throw new Error(res.message);
    } catch (err: any) {
      alert('Failed to load details: ' + err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <>
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-color)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Daily Sales Entries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--card-bg)]">
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Date</th>
                <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Transactions</th>
                <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Total Amount</th>
                <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Average</th>
                <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Paid Transactions</th>
                <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-[var(--text-secondary)]">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-[var(--text-secondary)]">No sales data found.</td></tr>
              ) : (
                data.map(row => (
                  <tr key={row.date} className="border-b border-[var(--border-light)] hover:bg-[var(--card-hover-bg)]">
                    <td className="py-3 px-5 text-[var(--text-primary)] font-medium">{new Date(row.date).toLocaleDateString()}</td>
                    <td className="py-3 px-5 text-[var(--text-primary)]">{row.count}</td>
                    <td className="py-3 px-5 text-[var(--text-primary)]">{formatCurrency(row.total)}</td>
                    <td className="py-3 px-5 text-[var(--text-primary)]">{formatCurrency(row.average)}</td>
                    <td className="py-3 px-5 text-[var(--text-primary)]">{row.paidCount}</td>
                    <td className="py-3 px-5">
                      <button onClick={() => handleViewDetails(row.date)} className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors" title="View details">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-[var(--border-color)] flex items-center justify-between">
          <p className="text-sm text-[var(--text-secondary)]">
            Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} entries
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="p-2 bg-[var(--card-secondary-bg)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--card-hover-bg)] disabled:opacity-50 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-[var(--text-primary)]">Page {page} of {totalPages}</span>
            <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="p-2 bg-[var(--card-secondary-bg)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--card-hover-bg)] disabled:opacity-50 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-color)] flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Sales Details for {selectedDate && new Date(selectedDate).toLocaleDateString()}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕</button>
            </div>
            <div className="overflow-y-auto p-5">
              {loadingDetails ? (
                <div className="text-center py-8 text-[var(--text-secondary)]">Loading details...</div>
              ) : details.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-secondary)]">No transactions found for this day.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="text-left py-2 px-3 text-[var(--text-secondary)]">ID</th>
                      <th className="text-left py-2 px-3 text-[var(--text-secondary)]">Time</th>
                      <th className="text-left py-2 px-3 text-[var(--text-secondary)]">Status</th>
                      <th className="text-left py-2 px-3 text-[var(--text-secondary)]">Payment Method</th>
                      <th className="text-left py-2 px-3 text-[var(--text-secondary)]">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.map(item => (
                      <tr key={item.id} className="border-b border-[var(--border-light)]">
                        <td className="py-2 px-3 text-[var(--text-primary)]">{item.id}</td>
                        <td className="py-2 px-3 text-[var(--text-primary)]">{new Date(item.timestamp).toLocaleTimeString()}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.status === 'completed' ? 'bg-[var(--status-completed-bg)] text-[var(--status-completed)]' :
                            item.status === 'pending' ? 'bg-[var(--status-pending-bg)] text-[var(--status-pending)]' :
                            'bg-[var(--status-cancelled-bg)] text-[var(--status-cancelled)]'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[var(--text-primary)]">{item.paymentMethod}</td>
                        <td className="py-2 px-3 text-[var(--text-primary)]">{formatCurrency(item.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SalesTable;