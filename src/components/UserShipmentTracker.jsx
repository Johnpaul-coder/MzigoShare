import React from 'react';
import { Package, Truck, Tag, Camera, ShieldCheck, PhoneCall, Navigation, CheckCircle2 } from 'lucide-react';

const STEPS = ['Listed & Paid', 'Tagged & Picked Up', 'In Transit', 'Delivered'];

function resolveEffectiveStep(bookingStatus, poolTripStatus) {
  const bookingIdx = STEPS.indexOf(bookingStatus || 'Listed & Paid');
  let poolMappedIdx = 0;
  if (poolTripStatus === 'Loading Pickups') poolMappedIdx = 1;
  else if (poolTripStatus === 'In Transit') poolMappedIdx = 2;
  else if (poolTripStatus === 'Delivered') poolMappedIdx = 3;
  return Math.max(bookingIdx, poolMappedIdx, 0);
}

export default function UserShipmentTracker({ pools, userProfile }) {
  if (!userProfile?.uid) return null;

  const normalizedUserPhone = (userProfile.phone || '').replace(/\s+/g, '').slice(-9);

  const userShipments = pools.flatMap((pool) =>
    (pool.bookings || [])
      .filter((b) => {
        if (b.uid && b.uid === userProfile.uid) return true;
        if (normalizedUserPhone && b.phone) {
          const bookingPhone = b.phone.replace(/\s+/g, '').slice(-9);
          return bookingPhone === normalizedUserPhone;
        }
        return false;
      })
      .map((b) => ({
        ...b,
        corridor: pool.corridor,
        destination: pool.destination,
        driverName: pool.driverName || 'Assigned Driver',
        driverPhone: pool.driverPhone || '',
        vehiclePlate: pool.vehiclePlate || 'Fleet Truck',
        poolTripStatus: pool.tripStatus || 'Awaiting Cargo',
        liveLocation: pool.liveLocation || null,
      }))
  );

  if (userShipments.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            My Shipments & Live Delivery Progress
          </h2>
          <p className="text-xs text-slate-500">
            Real-time status from pickup to delivery, cargo tag, M-Pesa escrow, and drop-off photo verification.
          </p>
        </div>
        <span className="text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full">
          {userShipments.length} Active {userShipments.length === 1 ? 'Shipment' : 'Shipments'}
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {userShipments.map((item) => {
          const activeStepIdx = resolveEffectiveStep(item.deliveryStatus, item.poolTripStatus);
          const isDelivered = activeStepIdx === 3;

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-lg">
                      <Tag className="w-3 h-3" /> {item.goodsTag || 'MZG-TAG'}
                    </span>
                    {item.liveLocation && !isDelivered && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                        <Navigation className="w-2.5 h-2.5" /> GPS Live ({item.liveLocation.speedKmh || 0} km/h)
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 mt-1.5">
                    {item.productName || 'Agricultural Produce'} ({item.weightKg} kg)
                  </h3>
                  <p className="text-[11px] text-slate-500">{item.corridor}</p>
                </div>

                <div className="text-right">
                  <div className="text-xs font-extrabold text-slate-900">
                    Paid: KSh {Number(item.amountPaid || 0).toLocaleString()}
                  </div>
                  <div className="font-mono text-[10px] text-emerald-700">
                    {item.mpesaReceipt}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold">
                {STEPS.map((label, idx) => (
                  <div
                    key={label}
                    className={`py-1.5 px-1 rounded-lg transition ${
                      idx <= activeStepIdx
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-400'
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 pt-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 font-semibold text-slate-800">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    {item.driverName} ({item.vehiclePlate})
                  </span>
                  {item.driverPhone && (
                    <a
                      href={`tel:${item.driverPhone}`}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-100 px-2 py-0.5 rounded-md"
                    >
                      <PhoneCall className="w-2.5 h-2.5" /> Call Driver
                    </a>
                  )}
                </div>
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isDelivered ? 'Escrow Released' : item.escrowStatus}
                </span>
              </div>

              {isDelivered && (
                <div className="pt-2.5 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
                    <span className="flex items-center gap-1">
                      {item.dropoffPhotoUrl ? (
                        <Camera className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      Delivered at {item.destination}
                    </span>
                    {item.deliveredAt && (
                      <span className="text-[10px] font-normal text-slate-500">
                        {new Date(item.deliveredAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>

                  {item.dropoffPhotoUrl && (
                    <img
                      src={item.dropoffPhotoUrl}
                      alt="Delivered cargo proof"
                      className="w-full h-40 object-cover rounded-xl border border-slate-200"
                    />
                  )}

                  {item.dropoffNotes && (
                    <p className="text-[11px] text-slate-600 bg-white rounded-lg px-2.5 py-1.5 border border-slate-200">
                      <strong>Driver Note:</strong> {item.dropoffNotes}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}