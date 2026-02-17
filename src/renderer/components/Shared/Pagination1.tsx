import React, { useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSize?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSize = true,
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);

      // Add delay (e.g., 300ms) bago mag scroll
      setTimeout(() => {
        containerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5; // Number of page buttons to show
    const half = Math.floor(maxVisible / 2);

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= half + 1) {
        for (let i = 1; i <= maxVisible - 2; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - half) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - (maxVisible - 3); i <= totalPages; i++)
          pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1 && !showPageSize) return null;

  return (
    <div
      ref={containerRef}
      className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-2 py-3 bg-[var(--card-bg)] border border-[var(--border-color)]/20 rounded-lg"
    >
      {/* Items info */}
      <div className="text-sm text-[var(--text-secondary)] order-2 sm:order-1">
        Showing{" "}
        <span className="font-medium text-[var(--text-primary)]">
          {startItem}
        </span>{" "}
        to{" "}
        <span className="font-medium text-[var(--text-primary)]">
          {endItem}
        </span>{" "}
        of{" "}
        <span className="font-medium text-[var(--text-primary)]">
          {totalItems}
        </span>{" "}
        rooms
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* First page */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg bg-[var(--card-secondary-bg)] border border-[var(--border-color)]/20 
                     text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)] hover:text-[var(--text-primary)]
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--card-secondary-bg)]
                     transition-colors duration-200"
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg bg-[var(--card-secondary-bg)] border border-[var(--border-color)]/20 
                     text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)] hover:text-[var(--text-primary)]
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--card-secondary-bg)]
                     transition-colors duration-200"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === "..." ? (
              <span className="px-3 py-2 text-[var(--text-tertiary)]">...</span>
            ) : (
              <button
                onClick={() => handlePageChange(page as number)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                  ${
                    currentPage === page
                      ? "bg-[var(--primary-color)] text-black shadow-md"
                      : "bg-[var(--card-secondary-bg)] text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)] hover:text-[var(--text-primary)] border border-[var(--border-color)]/20"
                  }`}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        {/* Next page */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-[var(--card-secondary-bg)] border border-[var(--border-color)]/20 
                     text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)] hover:text-[var(--text-primary)]
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--card-secondary-bg)]
                     transition-colors duration-200"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last page */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-[var(--card-secondary-bg)] border border-[var(--border-color)]/20 
                     text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)] hover:text-[var(--text-primary)]
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--card-secondary-bg)]
                     transition-colors duration-200"
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Page size selector */}
      {showPageSize && onPageSizeChange && (
        <div className="flex items-center gap-2 order-3">
          <span className="text-sm text-[var(--text-secondary)]">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-3 py-2 rounded-lg bg-[var(--card-secondary-bg)] border border-[var(--border-color)]/20 
                       text-[var(--text-primary)] text-sm focus:border-[var(--primary-color)] focus:ring-1 
                       focus:ring-[var(--primary-color)]/50 transition-colors duration-200"
            aria-label="Items per page"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default Pagination;
