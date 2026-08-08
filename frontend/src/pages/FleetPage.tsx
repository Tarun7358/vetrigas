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
} from 'lucide-react';

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
  const { vehicles, selectedVehicleId, setSelectedVehicleId, integrations } = useApp();
  const [liveVehicles, setLiveVehicles] = useState(vehicles);
  const [isSyncing, setIsSyncing] = useState(false);

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
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-amber-500/20"
                >
                  [ VIEW CAMERA ]
                </button>
                <button
                  onClick={() => onNavigate('deliveries')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700"
                >
                  [ VIEW DELIVERIES ]
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p>Select a vehicle to inspect live telemetry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
