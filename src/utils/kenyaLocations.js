export const KENYA_LOCATIONS = [
  // Machakos & Eastern Hubs / Feeder Wards
  { name: 'Machakos Hub (Town Center)', lat: -1.5177, lng: 37.2634, type: 'hub' },
  { name: 'Masii Market', lat: -1.4667, lng: 37.4333, type: 'pickup' },
  { name: 'Mwala Center', lat: -1.3533, lng: 37.4525, type: 'pickup' },
  { name: 'Kangundo Market', lat: -1.2981, lng: 37.3472, type: 'pickup' },
  { name: 'Kathiani Junction', lat: -1.4167, lng: 37.3333, type: 'pickup' },
  { name: 'Kalama Ward', lat: -1.6167, lng: 37.2500, type: 'pickup' },
  { name: 'Wamunyu Center', lat: -1.3833, lng: 37.5500, type: 'pickup' },
  { name: 'Makueni (Wote Hub)', lat: -1.7808, lng: 37.6288, type: 'hub' },
  { name: 'Emali Highway Stop', lat: -2.0786, lng: 37.4667, type: 'pickup' },

  // Major Processor Destinations & National Corridors
  { name: 'Nairobi Industrial Area', lat: -1.3032, lng: 36.8548, type: 'processor' },
  { name: 'Wakulima Market (Nairobi)', lat: -1.2864, lng: 36.8355, type: 'processor' },
  { name: 'Thika Agro-Processors', lat: -1.0333, lng: 37.0693, type: 'processor' },
  { name: 'Limuru Fresh Packhouse', lat: -1.1136, lng: 36.6428, type: 'processor' },
  { name: 'Naivasha Horticultural Hub', lat: -0.7172, lng: 36.4310, type: 'processor' },
  { name: 'Nakuru Milling & Processors', lat: -0.3031, lng: 36.0800, type: 'processor' },
  { name: 'Eldoret Grain & Produce Gate', lat: 0.5143, lng: 35.2698, type: 'processor' },
  { name: 'Kisumu Lakeside Market', lat: -0.0917, lng: 34.7680, type: 'processor' },
  { name: 'Kisii Highland Processors', lat: -0.6817, lng: 34.7667, type: 'processor' },
  { name: 'Meru Aggregation Hub', lat: 0.0463, lng: 37.6559, type: 'hub' },
];

export function findLocationCoords(query) {
  if (!query) return null;
  const normalized = query.trim().toLowerCase();
  const exact = KENYA_LOCATIONS.find((loc) => loc.name.toLowerCase() === normalized);
  if (exact) return exact;

  const partial = KENYA_LOCATIONS.find(
    (loc) =>
      loc.name.toLowerCase().includes(normalized) ||
      normalized.includes(loc.name.split(' ')[0].toLowerCase())
  );
  return partial || null;
}

// Fetch real driving route & distance (km) from free OSRM API
export async function fetchDrivingRoute(waypoints) {
  const validPoints = waypoints.filter((pt) => pt && typeof pt.lat === 'number' && typeof pt.lng === 'number');
  if (validPoints.length < 2) {
    return { distanceKm: 0, durationMins: 0, geometry: [] };
  }

  const coordsString = validPoints.map((p) => `${p.lng},${p.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
      const durationMins = Math.round(route.duration / 60);
      // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
      const geometry = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      return { distanceKm, durationMins, geometry };
    }
  } catch {
    // Fallback to Haversine straight-line * 1.25 road factor if offline
  }

  // Fallback road estimate
  let totalKm = 0;
  for (let i = 0; i < validPoints.length - 1; i++) {
    const R = 6371;
    const dLat = ((validPoints[i + 1].lat - validPoints[i].lat) * Math.PI) / 180;
    const dLon = ((validPoints[i + 1].lng - validPoints[i].lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((validPoints[i].lat * Math.PI) / 180) *
        Math.cos((validPoints[i + 1].lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    totalKm += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.25;
  }

  const distanceKm = Math.round(totalKm * 10) / 10;
  return {
    distanceKm,
    durationMins: Math.round((distanceKm / 55) * 60),
    geometry: validPoints.map((p) => [p.lat, p.lng]),
  };
}

// Calculate fair Kenyan truck charter cost from real kilometres & capacity
export function calculateDistanceCharterCost(distanceKm, maxCapacityKg = 1000) {
  const ratePerKm = maxCapacityKg >= 3000 ? 85 : maxCapacityKg >= 2000 ? 70 : 55;
  const computed = Math.round((distanceKm * ratePerKm) / 50) * 50;
  return Math.max(computed, 1500);
}