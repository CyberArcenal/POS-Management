import React from "react";
import { X, Loader2, Calendar, Mail, Phone, Award, ShoppingBag, TrendingUp } from "lucide-react";
import { type Customer } from "../../../api/customer";
import { type Sale } from "../../../api/sale";
import { type LoyaltyTransaction } from "../../../api/loyalty";
import Decimal from "decimal.js";

interface CustomerViewDialogProps {
  customer: Customer | null;
  sales: Sale[];
  loyaltyTransactions: LoyaltyTransaction[];
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const getCustomerStatus = (points: number): { label: string; color: string } => {
  if (points >= 1000) return { label: "VIP", color: "var(--customer-vip)" };
  if (points >= 500) return { label: "Loyal", color: "var(--customer-loyal)" };
  if (points >= 100) return { label: "Regular", color: "var(--customer-regular)" };
  return { label: "New", color: "var(--customer-new)" };
};

export const CustomerViewDialog: React.FC<CustomerViewDialogProps> = ({
  customer,
  sales,
  loyaltyTransactions,
  loading,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const status = customer ? getCustomerStatus(customer.loyaltyPointsBalance) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
        <div className="relative bg-[var(--card-bg)] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Customer Details</h2>
            <button onClick={onClose} className="p-1 hover:bg-[var(--card-hover-bg)] rounded">
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
              </div>
            ) : customer ? (
              <div className="space-y-6">
                {/* Profile Summary */}
                <div className="bg-[var(--card-secondary-bg)] rounded-lg p-4 border border-[var(--border-color)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{customer.name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {customer.contactInfo && (
                          <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                            {customer.contactInfo.includes('@') ? (
                              <Mail className="w-4 h-4" />
                            ) : (
                              <Phone className="w-4 h-4" />
                            )}
                            <span>{customer.contactInfo}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[var(--text-secondary)]">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {new Date(customer.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    {status && (
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{ backgroundColor: `${status.color}20`, color: status.color }}
                      >
                        {status.label}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-6 mt-4">
                    <div>
                      <p className="text-sm text-[var(--text-tertiary)]">Loyalty Points</p>
                      <p className="text-2xl font-bold text-[var(--accent-purple)]">
                        {customer.loyaltyPointsBalance}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-tertiary)]">Total Spent</p>
                      <p className="text-2xl font-bold text-[var(--accent-green)]">
                        ₱{sales.reduce((sum, s) => sum + (typeof s.totalAmount === 'string' ? parseFloat(s.totalAmount) : s.totalAmount), 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-tertiary)]">Transactions</p>
                      <p className="text-2xl font-bold text-[var(--accent-blue)]">{sales.length}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Sales */}
                <div>
                  <h4 className="text-md font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    Recent Sales
                  </h4>
                  {sales.length === 0 ? (
                    <p className="text-sm text-[var(--text-tertiary)]">No sales yet.</p>
                  ) : (
                    <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-[var(--table-header-bg)]">
                          <tr>
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-right">Total</th>
                            <th className="px-4 py-2 text-center">Status</th>
                            <th className="px-4 py-2 text-left">Payment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                          {sales.slice(0, 5).map((sale) => (
                            <tr key={sale.id}>
                              <td className="px-4 py-2">{new Date(sale.timestamp).toLocaleDateString()}</td>
                              <td className="px-4 py-2 text-right font-medium text-[var(--accent-green)]">
                                ₱{new Decimal(sale.totalAmount).toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  sale.status === 'paid' ? 'bg-[var(--status-completed-bg)] text-[var(--status-completed)]' :
                                  sale.status === 'initiated' ? 'bg-[var(--status-pending-bg)] text-[var(--status-pending)]' :
                                  sale.status === 'refunded' ? 'bg-[var(--status-cancelled-bg)] text-[var(--status-cancelled)]' :
                                  'bg-[var(--status-processing-bg)] text-[var(--status-processing)]'
                                }`}>
                                  {sale.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 capitalize">{sale.paymentMethod}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Loyalty History */}
                <div>
                  <h4 className="text-md font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Loyalty History
                  </h4>
                  {loyaltyTransactions.length === 0 ? (
                    <p className="text-sm text-[var(--text-tertiary)]">No loyalty transactions.</p>
                  ) : (
                    <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-[var(--table-header-bg)]">
                          <tr>
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-right">Points</th>
                            <th className="px-4 py-2 text-left">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                          {loyaltyTransactions.slice(0, 5).map((tx) => (
                            <tr key={tx.id}>
                              <td className="px-4 py-2">{new Date(tx.timestamp).toLocaleDateString()}</td>
                              <td className={`px-4 py-2 text-right font-medium ${
                                tx.pointsChange > 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'
                              }`}>
                                {tx.pointsChange > 0 ? '+' : ''}{tx.pointsChange}
                              </td>
                              <td className="px-4 py-2 text-[var(--text-secondary)]">{tx.notes || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Audit Trail (placeholder) */}
                <div>
                  <h4 className="text-md font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Audit Trail
                  </h4>
                  <p className="text-sm text-[var(--text-tertiary)]">Audit logs coming soon.</p>
                </div>
              </div>
            ) : (
              <p className="text-center text-[var(--text-tertiary)] py-12">No customer selected.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};