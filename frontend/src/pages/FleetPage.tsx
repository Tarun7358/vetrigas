import React from 'react';
import { useApp } from '../context/AppContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
} from 'lucide-react';

const vehicleIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231E3A8A" stroke="%23F59E0B" stroke-width="2">
      <path d="M10 17h4V5H10v12zM3 17h4V9H3v8zM17 17h4v-6h-4v6z"/>
      <circle cx="5" cy="19" r="2" fill="%230F172A"/>
      <circle cx="12" cy="19" r="2" fill="%230F172A"/>
      <circle cx="19" cy="19" r="2" fill="%230F172A"/>
    </svg>
  `),
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

interface FleetPageProps {
  onNavigate: (tab: string, targetId?: string) => void;
}

export const FleetPage: React.FC<FleetPageProps> = ({ onNavigate }) => {
  const { vehicles, selectedVehicleId, setSelectedVehicleId, integrations } = useApp();

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];

  return (
    <div className="space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4 text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-600/40">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-white">Live Fleet GPS Telemetry</h1>
            <p className="text-xs text-slate-400">
              Real-time vehicle tracking via Fleettrack EH21 integration
            </p>
          </div>
        </div>

        {/* Integration Status Badge */}
        <div className="flex items-center gap-2">
          {integrations.fleettrackConnected ? (
            <span className="badge-status badge-green flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Fleettrack API Connected
            </span>
          ) : (
            <span className="badge-status badge-red flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" /> Integration Not Connected
            </span>
          )}
        </div>
      </div>

      {/* Main Map + Side Panel Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
        {/* Leaflet Map Area */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative shadow-lg">
          <MapContainer
            center={[11.0168, 76.9558]}
            zoom={13}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {vehicles.map(v => (
              <Marker
                key={v.id}
                position={[v.lat, v.lng]}
                icon={vehicleIcon}
                eventHandlers={{
                  click: () => setSelectedVehicleId(v.id),
                }}
              >
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold text-blue-900">{v.registrationNumber}</p>
                    <p className="text-slate-700">Driver: {v.driverName}</p>
                    <p className="text-slate-700 font-semibold">{v.speed} km/h • {v.status}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Quick Vehicle Select Overlay Bar */}
          <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg p-2 flex items-center gap-2 max-w-full overflow-x-auto">
            {vehicles.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicleId(v.id)}
                className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedVehicle?.id === v.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
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
