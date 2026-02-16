import React from "react";
import { X, Loader2, Award, TrendingDown, Calendar } from "lucide-react";
import { type Customer } from "../../../api/customer";
import { type LoyaltyTransaction } from "../../../api/loyalty";

interface CustomerLoyaltyViewDialogProps {
  isOpen: boolean;
  customer: Customer | null;
  transactions: LoyaltyTransaction[];
  loading: boolean;
  onClose: () => void;
}

export const CustomerLoyaltyViewDialog: React.FC<CustomerLoyaltyViewDialogProps> = ({
  isOpen,
  customer,
  transactions,
  loading,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
        <div className="relative bg-[var(--card-bg)] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Customer Loyalty Details</h2>
            <button onClick={onClose} className="p-1 hover:bg-[var(--card-hover-bg)] rounded">
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
              </div>
            ) : customer ? (
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="bg-[var(--card-secondary-bg)] rounded-lg p-4 border border-[var(--border-color)]">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">{customer.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-[var(--text-secondary)]">
                    <span>{customer.contactInfo || "No contact info"}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Joined {new Date(customer.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-[var(--text-tertiary)]">Current Points Balance</p>
                    <p className="text-3xl font-bold text-[var(--accent-purple)]">{customer.loyaltyPointsBalance}</p>
                  </div>
                </div>

                {/* Transaction History */}
                <div>
                  <h4 className="text-md font-semibold text-[var(--text-primary)] mb-3">Loyalty History</h4>
                  {transactions.length === 0 ? (
                    <p className="text-sm text-[var(--text-tertiary)]">No loyalty transactions found.</p>
                  ) : (
                    <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-[var(--table-header-bg)]">
                          <tr>
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-center">Type</th>
                            <th className="px-4 py-2 text-right">Points</th>
                            <th className="px-4 py-2 text-left">Notes</th>
                            <th className="px-4 py-2 text-center">Sale ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                          {transactions.map((tx) => (
                            <tr key={tx.id}>
                              <td className="px-4 py-2">{new Date(tx.timestamp).toLocaleString()}</td>
                              <td className="px-4 py-2 text-center">
                                {tx.pointsChange > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-[var(--accent-green)]">
                                    <Award className="w-4 h-4" />
                                    Earn
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[var(--accent-red)]">
                                    <TrendingDown className="w-4 h-4" />
                                    Redeem
                                  </span>
                                )}
                              </td>
                              <td className={`px-4 py-2 text-right font-medium ${
                                tx.pointsChange > 0 ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"
                              }`}>
                                {tx.pointsChange > 0 ? "+" : ""}{tx.pointsChange}
                              </td>
                              <td className="px-4 py-2 text-[var(--text-secondary)]">{tx.notes || "—"}</td>
                              <td className="px-4 py-2 text-center">
                                {tx.saleId ? (
                                  <a
                                    href={`/sales/${tx.saleId}`}
                                    className="text-[var(--accent-blue)] hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    #{tx.saleId}
                                  </a>
                                ) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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