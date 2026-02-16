// src/renderer/pages/category/components/CategoryTable.tsx
import React from 'react';
import { Eye, Edit, Trash2, Package, Check, X } from 'lucide-react';
import type { Category } from '../../../api/category';

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

interface CategoryTableProps {
  categories: Category[];
  productCounts: Map<number, number>;
  onView: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  productCounts,
  onView,
  onEdit,
  onDelete,
}) => {
  if (categories.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-8 text-center">
        <Package className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
        <p className="text-[var(--text-primary)] font-medium">No categories found</p>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          Try adjusting your filters or add a new category
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
            <th className="w-1/5 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Name
            </th>
            <th className="w-2/5 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Description
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
            {categories.map((category) => (
              <tr
                key={category.id}
                onClick={() => onView(category)}
                className="hover:bg-[var(--table-row-hover)] transition-colors cursor-pointer"
              >
                <td className="w-1/5 px-4 py-3 text-sm font-medium text-[var(--text-primary)]">
                  {category.name}
                </td>
                <td className="w-2/5 px-4 py-3 text-sm text-[var(--text-secondary)] truncate">
                  {category.description || '—'}
                </td>
                <td className="w-1/6 px-4 py-3 text-right text-sm font-mono text-[var(--text-primary)]">
                  {productCounts.get(category.id) ?? 0}
                </td>
                <td className="w-1/6 px-4 py-3 text-center">
                  <StatusBadge active={category.isActive} />
                </td>
                <td className="w-1/6 px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onView(category); }}
                      className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-blue)]"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(category); }}
                      className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-purple)]"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(category); }}
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