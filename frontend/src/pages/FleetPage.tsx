import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Truck,
  Navigation,
  Gauge,
  Zap,
  Clock,
  ShieldCheck,
  AlertCircle,
  Package,
  RefreshCw,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import { soundAlerts } from '../utils/audioAlerts';

const createCustomIcon = (status: string) => {
  const isMoving = status === 'MOVING';
  const color = isMoving ? '%2310B981' : '%23F59E0B'; // Emerald vs Amber
  return new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="36" height="36">
        <circle cx="16" cy="16" r="14" fill="%230F172A" stroke="${color}" stroke-width="3"/>
        <path d="M8 18h16v-6h-4l-3-4H11l-3 4H8v6z" fill="${color}"/>
        <circle cx="11" cy="21" r="2.5" fill="%23FFFFFF"/>
        <circle cx="21" cy="21" r="2.5" fill="%23FFFFFF"/>
      </svg>
    `),
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

const MapRecenter: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 14, { animate: true, duration: 1.2 });
  }, [lat, lng, map]);
  return null;
};

interface FleetPageProps {
  onNavigate: (tab: string, targetId?: string) => void;
}

export const FleetPage: React.FC<FleetPageProps> = ({ onNavigate }) => {
  const { vehicles, selectedVehicleId, setSelectedVehicleId, integrations, role, employees, addVehicle, removeVehicle } = useApp();
  const [liveVehicles, setLiveVehicles] = useState(vehicles);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal State for Adding Vehicle & GPS Hardware Tracker
  const [showAddModal, setShowAddModal] = useState(false);
  const [regNo, setRegNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [gpsImei, setGpsImei] = useState('');
  const [simNo, setSimNo] = useState('+91 96008 70814');
  const [hasCam, setHasCam] = useState(true);

  const canAddVehicle = role === 'OWNER' || role === 'STOREROOM_STAFF' || role === 'MANAGER';
  const driverEmployees = employees.filter(e => e.role === 'Driver');

  // Poll Express Backend GPS Telemetry API every 4 seconds
  useEffect(() => {
    const fetchGpsData = async () => {
      try {
        setIsSyncing(true);
        const res = await fetch('http://localhost:5000/api/gps/vehicles');
        if (res.ok) {
          const data = await res.json();
          if (data.vehicles && data.vehicles.length > 0) {
            setLiveVehicles(data.vehicles);
          }
        }
      } catch (err) {
        // Fallback to client vehicles if backend offline
        setLiveVehicles(vehicles);
      } finally {
        setIsSyncing(false);
      }
    };

    fetchGpsData();
    const interval = setInterval(fetchGpsData, 4000);
    return () => clearInterval(interval);
  }, [vehicles]);

  const selectedVehicle = liveVehicles.find(v => v.id === selectedVehicleId) || liveVehicles[0];

  const handleAddVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNo.trim()) {
      alert('Please enter a vehicle registration number (e.g. TN 38 BZ 9102)');
      return;
    }

    const assignedDriver = driverName || (driverEmployees[0]?.name || 'Field Driver');

    await addVehicle({
      registrationNumber: regNo.trim().toUpperCase(),
      driverName: assignedDriver,
      gpsDeviceId: gpsImei.trim() || `GPS-EH21-${Math.floor(100000 + Math.random() * 900000)}`,
      simCardNumber: simNo.trim() || '+91 96008 70814',
      hasCamera: hasCam,
    });

    soundAlerts.playSuccessSyncChime();
    alert(`✓ Vehicle ${regNo.toUpperCase()} & GPS Tracker Hardware registered successfully!`);

    setRegNo('');
    setGpsImei('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4 text-white gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-600/40">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-white">Live Fleet GPS Telemetry & Map</h1>
            <p className="text-xs text-slate-400">
              Real-time vehicle tracking via Fleettrack EH21 IoT SIM Integration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Add Vehicle Button for Owner & Store Staff */}
          {canAddVehicle && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> + Register Vehicle & GPS Tracker
            </button>
          )}

          {/* Integration Status Badge */}
          <div className="flex items-center gap-2">
            {isSyncing && <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
            {integrations.fleettrackConnected ? (
              <span className="badge-status badge-green flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Live GPS Stream
              </span>
            ) : (
              <span className="badge-status badge-amber flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" /> GPS Standalone Telemetry
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Map + Side Panel Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* Leaflet Map Area */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative shadow-lg h-96 lg:h-auto min-h-[350px]">
          {selectedVehicle && (
            <MapContainer
              center={[selectedVehicle.lat, selectedVehicle.lng]}
              zoom={13}
              scrollWheelZoom={true}
              style={{ width: '100%', height: '100%', minHeight: '350px' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapRecenter lat={selectedVehicle.lat} lng={selectedVehicle.lng} />

              {liveVehicles.map(v => (
                <Marker
                  key={v.id}
                  position={[v.lat, v.lng]}
                  icon={createCustomIcon(v.status)}
                  eventHandlers={{
                    click: () => setSelectedVehicleId(v.id),
                  }}
                >
                  <Popup>
                    <div className="p-1 text-xs space-y-1">
                      <p className="font-bold text-slate-900 font-mono text-sm">{v.registrationNumber}</p>
                      <p className="text-slate-700">Driver: <strong>{v.driverName}</strong></p>
                      <p className="text-slate-700 font-bold">
                        {v.speed} km/h • <span className={v.status === 'MOVING' ? 'text-emerald-600' : 'text-amber-600'}>{v.status}</span>
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}

          {/* Quick Vehicle Select Overlay Bar */}
          <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl p-2 flex items-center gap-2 max-w-[calc(100%-2rem)] overflow-x-auto shadow-xl">
            {liveVehicles.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicleId(v.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedVehicle?.id === v.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🚚 {v.registrationNumber}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Telemetry Side Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col justify-between overflow-y-auto">
          {selectedVehicle ? (
            <div className="space-y-5">
              {/* Header Info */}
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-display font-bold text-xl text-amber-400">
                    🚚 {selectedVehicle.registrationNumber}
                  </h2>
                  <span
                    className={`badge-status ${
                      selectedVehicle.status === 'MOVING'
                        ? 'badge-green'
                        : selectedVehicle.status === 'STOPPED'
                        ? 'badge-amber'
                        : 'badge-red'
                    }`}
                  >
                    ● {selectedVehicle.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Assigned Driver: <strong className="text-white">{selectedVehicle.driverName}</strong></p>
              </div>

              {/* Live Telemetry Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Gauge className="w-3.5 h-3.5 text-blue-400" /> Speed
                  </span>
                  <p className="font-mono font-bold text-lg text-white mt-1">
                    {selectedVehicle.speed} <span className="text-xs text-slate-400 font-sans">km/h</span>
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Ignition
                  </span>
                  <p className={`font-bold text-base mt-1 ${selectedVehicle.ignition ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {selectedVehicle.ignition ? 'ON ●' : 'OFF'}
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Navigation className="w-3.5 h-3.5 text-purple-400" /> Today's Distance
                  </span>
                  <p className="font-mono font-bold text-lg text-white mt-1">
                    {selectedVehicle.todayDistanceKm} <span className="text-xs text-slate-400 font-sans">km</span>
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Package className="w-3.5 h-3.5 text-emerald-400" /> Deliveries
                  </span>
                  <p className="font-mono font-bold text-lg text-emerald-400 mt-1">
                    {selectedVehicle.completedDeliveries} / {selectedVehicle.totalDeliveries}
                  </p>
                </div>
              </div>

              {/* GPS Hardware Telemetry Metadata */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>IoT GPS Tracker IMEI:</span>
                  <span className="text-amber-400 font-bold">{selectedVehicle.gpsDeviceId || `GPS-EH21-${selectedVehicle.id.slice(-4)}`}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>M2M SIM Card:</span>
                  <span className="text-slate-200">{selectedVehicle.simCardNumber || '+91 96008 70814'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Dashcam Stream:</span>
                  <span className={selectedVehicle.hasCamera ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {selectedVehicle.hasCamera ? 'ENABLED ●' : 'NOT FITTED'}
                  </span>
                </div>
              </div>

              {/* Sync Metadata */}
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> Last Updated:
                </span>
                <span className="font-mono font-semibold text-slate-200">
                  {selectedVehicle.lastUpdatedSecondsAgo} seconds ago
                </span>
              </div>

              {/* Primary Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => onNavigate('camera')}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  [ VIEW CAMERA ]
                </button>
                <button
                  onClick={() => onNavigate('deliveries')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700 cursor-pointer"
                >
                  [ VIEW DELIVERIES ]
                </button>
                {canAddVehicle && (
                  <button
                    onClick={async () => {
                      if (confirm(`Are you sure you want to remove vehicle ${selectedVehicle.registrationNumber} from fleet?`)) {
                        await removeVehicle(selectedVehicle.id);
                      }
                    }}
                    className="w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border border-rose-500/30 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Vehicle from Fleet
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p>Select a vehicle to inspect live telemetry.</p>
            </div>
          )}
        </div>
      </div>

      {/* REGISTER VEHICLE & GPS HARDWARE TRACKER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg text-white shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-amber-400">Register Vehicle & GPS Tracker</h3>
                  <p className="text-xs text-slate-400">Add fleet truck and pair Fleettrack / Teltonika IoT GPS Hardware</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-1 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVehicleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Vehicle Registration Number *</label>
                <input
                  type="text"
                  placeholder="e.g. TN 38 BZ 9102"
                  value={regNo}
                  onChange={e => setRegNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono uppercase focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assign Driver *</label>
                <select
                  value={driverName}
                  onChange={e => setDriverName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="">Select Field Driver...</option>
                  {driverEmployees.map(emp => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name} ({emp.phone})
                    </option>
                  ))}
                  <option value="Senthil Kumar">Senthil Kumar (+91 98421 88310)</option>
                  <option value="Mani Kandan">Mani Kandan (+91 97860 11245)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">GPS Tracker Device IMEI / ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 864920194820124"
                    value={gpsImei}
                    onChange={e => setGpsImei(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">IoT M2M SIM Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 96008 70814"
                    value={simNo}
                    onChange={e => setSimNo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Live Vehicle Dashcam Fitted</p>
                  <p className="text-[11px] text-slate-400">Enables live video stream on Camera tab</p>
                </div>
                <input
                  type="checkbox"
                  checked={hasCam}
                  onChange={e => setHasCam(e.target.checked)}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3 rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer mt-2"
              >
                ✓ Save Vehicle & Pair GPS Hardware
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
