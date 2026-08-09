import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { QrCode, DollarSign, Eye, RefreshCw, CheckCircle2, MessageSquare } from 'lucide-react';
import { EBillModal } from './EBillModal';
import type { BillRecord, DeliveryItem } from '../types';

export const LiveDriverQRMonitor: React.FC = () => {
  const { deliveries, bills, confirmOwnerGPayPayment, role } = useApp();
  const [selectedQRItem, setSelectedQRItem] = useState<DeliveryItem | null>(null);
  const [selectedEBill, setSelectedEBill] = useState<BillRecord | null>(null);

  // Permission flags strictly enforcing hierarchy: OWNER > STOREROOM_STAFF > MANAGER > GODOWN_KEEPER > LOADMAN > DRIVER
  const canConfirmOrEdit = role === 'OWNER' || role === 'STOREROOM_STAFF' || role === 'MANAGER';
  const isHighAdmin = role === 'OWNER' || role === 'STOREROOM_STAFF';

  // Filter completed deliveries or bills with payments
  const completedDeliveries = deliveries.filter(d => d.status === 'DELIVERED');
  const pendingGPayCount = completedDeliveries.filter(d => d.paymentMethod === 'OWNER_GPAY_DIRECT' && d.paymentStatus === 'PENDING').length;
  const pendingGPaySum = completedDeliveries.filter(d => d.paymentMethod === 'OWNER_GPAY_DIRECT' && d.paymentStatus === 'PENDING').reduce((acc, d) => acc + d.amount, 0);

  const handleOpenEBill = (del: DeliveryItem) => {
    const existingBill = bills.find(b => b.customerName === del.customerName || b.amount === del.amount);
    const billRecord: BillRecord = existingBill || {
      id: `bill-${del.id}`,
      billNumber: `VI-2026-${del.deliveryNumber}`,
      customerName: del.customerName,
      amount: del.amount,
      paymentMethod: del.paymentMethod || 'UPI',
      transactionId: `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`,
      driverName: del.driverName,
      date: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: del.paymentStatus === 'PENDING' ? 'PENDING' : 'PAID',
      cylinderCount: del.cylinderCount,
    };
    setSelectedEBill(billRecord);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <QrCode className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-lg text-white flex items-center gap-2">
              <span>LIVE DRIVER PAYMENT & GPAY DIRECT MONITOR</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            </h2>
            <p className="text-xs text-slate-400">
              Real-time audit stream of UPI QR codes scanned, cash receipts, and direct Owner GPay credit transfers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
          {pendingGPayCount > 0 && (
            <span className="bg-purple-950/80 border border-purple-700 text-purple-300 font-extrabold px-3 py-1.5 rounded-xl animate-pulse">
              📱 {pendingGPayCount} Pending Owner GPay (₹{pendingGPaySum})
            </span>
          )}
          <span className="bg-slate-950 border border-slate-800 text-emerald-400 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            LIVE AUDIT ACTIVE
          </span>
        </div>
      </div>

      {/* Grid of Completed Driver Payment Cards */}
      {completedDeliveries.length === 0 ? (
        <div className="bg-slate-950/60 rounded-2xl p-8 border border-slate-800 text-center space-y-2">
          <QrCode className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="font-bold text-slate-300 text-sm">No Completed Delivery Payments Yet Today</p>
          <p className="text-xs text-slate-500">
            When drivers complete an order via UPI QR, Cash proof, or Owner GPay Direct, live transaction details will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {completedDeliveries.map(del => {
            const isPayLater = del.paymentMethod === 'OWNER_GPAY_DIRECT';
            const isUPI = del.paymentMethod === 'UPI' || !del.paymentMethod;
            const isPendingGPay = isPayLater && del.paymentStatus === 'PENDING';

            return (
              <div
                key={del.id}
                className={`bg-slate-950 border rounded-2xl p-4 space-y-3 transition-all flex flex-col justify-between shadow-lg ${
                  isPendingGPay ? 'border-purple-600/80 bg-purple-950/20' : 'border-slate-800 hover:border-amber-500/50'
                }`}
              >
                <div>
                  {/* Top Bar: Driver & Payment Mode Badge */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/40">
                        {del.driverName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-white leading-tight">{del.driverName}</p>
                        <p className="text-[10px] text-amber-400 font-mono">🚚 {del.vehicleNumber}</p>
                      </div>
                    </div>

                    <span
                      className={`badge-status text-[10px] font-extrabold px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                        isPayLater
                          ? 'bg-purple-950 text-purple-300 border border-purple-700'
                          : isUPI
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {isPayLater ? <MessageSquare className="w-3 h-3 text-purple-400" /> : isUPI ? <QrCode className="w-3 h-3 text-blue-400" /> : <DollarSign className="w-3 h-3 text-emerald-400" />}
                      {isPayLater ? 'PAY LATER (GPAY)' : isUPI ? 'UPI DYNAMIC QR' : 'CASH PROOF'}
                    </span>
                  </div>

                  {/* Customer & Amount details */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-200">{del.customerName}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{del.customerAddress}</p>
                      </div>
                      <span className="font-display font-extrabold text-base text-emerald-400 font-mono">
                        ₹{del.amount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400">Delivered: {del.cylinderCount} Cylinder</span>
                      {isPendingGPay ? (
                        <span className="text-purple-300 font-bold animate-pulse">⏳ PENDING GPAY</span>
                      ) : (
                        <span className="text-amber-400 font-bold">✓ VERIFIED</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2 text-xs">
                  {isPendingGPay ? (
                    canConfirmOrEdit ? (
                      <button
                        onClick={() => confirmOwnerGPayPayment(del.id)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 rounded-xl text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> ✓ Confirm Owner GPay Received (Staff/Owner)
                      </button>
                    ) : (
                      <div className="w-full bg-purple-950/60 border border-purple-800 text-purple-300 font-bold py-1.5 rounded-xl text-[11px] text-center">
                        ⏳ Pending Staff/Owner GPay Verification
                      </div>
                    )
                  ) : isUPI ? (
                    <button
                      onClick={() => setSelectedQRItem(del)}
                      className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold py-2 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" /> Inspect Scanned QR
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedQRItem(del)}
                      className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold py-2 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspect Cash Proof
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenEBill(del)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-1.5 rounded-xl text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>View / WhatsApp E-Bill Memo</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Inspect Scanned QR / Cash Proof Image */}
      {selectedQRItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="badge-status badge-amber text-[10px]">LIVE TRANSACTION AUDIT</span>
                <h3 className="font-bold text-sm text-white">Driver: {selectedQRItem.driverName}</h3>
              </div>
              <button
                onClick={() => setSelectedQRItem(null)}
                className="text-slate-400 hover:text-white text-sm font-bold bg-slate-800 px-2.5 py-1 rounded-xl"
              >
                ✕
              </button>
            </div>

            {/* QR or Photo Preview */}
            <div className="text-center space-y-3">
              {selectedQRItem.paymentMethod === 'CASH' && selectedQRItem.cashProofUrl ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-amber-400">Captured Cash Receipt Proof Photo:</p>
                  <img
                    src={selectedQRItem.cashProofUrl}
                    alt="Cash Proof"
                    className="w-full max-h-64 object-contain rounded-2xl border border-slate-800 bg-slate-950 p-2"
                  />
                </div>
              ) : (
                <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 inline-block shadow-inner">
                  <p className="text-xs font-extrabold text-slate-900 uppercase">Live Dynamic UPI QR Code</p>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                      `upi://pay?pa=vetrigas@okaxis&pn=Vetri%20Indane%20LPG&am=${selectedQRItem.amount}&cu=INR&tn=Order%20${selectedQRItem.deliveryNumber}`
                    )}`}
                    alt="UPI QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                  <p className="font-mono text-xs font-bold text-slate-800">UPI ID: vetrigas@okaxis</p>
                </div>
              )}

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-left space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer:</span>
                  <span className="font-bold text-white">{selectedQRItem.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Paid:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">₹{selectedQRItem.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Driver Vehicle:</span>
                  <span className="font-mono text-amber-400">{selectedQRItem.vehicleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-400 font-bold">
                    {selectedQRItem.paymentStatus === 'PENDING' ? '⏳ PENDING VERIFICATION' : '✓ PAYMENT VERIFIED'}
                  </span>
                </div>
              </div>

              {isHighAdmin && selectedQRItem.paymentStatus === 'PENDING' && (
                <button
                  onClick={() => {
                    confirmOwnerGPayPayment(selectedQRItem.id);
                    setSelectedQRItem(null);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Admin Override: Confirm GPay Payment Received
                </button>
              )}
            </div>

            <button
              onClick={() => setSelectedQRItem(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close Live Audit Inspector
            </button>
          </div>
        </div>
      )}

      {/* E-Bill Modal */}
      <EBillModal bill={selectedEBill} onClose={() => setSelectedEBill(null)} />
    </div>
  );
};
