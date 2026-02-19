import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Package, X } from "lucide-react";
import type { Product } from "../../../api/product";
import productAPI from "../../../api/product";

interface ProductSelectProps {
  value: number | null;
  onChange: (productId: number | null, product?: Product) => void;
  disabled?: boolean;
  placeholder?: string;
  activeOnly?: boolean;
  categoryId?: number;
  supplierId?: number;
}

const ProductSelect: React.FC<ProductSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Pumili ng produkto",
  activeOnly = true,
  categoryId,
  supplierId,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load products once (with filters)
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const params: any = {
          sortBy: "name",
          sortOrder: "ASC",
          limit: 1000,
        };
        if (activeOnly) params.isActive = true;
        if (categoryId) params.categoryId = categoryId;
        if (supplierId) params.supplierId = supplierId;

        const response = await productAPI.getAll(params);
        if (response.status && response.data) {
          setProducts(response.data);
          setFiltered(response.data);
        }
      } catch (error) {
        console.error("Hindi ma-load ang mga produkto:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [activeOnly, categoryId, supplierId]);

  // Filter by search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFiltered(products);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setFiltered(
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.sku.toLowerCase().includes(lower),
      ),
    );
  }, [searchTerm, products]);

  // Focus search when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Update dropdown position when opening or on scroll/resize
  const updateDropdownPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener("scroll", updateDropdownPosition, true);
      window.addEventListener("resize", updateDropdownPosition);
    }
    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (product: Product) => {
    onChange(product.id, product);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    onChange(null);
  };

  const selectedProduct = products.find((p) => p.id === value);

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-lg text-left flex items-center justify-between
          transition-colors duration-200
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-800"}
        `}
        style={{
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          color: "var(--text-primary)",
        }}
      >
        <div className="flex items-center gap-3 truncate">
          <Package
            className="w-5 h-5 flex-shrink-0"
            style={{ color: "var(--primary-color)" }}
          />
          {selectedProduct ? (
            <div className="truncate">
              <span className="font-medium">{selectedProduct.name}</span>
              <span
                className="ml-2 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                (SKU: {selectedProduct.sku})
              </span>
            </div>
          ) : (
            <span style={{ color: "var(--text-secondary)" }}>
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedProduct && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 rounded-full hover:bg-gray-700 transition"
              style={{ color: "var(--text-secondary)" }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown
            className={`w-5 h-5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            style={{ color: "var(--text-secondary)" }}
          />
        </div>
      </button>

      {/* Portal dropdown */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[100] rounded-lg shadow-lg overflow-hidden"
            style={{
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              maxHeight: "400px",
            }}
          >
            {/* Search bar */}
            <div
              className="p-3 border-b"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--text-secondary)" }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-md text-sm"
                  style={{
                    backgroundColor: "var(--card-secondary-bg)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            {/* Product list */}
            <div className="overflow-y-auto" style={{ maxHeight: "300px" }}>
              {loading && products.length === 0 ? (
                <div
                  className="p-4 text-center"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Loading...
                </div>
              ) : filtered.length === 0 ? (
                <div
                  className="p-4 text-center"
                  style={{ color: "var(--text-secondary)" }}
                >
                  No products found
                </div>
              ) : (
                filtered.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelect(product)}
                    className={`
                      w-full px-4 py-3 text-left flex items-center gap-3
                      hover:bg-gray-800 transition-colors
                      ${product.id === value ? "bg-gray-800" : ""}
                    `}
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-medium text-sm flex items-center gap-2"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {product.name}
                        <span
                          className="px-2 py-0.5 text-xs rounded-full"
                          style={{
                            backgroundColor: product.isActive
                              ? "var(--status-completed-bg)"
                              : "var(--status-cancelled-bg)",
                            color: product.isActive
                              ? "var(--status-completed)"
                              : "var(--status-cancelled)",
                          }}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div
                        className="text-xs mt-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <span>SKU: {product.sku}</span>
                        <span className="mx-2">•</span>
                        <span>₱{product.price.toLocaleString()}</span>
                        <span className="mx-2">•</span>
                        <span>Stock: {product.stockQty}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ProductSelect;
