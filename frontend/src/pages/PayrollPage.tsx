import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { PayrollRecord } from '../types';
import { CircleDollarSign, Download, ArrowRight, X } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const PayrollPage: React.FC = () => {
  const { payroll, updatePayrollStatus } = useApp();
  const [selectedPay, setSelectedPay] = useState<PayrollRecord | null>(null);

  const estimatedTotal = 482450;
  const approvedTotal = 465200;

  const handleExportSlip = async () => {
    const element = document.getElementById('salary-slip-modal-content');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SalarySlip_${selectedPay?.employeeName}_August2026.pdf`);
    } catch (err) {
      console.error('Slip generation error', err);
      alert('Unable to export slip');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <CircleDollarSign className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white">Workforce Payroll Engine</h1>
            <p className="text-xs text-slate-400">
              Automated Hourly Pay, Overtime, Incentives & Deduction Auditor
            </p>
          </div>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Payroll Period</p>
          <p className="font-display font-bold text-xl text-slate-900 mt-1">August 2026</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Active Employees</p>
          <p className="font-display font-bold text-xl text-blue-600 mt-1">28 Staff</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Estimated Payroll</p>
          <p className="font-display font-bold text-xl text-slate-900 mt-1">₹{estimatedTotal.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm">
          <p className="text-xs font-extrabold text-emerald-800 uppercase">Approved Payroll</p>
          <p className="font-display font-extrabold text-xl text-emerald-700 mt-1">₹{approvedTotal.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Payroll Approval Flow Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-white flex items-center justify-between">
        <span className="text-xs font-bold text-slate-300">Approval Workflow Phase:</span>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-slate-800 text-slate-400 px-2.5 py-1 rounded">1. Draft</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="bg-blue-950 text-blue-300 px-2.5 py-1 rounded border border-blue-800">2. Review</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="bg-emerald-950 text-emerald-300 px-2.5 py-1 rounded border border-emerald-800 font-bold">3. Approved</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="bg-slate-800 text-slate-400 px-2.5 py-1 rounded">4. Locked</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="bg-slate-800 text-slate-400 px-2.5 py-1 rounded">5. Paid</span>
        </div>
      </div>

      {/* Employee Payroll Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="table-enterprise">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Hours</th>
              <th>OT</th>
              <th>Bonus</th>
              <th>Deduction</th>
              <th>Net Salary</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payroll.map(pay => (
              <tr key={pay.id}>
                <td>
                  <div className="font-bold text-slate-900">{pay.employeeName}</div>
                  <div className="text-[11px] text-slate-500">{pay.role}</div>
                </td>
                <td className="font-mono text-xs font-semibold text-slate-700">{pay.regularHours} hrs</td>
                <td className="font-mono text-xs font-semibold text-blue-700">+{pay.otHours} hrs</td>
                <td className="font-mono text-xs font-semibold text-emerald-700">+₹{pay.bonus}</td>
                <td className="font-mono text-xs font-semibold text-rose-600">-₹{pay.deduction}</td>
                <td className="font-mono font-extrabold text-sm text-slate-900">
                  ₹{pay.netSalary.toLocaleString('en-IN')}
                </td>
                <td>
                  <span
                    className={`badge-status ${
                      pay.status === 'Approved'
                        ? 'badge-green'
                        : pay.status === 'Review'
                        ? 'badge-amber'
                        : 'badge-blue'
                    }`}
                  >
                    {pay.status}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedPay(pay)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                    >
                      Inspect Slip
                    </button>
                    {pay.status === 'Review' && (
                      <button
                        onClick={() => updatePayrollStatus(pay.id, 'Approved')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-1 rounded text-[10px]"
                      >
                        Approve Pay
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Salary Detail Modal */}
      {selectedPay && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden text-white animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <CircleDollarSign className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Official Salary Voucher Slip</h3>
              </div>
              <button onClick={() => setSelectedPay(null)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-950" id="salary-slip-modal-content">
              <div className="border border-slate-800 rounded-xl p-5 bg-slate-900 space-y-4">
                <div className="border-b border-slate-800 pb-3 text-center">
                  <h2 className="font-display font-extrabold text-lg text-white">VETRI INDANE</h2>
                  <p className="text-[11px] text-amber-400 font-semibold uppercase">Payroll Statement • {selectedPay.month}</p>
                </div>

                <div className="flex justify-between text-xs border-b border-slate-800 pb-3">
                  <div>
                    <p className="text-slate-400 text-[11px]">Employee Name</p>
                    <p className="font-bold text-white text-sm">{selectedPay.employeeName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-[11px]">Role / Position</p>
                    <p className="font-bold text-slate-300 text-xs">{selectedPay.role}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Regular Hours ({selectedPay.regularHours}h × ₹{selectedPay.hourlyRate})</span>
                    <span className="font-mono">₹{(selectedPay.regularHours * selectedPay.hourlyRate).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-blue-400">
                    <span>Overtime ({selectedPay.otHours}h × ₹{selectedPay.otRate})</span>
                    <span className="font-mono">+₹{(selectedPay.otHours * selectedPay.otRate).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-emerald-400">
                    <span>Performance Incentive Bonus</span>
                    <span className="font-mono">+₹{selectedPay.bonus.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-rose-400">
                    <span>Penalty / Advance Deduction</span>
                    <span className="font-mono">-₹{selectedPay.deduction.toFixed(2)}</span>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="font-bold text-sm text-white">NET SALARY</span>
                    <span className="font-display font-extrabold text-xl text-emerald-400 font-mono">
                      ₹{selectedPay.netSalary.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between gap-3">
              <button
                onClick={handleExportSlip}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" /> Download PDF Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
