import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { API_BASE } from '../utils/api';
import {
  Radio,
  Fingerprint,
  Play,
  Pause,
  Zap,
  CheckCircle2,
  Truck,
  Users,
  Camera,
  Video,
  X,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundAlerts } from '../utils/audioAlerts';

export const LiveSimulatorControl: React.FC<{ defaultExpanded?: boolean }> = ({ defaultExpanded = false }) => {
  const { employees, vehicles } = useApp();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isAutoGpsRunning, setIsAutoGpsRunning] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [isPunching, setIsPunching] = useState(false);
  const [isSteppingGps, setIsSteppingGps] = useState(false);
  const [lastScanMessage, setLastScanMessage] = useState<string | null>(null);

  // PC Camera Webcam State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Start PC Camera Stream
  const startCamera = async () => {
    try {
      setCapturedPhoto(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      alert('Could not access PC Camera / Webcam. Please check browser camera permissions.');
      setCameraActive(false);
    }
  };

  // Stop PC Camera Stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Open Camera Modal
  const handleOpenCamera = () => {
    setShowCameraModal(true);
    setTimeout(() => startCamera(), 200);
  };

  // Close Camera Modal
  const handleCloseCamera = () => {
    stopCamera();
    setShowCameraModal(false);
    setCapturedPhoto(null);
  };

  // Capture Photo & Clock In Selected User
  const handleSnapAndClockIn = async () => {
    if (!videoRef.current) return;

    // Capture frame on canvas
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const photoBase64 = canvas.toDataURL('image/jpeg', 0.85);

    setCapturedPhoto(photoBase64);
    stopCamera();

    // Trigger Biometric Punch with photo payload
    const targetId = selectedEmpId || (employees[0]?.id || 'emp-01');
    const targetEmp = employees.find(e => e.id === targetId || e.email.toLowerCase() === targetId.toLowerCase()) || employees[0];

    try {
      setIsPunching(true);
      const res = await fetch(`${API_BASE}/api/simulator/biometric-punch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: targetEmp ? targetEmp.id : targetId,
          employeeName: targetEmp?.name,
          photoUrl: photoBase64,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLastScanMessage(data.message || `📷 PC Camera Face Scan Verified for ${targetEmp?.name}`);
        soundAlerts.playSuccessSyncChime();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 } });
      }
    } catch (err) {
      alert('Camera biometric scan failed.');
    } finally {
      setIsPunching(false);
      setTimeout(() => setShowCameraModal(false), 1200);
    }
  };

  // Poll simulator status from Express backend
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/simulator/status`);
        if (res.ok) {
          const data = await res.json();
          setIsAutoGpsRunning(Boolean(data.isSimulatorRunning));
        }
      } catch (e) {}
    };
    checkStatus();
  }, []);

  // Toggle Automated Live GPS Telemetry Stream
  const handleToggleAutoGps = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/simulator/toggle-auto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !isAutoGpsRunning }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsAutoGpsRunning(data.isSimulatorRunning);
        if (data.isSimulatorRunning) {
          soundAlerts.playSuccessSyncChime();
        }
      }
    } catch (err) {
      alert('Backend connection error.');
    }
  };

  // Step GPS coordinates manually (1 tick)
  const handleStepGps = async () => {
    try {
      setIsSteppingGps(true);
      const res = await fetch(`${API_BASE}/api/simulator/gps-step`, { method: 'POST' });
      if (res.ok) {
        soundAlerts.playSuccessSyncChime();
      }
    } catch (err) {
      console.warn('GPS Step error');
    } finally {
      setTimeout(() => setIsSteppingGps(false), 500);
    }
  };

  // Trigger Biometric Attendance Punch for Selected Existing User
  const handleBiometricPunch = async (empIdTarget?: string) => {
    const targetId = empIdTarget || selectedEmpId || (employees[0]?.id || 'emp-01');
    const targetEmp = employees.find(e => e.id === targetId || e.email.toLowerCase() === targetId.toLowerCase()) || employees[0];

    try {
      setIsPunching(true);
      const res = await fetch(`${API_BASE}/api/simulator/biometric-punch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: targetEmp ? targetEmp.id : targetId, employeeName: targetEmp?.name }),
      });

      if (res.ok) {
        const data = await res.json();
        setLastScanMessage(data.message || `Biometric punch verified for ${targetEmp?.name}`);
        soundAlerts.playSuccessSyncChime();
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
      }
    } catch (err) {
      alert('Biometric scanner simulation error.');
    } finally {
      setTimeout(() => setIsPunching(false), 800);
    }
  };

  // Clock in all existing users simultaneously
  const handleClockInAll = async () => {
    setIsPunching(true);
    for (const emp of employees) {
      try {
        await fetch(`${API_BASE}/api/simulator/biometric-punch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: emp.id, employeeName: emp.name }),
        });
      } catch (e) {}
    }
    soundAlerts.playSuccessSyncChime();
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.7 } });
    setLastScanMessage(`✓ Biometric attendance recorded for ALL ${employees.length} active workers!`);
    setIsPunching(false);
  };

  return (
    <div className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl text-white shadow-xl overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-extrabold text-sm text-amber-400">
                Real-Time Hardware Telemetry Engine
              </h3>
              {isAutoGpsRunning ? (
                <span className="badge-status badge-green text-[10px] font-bold flex items-center gap-1 py-0.5 px-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> ● LIVE STREAM ACTIVE
                </span>
              ) : (
                <span className="badge-status badge-amber text-[10px] font-bold py-0.5 px-2">
                  ● PAUSED
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Live IoT Fleet GPS telemetry movement & ZKTeco easyTimePro Biometric punches with existing users
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-700 cursor-pointer"
        >
          {isExpanded ? 'Collapse ▲' : 'Open Controls ▼'}
        </button>
      </div>

      {/* Expanded Control Panels */}
      {isExpanded && (
        <div className="p-5 space-y-5 bg-slate-900/90 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. REAL-TIME GPS TELEMETRY CONTROL */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <span>Real-Time Fleettrack GPS Telemetry</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Peelamedu, CBE</span>
              </div>

              <p className="text-slate-400 text-[11px]">
                Real-time truck movement along Peelamedu & Avinashi Road routes for {vehicles.length} active fleet vehicles.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleToggleAutoGps}
                  className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
                    isAutoGpsRunning
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  }`}
                >
                  {isAutoGpsRunning ? (
                    <>
                      <Pause className="w-4 h-4" /> Stop Live GPS Loop
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" /> Start Live GPS Loop (2.5s)
                    </>
                  )}
                </button>

                <button
                  onClick={handleStepGps}
                  disabled={isSteppingGps}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Zap className={`w-4 h-4 ${isSteppingGps ? 'animate-spin' : ''}`} /> 1-Click GPS Step
                </button>
              </div>

              {/* Active Simulated Trucks */}
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1 text-slate-300 font-mono">
                <p className="font-bold text-slate-400 text-[10px] uppercase font-sans">Tracked Fleet Vehicles:</p>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {vehicles.map(v => (
                    <div key={v.id} className="flex justify-between bg-slate-950 p-1.5 rounded border border-slate-800">
                      <span className="font-bold text-amber-400">{v.registrationNumber}</span>
                      <span className="text-emerald-400">{v.driverName} ({v.speed}km/h)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. MOCK BIOMETRIC ATTENDANCE SCANNER */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
                  <Fingerprint className="w-4 h-4 text-emerald-400" />
                  <span>Biometric Fingerprint & Face Scanner</span>
                </div>
                <span className="text-[10px] text-blue-400 font-bold font-mono">ZKTeco easyTimePro</span>
              </div>

              <p className="text-slate-400 text-[11px]">
                Select an existing user to punch biometric attendance or use your <strong>PC Camera</strong> for facial recognition clock-in.
              </p>

              <div className="space-y-2">
                <select
                  value={selectedEmpId}
                  onChange={e => setSelectedEmpId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:border-emerald-400 focus:outline-none"
                >
                  <option value="">Select Existing User to Clock In...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role}) — {emp.email}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleBiometricPunch()}
                    disabled={isPunching}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Fingerprint className={`w-3.5 h-3.5 ${isPunching ? 'animate-bounce' : ''}`} />
                    Fingerprint
                  </button>

                  <button
                    onClick={handleOpenCamera}
                    disabled={isPunching}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-2 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    PC Camera Scan
                  </button>

                  <button
                    onClick={handleClockInAll}
                    disabled={isPunching}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" /> Clock All
                  </button>
                </div>
              </div>

              {lastScanMessage && (
                <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-300 p-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{lastScanMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PC CAMERA WEBCAM MODAL */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-5 text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    PC Webcam Facial Recognition Scanner
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Live video stream for testing biometric attendance clock-in
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseCamera}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Live Stream Box */}
            <div className="relative bg-black rounded-2xl border-2 border-slate-800 overflow-hidden min-h-[300px] flex items-center justify-center">
              {capturedPhoto ? (
                /* Show Captured Snapshot */
                <div className="relative w-full h-full flex flex-col items-center">
                  <img src={capturedPhoto} alt="Camera Snap" className="w-full max-h-72 object-cover rounded-xl" />
                  <div className="absolute inset-0 bg-emerald-950/40 border-4 border-emerald-500 rounded-xl flex items-center justify-center">
                    <span className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 animate-bounce">
                      <CheckCircle2 className="w-4 h-4" /> FACE MATCH VERIFIED — CLOCKING IN...
                    </span>
                  </div>
                </div>
              ) : (
                /* Live Camera Stream with Target Alignment Lines */
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-72 object-cover rounded-xl"
                  />
                  {cameraActive && (
                    <div className="absolute inset-0 border-2 border-amber-500/50 rounded-xl pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-dashed border-amber-400/80 rounded-full animate-pulse flex items-center justify-center">
                        <span className="text-[10px] text-amber-300 font-mono bg-slate-950/80 px-2 py-1 rounded border border-amber-400/50">
                          ALIGN FACE IN CIRCLE
                        </span>
                      </div>
                    </div>
                  )}
                  {!cameraActive && (
                    <div className="text-center py-10 space-y-2">
                      <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                      <p className="text-xs text-slate-300">Connecting PC Camera stream...</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseCamera}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSnapAndClockIn}
                disabled={!cameraActive || Boolean(capturedPhoto)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Camera className="w-4 h-4" /> Snap Photo & Clock In User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
