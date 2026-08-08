import React from 'react';
import { FileSpreadsheet, FileText, FileCode } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const reportsList = [
    { title: 'Daily Operations Executive Report', category: 'Operations', date: '08 Aug 2026' },
    { title: 'Biometric Attendance Registry Export', category: 'Attendance', date: 'August 2026' },
    { title: 'Monthly Workforce Payroll Ledger', category: 'Payroll', date: 'August 2026' },
    { title: 'Live Fleet Telemetry & Fuel Audit', category: 'Fleet', date: '08 Aug 2026' },
    { title: 'Customer Delivery Fulfillment Report', category: 'Deliveries', date: '08 Aug 2026' },
    { title: 'Billing & Invoicing Ledger', category: 'Billing', date: '08 Aug 2026' },
    { title: 'Daily Cash & Payment Reconciliation', category: 'Reconciliation', date: '08 Aug 2026' },
    { title: 'Depot Cylinder Inventory Movement Audit', category: 'Inventory', date: '08 Aug 2026' },
    { title: 'Worker Performance & Efficiency Matrix', category: 'Analytics', date: 'August 2026' },
  ];

  const handleExport = (format: string, title: string) => {
    alert(`Exporting ${title} in ${format.toUpperCase()} format...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white">Executive Report Center</h1>
            <p className="text-xs text-slate-400">
              Generate & Export PDF, Excel & CSV Operational Reports
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportsList.map((rep, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <span className="badge-status badge-blue text-[10px]">{rep.category}</span>
              <h3 className="font-display font-bold text-sm text-slate-900 mt-2">{rep.title}</h3>
              <p className="text-xs text-slate-500 mt-1">Period: {rep.date}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
              <button
                onClick={() => handleExport('pdf', rep.title)}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1.5 px-2 rounded text-[11px] flex items-center justify-center gap-1 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
              <button
                onClick={() => handleExport('excel', rep.title)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-1.5 px-2 rounded text-[11px] flex items-center justify-center gap-1 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
              </button>
              <button
                onClick={() => handleExport('csv', rep.title)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-1.5 px-2 rounded text-[11px] flex items-center justify-center gap-1 transition-colors border border-slate-300"
              >
                <FileCode className="w-3.5 h-3.5" /> CSV
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
