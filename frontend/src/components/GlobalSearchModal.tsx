import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Search, X, Truck, User, Receipt, Package, ArrowRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, targetId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { vehicles, employees, deliveries, bills, batches } = useApp();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open search
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchedVehicles = q ? vehicles.filter(v => v.registrationNumber.toLowerCase().includes(q) || v.driverName.toLowerCase().includes(q)) : [];
  const matchedEmployees = q ? employees.filter(e => e.name.toLowerCase().includes(q) || e.phone.includes(q)) : [];
  const matchedDeliveries = q ? deliveries.filter(d => d.deliveryNumber.toLowerCase().includes(q) || d.customerName.toLowerCase().includes(q)) : [];
  const matchedBills = q ? bills.filter(b => b.billNumber.toLowerCase().includes(q) || b.customerName.toLowerCase().includes(q)) : [];
  const matchedBatches = q ? batches.filter(bt => bt.batchNumber.toLowerCase().includes(q) || bt.driverName.toLowerCase().includes(q)) : [];

  const hasResults =
    matchedVehicles.length > 0 ||
    matchedEmployees.length > 0 ||
    matchedDeliveries.length > 0 ||
    matchedBills.length > 0 ||
    matchedBatches.length > 0;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type to search (e.g. TN XX 1234, Arun, Raj Kumar, VI10251)..."
            className="w-full bg-transparent text-sm focus:outline-none text-white placeholder-slate-500 font-medium"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 text-xs">
          {!query && (
            <div className="text-center py-8 text-slate-500">
              <p className="font-semibold">Quick Search Across Vetri Indane System</p>
              <p className="mt-1 text-[11px]">Search vehicles, drivers, customers, bills, or loading batches</p>
            </div>
          )}

          {query && !hasResults && (
            <div className="text-center py-8 text-slate-400">
              <p>No matching records found for "{query}".</p>
            </div>
          )}

          {/* Vehicles */}
          {matchedVehicles.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-400" /> Vehicles
              </p>
              <div className="space-y-1.5">
                {matchedVehicles.map(v => (
                  <button
                    key={v.id}
                    onClick={() => {
                      onNavigate('fleet', v.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-left transition-colors"
                  >
                    <div>
                      <p className="font-bold text-amber-400">{v.registrationNumber}</p>
                      <p className="text-slate-400 text-[11px]">Driver: {v.driverName} • Speed: {v.speed} km/h</p>
                    </div>
                    <span className="badge-status badge-green">{v.status}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Employees */}
          {matchedEmployees.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" /> Employees
              </p>
              <div className="space-y-1.5">
                {matchedEmployees.map(e => (
                  <button
                    key={e.id}
                    onClick={() => {
                      onNavigate('workforce', e.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-left transition-colors"
                  >
                    <div>
                      <p className="font-bold text-white">{e.name}</p>
                      <p className="text-slate-400 text-[11px]">{e.role} • {e.phone}</p>
                    </div>
                    <span className="text-emerald-400 font-semibold">{e.attendanceStatus}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Deliveries */}
          {matchedDeliveries.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-400" /> Deliveries
              </p>
              <div className="space-y-1.5">
                {matchedDeliveries.map(d => (
                  <button
                    key={d.id}
                    onClick={() => {
                      onNavigate('deliveries', d.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-left transition-colors"
                  >
                    <div>
                      <p className="font-bold text-white">{d.deliveryNumber} — {d.customerName}</p>
                      <p className="text-slate-400 text-[11px]">Amount: ₹{d.amount} • Driver: {d.driverName}</p>
                    </div>
                    <span className="badge-status badge-blue">{d.status}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bills */}
          {matchedBills.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-purple-400" /> Bills & Receipts
              </p>
              <div className="space-y-1.5">
                {matchedBills.map(b => (
                  <button
                    key={b.id}
                    onClick={() => {
                      onNavigate('billing', b.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-left transition-colors"
                  >
                    <div>
                      <p className="font-bold text-emerald-400">{b.billNumber}</p>
                      <p className="text-slate-400 text-[11px]">{b.customerName} • ₹{b.amount} ({b.paymentMethod})</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
