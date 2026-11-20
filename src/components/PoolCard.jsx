import React from 'react';
import { Truck, Users, Clock, MapPin, CheckCircle2 } from 'lucide-react';

export default function PoolCard({ pool, isSelected, onSelect }) {
  const fillPercent = Math.min(Math.round((pool.currentWeightKg / pool.maxCapacityKg) * 100), 100);
  const remainingKg = Math.max(pool.maxCapacityKg - pool.currentWeightKg, 0);
  const currentSplitCost = Math.round(
    (pool.baseTruckCost / Math.max(pool.currentWeightKg, 200)) * 200
  );

  return (
    <div
      onClick={() => onSelect(pool.id)}
      className={`cursor-pointer rounded-xl border-2 p-5 transition-all bg-white shadow-sm ${
        isSelected
          ? 'border-green-600 ring-2 ring-green-600/20'
          : 'border-slate-200 hover:border-green-400'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-700">
            <MapPin className="w-3.5 h-3.5" />
            {pool.corridor}
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">{pool.produceType}</h3>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            fillPercent >= 100
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {fillPercent >= 100 ? 'Truck Full & Ready' : `${remainingKg} kg left`}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
          <span>
            Loaded: <strong className="text-slate-900">{pool.currentWeightKg} kg</strong> / {pool.maxCapacityKg} kg
          </span>
          <span className="font-bold text-green-700">{fillPercent}% Full</span>
        </div>
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-green-600 to-emerald-500 transition-all duration-500"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
        <div>
          <span className="text-slate-500 block">Solo Truck</span>
          <span className="font-semibold text-slate-400 line-through">
            KSh {pool.baseTruckCost.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Est. 200kg Share</span>
          <span className="font-bold text-green-700 text-sm">
            KSh {currentSplitCost.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Farmers Pooled</span>
          <span className="font-semibold text-slate-800 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            {pool.bookings.length} farmers
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Truck className="w-3.5 h-3.5" /> {pool.vehicleType}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> {pool.departureWindow}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {pool.bookings.map((b) => (
          <span
            key={b.id}
            className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
          >
            <CheckCircle2 className="w-3 h-3 text-green-600" />
            {b.farmerName} ({b.weightKg}kg • {b.channel})
          </span>
        ))}
      </div>
    </div>
  );
}
