import React from 'react';
import type { PaginationMeta } from '../types/product.types';

interface PaginationControlsProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  pagination,
  onPageChange,
  className = ''
}) => {
  const { current_page, total_pages, next, previous } = pagination;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, current_page - Math.floor(maxVisible / 2));
    let end = Math.min(total_pages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  if (total_pages <= 1) return null;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(current_page - 1)}
          disabled={!previous}
          className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded border border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
        >
          Previous
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`
                w-8 h-8 rounded text-sm font-medium transition-colors
                ${page === current_page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }
              `}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(current_page + 1)}
          disabled={!next}
          className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded border border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
        >
          Next
        </button>
      </div>

      <div className="text-sm text-gray-400">
        Page {current_page} of {total_pages}
      </div>
    </div>
  );
};

export default PaginationControls;