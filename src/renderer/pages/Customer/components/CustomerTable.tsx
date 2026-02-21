import React from "react";
import { Eye, Edit, Trash2, Users, Mail, Phone } from "lucide-react";
import { type Customer } from "../../../api/customer";

// Helper to determine status badge – now uses the actual status field
const getCustomerStatus = (customer: Customer): { label: string; color: string } => {
  switch (customer.status) {
    case "vip":
      return { label: "VIP", color: "var(--customer-vip)" };
    case "elite":
      return { label: "Elite", color: "var(--customer-loyal)" };
    case "regular":
      return { label: "Regular", color: "var(--customer-regular)" };
    default:
      return { label: "Regular", color: "var(--customer-regular)" };
  }
};

interface CustomerTableProps {
  customers: Customer[];
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  getTotalSpent: (customerId: number) => number;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  onView,
  onEdit,
  onDelete,
  getTotalSpent,
}) => {
  if (customers.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-8 text-center">
        <Users className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
        <p className="text-[var(--text-primary)] font-medium">
          No customers found
        </p>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          Try adjusting your filters or add a new customer
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg overflow-hidden flex flex-col">
      {/* Fixed Header */}
      <table className="w-full table-fixed">
        <thead className="bg-[var(--table-header-bg)]">
          <tr>
            <th className="w-16 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">ID</th>
            <th className="w-1/4 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Name</th>
            <th className="w-1/4 px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Contact</th>
            <th className="w-24 px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Points</th>
            <th className="w-24 px-4 py-3 text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Status</th>
            <th className="w-32 px-4 py-3 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Total Spent</th>
            <th className="w-28 px-4 py-3 text-center text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
      </table>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full table-fixed">
          <tbody className="divide-y divide-[var(--border-color)]">
            {customers.map((customer) => {
              const status = getCustomerStatus(customer);
              const totalSpent = getTotalSpent(customer.id);

              // Determine which contact to show: email > phone > none
              const contactIcon = customer.email ? <Mail className="w-3 h-3" /> : customer.phone ? <Phone className="w-3 h-3" /> : null;
              const contactText = customer.email || customer.phone || null;

              return (
                <tr
                  key={customer.id}
                  onClick={() => onView(customer)}
                  className="hover:bg-[var(--table-row-hover)] transition-colors cursor-pointer"
                >
                  <td className="w-16 px-4 py-3 text-sm font-mono text-[var(--text-primary)]">
                    #{customer.id}
                  </td>
                  <td className="w-1/4 px-4 py-3 text-sm text-[var(--text-secondary)] font-medium">
                    {customer.name}
                  </td>
                  <td className="w-1/4 px-4 py-3 text-sm text-[var(--text-secondary)]">
                    {contactText ? (
                      <div className="flex items-center gap-1">
                        {contactIcon}
                        <span className="truncate">{contactText}</span>
                      </div>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">—</span>
                    )}
                  </td>
                  <td className="w-24 px-4 py-3 text-right text-sm font-semibold text-[var(--accent-purple)]">
                    {customer.loyaltyPointsBalance}
                  </td>
                  <td className="w-24 px-4 py-3 text-center">
                    <span
                      className="inline-flex px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `${status.color}20`, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="w-32 px-4 py-3 text-right text-sm font-semibold text-[var(--accent-green)]">
                    ₱{totalSpent.toFixed(2)}
                  </td>
                  <td className="w-28 px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); onView(customer); }}
                        className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-blue)]"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(customer); }}
                        className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-purple)]"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(customer); }}
                        className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--accent-red)]"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};