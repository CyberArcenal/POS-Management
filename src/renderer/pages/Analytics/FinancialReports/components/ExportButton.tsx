import React, { useState } from 'react';
import { Download } from 'lucide-react';
import financialReportsAPI from '../../../../api/analytics/financial_reports';

interface Props {
  startDate: string;
  endDate: string;
}

const ExportButton: React.FC<Props> = ({ startDate, endDate }) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await financialReportsAPI.exportReport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.status && res.data) {
        // Create a downloadable JSON file
        const jsonStr = JSON.stringify(res.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financial_report_${new Date().toISOString().slice(0, 10)}.json`;
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
      {exporting ? 'Exporting...' : 'Export JSON'}
    </button>
  );
};

export default ExportButton;