// src/renderer/pages/supplier/components/SupplierViewDialog.tsx
import React, { useState } from 'react';
import { X, Package, ShoppingCart, Info, Loader2 } from 'lucide-react';
import type { Supplier } from '../../../api/supplier';
import type { Product } from '../../../api/product';
import type { Purchase } from '../../../api/purchase';
import Decimal from 'decimal.js';

interface SupplierViewDialogProps {
  supplier: Supplier | null;
  products: Product[];
  purchases: Purchase[];
  metrics: {
    totalSpent: number;
    purchaseCount: number;
    averageOrderValue: number;
  };
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'info' | 'products' | 'purchases';

export const SupplierViewDialog: React.FC<SupplierViewDialogProps> = ({
  supplier,
  products,
  purchases,
  metrics,
  loading,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('info');

  if (!isOpen || !supplier) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-[var(--card-bg)] rounded-lg w-full max-w-3xl p-6 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Supplier Details: {supplier.name}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[var(--card-hover-bg)] rounded"
            >
              <X className="w-5 h-5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--border-color)] mb-4">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'info'
                  ? 'text-[var(--accent-blue)] border-b-2 border-[var(--accent-blue)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Info className="w-4 h-4 inline mr-1" />
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'products'
                  ? 'text-[var(--accent-blue)] border-b-2 border-[var(--accent-blue)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Package className="w-4 h-4 inline mr-1" />
              Products ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'purchases'
                  ? 'text-[var(--accent-blue)] border-b-2 border-[var(--accent-blue)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ShoppingCart className="w-4 h-4 inline mr-1" />
              Purchase History ({purchases.length})
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-blue)]" />
              </div>
            ) : (
              <>
                {activeTab === 'info' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[var(--card-secondary-bg)] p-4 rounded-lg">
                        <p className="text-sm text-[var(--text-tertiary)]">Name</p>
                        <p className="text-lg font-semibold text-[var(--text-primary)]">{supplier.name}</p>
                      </div>
                      <div className="bg-[var(--card-secondary-bg)] p-4 rounded-lg">
                        <p className="text-sm text-[var(--text-tertiary)]">Status</p>
                        <p className={`text-lg font-semibold ${supplier.isActive ? 'text-[var(--status-completed)]' : 'text-[var(--status-cancelled)]'}`}>
                          {supplier.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <div className="bg-[var(--card-secondary-bg)] p-4 rounded-lg">
                        <p className="text-sm text-[var(--text-tertiary)]">Contact Info</p>
                        <p className="text-[var(--text-primary)]">{supplier.contactInfo || '—'}</p>
                      </div>
                      <div className="bg-[var(--card-secondary-bg)] p-4 rounded-lg">
                        <p className="text-sm text-[var(--text-tertiary)]">Address</p>
                        <p className="text-[var(--text-primary)]">{supplier.address || '—'}</p>
                      </div>
                    </div>

                    {/* Metrics Cards */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                      <div className="bg-[var(--card-secondary-bg)] p-4 rounded-lg text-center">
                        <p className="text-sm text-[var(--text-tertiary)]">Total Spent</p>
                        <p className="text-2xl font-bold text-[var(--accent-green)]">
                          ₱{new Decimal(metrics.totalSpent).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-[var(--card-secondary-bg)] p-4 rounded-lg text-center">
                        <p className="text-sm text-[var(--text-tertiary)]">Completed Orders</p>
                        <p className="text-2xl font-bold text-[var(--accent-blue)]">
                          {metrics.purchaseCount}
                        </p>
                      </div>
                      <div className="bg-[var(--card-secondary-bg)] p-4 rounded-lg text-center">
                        <p className="text-sm text-[var(--text-tertiary)]">Avg. Order Value</p>
                        <p className="text-2xl font-bold text-[var(--accent-purple)]">
                          ₱{new Decimal(metrics.averageOrderValue).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'products' && (
                  <div>
                    {products.length === 0 ? (
                      <p className="text-center text-[var(--text-tertiary)] py-8">No products linked to this supplier.</p>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[var(--border-color)]">
                            <th className="text-left py-2 text-xs font-medium text-[var(--text-tertiary)]">SKU</th>
                            <th className="text-left py-2 text-xs font-medium text-[var(--text-tertiary)]">Name</th>
                            <th className="text-right py-2 text-xs font-medium text-[var(--text-tertiary)]">Price</th>
                            <th className="text-right py-2 text-xs font-medium text-[var(--text-tertiary)]">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                          {products.map((product) => (
                            <tr key={product.id}>
                              <td className="py-2 text-sm font-mono text-[var(--text-primary)]">{product.sku}</td>
                              <td className="py-2 text-sm text-[var(--text-secondary)]">{product.name}</td>
                              <td className="py-2 text-right text-sm text-[var(--accent-green)]">₱{new Decimal(product.price).toFixed(2)}</td>
                              <td className="py-2 text-right text-sm text-[var(--text-primary)]">{product.stockQty}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'purchases' && (
                  <div>
                    {purchases.length === 0 ? (
                      <p className="text-center text-[var(--text-tertiary)] py-8">No purchase history for this supplier.</p>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[var(--border-color)]">
                            <th className="text-left py-2 text-xs font-medium text-[var(--text-tertiary)]">Ref #</th>
                            <th className="text-left py-2 text-xs font-medium text-[var(--text-tertiary)]">Date</th>
                            <th className="text-left py-2 text-xs font-medium text-[var(--text-tertiary)]">Status</th>
                            <th className="text-right py-2 text-xs font-medium text-[var(--text-tertiary)]">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                          {purchases.map((purchase) => (
                            <tr key={purchase.id}>
                              <td className="py-2 text-sm font-mono text-[var(--text-primary)]">{purchase.referenceNo || '—'}</td>
                              <td className="py-2 text-sm text-[var(--text-secondary)]">{new Date(purchase.orderDate).toLocaleDateString()}</td>
                              <td className="py-2 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium
                                  ${purchase.status === 'completed' ? 'bg-[var(--status-completed-bg)] text-[var(--status-completed)]' :
                                    purchase.status === 'pending' ? 'bg-[var(--status-pending-bg)] text-[var(--status-pending)]' :
                                    'bg-[var(--status-cancelled-bg)] text-[var(--status-cancelled)]'}`}>
                                  {purchase.status}
                                </span>
                              </td>
                              <td className="py-2 text-right text-sm text-[var(--accent-green)]">₱{new Decimal(purchase.totalAmount).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};