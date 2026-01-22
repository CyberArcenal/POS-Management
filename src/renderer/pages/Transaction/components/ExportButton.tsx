// src/features/transactions/components/ExportButton.tsx
import React, { useState } from 'react';
import type { FilterState } from '../api/types';
import { transactionApi } from '../api/transactionApi';
import { showSuccess, showError } from '../../../utils/notification';

interface ExportButtonProps {
  filters: FilterState;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ filters }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    setShowFormatMenu(false);

    try {
      const result = await transactionApi.exportTransactions(filters, {
        format,
        include_items: true,
        date_range: filters.start_date && filters.end_date ? {
          start: filters.start_date,
          end: filters.end_date,
        } : undefined,
      });

      // Create download link
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up URL object
      URL.revokeObjectURL(result.url);

      showSuccess(`Transactions exported successfully as ${format.toUpperCase()}`);
    } catch (error: any) {
      showError(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowFormatMenu(!showFormatMenu)}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg transition-colors"
      >
        {isExporting ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Exporting...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </>
        )}
      </button>

      {/* Format Selection Menu */}
      {showFormatMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <div className="font-medium">Export as CSV</div>
                <div className="text-xs text-gray-400">Excel-compatible format</div>
              </div>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="font-medium">Export as PDF</div>
                <div className="text-xs text-gray-400">Printable document</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showFormatMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowFormatMenu(false)}
        />
      )}
    </div>
  );
};