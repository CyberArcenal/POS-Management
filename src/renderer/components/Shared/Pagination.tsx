// src/renderer/components/Shared/Pagination.tsx
import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
}) => {
  // Removed the if (totalPages <= 1) return null; to always show pagination

  return (
    <div className="flex items-center justify-between mt-4">
      {/* Info */}
      <div className="text-sm text-[var(--text-tertiary)]">
        Showing {(currentPage - 1) * pageSize + 1} to{" "}
        {Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 border rounded-lg ${
              currentPage === page
                ? "bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]"
                : "border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)]"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};