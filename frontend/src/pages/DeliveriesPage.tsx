import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TruckIcon, CheckCircle2, MapPin, User, Receipt, Filter } from 'lucide-react';
import { EBillModal } from '../components/EBillModal';
import type { BillRecord } from '../types';

export const DeliveriesPage: React.FC = () => {
  const { deliveries, bills, completeDelivery } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedBill, setSelectedBill] = useState<BillRecord | null>(null);

  const filtered = statusFilter === 'ALL'
    ? deliveries
    : deliveries.filter(d => d.status === statusFilter);

  const handleOpenEBill = (billNo?: string) => {
    if (!billNo) return;
    const b = bills.find(x => x.billNumber === billNo);
    if (b) setSelectedBill(b);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-600/40">
            <TruckIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white">Delivery Operations Control</h1>
            <p className="text-xs text-slate-400">
              Real-time Delivery Board & Customer Order Fulfillment
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs">
        <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        {['ALL', 'ASSIGNED', 'READY', 'OUT FOR DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              statusFilter === st
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Delivery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(del => (
          <div key={del.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-display font-bold text-base text-slate-900">
                  Delivery #{del.deliveryNumber}
                </span>
                <span
                  className={`badge-status ${
                    del.status === 'DELIVERED'
                      ? 'badge-green'
                      : del.status === 'OUT FOR DELIVERY'
                      ? 'badge-blue'
                      : 'badge-amber'
                  }`}
                >
                  ● {del.status}
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-start gap-2 text-slate-700">
                  <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900">{del.customerName}</p>
                    <p className="text-[11px] text-slate-500">{del.customerPhone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-tight text-slate-600">{del.customerAddress}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[11px]">Cylinder Count</span>
                    <p className="font-bold text-slate-900">{del.cylinderCount} × LPG Cylinder</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Amount</span>
                    <p className="font-display font-bold text-emerald-700 text-sm">₹{del.amount}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Assigned Driver</span>
                    <p className="font-semibold text-slate-800">{del.driverName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Vehicle</span>
                    <p className="font-semibold text-amber-700 font-mono">{del.vehicleNumber}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              {del.status === 'OUT FOR DELIVERY' ? (
                <button
                  onClick={() => completeDelivery(del.id, 'UPI')}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" /> Complete & Collect Payment
                </button>
              ) : del.status === 'DELIVERED' ? (
                <button
                  onClick={() => handleOpenEBill(del.billNumber)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Receipt className="w-4 h-4 text-amber-400" /> View E-Bill Invoice
                </button>
              ) : (
                <span className="text-xs text-slate-400 italic">Order Assigned</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <EBillModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
    </div>
  );
};
