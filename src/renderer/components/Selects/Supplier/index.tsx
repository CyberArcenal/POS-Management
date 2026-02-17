// src/renderer/components/SupplierSelect.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronDown, Loader, Truck, X, Phone, MapPin } from 'lucide-react';
import supplierAPI from '../../../api/supplier';
import type { Supplier } from '../../../api/supplier';

interface SupplierSelectProps {
  value: number | null;
  onChange: (supplierId: number | null, supplier?: Supplier) => void;
  disabled?: boolean;
  placeholder?: string;
  activeOnly?: boolean;       // show only active suppliers
  autoFocus?: boolean;
}

const SupplierSelect: React.FC<SupplierSelectProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Select a supplier',
  activeOnly = true,
  autoFocus = true,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filtered, setFiltered] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<number | undefined>(undefined);

  // Load suppliers
  const loadSuppliers = useCallback(
    async (reset = true, search?: string) => {
      if (loading) return;
      try {
        setLoading(true);
        const currentPage = reset ? 1 : page;

        const params: any = {
          page: currentPage,
          limit: 15,
          sortBy: 'name',
          sortOrder: 'ASC',
          search,
        };
        if (activeOnly) {
          params.isActive = true;
        }

        const response = await supplierAPI.getAll(params);
        if (response.status && response.data) {
          let newSuppliers: Supplier[] = [];
          let totalPages = 1;
          let totalItems = 0;

          if (Array.isArray(response.data)) {
            newSuppliers = response.data;
            totalPages = 1;
            totalItems = newSuppliers.length;
          } else {
            newSuppliers = response.data.items || [];
            totalPages = response.data.totalPages || 1;
            totalItems = response.data.total || 0;
          }

          setSuppliers((prev) => (reset ? newSuppliers : [...prev, ...newSuppliers]));
          setFiltered((prev) => (reset ? newSuppliers : [...prev, ...newSuppliers]));
          setPage(currentPage + 1);
          setHasMore(currentPage < totalPages);
          setTotal(totalItems);
        }
      } catch (error) {
        console.error('Failed to load suppliers:', error);
      } finally {
        setLoading(false);
      }
    },
    [page, loading, activeOnly]
  );

  // Debounced search
  useEffect(() => {
    if (isOpen) {
      debounceTimer.current = setTimeout(() => {
        loadSuppliers(true, searchTerm || undefined);
      }, 400);
    }
    return () => clearTimeout(debounceTimer.current);
  }, [searchTerm, isOpen, loadSuppliers]);

  // Load initial when dropdown opens
  useEffect(() => {
    if (isOpen && suppliers.length === 0 && !loading) {
      loadSuppliers(true);
    }
  }, [isOpen, suppliers.length, loading, loadSuppliers]);

  // Outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto‑focus
  useEffect(() => {
    if (isOpen && autoFocus && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, autoFocus]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    loadSuppliers(true);
  };

  const handleSelect = (sup: Supplier) => {
    onChange(sup.id, sup);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange(null);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadSuppliers(false, searchTerm || undefined);
    }
  };

  const selectedSupplier = suppliers.find((s) => s.id === value);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full p-3 rounded-lg text-left flex justify-between items-center text-sm
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          transition-colors duration-200
        `}
        style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          minHeight: '44px',
        }}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedSupplier ? (
            <>
              <Truck className="w-4 h-4" style={{ color: 'var(--primary-color)' }} />
              <div className="truncate">
                <div className="font-medium flex items-center gap-2">
                  {selectedSupplier.name}
                  <span
                    className="px-1.5 py-0.5 text-xs rounded"
                    style={{
                      backgroundColor: selectedSupplier.isActive
                        ? 'var(--status-completed-bg)'
                        : 'var(--status-cancelled-bg)',
                      color: selectedSupplier.isActive
                        ? 'var(--status-completed)'
                        : 'var(--status-cancelled)',
                    }}
                  >
                    {selectedSupplier.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-xs flex gap-2" style={{ color: 'var(--text-secondary)' }}>
                  {selectedSupplier.contactInfo && <span>{selectedSupplier.contactInfo}</span>}
                  {selectedSupplier.address && <span>• {selectedSupplier.address}</span>}
                </div>
              </div>
            </>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedSupplier && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 rounded hover:bg-gray-700 transition-colors"
              style={{ color: 'var(--primary-hover)' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            style={{ color: 'var(--text-secondary)' }}
          />
        </div>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 rounded-lg shadow-lg overflow-hidden transition-all duration-200 ease-out transform origin-top"
          style={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            maxHeight: '420px',
          }}
        >
          {/* Search header */}
          <div className="p-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Find supplier
                </span>
              </div>
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-xs px-2 py-1 rounded hover:bg-gray-700 transition-colors"
                  style={{ color: 'var(--primary-color)' }}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by name, contact, or address..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-8 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
              {loading && (
                <Loader
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin"
                  style={{ color: 'var(--primary-color)' }}
                />
              )}
            </div>
            {total > 0 && (
              <div className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                {total} supplier{total !== 1 ? 's' : ''} total
              </div>
            )}
          </div>

          {/* Supplier list */}
          <div
            className="overflow-y-auto"
            style={{ maxHeight: '250px' }}
            onScroll={(e) => {
              const target = e.target as HTMLDivElement;
              const bottom = target.scrollHeight - target.scrollTop === target.clientHeight;
              if (bottom && hasMore && !loading) {
                handleLoadMore();
              }
            }}
          >
            {filtered.length === 0 ? (
              <div className="p-4 text-center">
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin mx-auto" style={{ color: 'var(--primary-color)' }} />
                ) : (
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    No suppliers found
                  </div>
                )}
              </div>
            ) : (
              <>
                {filtered.map((sup) => (
                  <button
                    key={sup.id}
                    type="button"
                    onClick={() => handleSelect(sup)}
                    className={`
                      w-full p-3 text-left transition-colors flex items-start gap-3
                      hover:bg-gray-800
                      ${sup.id === value ? 'bg-gray-800' : ''}
                    `}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {/* Selection indicator */}
                    <div
                      className={`
                        w-4 h-4 rounded-full border flex-shrink-0 mt-1 flex items-center justify-center
                        ${sup.id === value ? 'border-primary' : 'border-gray-600'}
                      `}
                    >
                      {sup.id === value && <div className="w-2 h-2 rounded-full bg-white"></div>}
                    </div>

                    <Truck className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: 'var(--primary-color)' }} />

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm flex items-center gap-2">
                        {sup.name}
                        <span
                          className="px-1.5 py-0.5 text-xs rounded"
                          style={{
                            backgroundColor: sup.isActive
                              ? 'var(--status-completed-bg)'
                              : 'var(--status-cancelled-bg)',
                            color: sup.isActive ? 'var(--status-completed)' : 'var(--status-cancelled)',
                          }}
                        >
                          {sup.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-xs mt-0.5 space-y-0.5">
                        {sup.contactInfo && (
                          <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                            <Phone className="w-3 h-3" /> {sup.contactInfo}
                          </div>
                        )}
                        {sup.address && (
                          <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                            <MapPin className="w-3 h-3" /> {sup.address}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}

                {/* Load more */}
                {hasMore && (
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="w-full p-2 text-center text-sm transition-colors hover:bg-gray-800"
                    style={{ color: 'var(--primary-color)' }}
                  >
                    {loading ? (
                      <Loader className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      'Load more...'
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierSelect;