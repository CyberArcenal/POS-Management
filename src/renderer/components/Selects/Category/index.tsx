// src/renderer/components/CategorySelect.tsx
import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Tag, X } from "lucide-react";
import categoryAPI from "../../../api/category";
import type { Category } from "../../../api/category";

interface CategorySelectProps {
  value: number | null;
  onChange: (categoryId: number | null, category?: Category) => void;
  disabled?: boolean;
  placeholder?: string;
  activeOnly?: boolean;
  className?: string; // para sa custom width
}

const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Pumili ng kategorya",
  activeOnly = true,
  className = "w-full max-w-md", // default width, pwedeng palitan
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const params: any = {
          sortBy: "name",
          sortOrder: "ASC",
          limit: 1000,
        };
        if (activeOnly) params.isActive = true;

        const response = await categoryAPI.getAll(params);
        if (response.status && response.data) {
          const list = Array.isArray(response.data)
            ? response.data
            : response.data.items || [];
          setCategories(list);
          setFilteredCategories(list);
        }
      } catch (error) {
        console.error("Hindi ma-load ang mga kategorya:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [activeOnly]);

  // Filter categories
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
      return;
    }
    const lower = searchTerm.toLowerCase();
    const filtered = categories.filter((cat) =>
      cat.name.toLowerCase().includes(lower),
    );
    setFilteredCategories(filtered);
  }, [searchTerm, categories]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSelect = (category: Category) => {
    onChange(category.id, category);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation(); // Pigilan ang pagbukas ng dropdown
    onChange(null);
  };

  const selectedCategory = categories.find((c) => c.id === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger button - isang button lang para hindi lumaki */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-2 rounded-lg text-left flex items-center gap-2
          transition-colors duration-200
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-800"}
        `}
        style={{
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--border-color)",
          color: "var(--text-primary)",
          minHeight: "42px", // Fixed height para consistent
        }}
      >
        <Tag
          className="w-4 h-4 flex-shrink-0"
          style={{ color: "var(--primary-color)" }}
        />

        {/* Content container na may truncation */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {selectedCategory ? (
            <>
              <span className="font-medium truncate">
                {selectedCategory.name}
              </span>
              {selectedCategory.description && (
                <span
                  className="text-xs truncate"
                  style={{ color: "var(--text-secondary)" }}
                >
                  ({selectedCategory.description})
                </span>
              )}
            </>
          ) : (
            <span
              className="truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              {placeholder}
            </span>
          )}
        </div>

        {/* Remove button - nasa loob ng main button pero may stopPropagation */}
        {selectedCategory && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full hover:bg-gray-700 transition-colors flex-shrink-0"
            style={{ color: "var(--text-secondary)" }}
            title="Alisin ang napili"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
          style={{ color: "var(--text-secondary)" }}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 rounded-lg shadow-lg overflow-hidden"
          style={{
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--border-color)",
            maxHeight: "350px",
          }}
        >
          {/* Search bar */}
          <div
            className="p-2 border-b"
            style={{ borderColor: "var(--border-color)" }}
          >
            <div className="relative">
              <Search
                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-secondary)" }}
              />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Maghanap..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded text-sm"
                style={{
                  backgroundColor: "var(--card-secondary-bg)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          {/* Category list */}
          <div className="overflow-y-auto" style={{ maxHeight: "250px" }}>
            {loading && categories.length === 0 ? (
              <div
                className="p-3 text-center text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Naglo-load...
              </div>
            ) : filteredCategories.length === 0 ? (
              <div
                className="p-3 text-center text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Walang nakitang kategorya
              </div>
            ) : (
              filteredCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleSelect(category)}
                  className={`
                    w-full px-3 py-2 text-left flex items-center gap-2
                    transition-colors text-sm cursor-pointer hover:bg-gray-800!
                    ${category.id === value ? "bg-gray-800" : ""}
                  `}
                  style={{ borderBottom: "1px solid var(--border-color)" }}
                >
                  <Tag
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: "var(--primary-color)" }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-medium truncate"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {category.name}
                      </span>
                      <span
                        className="px-1.5 py-0.5 text-xs rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: category.isActive
                            ? "var(--status-completed-bg)"
                            : "var(--status-cancelled-bg)",
                          color: category.isActive
                            ? "var(--status-completed)"
                            : "var(--status-cancelled)",
                        }}
                      >
                        {category.isActive ? "Aktibo" : "Hindi"}
                      </span>
                    </div>
                    {category.description && (
                      <div
                        className="text-xs truncate mt-0.5"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {category.description}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySelect;
