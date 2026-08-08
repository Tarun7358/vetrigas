import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { BillRecord } from '../types';
import { Receipt, Eye } from 'lucide-react';
import { EBillModal } from '../components/EBillModal';

export const BillingPage: React.FC = () => {
  const { bills, reconciliation, resolveReconciliation } = useApp();
  const [selectedBill, setSelectedBill] = useState<BillRecord | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);

  const totalBills = 184;
  const paidBills = 181;
  const pendingBills = 3;
  const totalCollection = 113650;

  const handleResolve = () => {
    resolveReconciliation(reconciliation.difference, resolveNote || 'Verified driver cash submission');
    setShowResolveModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white">Billing, E-Bills & Cash Reconciliation</h1>
            <p className="text-xs text-slate-400">
              Integrated Customer Invoicing & Daily Cash Audit Desk
            </p>
          </div>
        </div>
      </div>

      {/* Top Billing KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Bills</p>
          <p className="font-display font-bold text-2xl text-slate-900 mt-1">{totalBills}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm">
          <p className="text-xs font-extrabold text-emerald-800 uppercase">Paid Bills</p>
          <p className="font-display font-extrabold text-2xl text-emerald-700 mt-1">{paidBills}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm">
          <p className="text-xs font-bold text-amber-800 uppercase">Pending Bills</p>
          <p className="font-display font-bold text-2xl text-amber-700 mt-1">{pendingBills}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm">
          <p className="text-xs font-extrabold text-blue-800 uppercase">Today's Collection</p>
          <p className="font-display font-extrabold text-2xl text-blue-700 mt-1">
            ₹{totalCollection.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Daily Reconciliation Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="font-display font-bold text-base text-amber-400">Daily Payment Reconciliation Audit</h2>
            <p className="text-xs text-slate-400">Expected vs Collected UPI & Physical Cash Audit</p>
          </div>
          <span
            className={`badge-status ${
              reconciliation.status === 'BALANCED' ? 'badge-green' : 'badge-red animate-pulse'
            }`}
          >
            {reconciliation.status === 'BALANCED' ? '● RECONCILED' : '● CASH DISCREPANCY DETECTED'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px]">Expected Total</span>
            <p className="font-mono font-bold text-base text-white mt-0.5">₹{reconciliation.expectedTotal.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px]">UPI Received</span>
            <p className="font-mono font-bold text-base text-blue-400 mt-0.5">₹{reconciliation.upiReceived.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px]">Cash Expected</span>
            <p className="font-mono font-bold text-base text-amber-400 mt-0.5">₹{reconciliation.cashExpected.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px]">Cash Submitted</span>
            <p className="font-mono font-bold text-base text-emerald-400 mt-0.5">₹{reconciliation.cashSubmitted.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-rose-950/80 p-3 rounded-lg border border-rose-800 col-span-2 md:col-span-1">
            <span className="text-rose-300 font-bold text-[11px]">Cash Difference</span>
            <p className="font-mono font-extrabold text-base text-rose-400 mt-0.5">
              ₹{reconciliation.difference} ⚠️
            </p>
          </div>
        </div>

        {reconciliation.difference > 0 && (
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setShowResolveModal(true)}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow"
            >
              Resolve Cash Discrepancy (₹{reconciliation.difference})
            </button>
          </div>
        )}
      </div>

      {/* Bill Table */}
      <div className="mobile-table-container bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 font-display font-bold text-sm text-slate-900">
          Recent Invoices & Payment Ledger
        </div>
        <table className="table-enterprise">
          <thead>
            <tr>
              <th>Bill No.</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Driver</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(bill => (
              <tr key={bill.id}>
                <td className="font-mono font-bold text-amber-700">{bill.billNumber}</td>
                <td>
                  <div className="font-bold text-slate-900">{bill.customerName}</div>
                  <div className="text-[11px] text-slate-500">{bill.cylinderCount} x LPG Cylinder</div>
                </td>
                <td className="font-mono font-bold text-emerald-700">₹{bill.amount}</td>
                <td>
                  <span className="badge-status badge-blue">{bill.paymentMethod}</span>
                </td>
                <td className="text-slate-800 font-semibold">{bill.driverName}</td>
                <td className="text-slate-500 text-xs font-mono">{bill.date}</td>
                <td>
                  <span className="badge-status badge-green">PAID ✓</span>
                </td>
                <td>
                  <button
                    onClick={() => setSelectedBill(bill)}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                  >
                    <Eye className="w-3.5 h-3.5" /> View E-Bill
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EBillModal bill={selectedBill} onClose={() => setSelectedBill(null)} />

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full text-white space-y-4">
            <h3 className="font-bold text-base text-rose-400">Resolve Cash Difference</h3>
            <p className="text-xs text-slate-300">
              Submitting ₹{reconciliation.difference} cash balance adjustment to balance today's cash reconciliation drawer.
            </p>

            <textarea
              value={resolveNote}
              onChange={e => setResolveNote(e.target.value)}
              placeholder="Reason / Note (e.g. Arun cash verified from pouch)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none"
              rows={3}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResolveModal(false)}
                className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
