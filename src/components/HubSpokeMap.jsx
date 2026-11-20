import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Navigation,
  Clock,
  Banknote,
  Sprout,
  Warehouse,
  Factory,
  Plus,
} from 'lucide-react';
import {
  KENYA_LOCATIONS,
  findLocationCoords,
  fetchDrivingRoute,
} from '../utils/kenyaLocations';

export default function HubSpokeMap({ pools }) {
  const [selectedPoolId, setSelectedPoolId] = useState(pools[0]?.id || null);
  const [customStopName, setCustomStopName] = useState('');
  const [extraStops, setExtraStops] = useState([]);
  const [routeStats, setRouteStats] = useState({ distanceKm: 0, durationMins: 0 });

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerRef = useRef(null);

  useEffect(() => {
    if (!selectedPoolId && pools.length > 0) {
      setSelectedPoolId(pools[0].id);
    }
  }, [pools, selectedPoolId]);

  const activePool = pools.find((p) => p.id === selectedPoolId) || pools[0] || null;

  // Build ordered list of stops: Origin -> Booked Farmer Pickups -> Added Route Pickups -> Destination
  const bookedPickups = (activePool?.bookings || []).map((b) => ({
    id: b.id,
    name: b.village,
    farmerName: b.farmerName,
    weightKg: b.weightKg,
    role: 'Farmer Pickup',
    coords: findLocationCoords(b.village),
  }));

  const manualPickups = extraStops.map((stop, idx) => ({
    id: `extra-${idx}`,
    name: stop,
    farmerName: 'Scheduled Hub Pickup',
    weightKg: 0,
    role: 'Listed Pickup Stop',
    coords: findLocationCoords(stop),
  }));

  const originCoords = activePool ? findLocationCoords(activePool.origin) : null;
  const destCoords = activePool ? findLocationCoords(activePool.destination) : null;

  const allListedStops = activePool
    ? [
        {
          id: 'origin',
          name: activePool.origin,
          role: 'Origin Consolidation Hub',
          coords: originCoords,
        },
        ...bookedPickups,
        ...manualPickups,
        {
          id: 'dest',
          name: activePool.destination,
          role: 'Agro-Processor Destination',
          coords: destCoords,
        },
      ]
    : [];

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current).setView([-1.41, 37.06], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    routeLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Draw live driving route & pins whenever activePool or listed pickups change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = routeLayerRef.current;
    if (!map || !layerGroup || !activePool) return;

    layerGroup.clearLayers();

    const mappedWaypoints = allListedStops
      .filter((s) => s.coords)
      .map((s) => ({ ...s.coords, label: s.name, role: s.role, weightKg: s.weightKg }));

    if (mappedWaypoints.length < 2) return;

    let cancelled = false;

    fetchDrivingRoute(mappedWaypoints).then((route) => {
      if (cancelled || !mapInstanceRef.current) return;
      setRouteStats({ distanceKm: route.distanceKm, durationMins: route.durationMins });

      if (route.geometry.length > 1) {
        const polyline = L.polyline(route.geometry, {
          color: '#059669',
          weight: 5,
          opacity: 0.85,
        }).addTo(layerGroup);

        map.fitBounds(polyline.getBounds(), { padding: [45, 45] });
      }

      mappedWaypoints.forEach((pt, idx) => {
        const isOrigin = idx === 0;
        const isDest = idx === mappedWaypoints.length - 1;
        const color = isOrigin ? '#047857' : isDest ? '#d97706' : '#0284c7';

        const marker = L.circleMarker([pt.lat, pt.lng], {
          radius: isOrigin || isDest ? 9 : 7,
          fillColor: color,
          color: '#ffffff',
          weight: 2.5,
          opacity: 1,
          fillOpacity: 1,
        }).addTo(layerGroup);

        marker.bindPopup(
          `<div style="font-family:sans-serif;font-size:12px;">
            <strong>${pt.label}</strong><br/>
            <span style="color:#475569;">${pt.role}</span>
            ${pt.weightKg ? `<br/><span style="color:#059669;font-weight:bold;">Load: ${pt.weightKg} kg</span>` : ''}
          </div>`
        );
      });
    });

    return () => {
      cancelled = true;
    };
  }, [activePool, extraStops.length, activePool?.bookings?.length]);

  const handleAddPickupStop = (e) => {
    e.preventDefault();
    if (!customStopName.trim()) return;
    setExtraStops((prev) => [...prev, customStopName.trim()]);
    setCustomStopName('');
  };

  const effectiveKm = routeStats.distanceKm || activePool?.distanceKm || 0;
  const costPerKm =
    effectiveKm > 0 && activePool
      ? Math.round(activePool.baseTruckCost / effectiveKm)
      : 0;
  const costPerKg =
    activePool && activePool.currentWeightKg > 0
      ? (activePool.baseTruckCost / activePool.currentWeightKg).toFixed(2)
      : activePool
      ? (activePool.baseTruckCost / activePool.maxCapacityKg).toFixed(2)
      : '0.00';

  return (
    <div className="space-y-6">
      {/* Top Corridor Selector & Live Distance Pricing Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-emerald-600" />
            Live Route, Kilometres & Listed Pickups Map
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real OpenStreetMap road routing with live distance-based charter pricing and pickup stops.
          </p>
        </div>

        {pools.length > 0 && (
          <select
            value={activePool?.id || ''}
            onChange={(e) => {
              setSelectedPoolId(e.target.value);
              setExtraStops([]);
            }}
            className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:border-emerald-600"
          >
            {pools.map((p) => (
              <option key={p.id} value={p.id}>
                {p.corridor} ({p.produceType})
              </option>
            ))}
          </select>
        )}
      </div>

      {!activePool ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">
          No active pools in Firestore yet. Launch a truck pool on the Pools & Booking tab to view
          live road routing and kilometres.
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 Cols: Live Interactive OpenStreetMap + Distance Pricing Metrics */}
          <div className="lg:col-span-8 space-y-4">
            {/* 3 Live Pricing & Distance KPI Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-500">
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  Total Road Distance
                </div>
                <div className="text-xl font-extrabold text-slate-900 mt-1">
                  {effectiveKm} km
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" /> ~{routeStats.durationMins || 75} mins transit
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-500">
                  <Banknote className="w-3.5 h-3.5 text-amber-600" />
                  Charter Rate / km
                </div>
                <div className="text-xl font-extrabold text-slate-900 mt-1">
                  KSh {costPerKm}/km
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Total Charter: KSh {activePool.baseTruckCost.toLocaleString()}
                </div>
              </div>

              <div className="bg-emerald-900 text-white rounded-xl p-3.5 shadow-sm">
                <div className="text-[11px] font-bold uppercase text-emerald-300">
                  Pooled Farmer Rate
                </div>
                <div className="text-xl font-extrabold mt-1">KSh {costPerKg}/kg</div>
                <div className="text-[11px] text-emerald-200 mt-0.5">
                  {activePool.currentWeightKg}/{activePool.maxCapacityKg} kg booked
                </div>
              </div>
            </div>

            {/* Map Container */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div ref={mapContainerRef} className="w-full h-[420px] z-10" />
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-700" /> Origin Hub
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600" /> Listed Farmer Pickup
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> Processor Destination
                  </span>
                </div>
                <span>Powered by OpenStreetMap & OSRM</span>
              </div>
            </div>
          </div>

          {/* Right 4 Cols: Listed Pickup Points Along Route */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Listed Route Pickups ({allListedStops.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Ordered feeder stops along this highway corridor. Adding a stop updates live km.
              </p>
            </div>

            {/* Add Pickup Stop Form */}
            <datalist id="pickup-stops-list">
              {KENYA_LOCATIONS.filter((l) => l.type !== 'processor').map((loc) => (
                <option key={loc.name} value={loc.name} />
              ))}
            </datalist>

            <form onSubmit={handleAddPickupStop} className="flex gap-2">
              <input
                type="text"
                list="pickup-stops-list"
                placeholder="Add feeder pickup (e.g., Masii Market)"
                value={customStopName}
                onChange={(e) => setCustomStopName(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>

            {/* Ordered Timeline of Pickups */}
            <div className="space-y-2.5 pt-1 max-h-[340px] overflow-y-auto pr-1">
              {allListedStops.map((stop, index) => {
                const isFirst = index === 0;
                const isLast = index === allListedStops.length - 1;
                return (
                  <div
                    key={stop.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isFirst
                          ? 'bg-emerald-100 text-emerald-700'
                          : isLast
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {isFirst ? (
                        <Warehouse className="w-4 h-4" />
                      ) : isLast ? (
                        <Factory className="w-4 h-4" />
                      ) : (
                        <Sprout className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">{stop.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {stop.farmerName ? `${stop.farmerName} • ` : ''}
                        {stop.role}
                      </div>
                      {stop.weightKg > 0 && (
                        <span className="inline-block mt-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          +{stop.weightKg} kg reserved
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}