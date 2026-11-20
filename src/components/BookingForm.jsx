import React, { useState } from 'react';
import { calculatePoolEconomics } from '../utils/costCalculator';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function BookingForm({ pool, onBook }) {
  const [farmerName, setFarmerName] = useState('Mutiso Musyoka');
  const [village, setVillage] = useState('Mwala');
  const [weightKg, setWeightKg] = useState(200);
  const [submitting, setSubmitting] = useState(false);

  if (!pool) return null;

  const remainingKg = Math.max(pool.maxCapacityKg - pool.currentWeightKg, 0);
  const economics = calculatePoolEconomics(pool, Number(weightKg) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (remainingKg <= 0 || weightKg <= 0) return;
    setSubmitting(true);
    await onBook(pool.id, {
      farmerName,
      village,
      weightKg: Math.min(Number(weightKg), remainingKg),
      channel: 'Web App',
    });
    setSubmitting(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="font-bold text-base text-slate-900 mb-1">
        Reserve Cargo Slot ({pool.corridor})
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Join this active pool to split transport costs and unlock direct processor pricing.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Farmer Name</label>
            <input
              type="text"
              required
              value={farmerName}
              onChange={(e) => setFarmerName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Pickup Point</label>
            <input
              type="text"
              required
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Harvest Weight (kg) — Max available: {remainingKg} kg
          </label>
          <input
            type="number"
            min="50"
            max={remainingKg || 200}
            step="50"
            required
            value={weightKg}
            onChange={(e) => setWeightKg(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
          />
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-green-800">
            <Sparkles className="w-4 h-4" />
            Farmer Value-Addition Breakdown
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Solo Charter Truck Cost:</span>
            <span className="line-through text-slate-400">
              KSh {economics.soloTruckCost.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between font-semibold text-slate-900">
            <span>Your Pooled Transport Share:</span>
            <span className="text-green-700">
              KSh {economics.sharedFarmerCost.toLocaleString()} ({economics.savingsPercent}% saved)
            </span>
          </div>
          <div className="border-t border-green-200 pt-2 flex justify-between text-slate-700">
            <span>Middleman Farmgate Payout:</span>
            <span>KSh {economics.middlemanRevenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-emerald-900 text-sm">
            <span>Net Payout at Processor Gate:</span>
            <span>
              KSh {economics.processorNet.toLocaleString()} (+KSh{' '}
              {economics.netGainOverMiddleman.toLocaleString()})
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || remainingKg <= 0}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-semibold py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition"
        >
          {remainingKg <= 0
            ? 'Truck Full (100% Capacity)'
            : submitting
            ? 'Adding to Truck...'
            : 'Confirm Slot & Pay via M-Pesa'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
