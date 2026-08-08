import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Video, Camera, Play, CheckCircle2, AlertTriangle } from 'lucide-react';

export const CameraPage: React.FC = () => {
  const { vehicles, selectedVehicleId, integrations } = useApp();
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];
  const [activeCam, setActiveCam] = useState<'ROAD' | 'CABIN'>('ROAD');
  const [snapshotTaken, setSnapshotTaken] = useState(false);

  const handleSnapshot = () => {
    setSnapshotTaken(true);
    setTimeout(() => setSnapshotTaken(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-white">VEHICLE CAMERA CONTROL</h1>
            <p className="text-xs text-slate-400">
              Fleettrack EH21 Dashcam Stream & Event Timeline Player
            </p>
          </div>
        </div>

        {/* Integration Status Flag */}
        <div className="mt-3 md:mt-0 flex items-center gap-3">
          {integrations.fleettrackConnected ? (
            <span className="badge-status badge-green flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Fleettrack Dashcam Linked
            </span>
          ) : (
            <span className="badge-status badge-amber flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Integration Unavailable
            </span>
          )}
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Canvas Container */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-2xl flex flex-col justify-between space-y-4">
          {/* Stream Overlay Controls */}
          <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="font-bold text-amber-400 font-mono">🚚 {selectedVehicle.registrationNumber}</span>
              <span className="text-slate-400">Driver: <strong className="text-white">{selectedVehicle.driverName}</strong></span>
              <span className="text-slate-400">Speed: <strong className="text-emerald-400 font-mono">{selectedVehicle.speed} km/h</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="pulse-dot"></span>
              <span className="text-emerald-400 font-bold uppercase text-[11px]">● LIVE STREAM</span>
            </div>
          </div>

          {/* Video Player Display Box */}
          <div className="relative w-full aspect-video bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden group">
            {/* Visual Simulator Canvas */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent flex flex-col justify-between p-6">
              <div className="flex justify-between items-start">
                <span className="bg-slate-900/90 text-amber-400 border border-slate-700 text-[11px] font-mono px-2.5 py-1 rounded">
                  CAM {activeCam === 'ROAD' ? '01: FRONT ROAD VIEW' : '02: CABIN DRIVER VIEW'}
                </span>
                <span className="bg-slate-900/90 text-slate-300 text-[10px] font-mono px-2 py-1 rounded">
                  1080P • 30FPS • H.265
                </span>
              </div>

              {/* Simulated Moving Horizon Grid */}
              <div className="text-center space-y-2 my-auto">
                <Video className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
                <p className="font-mono text-xs text-slate-400">
                  {activeCam === 'ROAD' ? '[ LIVE ROAD FEED SIMULATION — AVINASHI ROAD ]' : '[ LIVE CABIN DRIVER FEED SIMULATION — ARUN ]'}
                </p>
                <p className="text-[10px] text-slate-500">Fleettrack EH21 Secured Encrypted Stream</p>
              </div>

              <div className="flex justify-between items-end text-[11px] font-mono text-slate-300">
                <span>LAT: {selectedVehicle.lat} | LNG: {selectedVehicle.lng}</span>
                <span>08 AUG 2026 16:38:26</span>
              </div>
            </div>

            {/* Flash notification on Snapshot */}
            {snapshotTaken && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center animate-out fade-out duration-1000">
                <div className="bg-slate-950 text-emerald-400 px-4 py-2 rounded-lg font-bold text-xs border border-emerald-500">
                  ✓ Snapshot Captured & Saved to Audit Log
                </div>
              </div>
            )}
          </div>

          {/* Camera Controls Bar */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveCam('ROAD')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeCam === 'ROAD'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Front Road View
              </button>
              <button
                onClick={() => setActiveCam('CABIN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeCam === 'CABIN'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Cabin Driver View
              </button>
            </div>

            <button
              onClick={handleSnapshot}
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Camera className="w-4 h-4 text-amber-400" /> Take Snapshot
            </button>
          </div>
        </div>

        {/* Trip Timeline & Event Clips */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-display font-bold text-base text-white mb-1">Trip Timeline Playback</h3>
            <p className="text-xs text-slate-400 mb-4">Historical journey clips and automated event flags</p>

            {/* Timeline Visual Bar */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Trip Timeline</p>
              <div className="flex items-center justify-between text-xs font-mono text-slate-300 border-b border-slate-800 pb-3">
                <span className="bg-blue-950 text-blue-300 px-2 py-0.5 rounded">08:32 AM</span>
                <span>───</span>
                <span className="bg-blue-950 text-blue-300 px-2 py-0.5 rounded">09:15 AM</span>
                <span>───</span>
                <span className="bg-blue-950 text-blue-300 px-2 py-0.5 rounded">10:42 AM</span>
                <span>───</span>
                <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded">12:10 PM</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Click any timestamp node to jump playback stream to recorded trip interval.
              </p>
            </div>

            {/* Event Clips Browser */}
            <div className="mt-5 space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recorded Event Clips</p>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-200">Harsh Braking Alert</p>
                  <p className="text-[11px] text-slate-400">10:42 AM • Speed dropped 45 to 12 km/h</p>
                </div>
                <button className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400">
                  <Play className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-200">Delivery Stop Landmark</p>
                  <p className="text-[11px] text-slate-400">09:15 AM • Customer Raj Kumar Stop</p>
                </div>
                <button className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400">
                  <Play className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center text-[11px] text-slate-500">
            Fleettrack Camera Device Serial: #FT-EH21-99824
          </div>
        </div>
      </div>
    </div>
  );
};
