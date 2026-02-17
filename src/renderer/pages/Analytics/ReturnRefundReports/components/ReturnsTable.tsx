import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import type { ReturnRefundEntry } from '../../../../api/analytics/return_refund_reports';
import returnRefundAPI from '../../../../api/analytics/return_refund_reports';

interface Props {
  data: ReturnRefundEntry[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

const ReturnsTable: React.FC<Props> = ({
  data,
  loading,
  page,
  totalPages,
  total,
  onPageChange,
}) => {
  const [selectedReturn, setSelectedReturn] = useState<ReturnRefundEntry | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

  const handleViewDetails = async (id: number) => {
    setLoadingDetails(true);
    setShowModal(true);
    try {
      const res = await returnRefundAPI.getById(id);
      if (res.status) setSelectedReturn(res.data);
      else throw new Error(res.message);
    } catch (err: any) {
      alert('Failed to load details: ' + err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-[var(--status-completed-bg)] text-[var(--status-completed)]';
      case 'pending':
        return 'bg-[var(--status-pending-bg)] text-[var(--status-pending)]';
      case 'rejected':
        return 'bg-[var(--danger-bg)] text-[var(--danger-color)]';
      default:
        return 'bg-[var(--border-light)] text-[var(--text-secondary)]';
    }
  };

  return (
    <>
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-color)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Return/Refund Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--card-bg)]">
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Reference</th>
                <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Date</th>
                <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Customer</th>
                <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Reason</th>
                <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Method</th>
                <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Amount</th>
                <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Status</th>
                <th className="text-left py-3 px-5 text-[var(--text-secondary)] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-8 text-center text-[var(--text-secondary)]">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-[var(--text-secondary)]">No records found.</td></tr>
              ) : (
                data.map(item => (
                  <tr key={item.id} className="border-b border-[var(--border-light)] hover:bg-[var(--card-hover-bg)]">
                    <td className="py-3 px-5 text-[var(--text-primary)] font-medium">{item.referenceNo}</td>
                    <td className="py-3 px-5 text-[var(--text-primary)]">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-5 text-[var(--text-primary)]">{item.customer?.name || '-'}</td>
                    <td className="py-3 px-5 text-[var(--text-primary)] truncate max-w-[150px]">{item.reason}</td>
                    <td className="py-3 px-5 text-[var(--text-primary)] capitalize">{item.refundMethod}</td>
                    <td className="py-3 px-5 text-[var(--text-primary)]">{formatCurrency(item.totalAmount)}</td>
                    <td className="py-3 px-5">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <button
                        onClick={() => handleViewDetails(item.id)}
                        className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors"
                        title="View details"
                      >
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
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-2 bg-[var(--card-secondary-bg)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--card-hover-bg)] disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-[var(--text-primary)]">Page {page} of {totalPages}</span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="p-2 bg-[var(--card-secondary-bg)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--card-hover-bg)] disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] w-full max-w-3xl max-h-[80vh] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border-color)] flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Return Details - {selectedReturn?.referenceNo}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕</button>
            </div>
            <div className="overflow-y-auto p-5">
              {loadingDetails ? (
                <div className="text-center py-8 text-[var(--text-secondary)]">Loading details...</div>
              ) : selectedReturn ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Reference No</p>
                      <p className="text-[var(--text-primary)] font-medium">{selectedReturn.referenceNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Date</p>
                      <p className="text-[var(--text-primary)]">{new Date(selectedReturn.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Customer</p>
                      <p className="text-[var(--text-primary)]">{selectedReturn.customer?.name || 'Guest'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Status</p>
                      <p className={`px-2 py-1 rounded-full text-xs inline-block ${getStatusBadge(selectedReturn.status)}`}>
                        {selectedReturn.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Refund Method</p>
                      <p className="text-[var(--text-primary)] capitalize">{selectedReturn.refundMethod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Total Amount</p>
                      <p className="text-[var(--text-primary)] font-bold">{formatCurrency(selectedReturn.totalAmount)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-[var(--text-secondary)]">Reason</p>
                      <p className="text-[var(--text-primary)]">{selectedReturn.reason}</p>
                    </div>
                  </div>

                  {selectedReturn.items && selectedReturn.items.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-[var(--text-primary)] mb-2">Items Returned</h4>
                      <table className="w-full text-sm">
                        <thead className="border-b border-[var(--border-color)]">
                          <tr>
                            <th className="text-left py-2 text-[var(--text-secondary)]">Product</th>
                            <th className="text-right py-2 text-[var(--text-secondary)]">Qty</th>
                            <th className="text-right py-2 text-[var(--text-secondary)]">Unit Price</th>
                            <th className="text-right py-2 text-[var(--text-secondary)]">Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedReturn.items.map(item => (
                            <tr key={item.id} className="border-b border-[var(--border-light)]">
                              <td className="py-2 text-[var(--text-primary)]">{item.product?.name || `Product #${item.productId}`}</td>
                              <td className="py-2 text-right text-[var(--text-primary)]">{item.quantity}</td>
                              <td className="py-2 text-right text-[var(--text-primary)]">{formatCurrency(item.unitPrice)}</td>
                              <td className="py-2 text-right text-[var(--text-primary)]">{formatCurrency(item.lineTotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--text-secondary)]">No details found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReturnsTable;