import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PackageCheck, AlertTriangle, X } from 'lucide-react';
import { API_BASE } from '../utils/api';

export const LoadingPage: React.FC = () => {
  const { batches, reportBatchIssue } = useApp();
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [actualLoadedInput, setActualLoadedInput] = useState<number>(23);
  const [discrepancyReasonInput, setDiscrepancyReasonInput] = useState('Stock shortage');

  const totalRequired = 250;
  const loadedTotal = batches.reduce((acc, b) => acc + b.loadedCount, 0);
  const remainingTotal = totalRequired - loadedTotal;

  const handleSaveDiscrepancy = () => {
    if (selectedBatchId) {
      reportBatchIssue(selectedBatchId, Number(actualLoadedInput), discrepancyReasonInput);
      setSelectedBatchId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white">Loading Control Center</h1>
            <p className="text-xs text-slate-400">
              Daily Vehicle Cylinder Batch Loading & Discrepancy Auditor
            </p>
          </div>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-center">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Required</p>
          <p className="font-display font-bold text-3xl text-slate-900 mt-1">{totalRequired}</p>
        </div>
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 shadow-sm text-center">
          <p className="text-xs font-extrabold text-amber-800 uppercase">Loaded</p>
          <p className="font-display font-extrabold text-3xl text-amber-700 mt-1">{loadedTotal}</p>
        </div>
        <div className="bg-slate-100 p-5 rounded-xl border border-slate-300 shadow-sm text-center">
          <p className="text-xs font-bold text-slate-500 uppercase">Remaining</p>
          <p className="font-display font-bold text-3xl text-slate-700 mt-1">{remainingTotal}</p>
        </div>
      </div>

      {/* Loading Batch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {batches.map(batch => (
          <div
            key={batch.id}
            className={`bg-white border rounded-xl p-5 shadow-sm space-y-4 ${
              batch.status === 'DISCREPANCY' ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-display font-bold text-base text-slate-900">{batch.batchNumber}</span>
                <p className="text-xs text-slate-500">Timestamp: {batch.timestamp}</p>
              </div>
              <span
                className={`badge-status ${
                  batch.status === 'COMPLETED' ? 'badge-green' : 'badge-red'
                }`}
              >
                ● {batch.status}
              </span>
            </div>

            {/* Batch Parameters */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Driver</span>
                <p className="font-bold text-slate-900">{batch.driverName}</p>
              </div>
              <div>
                <span className="text-slate-400">Vehicle</span>
                <p className="font-bold text-amber-700 font-mono">{batch.vehicleNumber}</p>
              </div>
              <div>
                <span className="text-slate-400">Loadman</span>
                <p className="font-bold text-slate-900">{batch.loadmanName}</p>
              </div>
              <div>
                <span className="text-slate-400">Loading Count</span>
                <p className="font-bold text-slate-900">
                  {batch.loadedCount} / {batch.requiredCount} cylinders
                </p>
              </div>
            </div>

            {/* Loadman Discrepancy Highlight Box */}
            {batch.status === 'DISCREPANCY' && (
              <div className="bg-rose-950 text-white p-3 rounded-lg text-xs space-y-1">
                <div className="flex justify-between items-center font-bold text-rose-300">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-rose-400" /> Discrepancy Flag
                  </span>
                  <span>Diff: {batch.discrepancyDiff}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Expected: {batch.requiredCount}</span>
                  <span>Actual: {batch.loadedCount}</span>
                </div>
                <p className="text-rose-200 font-semibold pt-1 border-t border-rose-900">
                  Reason: {batch.discrepancyReason}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              {batch.status !== 'COMPLETED' && batch.status !== 'ACCEPTED' ? (
                <button
                  onClick={async () => {
                    try {
                      await fetch(`${API_BASE}/api/batches/${batch.id}/accept`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ loadmanName: 'Kumar', status: 'ACCEPTED' }),
                      });
                      window.location.reload();
                    } catch (err) {
                      console.error('Accept batch error:', err);
                    }
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer shadow-sm shadow-emerald-600/20"
                >
                  Accept Order & Confirm Batch
                </button>
              ) : (
                <div className="flex-1 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold py-2 rounded-lg text-xs text-center">
                  Order Accepted & Verified
                </div>
              )}

              <button
                onClick={() => {
                  setSelectedBatchId(batch.id);
                  setActualLoadedInput(batch.loadedCount);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Discrepancy
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Discrepancy Modal */}
      {selectedBatchId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-white animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <span className="font-bold text-sm">Report Batch Discrepancy</span>
              <button onClick={() => setSelectedBatchId(null)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Actual Loaded Cylinders</label>
                <input
                  type="number"
                  value={actualLoadedInput}
                  onChange={e => setActualLoadedInput(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Reason for Discrepancy</label>
                <select
                  value={discrepancyReasonInput}
                  onChange={e => setDiscrepancyReasonInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:outline-none"
                >
                  <option value="Stock shortage">Stock shortage</option>
                  <option value="Damaged cylinder removed">Damaged cylinder removed</option>
                  <option value="Vehicle weight capacity reached">Vehicle weight capacity reached</option>
                </select>
              </div>

              <button
                onClick={handleSaveDiscrepancy}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg text-xs transition-colors shadow-md shadow-amber-500/20"
              >
                Save Discrepancy Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
