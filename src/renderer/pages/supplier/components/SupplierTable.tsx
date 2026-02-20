// src/renderer/pages/supplier/components/SupplierTable.tsx
import React from 'react';
import { Eye, Edit, Trash2, Package, Check, X } from 'lucide-react';
import type { Supplier } from '../../../api/supplier';

// ----------------------------------------------------------------------
// Helper Components
// ----------------------------------------------------------------------

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => {
  return active ? (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[var(--status-completed-bg)] text-[var(--status-completed)]">
      <Check className="w-3 h-3" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[var(--status-cancelled-bg)] text-[var(--status-cancelled)]">
      <X className="w-3 h-3" />
      Inactive
    </span>
  );
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

interface SupplierTableProps {
  suppliers: Supplier[];
  productCounts: Map<number, number>;
  onView: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

export const SupplierTable: React.FC<SupplierTableProps> = ({
  suppliers,
  productCounts,
  onView,
  onEdit,
  onDelete,
}) => {
  if (suppliers.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-8 text-center">
        <Package className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
        <p className="text-[var(--text-primary)] font-medium">No suppliers found</p>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          Try adjusting your filters or add a new supplier
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg overflow-hidden flex flex-col">
      {/* Fixed Header Table */}
      <table className="w-full table-fixed">
        <thead className="bg-[var(--table-header-bg)]">
          <tr>
            <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Name
            </th>
            <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Contact Info
            </th>
            <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Address
            </th>
            <th className="w-1/6 px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Products
            </th>
            <th className="w-1/6 px-4 py-3 text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Status
            </th>
            <th className="w-1/6 px-4 py-3 text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
      </table>

      {/* Scrollable Body Table */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full table-fixed">
          <tbody className="divide-y divide-[var(--border-color)]">
            {suppliers.map((supplier) => (
              <tr
                key={supplier.id}
                onClick={() => onView(supplier)}
                className="hover:bg-[var(--table-row-hover)] transition-colors cursor-pointer"
              >
                <td className="w-1/6 px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
                  {supplier.name}
                </td>
                <td className="w-1/6 px-4 py-3 text-sm text-[var(--text-secondary)] truncate">
                  {supplier.phone || supplier.email || "-"}
                </td>
                <td className="w-1/6 px-4 py-3 text-sm text-[var(--text-secondary)] truncate">
                  {supplier.address || '—'}
                </td>
                <td className="w-1/6 px-4 py-3 text-right text-sm font-mono text-[var(--text-primary)]">
                  {productCounts.get(supplier.id) ?? 0}
                </td>
                <td className="w-1/6 px-4 py-3 text-center">
                  <StatusBadge active={supplier.isActive} />
                </td>
                <td className="w-1/6 px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onView(supplier); }}
                      className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-blue)]"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(supplier); }}
                      className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-purple)]"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(supplier); }}
                      className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-red)]"
                      title="Delete (Deactivate)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};