import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TruckIcon, CheckCircle2, MapPin, User, Receipt, Filter, MessageSquare, WifiOff, Wifi } from 'lucide-react';
import { EBillModal } from '../components/EBillModal';
import type { BillRecord } from '../types';
import { sendWhatsAppReceipt } from '../utils/whatsappReceipt';
import { soundAlerts } from '../utils/audioAlerts';
import { offlineSync } from '../utils/offlineSync';

export const DeliveriesPage: React.FC = () => {
  const { deliveries, bills, completeDelivery } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedBill, setSelectedBill] = useState<BillRecord | null>(null);

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = offlineSync.subscribe((online, count) => {
      setIsOnline(online);
      setOfflineQueueCount(count);
    });
    return unsubscribe;
  }, []);

  const filtered = statusFilter === 'ALL'
    ? deliveries
    : deliveries.filter(d => d.status === statusFilter);

  const handleOpenEBill = (billNo?: string) => {
    if (!billNo) return;
    const b = bills.find(x => x.billNumber === billNo);
    if (b) setSelectedBill(b);
  };

  const handleCompleteAndNotify = (delId: string, customerName: string, phone: string, amount: number, cylinderCount: number, driverName: string, vehicleNumber: string) => {
    completeDelivery(delId, 'UPI');
    soundAlerts.playSuccessSyncChime();

    // Trigger WhatsApp digital receipt dispatch
    sendWhatsAppReceipt({
      customerName,
      customerPhone: phone,
      billNumber: `MEMO-${Math.floor(100000 + Math.random() * 900000)}`,
      cylinderCount,
      amount,
      paymentMethod: 'UPI / Dynamic QR',
      driverName,
      vehicleNumber,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-600/30">
            <TruckIcon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
              Delivery Operations & Customer Dispatch
            </h1>
            <p className="text-xs text-slate-400">
              Real-Time LPG Delivery Board, Offline PWA Queue & WhatsApp Digital Receipts
            </p>
          </div>
        </div>

        {/* Network & Offline PWA Sync Status */}
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 animate-pulse">
              <WifiOff className="w-4 h-4 text-amber-400" />
              <span>Offline Mode ({offlineQueueCount} Queued)</span>
            </div>
          ) : (
            <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span>PWA Online & Synced</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto bg-white p-3 rounded-2xl border border-slate-200 shadow-sm text-xs">
        <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        {['ALL', 'ASSIGNED', 'READY', 'OUT FOR DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === st
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Delivery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(del => (
          <div key={del.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
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
                    <p className="text-[11px] text-slate-500 font-mono">{del.customerPhone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-tight text-slate-600">{del.customerAddress}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[11px]">Cylinder Quantity</span>
                    <p className="font-bold text-slate-900">{del.cylinderCount} × LPG Cylinder</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Order Amount</span>
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
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {del.status === 'OUT FOR DELIVERY' ? (
                <button
                  onClick={() => handleCompleteAndNotify(del.id, del.customerName, del.customerPhone, del.amount, del.cylinderCount, del.driverName, del.vehicleNumber)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Complete & Send WhatsApp Receipt
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEBill(del.billNumber)}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-400" /> View E-Bill
                  </button>

                  <button
                    onClick={() => sendWhatsAppReceipt({
                      customerName: del.customerName,
                      customerPhone: del.customerPhone,
                      billNumber: del.billNumber || `MEMO-${del.deliveryNumber}`,
                      cylinderCount: del.cylinderCount,
                      amount: del.amount,
                      paymentMethod: del.paymentMethod || 'UPI',
                      driverName: del.driverName,
                      vehicleNumber: del.vehicleNumber,
                    })}
                    className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <EBillModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
    </div>
  );
};
