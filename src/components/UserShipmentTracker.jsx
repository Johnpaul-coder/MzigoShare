import React from 'react';
import { Package, Truck, Tag, Camera, ShieldCheck } from 'lucide-react';

const STEPS = ['Listed & Paid', 'Tagged & Picked Up', 'In Transit', 'Delivered'];

export default function UserShipmentTracker({ pools, userProfile }) {
  const allShipments = pools.flatMap((pool) =>
    (pool.bookings || []).map((b) => ({
      ...b,
      corridor: pool.corridor,
      destination: pool.destination,
      driverName: pool.driverName || 'Assigned Driver',
      vehiclePlate: pool.vehiclePlate || 'Fleet Truck',
    }))
  );

  const userShipments = allShipments.filter(
    (s) =>
      s.uid === userProfile?.uid ||
      s.farmerName?.toLowerCase() === userProfile?.fullName?.toLowerCase()
  );

  const displayed = userShipments.length > 0 ? userShipments : allShipments;

  if (displayed.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-600" />
          My Listed Products & Live Delivery Progress
        </h2>
        <p className="text-xs text-slate-500">
          Real-time status, cargo tag, amount paid, and driver drop-off photo verification.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {displayed.map((item) => {
          const activeStepIdx = Math.max(
            STEPS.indexOf(item.deliveryStatus || 'Listed & Paid'),
            0
          );

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-lg">
                    <Tag className="w-3 h-3" /> {item.goodsTag || 'MZG-TAG'}
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900 mt-1">
                    {item.productName} ({item.weightKg} kg)
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
                    className={`py-1.5 px-1 rounded-lg ${
                      idx <= activeStepIdx
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-400'
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  {item.driverName} ({item.vehiclePlate})
                </span>
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {item.escrowStatus}
                </span>
              </div>

              {item.deliveryStatus === 'Delivered' && item.dropoffPhotoUrl && (
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <Camera className="w-3.5 h-3.5" />
                    Drop-Off Photo Confirmed at {item.destination}
                  </div>
                  <img
                    src={item.dropoffPhotoUrl}
                    alt="Delivered cargo"
                    className="w-full h-36 object-cover rounded-xl border border-slate-200"
                  />
                  {item.dropoffNotes && (
                    <p className="text-[11px] text-slate-500">{item.dropoffNotes}</p>
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