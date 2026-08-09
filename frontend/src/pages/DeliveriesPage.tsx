import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TruckIcon, CheckCircle2, MapPin, User, Receipt, Filter, MessageSquare, WifiOff, Wifi, X, Navigation, QrCode, DollarSign, ShieldCheck, Camera, Compass, Clock } from 'lucide-react';
import { EBillModal } from '../components/EBillModal';
import { LiveDriverQRMonitor } from '../components/LiveDriverQRMonitor';
import type { BillRecord, DeliveryItem } from '../types';
import { sendWhatsAppReceipt } from '../utils/whatsappReceipt';
import { soundAlerts } from '../utils/audioAlerts';
import { offlineSync } from '../utils/offlineSync';

export const DeliveriesPage: React.FC = () => {
  const { deliveries, bills, completeDelivery, verifyCashProof, addOrder, role, currentUser, attendance, vehicles } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedBill, setSelectedBill] = useState<BillRecord | null>(null);

  // Live Navigation State
  const [activeNavDelivery, setActiveNavDelivery] = useState<DeliveryItem | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number; speed: number } | null>(null);

  // Modals state
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
  const [fulfillItem, setFulfillItem] = useState<DeliveryItem | null>(null);
  const [inspectCashItem, setInspectCashItem] = useState<DeliveryItem | null>(null);

  // Payment Fulfill Form State
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CASH' | 'OWNER_GPAY_DIRECT'>('UPI');
  const [cashProofImage, setCashProofImage] = useState<string>('');
  const [cashProofFileName, setCashProofFileName] = useState<string>('');

  // Order Booking Form State
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustAddress, setNewCustAddress] = useState<string>('');
  const [newQty, setNewQty] = useState<number>(1);
  const [newAmount, setNewAmount] = useState<number>(940);
  const [newDriver, setNewDriver] = useState<string>('Arun');
  const [newVehicle, setNewVehicle] = useState<string>('TN 38 AU 4821');

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);

  const isDriver = role === 'DRIVER';
  const isManagementOrStaff = role === 'OWNER' || role === 'MANAGER' || role === 'GODOWN_KEEPER' || role === 'STOREROOM_STAFF';

  // Live GPS Geolocation Watcher for Navigation
  useEffect(() => {
    let watchId: number | null = null;

    if (activeNavDelivery && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        pos => {
          setCurrentCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: Math.round((pos.coords.speed || 0) * 3.6),
          });
        },
        err => console.warn('Geolocation navigation warning:', err),
        { enableHighAccuracy: true }
      );
    } else {
      setCurrentCoords({ lat: 11.0168, lng: 76.9558, speed: 38 });
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [activeNavDelivery]);

  const handleStartNavigation = (del: DeliveryItem) => {
    setActiveNavDelivery(del);
    // Also launch Google Maps navigation turn-by-turn
    const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(del.customerAddress + ', Coimbatore')}`;
    window.open(mapUrl, '_blank');
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustAddress) return;

    try {
      await addOrder({
        customerName: newCustName,
        address: newCustAddress,
        phone: newCustPhone || '+91 96008 70814',
        category: 'COMMERCIAL',
        amount: newAmount,
        assignedDriverName: newDriver,
        vehicleNumber: newVehicle,
        cylinderCount: newQty,
      });

      setShowOrderModal(false);
      setNewCustName('');
      setNewCustAddress('');
      setNewCustPhone('');
      soundAlerts.playSuccessSyncChime();
    } catch (err) {
      console.error('Order creation error:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = offlineSync.subscribe((online, count) => {
      setIsOnline(online);
      setOfflineQueueCount(count);
    });
    return unsubscribe;
  }, []);

  const handleImageUpload = (file: File) => {
    setCashProofFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCashProofImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmFulfillment = () => {
    if (!fulfillItem) return;

    if (paymentMode === 'CASH' && !cashProofImage) {
      alert('Proof Required: Please capture/upload photo proof of the cash payment for office staff review.');
      return;
    }

    completeDelivery(fulfillItem.id, paymentMode, undefined, cashProofImage || undefined);
    soundAlerts.playSuccessSyncChime();

    // Auto-generate instant E-Bill object for immediate modal preview & download
    const billNo = `VI-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const newBillRecord: BillRecord = {
      id: `bill-${Date.now()}`,
      billNumber: billNo,
      customerName: fulfillItem.customerName,
      amount: fulfillItem.amount,
      paymentMethod: paymentMode,
      transactionId: paymentMode === 'OWNER_GPAY_DIRECT' ? `GPAY-DUE-${Math.floor(100000 + Math.random() * 900000)}` : `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`,
      driverName: fulfillItem.driverName,
      date: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: paymentMode === 'OWNER_GPAY_DIRECT' ? 'PENDING' : 'PAID',
      cylinderCount: fulfillItem.cylinderCount,
    };

    // Trigger WhatsApp digital receipt dispatch
    sendWhatsAppReceipt({
      customerName: fulfillItem.customerName,
      customerPhone: fulfillItem.customerPhone,
      billNumber: billNo,
      cylinderCount: fulfillItem.cylinderCount,
      amount: fulfillItem.amount,
      paymentMethod: paymentMode === 'UPI' ? 'UPI / Dynamic QR' : paymentMode === 'OWNER_GPAY_DIRECT' ? 'Pay Later via Owner GPay (+91 96008 70814)' : 'Cash (Proof Attached)',
      driverName: fulfillItem.driverName,
      vehicleNumber: fulfillItem.vehicleNumber,
    });

    // Close fulfillment modal, stop live nav, and pop open E-Bill Modal
    setFulfillItem(null);
    setActiveNavDelivery(null);
    setCashProofImage('');
    setCashProofFileName('');
    setSelectedBill(newBillRecord);
  };

  // Driver-specific Filtering & Shift Statistics
  const driverNameClean = (currentUser?.name || '').trim().toLowerCase();

  const myDeliveries = isDriver
    ? deliveries.filter(d => {
        const dName = (d.driverName || '').trim().toLowerCase();
        return (
          dName === driverNameClean ||
          (driverNameClean.length > 2 && dName.includes(driverNameClean)) ||
          (dName.length > 2 && driverNameClean.includes(dName))
        );
      })
    : deliveries;

  const filtered = statusFilter === 'ALL'
    ? myDeliveries
    : myDeliveries.filter(d => d.status === statusFilter);

  // Driver metrics
  const myCompleted = myDeliveries.filter(d => d.status === 'DELIVERED');
  const myCompletedCount = myCompleted.length;
  const myTotalCount = myDeliveries.length;
  const myCylinderCount = myCompleted.reduce((acc, d) => acc + (d.cylinderCount || 1), 0);
  const myCollectionSum = myCompleted.reduce((acc, d) => acc + d.amount, 0);
  const myUpiCount = myCompleted.filter(d => d.paymentMethod === 'UPI').length;
  const myCashCount = myCompleted.filter(d => d.paymentMethod === 'CASH').length;

  // Attendance shift working hours lookup
  const driverAttendanceRecord = attendance?.find(a =>
    a.employeeName.toLowerCase().includes(driverNameClean) ||
    driverNameClean.includes(a.employeeName.toLowerCase()) ||
    a.role.toLowerCase() === 'driver'
  );
  const driverShiftHours = driverAttendanceRecord?.workingHours || '7h 45m';
  const driverCheckIn = driverAttendanceRecord?.checkIn || '08:00 AM';

  const handleOpenEBill = (billNo?: string) => {
    if (!billNo) return;
    const b = bills.find(x => x.billNumber === billNo);
    if (b) setSelectedBill(b);
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
              {isDriver ? 'Assigned Field Deliveries, Turn-by-Turn Route Navigation & Payment Collection' : 'Real-Time LPG Delivery Board, Order Posting & Cash Verification Hub'}
            </p>
          </div>
        </div>

        {/* Network & Offline PWA Sync Status & Order Booking */}
        <div className="flex items-center gap-3">
          {isManagementOrStaff && (
            <button
              onClick={() => setShowOrderModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              + Book New Client Order
            </button>
          )}

          {isDriver && (
            <span className="bg-slate-800 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold">
              FIELD DRIVER MODE
            </span>
          )}

          {!isOnline ? (
            <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 animate-pulse">
              <WifiOff className="w-4 h-4 text-amber-400" />
              <span>Offline ({offlineQueueCount})</span>
            </div>
          ) : (
            <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span>Synced</span>
            </div>
          )}
        </div>
      </div>

      {/* DRIVER PERSONAL SHIFT HOURS & DELIVERIES SUMMARY CARD */}
      {isDriver && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in">
          {/* Card 1: Shift Working Hours */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Today's Shift Hours</span>
              <p className="font-display font-extrabold text-2xl text-amber-400 mt-1">
                {driverShiftHours}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">Shift Check-in: <strong className="text-emerald-400">{driverCheckIn}</strong></p>
            </div>
            <div className="p-3.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: My Delivered Orders */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">My Delivered Orders</span>
              <p className="font-display font-extrabold text-2xl text-emerald-400 mt-1">
                {myCompletedCount} / {myTotalCount} Orders
              </p>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">{myCylinderCount} Cylinders Delivered</p>
            </div>
            <div className="p-3.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Today's Money Collected */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">My Collections Today</span>
              <p className="font-display font-extrabold text-2xl text-blue-400 mt-1">
                ₹{myCollectionSum.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">{myUpiCount} UPI QR • {myCashCount} Cash</p>
            </div>
            <div className="p-3.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-2xl">
              <Receipt className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* LIVE DRIVER UPI QR & CASH COLLECTION MONITOR (Visible for Owner, Store Staff, Manager & Godown oversight) */}
      {!isDriver && role !== 'LOADMAN' && <LiveDriverQRMonitor />}

      {/* LIVE DRIVER GPS ROUTE NAVIGATION HUD BANNER */}
      {activeNavDelivery && (
        <div className="bg-slate-950 border-2 border-emerald-500 rounded-3xl p-5 text-white shadow-2xl space-y-4 animate-in slide-in-from-top-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                <Compass className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold">LIVE GPS ROUTE NAVIGATION ACTIVE</span>
                <h3 className="font-display font-extrabold text-lg text-white">En Route to: {activeNavDelivery.customerName}</h3>
                <p className="text-xs text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> {activeNavDelivery.customerAddress}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Speed: </span>
                <span className="text-emerald-400 font-bold">{currentCoords?.speed || 40} KM/H</span>
              </div>
              <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">GPS: </span>
                <span className="text-amber-400">{currentCoords?.lat.toFixed(4) || '11.0168'} N, {currentCoords?.lng.toFixed(4) || '76.9558'} E</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeNavDelivery.customerAddress + ', Coimbatore')}`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <Navigation className="w-4 h-4" /> Open Turn-by-Turn Maps Directions
            </a>

            <button
              onClick={() => {
                setFulfillItem(activeNavDelivery);
                setPaymentMode('UPI');
              }}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4" /> Arrived at Destination — Collect Payment
            </button>
          </div>
        </div>
      )}

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

                {/* Customer Address & GPS Route Navigation Link */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-start gap-2 text-slate-700">
                    <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-tight text-slate-700 font-medium">{del.customerAddress}</p>
                  </div>

                  <button
                    onClick={() => handleStartNavigation(del)}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-[11px] shadow-sm transition-colors cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>📍 Start GPS Route Navigation</span>
                  </button>
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

                {/* Cash Proof Review Banner for Office Staff / Owner */}
                {del.paymentMethod === 'CASH' && del.cashProofUrl && (
                  <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl flex items-center justify-between text-[11px]">
                    <span className="text-amber-900 font-bold flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-amber-600" />
                      {del.cashProofStatus === 'VERIFIED' ? '✓ Cash Verified' : 'Cash Proof Attached'}
                    </span>
                    <button
                      onClick={() => setInspectCashItem(del)}
                      className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] cursor-pointer"
                    >
                      Inspect Photo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {del.status === 'OUT FOR DELIVERY' || del.status === 'ASSIGNED' || del.status === 'READY' ? (
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    onClick={() => {
                      setFulfillItem(del);
                      setPaymentMode('UPI');
                    }}
                    className="flex-1 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Collect Money & Complete Delivery
                  </button>

                  <button
                    onClick={() => {
                      const rawPhone = del.customerPhone.replace(/[^0-9]/g, '') || '9600870814';
                      const text = encodeURIComponent(
                        `Hello ${del.customerName},\n\n` +
                        `🔥 Your Vetri Indane LPG Cylinder Refill (${del.deliveryNumber}) is OUT FOR DELIVERY!\n\n` +
                        `📦 Quantity: ${del.cylinderCount} Cylinder(s)\n` +
                        `💰 Amount: ₹${del.amount}\n` +
                        `🚚 Driver: ${del.driverName} (${del.vehicleNumber})\n` +
                        `📞 Contact: +91 96008 70814\n\n` +
                        `Please have Cash or UPI QR ready. Thank you for choosing Vetri Indane!`
                      );
                      window.open(`https://wa.me/91${rawPhone}?text=${text}`, '_blank');
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                    title="Send WhatsApp SMS Alert to Customer with Driver Phone & ETA"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Alert
                  </button>
                </div>
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
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Share E-Bill
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* DRIVER COMPLETE DELIVERY & PAYMENT COLLECTION MODAL */}
      {fulfillItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 text-white space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                  Complete LPG Delivery #{fulfillItem.deliveryNumber}
                </h2>
                <p className="text-xs text-slate-400">Customer: <strong>{fulfillItem.customerName}</strong> ({fulfillItem.cylinderCount} Cylinders)</p>
              </div>
              <button onClick={() => setFulfillItem(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="space-y-4 text-xs">
              <label className="block text-slate-400 font-semibold">Select Customer Payment Collection Method *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMode('UPI')}
                  className={`py-2.5 px-3 rounded-2xl font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    paymentMode === 'UPI'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span className="text-[11px]">UPI Scan QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('CASH')}
                  className={`py-2.5 px-3 rounded-2xl font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    paymentMode === 'CASH'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span className="text-[11px]">Cash Collection</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('OWNER_GPAY_DIRECT')}
                  className={`py-2.5 px-3 rounded-2xl font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    paymentMode === 'OWNER_GPAY_DIRECT'
                      ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-[11px]">Pay Later (Owner GPay)</span>
                </button>
              </div>

              {/* UPI Dynamic QR View */}
              {paymentMode === 'UPI' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-center space-y-3">
                  <p className="text-xs font-bold text-amber-400">Scan & Pay ₹{fulfillItem.amount} via UPI (GPay / PhonePe / Paytm)</p>
                  <div className="w-36 h-36 mx-auto bg-white p-2.5 rounded-2xl shadow-inner flex items-center justify-center border-2 border-emerald-500">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=vetrigas@okaxis%26pn=VetriIndane%26am=${fulfillItem.amount}%26cu=INR`}
                      alt="UPI Payment QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Digital E-Bill receipt will be dispatched via WhatsApp upon confirmation.</p>
                </div>
              )}

              {/* Pay Later via Owner GPay View */}
              {paymentMode === 'OWNER_GPAY_DIRECT' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center space-y-3">
                  <div className="bg-blue-950/80 border border-blue-800 rounded-xl p-3 text-xs space-y-1.5">
                    <p className="font-extrabold text-blue-300 uppercase tracking-wide text-[11px]">📱 Customer Deferred Payment Request</p>
                    <p className="text-slate-300">Customer will transfer directly to Owner's GPay account:</p>
                    <p className="text-white font-mono font-bold text-sm bg-slate-900 py-1 px-3 rounded-lg border border-slate-700 inline-block">
                      +91 96008 70814 (Vetri Owner)
                    </p>
                    <p className="text-[11px] text-emerald-400 font-bold">Amount Due: ₹{fulfillItem.amount}</p>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Delivery will be marked <span className="text-amber-400 font-bold">DELIVERED (PENDING GPAY)</span>. Owner can confirm receipt in Owner Portal once payment arrives.
                  </p>
                </div>
              )}

              {/* Cash Collection Proof Upload View */}
              {paymentMode === 'CASH' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Cash Amount Collected:</span>
                    <span className="font-display font-bold text-amber-400 text-sm">₹{fulfillItem.amount}</span>
                  </div>

                  <div className="border-2 border-dashed border-slate-800 bg-slate-900 rounded-xl p-4 text-center cursor-pointer hover:border-amber-500 transition-colors">
                    <Camera className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                    <span className="text-xs text-slate-300 block font-medium">
                      {cashProofFileName ? `Attached: ${cashProofFileName}` : '📷 Capture / Upload Cash Proof Image'}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">Photo of collected cash currency notes or signed cash memo voucher</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        if (e.target.files?.[0]) {
                          handleImageUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      id="cash-proof-upload"
                    />
                    <label htmlFor="cash-proof-upload" className="mt-2 inline-block text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-lg cursor-pointer">
                      Browse or Snap Photo
                    </label>
                  </div>

                  {cashProofImage && (
                    <div className="text-center">
                      <img src={cashProofImage} alt="Cash Proof Preview" className="max-h-32 mx-auto rounded-lg border border-slate-700 shadow-md" />
                      <p className="text-[10px] text-emerald-400 mt-1 font-bold">✓ Cash Proof Image Attached for Office Staff Audit</p>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleConfirmFulfillment}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-2xl text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Payment & Mark Order Delivered
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT CASH PROOF MODAL (OFFICE STAFF & OWNER REVIEW) */}
      {inspectCashItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md text-slate-900 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <span className="font-bold text-sm text-amber-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Cash Collection Audit Review
              </span>
              <button onClick={() => setInspectCashItem(null)} className="text-slate-400 hover:text-white p-1">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-950 text-white p-3 rounded-2xl flex flex-col items-center">
                {inspectCashItem.cashProofUrl && inspectCashItem.cashProofUrl.startsWith('data:image') ? (
                  <img src={inspectCashItem.cashProofUrl} alt="Driver Cash Proof" className="max-h-56 object-contain rounded-xl border border-slate-700 shadow-md" />
                ) : (
                  <div className="text-center p-4 bg-amber-50 text-slate-900 rounded-xl border border-amber-300 font-mono">
                    <p className="font-bold">₹{inspectCashItem.amount} CASH RECEIVED</p>
                    <p className="text-[10px] text-slate-600">Collected by Driver {inspectCashItem.driverName}</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery ID:</span>
                  <span className="font-bold">#{inspectCashItem.deliveryNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold">{inspectCashItem.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Collected Amount:</span>
                  <span className="font-bold text-emerald-700">₹{inspectCashItem.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Field Driver:</span>
                  <span>{inspectCashItem.driverName} ({inspectCashItem.vehicleNumber})</span>
                </div>
              </div>

              {inspectCashItem.cashProofStatus !== 'VERIFIED' ? (
                <button
                  onClick={() => {
                    verifyCashProof(inspectCashItem.id);
                    setInspectCashItem(null);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve & Verify Cash Proof
                </button>
              ) : (
                <p className="text-center text-emerald-700 font-bold bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                  ✓ Cash Collection Verified by Office Staff
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Client Order Entry Modal (Storeroom Staff & Godown Keeper) */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-white animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <span className="font-bold text-sm text-amber-400">Book New Client LPG Order (Office Entry)</span>
              <button onClick={() => setShowOrderModal(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Hotel / Saravana Mess"
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 96008 70814"
                    value={newCustPhone}
                    onChange={e => setNewCustPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Cylinder Qty *</label>
                  <input
                    type="number"
                    min="1"
                    value={newQty}
                    onChange={e => {
                      const q = Number(e.target.value);
                      setNewQty(q);
                      setNewAmount(q * 940);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Delivery Address *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="No. 14, Main Road, Peelamedu, Coimbatore"
                  value={newCustAddress}
                  onChange={e => setNewCustAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Total Amount (Rs.)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={e => setNewAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-amber-400 font-bold font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Assign Field Driver</label>
                  <select
                    value={newDriver}
                    onChange={e => setNewDriver(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Arun">Arun (Driver)</option>
                    <option value="Suresh">Suresh (Driver)</option>
                    <option value="Ramesh">Ramesh (Driver)</option>
                    <option value="Vijay">Vijay (Driver)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Select Available Truck / Vehicle *</label>
                <select
                  value={newVehicle}
                  onChange={e => setNewVehicle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.registrationNumber}>
                      🚚 {v.registrationNumber} (Current: {v.driverName})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                Post Order & Notify Loadman / Driver
              </button>
            </form>
          </div>
        </div>
      )}

      <EBillModal bill={selectedBill} onClose={() => setSelectedBill(null)} />
    </div>
  );
};
