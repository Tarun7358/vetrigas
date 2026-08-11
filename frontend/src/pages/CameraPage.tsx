import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Video, Camera, Play, CheckCircle2, AlertTriangle, RefreshCw, Smartphone } from 'lucide-react';

export const CameraPage: React.FC = () => {
  const { vehicles, selectedVehicleId, setSelectedVehicleId, integrations, currentUser, role, deliveries } = useApp();

  const isDriver = role === 'DRIVER';
  const driverName = currentUser?.name || 'Arun';

  // Find active or recent delivery for driver
  const myActiveDelivery = deliveries.find(
    d => (d.driverName || '').toLowerCase() === driverName.toLowerCase() && d.status !== 'DELIVERED'
  ) || deliveries.find(
    d => (d.driverName || '').toLowerCase() === driverName.toLowerCase()
  );

  // Match vehicle by active delivery's vehicleNumber or by driver name
  const myAssignedVehicle = vehicles.find(v => v.registrationNumber === myActiveDelivery?.vehicleNumber)
    || vehicles.find(v => (v.driverName || '').toLowerCase() === driverName.toLowerCase())
    || null;

  // Active vehicle: locked for DRIVER, selectable for Management
  const activeVehicle = isDriver
    ? myAssignedVehicle
    : (vehicles.find(v => v.id === selectedVehicleId) || (vehicles.length > 0 ? vehicles[0] : null));

  const [activeCam, setActiveCam] = useState<'ROAD' | 'CABIN'>('ROAD');
  const [snapshotTaken, setSnapshotTaken] = useState(false);
  const [useDeviceCam, setUseDeviceCam] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [selectedTimelineTime, setSelectedTimelineTime] = useState<string | null>(null);
  const [playbackNotice, setPlaybackNotice] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    if (useDeviceCam) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: activeCam === 'ROAD' ? 'environment' : 'user' } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
          }
          setStreamError(null);
        })
        .catch(err => {
          console.warn('Live device camera permission note:', err);
          setStreamError('Device camera access requested or unavailable. Showing encrypted dashcam simulation.');
          setUseDeviceCam(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [useDeviceCam, activeCam]);

  const handleSnapshot = () => {
    setSnapshotTaken(true);
    setTimeout(() => setSnapshotTaken(false), 3000);
  };

  // Dynamic Trip Timeline & Event Clips Calculation
  const activeVehicleDeliveries = activeVehicle
    ? deliveries.filter(
        d => d.vehicleNumber === activeVehicle.registrationNumber || d.driverName?.toLowerCase() === activeVehicle.driverName?.toLowerCase()
      )
    : [];

  const dynamicEventClips = activeVehicleDeliveries.length > 0
    ? activeVehicleDeliveries.map((del, idx) => ({
        id: del.id,
        title: `Delivery Stop #${del.deliveryNumber || del.id} (${del.customerName})`,
        details: `${del.customerAddress} • ${del.cylinderCount} Cylinders • Status: ${del.status}`,
        type: del.status === 'DELIVERED' ? 'DELIVERY_STOP' : 'EN_ROUTE',
        time: del.deliveryTime || `${(8 + idx * 2).toString().padStart(2, '0')}:15 AM`,
        badgeColor: del.status === 'DELIVERED' ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800' : 'text-amber-400 bg-amber-950/60 border-amber-800',
      }))
    : (activeVehicle
        ? [
            {
              id: 'evt-01',
              title: `Fleet Depot Departure`,
              details: `Peelamedu Main Depot • Initial speed ${Math.max(20, activeVehicle.speed)} km/h`,
              type: 'DISPATCH',
              time: '08:15 AM',
              badgeColor: 'text-blue-400 bg-blue-950/60 border-blue-800',
            },
            {
              id: 'evt-02',
              title: `Route Landmark & Telemetry Ping`,
              details: `Avinashi Road Route • Ignition ${activeVehicle.ignition ? 'ON' : 'OFF'}`,
              type: 'TELEMETRY',
              time: `${activeVehicle.lastUpdatedSecondsAgo}s ago`,
              badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800',
            },
          ]
        : []);

  const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timelineNodes = activeVehicle
    ? [
        { label: '08:00 AM', tag: 'Depot Exit' },
        { label: activeVehicleDeliveries[0]?.deliveryTime || '09:30 AM', tag: 'Order Dispatch' },
        { label: `${activeVehicle.lastUpdatedSecondsAgo}s ago`, tag: 'Telemetry Ping' },
        { label: currentTimeStr, tag: 'Live Now', isLive: true },
      ]
    : [];

  const handlePlayClip = (clipTitle: string, time: string) => {
    setSelectedTimelineTime(time);
    setPlaybackNotice(`▶ Playing Recorded Dashcam Clip: "${clipTitle}" [${time}]`);
    setTimeout(() => setPlaybackNotice(null), 4000);
  };

  if (!activeVehicle) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Video className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
                VEHICLE DASHCAM & LIVE CAMERA CONTROL
              </h1>
              <p className="text-xs text-slate-400">
                {isDriver ? `Driver Camera Monitor • Driver: ${driverName}` : 'Fleettrack EH21 AI Dashcam Stream & Driver Safety Timeline'}
              </p>
            </div>
          </div>
        </div>

        {/* Empty State Banner */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-12 text-center text-white shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-display font-extrabold text-amber-400">
            NO FLEET TRUCK REGISTERED OR ASSIGNED
          </h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            {isDriver
              ? `No active fleet truck has been assigned to driver "${driverName}" yet. Select an assigned delivery order with a registered truck to view camera feeds.`
              : 'No vehicles are registered in the fleet database. Create a new vehicle using the "+ Add New Fleet Vehicle" panel in the Owner Dashboard.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Video className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
              VEHICLE DASHCAM & LIVE CAMERA CONTROL
            </h1>
            <p className="text-xs text-slate-400">
              {isDriver ? `Driver Camera Monitor • Assigned Truck: ${activeVehicle.registrationNumber}` : 'Fleettrack EH21 AI Dashcam Stream & Driver Safety Timeline'}
            </p>
          </div>
        </div>

        {/* Vehicle Switcher Dropdown & Camera Source Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {isDriver ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-mono font-bold">
              <span>🔒 Assigned Truck: 🚚 {activeVehicle.registrationNumber}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5">
              <span className="text-xs font-bold text-amber-400">Truck:</span>
              <select
                value={activeVehicle.id}
                onChange={e => setSelectedVehicleId(e.target.value)}
                className="bg-transparent text-white font-mono font-bold text-xs outline-none cursor-pointer"
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                    🚚 {v.registrationNumber} ({v.driverName})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setUseDeviceCam(!useDeviceCam)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              useDeviceCam
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>{useDeviceCam ? 'Using Mobile Device Cam' : 'Switch to Device Camera'}</span>
          </button>

          {integrations.fleettrackConnected ? (
            <span className="badge-status badge-green flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Dashcam Linked
            </span>
          ) : (
            <span className="badge-status badge-amber flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Live Encrypted
            </span>
          )}
        </div>
      </div>

      {streamError && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3 rounded-xl text-xs flex items-center justify-between">
          <span>⚠️ {streamError}</span>
          <button onClick={() => setStreamError(null)} className="text-amber-400 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {playbackNotice && (
        <div className="bg-emerald-950/90 border border-emerald-600 text-emerald-300 p-3 rounded-xl text-xs flex items-center justify-between shadow-lg animate-in fade-in">
          <span className="font-bold">{playbackNotice}</span>
          <button onClick={() => setPlaybackNotice(null)} className="text-white font-extrabold hover:underline cursor-pointer">✕</button>
        </div>
      )}

      {/* Main Video Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Canvas Container */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between space-y-4">
          
          {/* Quick Fleet Truck Selector Tabs (Management) vs Driver Lock Badge */}
          {isDriver ? (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">🔒 Driver Vehicle Lock:</span>
                <span className="text-white font-mono font-bold">🚚 {activeVehicle.registrationNumber}</span>
                <span className="text-slate-400 text-xs">({activeVehicle.driverName})</span>
              </div>
              <span className="text-emerald-400 font-mono text-[11px] bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                ● Active Order Stream Mode
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[11px] font-extrabold text-slate-400 font-mono shrink-0 mr-1 uppercase">SELECT TRUCK:</span>
              {vehicles.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    activeVehicle.id === v.id
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 border border-amber-400'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span>🚚 {v.registrationNumber}</span>
                  <span className="opacity-80 text-[10px]">({v.driverName})</span>
                </button>
              ))}
            </div>
          )}

          {/* Stream Overlay Controls & Player */}
          {(() => {
            const isLiveFeed = useDeviceCam || integrations.fleettrackConnected;
            const isIgnitionOn = isLiveFeed && activeVehicle.ignition;

            return (
              <>
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 bg-slate-900/90 px-4 py-2.5 rounded-xl border border-slate-800 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-amber-400 font-mono text-sm">🚚 {activeVehicle.registrationNumber}</span>
                    <span className="text-slate-400">Driver: <strong className="text-white">{activeVehicle.driverName}</strong></span>
                    <span className="text-slate-400">Speed: <strong className="text-emerald-400 font-mono">{isLiveFeed ? activeVehicle.speed : 0} km/h</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLiveFeed ? (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                        <span className="text-emerald-400 font-extrabold uppercase text-[11px] tracking-wider">● LIVE STREAM</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span className="text-amber-400 font-extrabold uppercase text-[11px] tracking-wider">● STANDBY / DISCONNECTED</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Video Player Display Box */}
                <div className="relative w-full aspect-video bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden group shadow-inner">
                  {useDeviceCam ? (
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-slate-950 flex flex-col justify-between p-6 overflow-hidden">
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] animate-pulse"></div>

                      <div className="flex justify-between items-start z-10">
                        <span className="bg-slate-900/90 text-amber-400 border border-slate-700 text-[11px] font-mono px-3 py-1 rounded-xl shadow-md">
                          CAM {activeCam === 'ROAD' ? '01: FRONT ROAD VIEW' : '02: CABIN DRIVER VIEW'}
                        </span>
                        {isLiveFeed ? (
                          <span className="bg-slate-900/90 text-emerald-400 text-[10px] font-mono px-2.5 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                            1080P • 30FPS • H.265 ENCRYPTED
                          </span>
                        ) : (
                          <span className="bg-slate-900/90 text-slate-400 text-[10px] font-mono px-2.5 py-1 rounded-xl border border-slate-700 flex items-center gap-1">
                            STANDBY • HARDWARE DISCONNECTED
                          </span>
                        )}
                      </div>

                      <div className="text-center space-y-3 my-auto z-10">
                        <div className={`p-4 rounded-full border w-16 h-16 mx-auto flex items-center justify-center ${isLiveFeed ? 'bg-amber-500/10 border-amber-500/30 animate-pulse' : 'bg-slate-800/40 border-slate-700'}`}>
                          <Video className={`w-8 h-8 ${isLiveFeed ? 'text-amber-400' : 'text-slate-500'}`} />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-bold text-white tracking-wide">
                            {isLiveFeed
                              ? (activeCam === 'ROAD'
                                  ? '[ LIVE FRONT ROAD STREAM — PEELAMEDU HIGHWAY ]'
                                  : `[ LIVE CABIN DRIVER FEED — ${activeVehicle.driverName.toUpperCase()} ]`)
                              : '[ DASHCAM STANDBY — NO LIVE HARDWARE FEED ]'}
                          </p>
                          <p className={`text-xs font-mono mt-1 ${isIgnitionOn ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                            Vehicle: {activeVehicle.registrationNumber} • Ignition: {isIgnitionOn ? 'ON' : 'OFF'}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-end text-[11px] font-mono text-slate-300 z-10 border-t border-slate-800/80 pt-2">
                        <span>GPS: {activeVehicle.lat.toFixed(4)} N, {activeVehicle.lng.toFixed(4)} E</span>
                        <span className="text-amber-400 font-bold">{new Date().toLocaleTimeString()} • {isLiveFeed ? 'LIVE AUDIT' : 'STANDBY'}</span>
                      </div>
                    </div>
                  )}

                  <div className="absolute top-3 right-3 bg-slate-950/80 text-white border border-slate-700/80 text-[10px] font-mono px-3 py-1.5 rounded-xl backdrop-blur-sm shadow-md pointer-events-none z-20">
                    HUD SPEED: {isLiveFeed ? activeVehicle.speed : 0} KM/H
                  </div>

                  {snapshotTaken && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center animate-out fade-out duration-1000 z-30">
                      <div className="bg-slate-950 text-emerald-400 px-5 py-3 rounded-2xl font-bold text-xs border border-emerald-500 shadow-2xl">
                        ✓ Snapshot Captured & Saved to Audit Log
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}

          {/* Camera Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveCam('ROAD')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeCam === 'ROAD'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Front Road View
              </button>
              <button
                onClick={() => setActiveCam('CABIN')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeCam === 'CABIN'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Cabin Driver View
              </button>
            </div>

            <button
              onClick={handleSnapshot}
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-amber-400" /> Take Instant Snapshot
            </button>
          </div>
        </div>

        {/* Trip Timeline & Event Clips */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col justify-between space-y-6 shadow-xl">
          <div>
            <h3 className="font-display font-bold text-base text-white mb-1">Trip Timeline Playback</h3>
            <p className="text-xs text-slate-400 mb-4">Live journey clips and dynamic event flags for {activeVehicle.registrationNumber}</p>

            {/* Dynamic Timeline Visual Bar */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Trip Timeline</p>
                <span className="text-[10px] text-slate-400 font-mono">{activeVehicle.driverName}</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-mono text-slate-300 border-b border-slate-800 pb-3">
                {timelineNodes.map((node, i) => (
                  <button
                    key={i}
                    onClick={() => handlePlayClip(`Timeline Step: ${node.tag}`, node.label)}
                    className={`p-1.5 rounded-lg border text-[11px] cursor-pointer transition-all hover:scale-105 ${
                      node.isLive
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700 font-bold shadow-md shadow-emerald-500/10'
                        : selectedTimelineTime === node.label
                        ? 'bg-amber-500 text-slate-950 font-extrabold border-amber-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-amber-500/50'
                    }`}
                  >
                    <span className="block truncate">{node.label}</span>
                    <span className="text-[9px] opacity-70 block truncate">{node.tag}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Click any timestamp node to jump playback stream to recorded trip interval.
              </p>
            </div>

            {/* Dynamic Event Clips Browser */}
            <div className="mt-5 space-y-2.5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recorded Event Clips ({dynamicEventClips.length})</p>

              {dynamicEventClips.map((clip) => (
                <div key={clip.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs gap-2">
                  <div className="space-y-0.5 overflow-hidden">
                    <p className="font-bold text-slate-200 truncate">{clip.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">{clip.time} • {clip.details}</p>
                  </div>
                  <button
                    onClick={() => handlePlayClip(clip.title, clip.time)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 cursor-pointer shrink-0 transition-transform active:scale-95"
                    title="Play event clip"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-center text-[11px] text-slate-400 font-mono">
            Fleettrack EH21 AI Camera • Serial #FT-{activeVehicle.registrationNumber.replace(/\s+/g, '')}
          </div>
        </div>
      </div>
    </div>
  );
};
