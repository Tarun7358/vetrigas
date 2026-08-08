import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileSpreadsheet,
  FileText,
  FileCode,
  Search,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Truck,
  Users,
  CreditCard,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { employees, vehicles, bills, deliveries, payroll } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [downloadToast, setDownloadToast] = useState<{ show: boolean; title: string; format: string }>({
    show: false,
    title: '',
    format: '',
  });

  const reportsList = [
    {
      id: 'daily-ops',
      title: 'Daily Operations Executive Report',
      category: 'Operations',
      description: 'Comprehensive operational snapshot covering fleet status, active deliveries, and daily revenue.',
      icon: TrendingUp,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      id: 'attendance-ledger',
      title: 'Biometric Attendance Registry Export',
      category: 'Attendance',
      description: 'Full workforce clock-in/clock-out logs synced with EasyTime Pro biometrics.',
      icon: Users,
      date: 'August 2026',
    },
    {
      id: 'payroll-summary',
      title: 'Monthly Workforce Payroll Ledger',
      category: 'Payroll',
      description: 'Detailed wage calculations, overtime hours, bonuses, deductions, and payout status.',
      icon: CreditCard,
      date: 'August 2026',
    },
    {
      id: 'fleet-fuel',
      title: 'Live Fleet Telemetry & Fuel Audit',
      category: 'Fleet',
      description: 'Vehicle GPS distance traveled, speed logs, fuel fills, and maintenance expense records.',
      icon: Truck,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      id: 'deliveries-log',
      title: 'Customer Delivery Fulfillment Report',
      category: 'Deliveries',
      description: 'Consumer LPG cylinder dispatch history, delivery completion timestamps, and driver logs.',
      icon: PackageCheck,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      id: 'billing-ledger',
      title: 'Billing & Invoicing Revenue Ledger',
      category: 'Billing',
      description: 'Itemized sales transactions, cash vs UPI breakdown, and customer invoice logs.',
      icon: FileSpreadsheet,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
  ];

  const filteredReports = reportsList.filter(rep => {
    const matchesCategory = selectedCategory === 'ALL' || rep.category.toUpperCase() === selectedCategory.toUpperCase();
    const matchesSearch = rep.title.toLowerCase().includes(searchQuery.toLowerCase()) || rep.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Helper to trigger CSV file download
  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate Report Data based on report ID
  const generateReportDataset = (reportId: string) => {
    if (reportId === 'attendance-ledger') {
      return employees.map(emp => ({
        Employee_ID: emp.id,
        Name: emp.name,
        Role: emp.role,
        Attendance_Status: emp.attendanceStatus,
        Working_Hours: emp.workingHours,
        Work_Progress: emp.todayWorkProgress,
        Performance_Score: `${emp.performanceScore}%`,
        Status: emp.status,
      }));
    }

    if (reportId === 'payroll-summary') {
      return payroll.map(p => ({
        Payroll_ID: p.id,
        Employee_Name: p.employeeName,
        Role: p.role,
        Regular_Hours: p.regularHours,
        Hourly_Rate: `₹${p.hourlyRate}`,
        OT_Hours: p.otHours,
        Bonus: `₹${p.bonus}`,
        Deduction: `₹${p.deduction}`,
        Net_Salary: `₹${p.netSalary}`,
        Status: p.status,
        Month: p.month,
      }));
    }

    if (reportId === 'fleet-fuel') {
      return vehicles.map(v => ({
        Vehicle_ID: v.id,
        Registration_Number: v.registrationNumber,
        Driver_Name: v.driverName,
        Status: v.status,
        Speed_KMH: v.speed,
        Today_Distance_KM: `${v.todayDistanceKm} km`,
        Deliveries_Completed: `${v.completedDeliveries}/${v.totalDeliveries}`,
        Camera_Status: v.cameraStatus,
      }));
    }

    if (reportId === 'deliveries-log') {
      return deliveries.map(d => ({
        Delivery_ID: d.id,
        Delivery_Number: d.deliveryNumber,
        Customer_Name: d.customerName,
        Address: d.customerAddress,
        Cylinders: d.cylinderCount,
        Amount: `₹${d.amount}`,
        Driver_Assigned: d.driverName,
        Vehicle_Number: d.vehicleNumber,
        Status: d.status,
        Payment_Status: d.paymentStatus,
      }));
    }

    if (reportId === 'billing-ledger') {
      return bills.map(b => ({
        Bill_Number: b.billNumber,
        Customer_Name: b.customerName,
        Cylinders: b.cylinderCount,
        Amount: `₹${b.amount}`,
        Payment_Method: b.paymentMethod,
        Transaction_ID: b.transactionId || 'N/A',
        Driver_Collector: b.driverName,
        Date: b.date,
        Status: b.status,
      }));
    }

    // Default: Daily Operations
    return employees.map(emp => ({
      ID: emp.id,
      Name: emp.name,
      Role: emp.role,
      Phone: emp.phone,
      Status: emp.status,
      Today_Progress: emp.todayWorkProgress,
    }));
  };

  // CSV Exporter
  const handleExportCSV = (report: typeof reportsList[0]) => {
    const data = generateReportDataset(report.id);
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [
      `"VETRI INDANE LPG DISTRIBUTORSHIP - EXECUTIVE REPORT"`,
      `"Report Title: ${report.title}"`,
      `"Generated On: ${new Date().toLocaleString()}"`,
      `"SAP Distributorship Code: IN0039201"`,
      `""`,
      headers.join(','),
      ...data.map(row => headers.map(header => `"${(row as any)[header] ?? ''}"`).join(',')),
    ];

    triggerDownload(csvRows.join('\n'), `${report.id}_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
    showToast(report.title, 'CSV');
  };

  // Excel (.xls formatted HTML/CSV) Exporter
  const handleExportExcel = (report: typeof reportsList[0]) => {
    const data = generateReportDataset(report.id);
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const bom = '\uFEFF'; // UTF-8 BOM for Microsoft Excel auto-detect
    const csvRows = [
      `VETRI INDANE LPG DISTRIBUTORSHIP - OFFICIAL EXCEL LEDGER`,
      `Report: ${report.title}`,
      `Generated Date: ${new Date().toLocaleString()}`,
      `Distributorship SAP Code: IN0039201`,
      ``,
      headers.join('\t'),
      ...data.map(row => headers.map(header => `${(row as any)[header] ?? ''}`).join('\t')),
    ];

    triggerDownload(bom + csvRows.join('\n'), `${report.id}_${Date.now()}.xls`, 'application/vnd.ms-excel;charset=utf-8;');
    showToast(report.title, 'Excel (.xls)');
  };

  // Professional Printable Document / PDF Exporter
  const handleExportPDF = (report: typeof reportsList[0]) => {
    const data = generateReportDataset(report.id);
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups to generate PDF report documents.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${report.title} - Vetri Indane Official Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #0f172a; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #f59e0b; padding-bottom: 15px; margin-bottom: 20px; }
          .brand-title { font-size: 22px; font-weight: bold; color: #0f172a; margin: 0; }
          .brand-subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }
          .sap-badge { background: #0f172a; color: #ffffff; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 12px; }
          .meta-grid { display: flex; justify-content: space-between; background: #f8fafc; padding: 12px 18px; border-radius: 8px; font-size: 12px; border: 1px solid #e2e8f0; margin-bottom: 25px; }
          .table-container { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          .table-container th { background: #0f172a; color: #ffffff; padding: 10px 12px; text-align: left; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          .table-container td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
          .table-container tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 40px; pt: 20px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #64748b; }
          .signature-box { text-align: center; border-top: 1px solid #0f172a; width: 180px; padding-top: 5px; font-weight: bold; color: #0f172a; }
          @media print {
            body { margin: 15px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="background: #f59e0b; color: #000; border: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer;">
            🖨️ Print / Save as PDF
          </button>
        </div>

        <div class="header">
          <div>
            <div class="brand-title">VETRI INDANE LPG DISTRIBUTORSHIP</div>
            <div class="brand-subtitle">Coimbatore South & Singanallur Operating Zone | RDK Technologies Architecture</div>
          </div>
          <div class="sap-badge">SAP CODE: IN0039201</div>
        </div>

        <div class="meta-grid">
          <div><strong>Report Document:</strong> ${report.title}</div>
          <div><strong>Generated On:</strong> ${new Date().toLocaleString()}</div>
          <div><strong>Period:</strong> ${report.date}</div>
        </div>

        <table class="table-container">
          <thead>
            <tr>
              ${headers.map(h => `<th>${h.replace(/_/g, ' ')}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${headers.map(h => `<td>${(row as any)[h] ?? '-'}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>
            <p style="margin: 0;">Verified Official Document | Powered by SQLite Persistent Engine</p>
            <p style="margin: 2px 0 0 0;">System Engineering Partner: <strong>RDK Technologies</strong></p>
          </div>
          <div class="signature-box">
            Authorized Signatory
          </div>
        </div>

        <script>
          setTimeout(() => {
            window.print();
          }, 600);
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    showToast(report.title, 'PDF Document');
  };

  const showToast = (title: string, format: string) => {
    setDownloadToast({ show: true, title, format });
    setTimeout(() => {
      setDownloadToast({ show: false, title: '', format: '' });
    }, 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
              Executive Report Hub & Data Exporter
            </h1>
            <p className="text-xs text-slate-400">
              Export high-resolution PDF documents, formatted Excel ledgers, and raw CSV files directly from SQLite
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Distributorship SAP: <strong>IN0039201</strong></span>
        </div>
      </div>

      {/* Download Confirmation Toast */}
      {downloadToast.show && (
        <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-xl flex items-center justify-between text-xs font-semibold animate-pulse">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>Generated & Downloaded <strong>{downloadToast.title}</strong> in <strong>{downloadToast.format}</strong> format!</span>
          </div>
          <span className="bg-emerald-700 px-2.5 py-1 rounded text-[10px]">Verified Download</span>
        </div>
      )}

      {/* Filters & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['ALL', 'OPERATIONS', 'ATTENDANCE', 'PAYROLL', 'FLEET', 'DELIVERIES', 'BILLING'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search report title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredReports.map(rep => {
          const IconComp = rep.icon;
          return (
            <div
              key={rep.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="badge-status badge-blue text-[10px]">{rep.category}</span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{rep.date}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors shrink-0">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-slate-900 group-hover:text-amber-600 transition-colors">
                      {rep.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{rep.description}</p>
                  </div>
                </div>
              </div>

              {/* Professional Download Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleExportPDF(rep)}
                  className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-600" /> PDF
                </button>
                <button
                  onClick={() => handleExportExcel(rep)}
                  className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold py-2 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
                </button>
                <button
                  onClick={() => handleExportCSV(rep)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold py-2 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <FileCode className="w-3.5 h-3.5 text-slate-600" /> CSV
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
