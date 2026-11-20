import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Tag,
  Camera,
  CheckCircle2,
  Navigation,
  MapPin,
  PackageCheck,
  Radio,
  Truck,
  Phone,
  ShieldCheck,
  AlertCircle,
  Clock,
} from 'lucide-react';
import HubSpokeMap from './HubSpokeMap';
import {
  updateBookingDelivery,
  updatePoolLiveLocation,
  updatePoolTripStatus,
} from '../services/poolService';

const TRIP_STAGES = [
  'Awaiting Cargo',
  'Filling Pool',
  'Loading Pickups',
  'In Transit',
  'Delivered',
];

export default function DriverPortal({ pools = [], userProfile }) {
  // Filter strictly to routes assigned to this vetted driver
  const assignedPools = useMemo(() => {
    if (!userProfile) return [];
    const userEmail = (userProfile.email || '').toLowerCase();
    const userPlate = (userProfile.assignedTruckPlate || '').toUpperCase();

    return pools.filter((p) => {
      if (p.driverAuthUid && p.driverAuthUid === userProfile.uid) return true;
      if (p.driverId && p.driverId === userProfile.uid) return true;
      if (userEmail && (p.driverEmail || '').toLowerCase() === userEmail) return true;
      if (userPlate && (p.vehiclePlate || '').toUpperCase() === userPlate) return true;
      return false;
    });
  }, [pools, userProfile]);

  const [selectedPoolId, setSelectedPoolId] = useState(null);
  const [tagInputs, setTagInputs] = useState({});
  const [dropoffNotes, setDropoffNotes] = useState({});
  const [busyBookingId, setBusyBookingId] = useState(null);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [actionBanner, setActionBanner] = useState({ type: '', text: '' });
  const watchIdRef = useRef(null);

  // Automatically sync selectedPoolId when assignedPools loads or updates
  useEffect(() => {
    if (assignedPools.length === 0) {
      setSelectedPoolId(null);
      return;
    }
    const stillExists = assignedPools.some((p) => p.id === selectedPoolId);
    if (!stillExists) {
      setSelectedPoolId(assignedPools[0].id);
    }
  }, [assignedPools, selectedPoolId]);

  const activePool =
    assignedPools.find((p) => p.id === selectedPoolId) || assignedPools[0] || null;

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const showFeedback = (type, text) => {
    setActionBanner({ type, text });
    setTimeout(() => {
      setActionBanner((prev) => (prev.text === text ? { type: '', text: '' } : prev));
    }, 5000);
  };

  const toggleLiveGps = () => {
    if (!activePool) return;

    if (isBroadcasting) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      setIsBroadcasting(false);
      setGpsStatus('GPS broadcast paused.');
      return;
    }

    if (!('geolocation' in navigator)) {
      setGpsStatus('GPS is not supported on this device/browser.');
      return;
    }

    setIsBroadcasting(true);
    setGpsStatus('Acquiring device GPS signal...');

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed } = pos.coords;
        try {
          await updatePoolLiveLocation(activePool.id, {
            lat: latitude,
            lng: longitude,
            speedKmh: speed ? Math.round(speed * 3.6) : 0,
          });
          setGpsStatus(`Live GPS active (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        } catch (err) {
          setGpsStatus(`GPS sync error: ${err.message}`);
        }
      },
      (err) => {
        setIsBroadcasting(false);
        setGpsStatus(
          err.code === 1
            ? 'Location permission denied. Allow GPS access in your browser.'
            : 'Unable to acquire GPS fix. Move outdoors and try again.'
        );
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  };

  const handleStageChange = async (newStage) => {
    if (!activePool || updatingStage) return;
    setUpdatingStage(true);
    try {
      await updatePoolTripStatus(activePool.id, newStage);
      showFeedback('success', `Trip status updated to "${newStage}".`);
    } catch (err) {
      showFeedback('error', `Failed to update trip stage: ${err.message}`);
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleBookingStatusUpdate = async (poolId, bookingId, payload, successText) => {
    setBusyBookingId(bookingId);
    try {
      await updateBookingDelivery(poolId, bookingId, payload);
      showFeedback('success', successText);
    } catch (err) {
      showFeedback('error', `Action failed: ${err.message}`);
    } finally {
      setBusyBookingId(null);
    }
  };

  const handlePhotoUpload = (poolId, bookingId, file) => {
    if (!file) return;
    setBusyBookingId(bookingId);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const maxWidth = 640;
          const scale = Math.min(maxWidth / img.width, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.72);

          await updateBookingDelivery(poolId, bookingId, {
            deliveryStatus: 'Delivered',
            escrowStatus: 'Delivered — Escrow Verified',
            dropoffPhotoUrl: compressedDataUrl,
            dropoffNotes:
              dropoffNotes[bookingId] || `Dropped off safely at ${activePool?.destination}`,
            deliveredAt: new Date().toISOString(),
          });
          showFeedback('success', 'Drop-off photo uploaded & escrow verified!');
        } catch (err) {
          showFeedback('error', `Photo upload failed: ${err.message}`);
        } finally {
          setBusyBookingId(null);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const bookings = activePool?.bookings || [];
  const deliveredCount = bookings.filter((b) => b.deliveryStatus === 'Delivered').length;
  const activeStageIdx = TRIP_STAGES.indexOf(activePool?.tripStatus || 'Awaiting Cargo');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">
              Vetted Driver Custody Portal
            </span>
            {userProfile?.licenseNo && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-emerald-200">
                NTSA: {userProfile.licenseNo}
              </span>
            )}
            {(activePool?.vehiclePlate || userProfile?.assignedTruckPlate) && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Truck: {activePool?.vehiclePlate || userProfile?.assignedTruckPlate}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-extrabold mt-1">
            Welcome, {userProfile?.fullName || 'Fleet Driver'}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Broadcast live truck GPS, update trip stages, tag picked-up crates, and capture drop-off proof.
          </p>
          {gpsStatus && (
            <p className="text-[11px] font-mono text-emerald-300 mt-1.5">{gpsStatus}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activePool && (
            <button
              type="button"
              onClick={toggleLiveGps}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition ${
                isBroadcasting
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
              }`}
            >
              <Radio className={`w-4 h-4 ${isBroadcasting ? 'animate-ping' : ''}`} />
              {isBroadcasting ? 'Stop Live GPS' : 'Broadcast Live GPS'}
            </button>
          )}

          {assignedPools.length > 0 && (
            <select
              value={activePool?.id || ''}
              onChange={(e) => setSelectedPoolId(e.target.value)}
              className="rounded-xl bg-white text-slate-900 px-4 py-2.5 text-xs font-extrabold"
            >
              {assignedPools.map((p) => (
                <option key={p.id} value={p.id}>
                  Route: {p.corridor} ({p.vehiclePlate || 'Assigned'})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Live Action Feedback Banner */}
      {actionBanner.text && (
        <div
          className={`rounded-xl px-4 py-3 text-xs font-bold flex items-center gap-2 border ${
            actionBanner.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {actionBanner.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{actionBanner.text}</span>
        </div>
      )}

      {/* Empty State if Admin hasn't assigned a route yet */}
      {!activePool ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2 shadow-sm">
          <Clock className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-base font-extrabold text-slate-900">
            Awaiting Route & Cargo Assignment
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your vetted driver account ({userProfile?.email}) is active. Once Admin Dispatch assigns you to a corridor truck pool, your route map, trip controls, and cargo manifest will appear here automatically.
          </p>
        </div>
      ) : (
        <>
          {/* Route Custody & Trip Stage Control Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Active Assigned Corridor
                </div>
                <h2 className="text-lg font-extrabold text-slate-900">{activePool.corridor}</h2>
                <p className="text-xs text-slate-500">
                  Truck: <strong>{activePool.vehiclePlate}</strong> ({activePool.vehicleType}) •
                  Distance: <strong>{activePool.distanceKm} km</strong> • Load:{' '}
                  <strong>
                    {activePool.currentWeightKg || 0}/{activePool.maxCapacityKg} kg
                  </strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-600 mr-1">Set Trip Stage:</span>
                {['Loading Pickups', 'In Transit', 'Delivered'].map((stage) => {
                  const isCurrent = activePool.tripStatus === stage;
                  return (
                    <button
                      key={stage}
                      type="button"
                      disabled={updatingStage || isCurrent}
                      onClick={() => handleStageChange(stage)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                        isCurrent
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      {stage}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5-Stage Progress Bar */}
            <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-bold">
              {TRIP_STAGES.map((stage, idx) => {
                const isDone = idx <= activeStageIdx;
                return (
                  <div
                    key={stage}
                    className={`py-2 px-1 rounded-lg border ${
                      isDone
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    {stage}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Corridor Map */}
          <HubSpokeMap pools={[activePool]} />

          {/* Cargo Manifest & Drop-off Proof Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-emerald-600" />
                  Cargo Manifest & Drop-Off Confirmation ({deliveredCount}/{bookings.length}{' '}
                  Delivered)
                </h2>
                <p className="text-xs text-slate-500">
                  Destination Gate: <strong>{activePool.destination}</strong> • Plate:{' '}
                  <strong>{activePool.vehiclePlate}</strong>
                </p>
              </div>
            </div>

            {bookings.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No shipper cargo slots booked on this route yet. New bookings appear here in real time.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {bookings.map((b) => {
                  const currentTag = tagInputs[b.id] ?? b.goodsTag ?? 'MZG-TAG';
                  const isDelivered = b.deliveryStatus === 'Delivered';
                  const isBusy = busyBookingId === b.id;

                  return (
                    <div
                      key={b.id}
                      className={`rounded-2xl border-2 p-4 space-y-3 ${
                        isDelivered
                          ? 'border-emerald-300 bg-emerald-50/40'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 font-mono text-xs font-extrabold bg-slate-900 text-emerald-300 px-2.5 py-1 rounded-lg">
                              <Tag className="w-3.5 h-3.5" />
                              {b.goodsTag}
                            </span>
                            {b.phone && (
                              <a
                                href={`tel:${b.phone}`}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-lg hover:bg-sky-100"
                              >
                                <Phone className="w-3 h-3" /> {b.phone}
                              </a>
                            )}
                          </div>
                          <h3 className="font-extrabold text-sm text-slate-900 mt-1.5">
                            {b.farmerName} • {b.weightKg} kg {b.productName}
                          </h3>
                          <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-sky-600" />
                            Pickup: <strong>{b.village}</strong> ➔ Drop:{' '}
                            <strong>{activePool.destination}</strong>
                          </p>
                        </div>

                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-800">
                          {b.deliveryStatus || 'Listed & Paid'}
                        </span>
                      </div>

                      {!isDelivered && (
                        <div className="space-y-2.5 pt-2 border-t border-slate-200">
                          <div className="flex flex-wrap gap-2">
                            <input
                              type="text"
                              value={currentTag}
                              onChange={(e) =>
                                setTagInputs({ ...tagInputs, [b.id]: e.target.value.toUpperCase() })
                              }
                              placeholder="Goods Tag ID"
                              className="flex-1 min-w-[110px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono font-bold"
                            />
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleBookingStatusUpdate(
                                  activePool.id,
                                  b.id,
                                  {
                                    goodsTag: currentTag,
                                    deliveryStatus: 'Tagged & Picked Up',
                                  },
                                  `Crate ${currentTag} marked as Tagged & Picked Up.`
                                )
                              }
                              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold"
                            >
                              {isBusy ? 'Saving...' : 'Tag & Pick Up'}
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleBookingStatusUpdate(
                                  activePool.id,
                                  b.id,
                                  {
                                    goodsTag: currentTag,
                                    deliveryStatus: 'In Transit',
                                  },
                                  `Crate ${currentTag} marked as In Transit.`
                                )
                              }
                              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1"
                            >
                              <Navigation className="w-3 h-3" /> Start Transit
                            </button>
                          </div>

                          <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                            <div className="text-[11px] font-bold text-slate-700">
                              Complete Drop-Off at {activePool.destination} (Photo Required)
                            </div>
                            <input
                              type="text"
                              placeholder="Drop-off note (e.g., Left at Gate B weighbridge)"
                              value={dropoffNotes[b.id] || ''}
                              onChange={(e) =>
                                setDropoffNotes({ ...dropoffNotes, [b.id]: e.target.value })
                              }
                              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                            />
                            <label className="w-full cursor-pointer py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition">
                              <Camera className="w-4 h-4" />
                              {isBusy
                                ? 'Uploading Proof Photo...'
                                : 'Snap / Upload Drop-Off Photo & Complete'}
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                disabled={isBusy}
                                className="hidden"
                                onChange={(e) =>
                                  handlePhotoUpload(activePool.id, b.id, e.target.files?.[0])
                                }
                              />
                            </label>
                          </div>
                        </div>
                      )}

                      {isDelivered && (
                        <div className="pt-2 border-t border-emerald-200 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                            <ShieldCheck className="w-4 h-4" />
                            Delivered & Escrow Verified
                          </div>
                          {b.dropoffPhotoUrl && (
                            <img
                              src={b.dropoffPhotoUrl}
                              alt="Drop-off confirmation"
                              className="w-full h-36 object-cover rounded-xl border border-emerald-200"
                            />
                          )}
                          {b.dropoffNotes && (
                            <p className="text-[11px] text-slate-600">{b.dropoffNotes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}