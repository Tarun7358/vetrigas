import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Smartphone,
  Truck,
  CheckCircle2,
  QrCode,
  MapPin,
  Navigation,
  CircleDollarSign,
  Flame,
  User,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LiveSimulatorControl } from '../components/LiveSimulatorControl';

export const MobileSimulatorPage: React.FC = () => {
  const { role, setRole, deliveries, completeDelivery, batches, reportBatchIssue } = useApp();
  const [mobileWorker, setMobileWorker] = useState<'DRIVER' | 'LOADMAN'>(role === 'LOADMAN' ? 'LOADMAN' : 'DRIVER');
  const [activeTab, setActiveTab] = useState<'HOME' | 'WORK' | 'SALARY' | 'STATS' | 'PROFILE'>('HOME');
  
  // Payment Flow States
  const [paymentDeliveryId, setPaymentDeliveryId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH'>('UPI');
  const [paymentStep, setPaymentStep] = useState<'SELECT' | 'QR' | 'VERIFYING' | 'SUCCESS'>('SELECT');

  const selectedDelivery = deliveries.find(d => d.id === paymentDeliveryId) || deliveries[0];

  const handleStartPayment = (delId: string) => {
    setPaymentDeliveryId(delId);
    setPaymentStep('SELECT');
  };

  const handleSimulatePaymentConfirmation = () => {
    setPaymentStep('VERIFYING');
    setTimeout(() => {
      setPaymentStep('SUCCESS');
      if (paymentDeliveryId) {
        completeDelivery(paymentDeliveryId, paymentMethod);
      }
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }, 2000);
  };

  return (
    <div className="space-y-6 flex flex-col items-center">
      {/* Top Banner Control */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white">Worker Flutter Mobile App Simulator</h1>
            <p className="text-xs text-slate-400">
              Low-density, large-touch interface designed for budget Android devices
            </p>
          </div>
        </div>

        {/* Worker Selector Toggle */}
        <div className="mt-3 md:mt-0 flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
          <button
            onClick={() => {
              setMobileWorker('DRIVER');
              setRole('DRIVER');
            }}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
              mobileWorker === 'DRIVER' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Driver App (Arun)
          </button>
          <button
            onClick={() => {
              setMobileWorker('LOADMAN');
              setRole('LOADMAN');
            }}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
              mobileWorker === 'LOADMAN' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Loadman App (Kumar)
          </button>
        </div>
      </div>

      {/* Real-Time Mock Simulator Engine Controls */}
      <div className="w-full">
        <LiveSimulatorControl defaultExpanded={false} />
      </div>

      {/* Embedded Phone Frame */}
      <div className="phone-simulator">
        <div className="phone-notch"></div>
        <div className="phone-screen">
          {/* Status Bar */}
          <div className="pt-8 px-6 pb-2 bg-slate-900 text-white flex justify-between items-center text-[10px] font-mono shrink-0">
            <span>04:42 PM</span>
            <div className="flex items-center gap-1">
              <span>● 4G</span>
              <span>100% 🔋</span>
            </div>
          </div>

          {/* APP BODY CONTENT */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 text-slate-900">
            {/* DRIVER FLOW */}
            {mobileWorker === 'DRIVER' && (
              <>
                {/* 1. Driver Home Screen */}
                {activeTab === 'HOME' && !paymentDeliveryId && (
                  <div className="space-y-4">
                    {/* Driver Greeting Banner */}
                    <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="font-display font-extrabold text-lg text-white">Good Morning, Arun 👋</h2>
                          <p className="text-[11px] text-slate-400">Driver • Vetri Indane</p>
                        </div>
                        <div className="bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                          ● ONLINE
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px]">Deliveries</span>
                          <p className="font-display font-bold text-base text-amber-400 mt-0.5">17 / 24</p>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 text-[10px]">Today's Collection</span>
                          <p className="font-display font-bold text-base text-emerald-400 mt-0.5">₹18,450</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-slate-300">
                        <span>Vehicle: <strong className="text-white">TN XX 1234</strong></span>
                        <span className="text-emerald-400 font-semibold">GPS ● Connected</span>
                      </div>

                      <button className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
                        <Navigation className="w-4 h-4" /> [ START ROUTE ]
                      </button>
                    </div>

                    {/* Driver Delivery Cards */}
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">Today's Assigned Deliveries</h3>
                      <div className="space-y-3">
                        {deliveries.filter(d => d.status === 'OUT FOR DELIVERY').map(del => (
                          <div key={del.id} className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                DELIVERY #{del.deliveryNumber}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500">{del.distanceKm} km away</span>
                            </div>

                            <div>
                              <p className="font-display font-extrabold text-base text-slate-900">{del.customerName}</p>
                              <p className="text-xs text-slate-600 font-semibold">{del.cylinderCount} × LPG Cylinder</p>
                              <p className="font-display font-extrabold text-lg text-emerald-700 mt-1">₹{del.amount}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                              <button className="bg-slate-100 text-slate-800 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-blue-600" /> NAVIGATE
                              </button>
                              <button
                                onClick={() => handleStartPayment(del.id)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow"
                              >
                                COMPLETE
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Driver Payment Flow */}
                {paymentDeliveryId && (
                  <div className="space-y-4">
                    <button
                      onClick={() => setPaymentDeliveryId(null)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1"
                    >
                      ← Back to Deliveries
                    </button>

                    {paymentStep === 'SELECT' && (
                      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-md space-y-5">
                        <div className="text-center">
                          <p className="text-xs text-slate-500 font-bold uppercase">Customer Payment</p>
                          <h3 className="font-display font-extrabold text-2xl text-slate-900 mt-1">{selectedDelivery.customerName}</h3>
                          <p className="font-display font-extrabold text-3xl text-emerald-600 mt-1">₹{selectedDelivery.amount}</p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-600">Choose Payment Method:</p>
                          <button
                            onClick={() => {
                              setPaymentMethod('UPI');
                              handleSimulatePaymentConfirmation();
                            }}
                            className="w-full bg-blue-600 text-white font-extrabold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
                          >
                            <QrCode className="w-5 h-5" /> [ PAY VIA UPI QR ]
                          </button>
                          <button
                            onClick={() => {
                              setPaymentMethod('CASH');
                              handleSimulatePaymentConfirmation();
                            }}
                            className="w-full bg-slate-900 text-white font-extrabold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md"
                          >
                            <CircleDollarSign className="w-5 h-5 text-amber-400" /> [ COLLECT CASH ]
                          </button>
                        </div>
                      </div>
                    )}

                    {paymentStep === 'VERIFYING' && (
                      <div className="bg-slate-900 text-white border-2 border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xl">
                        <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">SCAN TO PAY</p>
                        <div className="w-40 h-40 mx-auto bg-white p-2 rounded-xl flex items-center justify-center border-4 border-amber-500">
                          <div className="w-full h-full border-2 border-dashed border-slate-900 flex flex-col items-center justify-center text-slate-900 font-mono">
                            <QrCode className="w-16 h-16 text-slate-900" />
                            <span className="text-[10px] font-bold mt-1">₹{selectedDelivery.amount}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-slate-300 font-semibold">Waiting for payment confirmation...</p>
                          <p className="text-emerald-400 font-bold text-xs flex items-center justify-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> ● VERIFYING
                          </p>
                        </div>
                      </div>
                    )}

                    {paymentStep === 'SUCCESS' && (
                      <div className="bg-emerald-950 border-2 border-emerald-700 text-white rounded-2xl p-5 text-center space-y-4 shadow-xl">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                        <div>
                          <h3 className="font-display font-extrabold text-xl text-white">✓ PAYMENT RECEIVED</h3>
                          <p className="font-display font-extrabold text-3xl text-emerald-400 mt-1">₹{selectedDelivery.amount}</p>
                          <p className="text-[11px] text-slate-300 mt-1">Transaction ID: TXN-88491023</p>
                        </div>

                        <div className="bg-slate-900 p-3 rounded-xl border border-emerald-800 text-left text-xs space-y-1">
                          <p className="text-slate-400 text-[10px]">Official E-Bill Generated</p>
                          <p className="font-bold text-amber-400 font-mono">Bill No: VI-2026-001025</p>
                          <p className="text-slate-300">Customer: {selectedDelivery.customerName}</p>
                        </div>

                        <div className="space-y-2">
                          <button
                            onClick={() => setPaymentDeliveryId(null)}
                            className="w-full bg-emerald-500 text-slate-950 font-extrabold py-3 rounded-xl text-xs shadow-md"
                          >
                            [ CONTINUE DELIVERIES ]
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Driver GPS / Trip Tab */}
                {activeTab === 'WORK' && (
                  <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4 shadow-lg">
                    <h3 className="font-display font-bold text-base text-amber-400">MY VEHICLE GPS</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between bg-slate-950 p-3 rounded-xl">
                        <span className="text-slate-400">Vehicle Number</span>
                        <span className="font-bold text-white font-mono">TN XX 1234</span>
                      </div>
                      <div className="flex justify-between bg-slate-950 p-3 rounded-xl">
                        <span className="text-slate-400">GPS Signal</span>
                        <span className="font-bold text-emerald-400">● Connected</span>
                      </div>
                      <div className="flex justify-between bg-slate-950 p-3 rounded-xl">
                        <span className="text-slate-400">Current Speed</span>
                        <span className="font-bold text-white font-mono">34 km/h</span>
                      </div>
                      <div className="flex justify-between bg-slate-950 p-3 rounded-xl">
                        <span className="text-slate-400">Today's Distance</span>
                        <span className="font-bold text-amber-400 font-mono">34.2 km</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* LOADMAN FLOW */}
            {mobileWorker === 'LOADMAN' && (
              <div className="space-y-4">
                <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md space-y-3">
                  <h2 className="font-display font-extrabold text-lg text-white">Good Morning, Kumar 👋</h2>
                  <p className="text-xs text-slate-400">Loadman • Vetri Indane Depot</p>

                  <div className="grid grid-cols-3 gap-2 text-center pt-2">
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px]">Assigned</span>
                      <p className="font-bold text-white text-sm mt-0.5">120</p>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px]">Completed</span>
                      <p className="font-bold text-emerald-400 text-sm mt-0.5">86</p>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[10px]">Remaining</span>
                      <p className="font-bold text-amber-400 text-sm mt-0.5">34</p>
                    </div>
                  </div>
                </div>

                {/* Batch Cards */}
                <div className="space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Assigned Loading Batches</h3>
                  {batches.map(batch => (
                    <div key={batch.id} className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-display font-extrabold text-sm text-slate-900">{batch.batchNumber}</span>
                        <span className="badge-status badge-blue">{batch.status}</span>
                      </div>

                      <div className="text-xs space-y-1 text-slate-700">
                        <p>Vehicle: <strong className="text-amber-700 font-mono">{batch.vehicleNumber}</strong></p>
                        <p>Driver: <strong>{batch.driverName}</strong></p>
                        <p>Cylinders: <strong>Required {batch.requiredCount} | Loaded {batch.loadedCount}</strong></p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => alert(`Batch ${batch.batchNumber} confirmed successfully!`)}
                          className="bg-emerald-600 text-white font-extrabold py-2.5 rounded-xl text-xs"
                        >
                          [ CONFIRM ]
                        </button>
                        <button
                          onClick={() => {
                            const actual = prompt('Enter actual loaded cylinders:', String(batch.loadedCount));
                            const reason = prompt('Reason for discrepancy:', 'Stock shortage');
                            if (actual && reason) {
                              reportBatchIssue(batch.id, Number(actual), reason);
                            }
                          }}
                          className="bg-rose-900 text-rose-200 font-extrabold py-2.5 rounded-xl text-xs"
                        >
                          [ REPORT ISSUE ]
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MOBILE BOTTOM NAVIGATION */}
          <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center justify-around text-[10px] text-slate-400 font-bold shrink-0">
            <button
              onClick={() => setActiveTab('HOME')}
              className={`flex flex-col items-center gap-0.5 ${activeTab === 'HOME' ? 'text-amber-400' : 'hover:text-white'}`}
            >
              <Flame className="w-4 h-4" /> Home
            </button>
            <button
              onClick={() => setActiveTab('WORK')}
              className={`flex flex-col items-center gap-0.5 ${activeTab === 'WORK' ? 'text-amber-400' : 'hover:text-white'}`}
            >
              <Truck className="w-4 h-4" /> {mobileWorker === 'DRIVER' ? 'Work' : 'Loading'}
            </button>
            <button
              onClick={() => setActiveTab('SALARY')}
              className={`flex flex-col items-center gap-0.5 ${activeTab === 'SALARY' ? 'text-amber-400' : 'hover:text-white'}`}
            >
              <CircleDollarSign className="w-4 h-4" /> Salary
            </button>
            <button
              onClick={() => setActiveTab('PROFILE')}
              className={`flex flex-col items-center gap-0.5 ${activeTab === 'PROFILE' ? 'text-amber-400' : 'hover:text-white'}`}
            >
              <User className="w-4 h-4" /> Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
