import React from 'react';
import { Truck, Clock, MapPin, CheckCircle2, Route, ShieldCheck } from 'lucide-react';

function maskFarmerName(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0] || 'Verified Shipper';
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

export default function PoolCard({ pool, isSelected, onSelect }) {
  const currentWeight = Number(pool.currentWeightKg) || 0;
  const maxCapacity = Math.max(Number(pool.maxCapacityKg) || 1, 1);
  const baseCost = Number(pool.baseTruckCost) || 0;

  const fillPercent = Math.min(Math.round((currentWeight / maxCapacity) * 100), 100);
  const fullPoolCostPerKg = (baseCost / maxCapacity).toFixed(2);
  const currentCostPerKg =
    currentWeight > 0 ? (baseCost / currentWeight).toFixed(2) : fullPoolCostPerKg;

  const remainingKg = Math.max(maxCapacity - currentWeight, 0);

  return (
    <div
      onClick={() => onSelect(pool.id)}
      className={`cursor-pointer rounded-2xl border-2 p-5 transition-all bg-white shadow-sm ${
        isSelected
          ? 'border-emerald-600 ring-4 ring-emerald-600/10'
          : 'border-slate-200 hover:border-emerald-400'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              <Truck className="w-3.5 h-3.5" />
              {pool.vehicleType}
            </span>
            {pool.distanceKm > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                <Route className="w-3 h-3 text-emerald-600" />
                {pool.distanceKm} km
              </span>
            )}
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {pool.departureWindow}
            </span>
          </div>

          <h3 className="text-lg font-extrabold text-slate-900 mt-2">{pool.corridor}</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Commodity: <strong className="text-slate-800">{pool.produceType}</strong> • Gate Offer:{' '}
            <strong className="text-emerald-700">KSh {pool.processorPricePerKg}/kg</strong>
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-500">
            {currentWeight > 0 ? 'Current Pooled Rate' : 'Full-Pool Rate'}
          </div>
          <div className="text-xl font-extrabold text-emerald-700">KSh {currentCostPerKg}/kg</div>
          <div className="text-[11px] text-slate-400">
            {currentWeight > 0
              ? `Drops to KSh ${fullPoolCostPerKg}/kg at 100%`
              : `${remainingKg.toLocaleString()} kg space open`}
          </div>
        </div>
      </div>

      {/* Capacity Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs font-bold mb-1.5">
          <span className="text-slate-700">
            Capacity: {currentWeight.toLocaleString()} / {maxCapacity.toLocaleString()} kg
          </span>
          <span className={fillPercent >= 80 ? 'text-emerald-700' : 'text-amber-600'}>
            {fillPercent}% Filled ({remainingKg.toLocaleString()} kg left)
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-full transition-all duration-500"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>

      {/* Privacy-Safe Co-Shipper Slots */}
      {pool.bookings && pool.bookings.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified Co-Shipper Slots ({pool.bookings.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {pool.bookings.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1.5 text-[11px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <strong>{maskFarmerName(b.farmerName)}</strong> ({b.weightKg} kg •{' '}
                <MapPin className="w-3 h-3 inline text-slate-400" /> {b.village})
                {b.mpesaReceipt && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                    Escrow Paid
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}