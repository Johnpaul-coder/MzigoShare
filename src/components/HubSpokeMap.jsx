import React from 'react';
import { GitMerge, ArrowRight, Warehouse, Factory, Sprout } from 'lucide-react';

export default function HubSpokeMap({ pools }) {
  const allBookings = pools.flatMap((pool) =>
    (pool.bookings || []).map((b) => ({
      ...b,
      originHub: pool.origin,
      corridor: pool.corridor,
    }))
  );

  const uniqueOrigins = [...new Set(pools.map((p) => p.origin))];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <GitMerge className="w-5 h-5 text-green-600" />
        <h2 className="text-lg font-bold text-slate-900">Hub-and-Spoke Consolidation Engine</h2>
      </div>
      <p className="text-sm text-slate-600 mb-6">
        Live visualization of smallholder feeder pickups consolidating at regional hubs before
        transferring onto full-capacity long-haul trucks to agro-processors.
      </p>

      {pools.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
          No active corridors in Firestore yet. Launch a truck pool from the Farmer tab to view live
          hub-and-spoke routing.
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 items-center bg-slate-50 p-5 rounded-xl border border-slate-200">
          {/* 1. First-Mile Spokes */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. First-Mile Spokes ({allBookings.length} Active Pickups)
            </div>
            {allBookings.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-400">
                Waiting for farmer bookings...
              </div>
            ) : (
              allBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between text-xs font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-green-600 shrink-0" />
                    <span>
                      {b.village} — {b.farmerName} ({b.weightKg} kg)
                    </span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              ))
            )}
          </div>

          {/* 2. Central Consolidation Hub(s) */}
          <div className="bg-green-900 text-white rounded-xl p-5 text-center shadow-md border-2 border-green-600">
            <Warehouse className="w-10 h-10 mx-auto text-emerald-300 mb-2" />
            <div className="text-xs uppercase tracking-wider text-emerald-300 font-semibold">
              2. Regional Sorting & Grading Hub
            </div>
            <h3 className="text-lg font-bold mt-1">
              {uniqueOrigins.join(' / ')}
            </h3>
            <p className="text-xs text-green-100 mt-2">
              Quality grading, crate weighing, and destination cross-docking into full truckloads.
            </p>
          </div>

          {/* 3. Long-Haul Destination Corridors */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              3. Full-Load Processor Corridors ({pools.length})
            </div>
            {pools.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <Factory className="w-4 h-4 text-amber-600" />
                    {p.destination}
                  </span>
                  <span className="text-green-700">
                    {Math.round((p.currentWeightKg / p.maxCapacityKg) * 100)}% Full
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Corridor: {p.corridor} ({p.currentWeightKg}/{p.maxCapacityKg} kg)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}