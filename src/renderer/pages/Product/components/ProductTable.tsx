import React from "react";
import {
  Eye,
  Edit,
  Trash2,
  Package,
  Check,
  X,
  PackagePlus,
} from "lucide-react";
import Decimal from "decimal.js";
import { type Product } from "../../../api/product";

// ----------------------------------------------------------------------
// Helper Components (StatusBadge and StockBadge)
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

const StockBadge: React.FC<{ qty: number }> = ({ qty }) => {
  if (qty <= 0) {
    return (
      <span className="text-[var(--stock-outstock)] font-medium">
        Out of Stock
      </span>
    );
  }
  if (qty <= 5) {
    return (
      <span className="text-[var(--stock-lowstock)] font-medium">
        Low ({qty})
      </span>
    );
  }
  return <span className="text-[var(--stock-instock)] font-medium">{qty}</span>;
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

interface ProductTableProps {
  products: Product[];
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onStockAdjust: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onView,
  onEdit,
  onDelete,
  onStockAdjust,
}) => {
  if (products.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-8 text-center">
        <Package className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
        <p className="text-[var(--text-primary)] font-medium">
          No products found
        </p>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          Try adjusting your filters or add a new product
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg overflow-hidden flex flex-col">
      {/* Fixed Header Table - unchanged */}
      <table className="w-full table-fixed">
        <thead className="bg-[var(--table-header-bg)]">
          <tr>
            <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              SKU
            </th>
            <th className="w-1/4 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Product Name
            </th>
            <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Category
            </th>
            <th className="w-1/6 px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Price
            </th>
            <th className="w-1/12 px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Stock
            </th>
            <th className="w-1/12 px-4 py-3 text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Status
            </th>
            <th className="w-1/12 px-4 py-3 text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
      </table>

      {/* Scrollable Body Table */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full table-fixed">
          <tbody className="divide-y divide-[var(--border-color)]">
            {products.map((product) => (
              <tr
                key={product.id}
                onClick={() => onView(product)}
                className="hover:bg-[var(--table-row-hover)] transition-colors cursor-pointer"
              >
                <td className="w-1/6 px-4 py-3 text-sm font-mono text-[var(--text-primary)]">
                  {product.sku}
                </td>
                <td className="w-1/4 px-4 py-3 text-sm text-[var(--text-secondary)] font-medium">
                  {product.name}
                </td>
                <td className="w-1/6 px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {product.category?.name ?? "—"}
                </td>
                <td className="w-1/6 px-4 py-3 text-right text-sm font-semibold text-[var(--accent-green)]">
                  ₱{new Decimal(product.price).toFixed(2)}
                </td>
                <td className="w-1/12 px-4 py-3 text-right text-sm">
                  <StockBadge qty={product.stockQty} />
                </td>
                <td className="w-1/12 px-4 py-3 text-center">
                  <StatusBadge active={product.isActive} />
                </td>
                <td className="w-1/12 px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(product);
                      }}
                      className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-blue)]"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStockAdjust(product);
                      }} // new button
                      className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-orange)]"
                      title="Adjust Stock"
                    >
                      <PackagePlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(product);
                      }}
                      className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-purple)]"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(product);
                      }}
                      className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-red)]"
                      title="Delete"
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
