import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation } from 'lucide-react';

const KENYA_HUBS = {
  'machakos hub (town center)': [-1.5177, 37.2634],
  'machakos': [-1.5177, 37.2634],
  'masii market': [-1.4646, 37.4426],
  'masii': [-1.4646, 37.4426],
  'kangundo': [-1.2981, 37.3481],
  'tala': [-1.2697, 37.3208],
  'makueni / wote': [-1.7808, 37.6288],
  'wote': [-1.7808, 37.6288],
  'kibwezi': [-2.4167, 37.9667],
  'mlolongo': [-1.3917, 36.9428],
  'nairobi industrial area': [-1.3032, 36.8588],
  'nairobi': [-1.2921, 36.8219],
  'thika': [-1.0332, 37.0693],
  'meru': [0.0463, 37.6559],
  'kisumu': [-0.0917, 34.768],
  'eldoret': [0.5143, 35.2698],
};

function resolveCoords(placeName, fallbackOffset = 0) {
  if (!placeName) return [-1.45 + fallbackOffset, 37.15 + fallbackOffset];
  const key = placeName.trim().toLowerCase();
  if (KENYA_HUBS[key]) return KENYA_HUBS[key];
  const match = Object.keys(KENYA_HUBS).find((k) => key.includes(k) || k.includes(key));
  if (match) return KENYA_HUBS[match];
  return [-1.42 + fallbackOffset * 0.05, 37.12 + fallbackOffset * 0.05];
}

export default function HubSpokeMap({ pools = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-1.39, 37.06],
      zoom: 9,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    const bounds = [];

    pools.forEach((pool, idx) => {
      const originCoords = resolveCoords(pool.origin, idx);
      const destCoords = resolveCoords(pool.destination, idx + 1);
      bounds.push(originCoords, destCoords);

      // Origin Hub Pin
      L.circleMarker(originCoords, {
        radius: 8,
        fillColor: '#059669',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.95,
      })
        .bindPopup(`<strong>Origin Hub:</strong> ${pool.origin}`)
        .addTo(group);

      // Destination Processor Pin
      L.circleMarker(destCoords, {
        radius: 9,
        fillColor: '#0284c7',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.95,
      })
        .bindPopup(`<strong>Destination Gate:</strong> ${pool.destination}`)
        .addTo(group);

      // Highway Corridor Line
      L.polyline([originCoords, destCoords], {
        color: '#10b981',
        weight: 4,
        dashArray: '8, 6',
      }).addTo(group);

      // Farmer Pickup Spokes
      (pool.bookings || []).forEach((b, bIdx) => {
        const pickupCoords = resolveCoords(b.village, (bIdx + 1) * 0.4);
        bounds.push(pickupCoords);
        L.circleMarker(pickupCoords, {
          radius: 6,
          fillColor: '#f59e0b',
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.9,
        })
          .bindPopup(
            `<strong>Tag ${b.goodsTag}</strong><br/>${b.farmerName} (${b.weightKg} kg)<br/>Pickup: ${b.village}`
          )
          .addTo(group);
      });

      // Live Moving Truck GPS Marker
      if (pool.liveLocation?.lat && pool.liveLocation?.lng) {
        const truckCoords = [pool.liveLocation.lat, pool.liveLocation.lng];
        bounds.push(truckCoords);

        const truckIcon = L.divIcon({
          className: 'mzigoshare-live-truck',
          html: `<div style="background:#0f172a;color:#34d399;border:2px solid #34d399;padding:4px 8px;border-radius:999px;font-weight:800;font-size:11px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.35);">🚛 ${
            pool.vehiclePlate || 'LIVE'
          }</div>`,
          iconSize: [96, 28],
          iconAnchor: [48, 14],
        });

        L.marker(truckCoords, { icon: truckIcon })
          .bindPopup(
            `<strong>Live Truck: ${pool.vehiclePlate}</strong><br/>Driver: ${pool.driverName}<br/>Speed: ${
              pool.liveLocation.speedKmh || 0
            } km/h`
          )
          .addTo(group);
      }
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [pools]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-emerald-600" />
          <h3 className="font-extrabold text-sm text-slate-900">
            Live Hub-and-Spoke Corridor & GPS Fleet Map
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Origin
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pickup Spoke
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600" /> Destination
          </span>
          <span className="flex items-center gap-1">🚛 Live Truck</span>
        </div>
      </div>
      <div ref={mapContainerRef} className="w-full h-80 z-10" />
    </div>
  );
}