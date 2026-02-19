// src/renderer/pages/Products/components/ProductActionsDropdown.tsx
import React, { useRef, useEffect, useState } from "react";
import {
  MoreVertical,
  DollarSign,
  ArrowUpDown,
  PackageMinus,
} from "lucide-react";
import type { Product } from "../../../api/product";

interface ProductActionsDropdownProps {
  product: Product;
  onPriceEdit: (product: Product) => void;
  onReorderLevelEdit: (product: Product) => void;
  onReorderQtyEdit: (product: Product) => void;
}

const ProductActionsDropdown: React.FC<ProductActionsDropdownProps> = ({
  product,
  onPriceEdit,
  onReorderLevelEdit,
  onReorderQtyEdit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Position dropdown dynamically to avoid overflow
  const getDropdownPosition = () => {
    if (!buttonRef.current) return {};
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 120; // approx height of three items
    const windowHeight = window.innerHeight;
    if (rect.bottom + dropdownHeight > windowHeight) {
      return { bottom: `${windowHeight - rect.top + 5}px`, right: `${window.innerWidth - rect.right}px` };
    }
    return { top: `${rect.bottom + 5}px`, right: `${window.innerWidth - rect.right}px` };
  };

  return (
    <div className="product-actions-dropdown-container" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="p-1 hover:bg-[var(--card-hover-bg)] rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        title="More actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className="fixed bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-xl w-56 z-50 py-1"
          style={getDropdownPosition()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction(() => onPriceEdit(product));
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] transition-colors"
          >
            <DollarSign className="w-4 h-4 text-[var(--accent-green)]" />
            Edit Price
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction(() => onReorderLevelEdit(product));
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] transition-colors"
          >
            <ArrowUpDown className="w-4 h-4 text-[var(--accent-purple)]" />
            Edit Reorder Level
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction(() => onReorderQtyEdit(product));
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] transition-colors"
          >
            <PackageMinus className="w-4 h-4 text-[var(--accent-orange)]" />
            Edit Reorder Quantity
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductActionsDropdown;