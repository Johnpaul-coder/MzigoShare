import React, { useEffect, useState } from 'react';
import { calculatePoolEconomics } from '../utils/costCalculator';
import { ArrowRight, Sparkles, Lock } from 'lucide-react';

export default function BookingForm({ pool, userProfile, onOpenAuth, onBook }) {
  const [farmerName, setFarmerName] = useState('');
  const [village, setVillage] = useState('');
  const [phone, setPhone] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFarmerName(userProfile.fullName || '');
      setVillage(userProfile.village || '');
      setPhone(userProfile.phone || '');
    } else {
      setFarmerName('');
      setVillage('');
      setPhone('');
    }
  }, [userProfile]);

  if (!pool) return null;

  const remainingKg = Math.max(pool.maxCapacityKg - pool.currentWeightKg, 0);
  const numericWeight = Number(weightKg) || 0;
  const economics = calculatePoolEconomics(pool, numericWeight);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userProfile) {
      onOpenAuth('signin');
      return;
    }
    if (remainingKg <= 0 || numericWeight <= 0) return;
    setSubmitting(true);
    try {
      await onBook(pool.id, {
        uid: userProfile.uid,
        farmerName,
        village,
        phone,
        weightKg: Math.min(numericWeight, remainingKg),
        channel: 'Web App',
      });
      setWeightKg('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="font-bold text-base text-slate-900 mb-1">
        Reserve Cargo Slot ({pool.corridor})
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Join this active pool to split transport costs and unlock direct processor pricing.
      </p>

      {!userProfile ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center space-y-3">
          <Lock className="w-7 h-7 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-800">Sign In Required to Book Cargo</div>
          <p className="text-xs text-slate-500">
            Create a free farmer account or sign in so your M-Pesa escrow receipts and truck slots
            are saved to your profile.
          </p>
          <div className="flex justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenAuth('signin')}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-xs font-semibold text-white"
            >
              Create Account
            </button>
          </div>
        </div>
      ) : (
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">M-Pesa Phone</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Harvest Weight (Max {remainingKg} kg)
              </label>
              <input
                type="number"
                min="1"
                max={remainingKg || 1}
                required
                placeholder="kg"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-green-600"
              />
            </div>
          </div>

          {numericWeight > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3.5 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-green-800">
                <Sparkles className="w-4 h-4" />
                Farmer Value-Addition Breakdown ({numericWeight} kg)
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
          )}

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
      )}
    </div>
  );
}