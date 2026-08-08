import React from 'react';
import { useApp } from '../context/AppContext';
import { Boxes } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { inventory } = useApp();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white">Cylinder Inventory Control</h1>
            <p className="text-xs text-slate-400">
              Real-time Stock Tracking & Depot Stock Movement
            </p>
          </div>
        </div>
      </div>

      {/* Inventory Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <p className="text-xs font-bold text-slate-400 uppercase">Available</p>
          <p className="font-display font-bold text-2xl text-slate-900 mt-1">{inventory.available}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <p className="text-xs font-bold text-slate-400 uppercase">Loaded</p>
          <p className="font-display font-bold text-2xl text-amber-600 mt-1">{inventory.loaded}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <p className="text-xs font-bold text-slate-400 uppercase">With Drivers</p>
          <p className="font-display font-bold text-2xl text-blue-600 mt-1">{inventory.withDrivers}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm text-center">
          <p className="text-xs font-extrabold text-emerald-800 uppercase">Delivered</p>
          <p className="font-display font-extrabold text-2xl text-emerald-700 mt-1">{inventory.delivered}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <p className="text-xs font-bold text-slate-400 uppercase">Returned</p>
          <p className="font-display font-bold text-2xl text-purple-600 mt-1">{inventory.returned}</p>
        </div>
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 shadow-sm text-center">
          <p className="text-xs font-bold text-rose-800 uppercase">Damaged</p>
          <p className="font-display font-bold text-2xl text-rose-600 mt-1">{inventory.damaged}</p>
        </div>
      </div>

      {/* Movement Audit Log */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <h2 className="font-display font-bold text-base text-slate-900">Recent Inventory Movement Log</h2>
        <div className="space-y-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-900">Loaded 25 Cylinders → Truck TN XX 1234 (Arun)</span>
              <p className="text-[11px] text-slate-500">Batch LB1021 • Loadman: Kumar</p>
            </div>
            <span className="font-mono text-slate-500">08:30 AM</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-900">Delivered 3 Cylinders → Lakshmi Traders</span>
              <p className="text-[11px] text-slate-500">Bill VI-2026-001025 • Driver: Arun</p>
            </div>
            <span className="font-mono text-slate-500">04:42 PM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
