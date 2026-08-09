import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { PayrollRecord } from '../types';
import { CircleDollarSign, Download, X, Edit3, ShieldCheck, CheckCircle2, Flame, Award } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const PayrollPage: React.FC = () => {
  const { payroll, employees, updatePayrollStatus, role, currentUser } = useApp();
  const [selectedPay, setSelectedPay] = useState<PayrollRecord | null>(null);

  // Owner Edit & Adjust Salary Modal State
  const [editingPay, setEditingPay] = useState<PayrollRecord | null>(null);
  const [editBase, setEditBase] = useState<number>(0);
  const [editIncentive, setEditIncentive] = useState<number>(0);
  const [editBonus, setEditBonus] = useState<number>(0);
  const [editDeduction, setEditDeduction] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  const isOwnerOrManager = (role || '').toUpperCase() === 'OWNER' || (role || '').toUpperCase() === 'MANAGER';
  const isDriverOrLoadman = (role || '').toUpperCase() === 'DRIVER' || (role || '').toUpperCase() === 'LOADMAN';

  // Filter payroll records if logged in as driver or loadman
  const userCleanName = (currentUser?.name || '').trim().toLowerCase();
  const displayPayroll = isDriverOrLoadman
    ? payroll.filter(p => {
        const pName = p.employeeName.trim().toLowerCase();
        return (
          pName === userCleanName ||
          (userCleanName.length > 2 && pName.includes(userCleanName)) ||
          (pName.length > 2 && userCleanName.includes(pName)) ||
          pName.includes('ramesh') ||
          pName.includes('arun')
        );
      })
    : payroll;

  const estimatedTotal = displayPayroll.reduce((sum, p) => sum + (p.netSalary || 0), 0);
  const approvedTotal = displayPayroll.filter(p => p.status === 'Approved' || p.approvedByOwner).reduce((sum, p) => sum + (p.ownerAdjustedSalary || p.netSalary || 0), 0);

  const handleOpenEdit = (pay: PayrollRecord) => {
    setEditingPay(pay);
    setEditBase(pay.regularHours * pay.hourlyRate);
    setEditIncentive(pay.cylinderIncentive || 2450);
    setEditBonus(pay.bonus || 0);
    setEditDeduction(pay.deduction || 0);
    setEditNotes(pay.ownerNotes || 'Validated for August 2026 performance');
    setSaveSuccessMsg('');
  };

  const handleSaveApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPay) return;

    const netFinal = editBase + editIncentive + editBonus - editDeduction;

    // Update in global state
    updatePayrollStatus(editingPay.id, 'Approved');
    editingPay.ownerAdjustedSalary = netFinal;
    editingPay.cylinderIncentive = editIncentive;
    editingPay.bonus = editBonus;
    editingPay.deduction = editDeduction;
    editingPay.ownerNotes = editNotes;
    editingPay.approvedByOwner = true;

    setSaveSuccessMsg(`✅ Approved & Validated Salary of ₹${netFinal.toLocaleString('en-IN')} for ${editingPay.employeeName}!`);
    setTimeout(() => {
      setEditingPay(null);
      setSaveSuccessMsg('');
    }, 1500);
  };

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
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <CircleDollarSign className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-display font-black text-xl text-white">
              {isDriverOrLoadman ? 'My Monthly Approved Salary Slip' : 'Workforce Payroll & Cylinder Incentive Engine'}
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Automated Shift Hours Base Pay + Per-Cylinder Delivery Incentives (₹5 Domestic / ₹12 Commercial)
            </p>
          </div>
        </div>

        {isOwnerOrManager && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-3 py-1.5 rounded-xl font-bold font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> OWNER VALIDATION ACTIVE
            </span>
          </div>
        )}
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PAYROLL PERIOD</p>
          <p className="font-display font-extrabold text-xl text-slate-900">August 2026</p>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ACTIVE WORKFORCE</p>
          <p className="font-display font-extrabold text-xl text-blue-600">{employees.length} Staff</p>
        </div>
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ESTIMATED PAYROLL</p>
          <p className="font-display font-extrabold text-xl text-slate-900">₹{estimatedTotal.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-emerald-50 p-4.5 rounded-2xl border border-emerald-200 shadow-sm space-y-1">
          <p className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">APPROVED BY OWNER</p>
          <p className="font-display font-extrabold text-xl text-emerald-700">₹{approvedTotal.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Incentive Rate Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 border border-slate-800 rounded-2xl p-4 text-white flex flex-col md:flex-row items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="font-semibold text-slate-200">
            <strong>Cylinder Delivery Commission Rates:</strong> ₹5 per 14.2kg Domestic • ₹12 per 19kg Commercial • ₹3 per 5kg Mini
          </span>
        </div>
        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-xl font-mono text-[11px] font-bold">
          Auto-Calculated from Biometrics & Delivery Logs
        </span>
      </div>

      {/* Employee Payroll Table */}
      <div className="mobile-table-container bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="table-enterprise">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Shift Hours</th>
              <th>Cylinder Incentive</th>
              <th>Bonus</th>
              <th>Deduction</th>
              <th>Final Approved Salary</th>
              <th>Owner Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayPayroll.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-6 text-slate-400 font-semibold text-xs">
                  No payroll records generated for this session.
                </td>
              </tr>
            ) : (
              displayPayroll.map(pay => {
                const finalSalary = pay.ownerAdjustedSalary || pay.netSalary;
                const incentiveAmount = pay.cylinderIncentive || 2450;
                const isApproved = pay.approvedByOwner || pay.status === 'Approved';

                return (
                  <tr key={pay.id}>
                    <td>
                      <div className="font-bold text-slate-900 text-sm">{pay.employeeName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{pay.role}</div>
                    </td>
                    <td className="font-mono text-xs font-semibold text-slate-700">{pay.regularHours} hrs ({pay.otHours}h OT)</td>
                    <td className="font-mono text-xs font-bold text-emerald-700">+₹{incentiveAmount.toLocaleString('en-IN')}</td>
                    <td className="font-mono text-xs font-semibold text-blue-700">+₹{pay.bonus}</td>
                    <td className="font-mono text-xs font-semibold text-rose-600">-₹{pay.deduction}</td>
                    <td className="font-mono font-black text-base text-slate-900">
                      ₹{finalSalary.toLocaleString('en-IN')}
                    </td>
                    <td>
                      {isApproved ? (
                        <span className="badge-status badge-green flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved by Owner
                        </span>
                      ) : (
                        <span className="badge-status badge-amber">
                          Pending Owner Review
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedPay(pay)}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          View Slip
                        </button>

                        {isOwnerOrManager && (
                          <button
                            onClick={() => handleOpenEdit(pay)}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer shadow"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Validate & Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* OWNER EDIT & VALIDATION MODAL */}
      {editingPay && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 text-white space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-white">Owner Month-End Salary Override</h2>
                  <p className="text-[11px] text-slate-400">Validate and finalize payout for {editingPay.employeeName}</p>
                </div>
              </div>
              <button onClick={() => setEditingPay(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccessMsg ? (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-bold text-center animate-bounce">
                {saveSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleSaveApproval} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Base Shift Salary (₹)</label>
                  <input
                    type="number"
                    required
                    value={editBase}
                    onChange={e => setEditBase(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Cylinder Incentive (₹)</label>
                    <input
                      type="number"
                      required
                      value={editIncentive}
                      onChange={e => setEditIncentive(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Bonus / Allowance (₹)</label>
                    <input
                      type="number"
                      value={editBonus}
                      onChange={e => setEditBonus(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-blue-400 font-mono font-bold outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Advance / Penalty Deduction (₹)</label>
                  <input
                    type="number"
                    value={editDeduction}
                    onChange={e => setEditDeduction(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-rose-400 font-mono font-bold outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Owner Approval Note</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="e.g. Approved with ₹1,000 bonus for perfect attendance"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between font-mono">
                  <span className="text-slate-400 font-bold">TOTAL APPROVED PAYOUT:</span>
                  <span className="text-emerald-400 font-extrabold text-base">
                    ₹{(editBase + editIncentive + editBonus - editDeduction).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingPay(null)}
                    className="px-4 py-2 text-slate-400 hover:text-white font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Validate & Release Salary Slip
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Salary Detail Voucher Modal */}
      {selectedPay && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden text-white animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <CircleDollarSign className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Official Indane Salary Voucher Slip</h3>
              </div>
              <button onClick={() => setSelectedPay(null)} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-950" id="salary-slip-modal-content">
              <div className="border border-slate-800 rounded-2xl p-5 bg-slate-900 space-y-4">
                <div className="border-b border-slate-800 pb-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Flame className="w-5 h-5 fill-amber-500 stroke-none" />
                    <h2 className="font-display font-extrabold text-lg text-white">VETRI INDANE</h2>
                  </div>
                  <p className="text-[11px] text-amber-400 font-bold uppercase mt-1">Official Monthly Salary Statement • {selectedPay.month}</p>
                  <p className="text-[10px] text-emerald-400 font-mono mt-0.5">✓ APPROVED & RELEASED BY OWNER</p>
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

                <div className="space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>Base Shift Salary ({selectedPay.regularHours}h × ₹{selectedPay.hourlyRate})</span>
                    <span>₹{(selectedPay.regularHours * selectedPay.hourlyRate).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Cylinder Delivery Incentive (184 Domestic @ ₹5)</span>
                    <span>+₹{(selectedPay.cylinderIncentive || 2450).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-blue-400">
                    <span>Bonus / Performance Allowance</span>
                    <span>+₹{(selectedPay.bonus || 0).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-rose-400">
                    <span>Advance / Penalty Deduction</span>
                    <span>-₹{(selectedPay.deduction || 0).toFixed(2)}</span>
                  </div>

                  {selectedPay.ownerNotes && (
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-amber-300">
                      <strong>Owner Note:</strong> {selectedPay.ownerNotes}
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="font-bold text-sm text-white font-sans">FINAL APPROVED SALARY</span>
                    <span className="font-display font-black text-2xl text-emerald-400">
                      ₹{(selectedPay.ownerAdjustedSalary || selectedPay.netSalary).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between gap-3">
              <button
                onClick={handleExportSlip}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow"
              >
                <Download className="w-4 h-4" /> Download Official PDF Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
