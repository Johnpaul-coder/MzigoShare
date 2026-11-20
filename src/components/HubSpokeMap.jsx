import React from 'react';
import { GitMerge, ArrowRight, Warehouse, Factory, Sprout } from 'lucide-react';

export default function HubSpokeMap({ pools }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <GitMerge className="w-5 h-5 text-green-600" />
        <h2 className="text-lg font-bold text-slate-900">Hub-and-Spoke Consolidation Engine</h2>
      </div>
      <p className="text-sm text-slate-600 mb-6">
        Smallholder feeder pickups consolidate at regional hubs (Machakos) before transferring to
        full-capacity long-haul trucks to Nairobi and Kisii processors—eliminating partial empty runs.
      </p>

      <div className="grid md:grid-cols-3 gap-6 items-center bg-slate-50 p-5 rounded-xl border border-slate-200">
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            1. First-Mile Spokes (Farms)
          </div>
          {['Kalama Ward (200kg)', 'Mwala Sub-County (200kg)', 'Kathiani Farms (200kg)', 'Kangundo Cluster (900kg)'].map(
            (spoke, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between text-xs font-medium"
              >
                <span className="flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-green-600" />
                  {spoke}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            )
          )}
        </div>

        <div className="bg-green-900 text-white rounded-xl p-5 text-center shadow-md border-2 border-green-600">
          <Warehouse className="w-10 h-10 mx-auto text-emerald-300 mb-2" />
          <div className="text-xs uppercase tracking-wider text-emerald-300 font-semibold">
            2. Regional Sorting & Grading Hub
          </div>
          <h3 className="text-lg font-bold mt-1">Machakos Central Hub</h3>
          <p className="text-xs text-green-100 mt-2">
            Quality grading, crate weighing, and destination cross-docking into full truckloads.
          </p>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            3. Full-Load Processor Corridors
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
                Route: {p.hubRoute.join(' ➔ ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
