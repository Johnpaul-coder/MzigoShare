import React, { useState } from 'react';
import {
  Tag,
  Camera,
  CheckCircle2,
  Navigation,
  MapPin,
  PackageCheck,
} from 'lucide-react';
import HubSpokeMap from './HubSpokeMap';
import { updateBookingDelivery } from '../services/poolService';

export default function DriverPortal({ pools, userProfile }) {
  const [selectedPoolId, setSelectedPoolId] = useState(pools[0]?.id || null);
  const [tagInputs, setTagInputs] = useState({});
  const [dropoffNotes, setDropoffNotes] = useState({});
  const [uploadingId, setUploadingId] = useState(null);

  const activePool = pools.find((p) => p.id === selectedPoolId) || pools[0] || null;

  const handlePhotoUpload = (poolId, bookingId, file) => {
    if (!file) return;
    setUploadingId(bookingId);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
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
          escrowStatus: 'Released to Farmer',
          dropoffPhotoUrl: compressedDataUrl,
          dropoffNotes:
            dropoffNotes[bookingId] || `Dropped off safely at ${activePool?.destination}`,
          deliveredAt: new Date().toISOString(),
        });
        setUploadingId(null);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">
            Driver Navigation & Cargo Manifest
          </span>
          <h1 className="text-2xl font-extrabold mt-0.5">
            Welcome, {userProfile?.fullName || 'Fleet Driver'}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Follow your assigned route map, tag picked-up crates, and capture a drop-off photo at destination.
          </p>
        </div>

        {pools.length > 0 && (
          <select
            value={activePool?.id || ''}
            onChange={(e) => setSelectedPoolId(e.target.value)}
            className="rounded-xl bg-white text-slate-900 px-4 py-2.5 text-xs font-extrabold"
          >
            {pools.map((p) => (
              <option key={p.id} value={p.id}>
                Route: {p.corridor} ({p.vehiclePlate || 'Assigned'})
              </option>
            ))}
          </select>
        )}
      </div>

      <HubSpokeMap pools={activePool ? [activePool] : []} />

      {activePool && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-600" />
                Cargo Tags & Drop-Off Photo Confirmation ({(activePool.bookings || []).length})
              </h2>
              <p className="text-xs text-slate-500">
                Destination Gate: <strong>{activePool.destination}</strong> • Plate:{' '}
                <strong>{activePool.vehiclePlate}</strong>
              </p>
            </div>
          </div>

          {(activePool.bookings || []).length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No farmer cargo slots booked on this route yet.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {activePool.bookings.map((b) => {
                const currentTag = tagInputs[b.id] ?? b.goodsTag ?? 'MZG-TAG';
                const isDelivered = b.deliveryStatus === 'Delivered';

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
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-extrabold bg-slate-900 text-emerald-300 px-2.5 py-1 rounded-lg">
                          <Tag className="w-3.5 h-3.5" />
                          {b.goodsTag}
                        </span>
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
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={currentTag}
                            onChange={(e) =>
                              setTagInputs({ ...tagInputs, [b.id]: e.target.value.toUpperCase() })
                            }
                            placeholder="Goods Tag ID"
                            className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono font-bold"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateBookingDelivery(activePool.id, b.id, {
                                goodsTag: currentTag,
                                deliveryStatus: 'Tagged & Picked Up',
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold"
                          >
                            Tag & Pick Up
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateBookingDelivery(activePool.id, b.id, {
                                goodsTag: currentTag,
                                deliveryStatus: 'In Transit',
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center gap-1"
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
                            {uploadingId === b.id
                              ? 'Uploading Proof Photo...'
                              : 'Snap / Upload Drop-Off Photo & Complete'}
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) =>
                                handlePhotoUpload(activePool.id, b.id, e.target.files?.[0])
                              }
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {isDelivered && b.dropoffPhotoUrl && (
                      <div className="pt-2 border-t border-emerald-200 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="w-4 h-4" />
                          Delivered & Escrow Released
                        </div>
                        <img
                          src={b.dropoffPhotoUrl}
                          alt="Drop-off confirmation"
                          className="w-full h-36 object-cover rounded-xl border border-emerald-200"
                        />
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
      )}
    </div>
  );
}