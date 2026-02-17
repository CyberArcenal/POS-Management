import React, { useState } from 'react';
import { Download } from 'lucide-react';
import inventoryReportsAPI from '../../../../api/analytics/inventory_reports';

interface Props {
  categoryId?: number;
  supplierId?: number;
  startDate: string;
  endDate: string;
}

const ExportButton: React.FC<Props> = ({ categoryId, supplierId, startDate, endDate }) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await inventoryReportsAPI.exportCSV({
        categoryId,
        supplierId,
        // Note: exportCSV doesn't accept date range per API spec, but we can add if needed.
        // If date range needed, we may need to call generateReport and convert.
      });
      if (res.status && res.data.length) {
        const headers = Object.keys(res.data[0]).join(',');
        const csv = res.data.map(row => Object.values(row).join(',')).join('\n');
        const blob = new Blob([headers + '\n' + csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_report_${new Date().toISOString().slice(0, 10)}.csv`;
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