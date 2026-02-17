import React, { useState } from 'react';
import { Download } from 'lucide-react';
import returnRefundAPI from '../../../../api/analytics/return_refund_reports';

interface Props {
  customerId?: number;
  status?: string;
  refundMethod?: string;
  startDate: string;
  endDate: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

const ExportButton: React.FC<Props> = ({
  customerId,
  status,
  refundMethod,
  startDate,
  endDate,
  minAmount,
  maxAmount,
  searchTerm,
}) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await returnRefundAPI.exportCSV({
        customerId,
        status: status || undefined,
        refundMethod: refundMethod || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        minAmount,
        maxAmount,
        searchTerm: searchTerm || undefined,
      });
      if (res.status && res.data.length) {
        const headers = Object.keys(res.data[0]).join(',');
        const csv = res.data.map(row => Object.values(row).join(',')).join('\n');
        const blob = new Blob([headers + '\n' + csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `returns_refunds_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert('No data to export');
      }
    } catch (err: any) {
      alert('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-blue)] text-white rounded-lg hover:bg-[var(--accent-blue-hover)] transition-colors disabled:opacity-50"
    >
      <Download className="w-4 h-4" />
      {exporting ? 'Exporting...' : 'Export CSV'}
    </button>
  );
};

export default ExportButton;