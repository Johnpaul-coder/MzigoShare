import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  TrendingUp,
  Truck,
  ShieldCheck,
  MapPin,
  User,
  Scale,
  CheckCircle2,
  Sparkles,
  Lock,
} from 'lucide-react';
import { KENYA_LOCATIONS } from '../utils/kenyaLocations';
import MpesaStkModal from './MpesaStkModal';

const QUICK_WEIGHTS = [50, 100, 250, 500];

export default function BookingForm({ pool, userProfile, onBook }) {
  const remainingKg = Math.max(pool.maxCapacityKg - pool.currentWeightKg, 0);
  const [farmerName, setFarmerName] = useState(userProfile?.fullName || '');
  const [village, setVillage] = useState(userProfile?.village || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [weightKg, setWeightKg] = useState(remainingKg > 0 ? Math.min(150, remainingKg) : 0);
  const [stkOpen, setStkOpen] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);

  useEffect(() => {
    if (userProfile) {
      setFarmerName((prev) => prev || userProfile.fullName || '');
      setVillage((prev) => prev || userProfile.village || '');
      setPhone((prev) => prev || userProfile.phone || '');
    }
  }, [userProfile]);

  useEffect(() => {
    setWeightKg(remainingKg > 0 ? Math.min(150, remainingKg) : 0);
  }, [pool.id, remainingKg]);

  const numericWeight = Math.min(Math.max(Number(weightKg) || 0, 0), remainingKg);
  const projectedTotalWeight = Math.max(pool.currentWeightKg + numericWeight, 1);
  const pooledCostPerKg = pool.baseTruckCost / projectedTotalWeight;
  const farmerFreightShare = Math.round(pooledCostPerKg * numericWeight);
  const soloCharterSavings = Math.max(pool.baseTruckCost - farmerFreightShare, 0);
  const grossProcessorPayout = numericWeight * pool.processorPricePerKg;
  const netFarmerEarnings = grossProcessorPayout - farmerFreightShare;
  const middlemanNetEarnings = numericWeight * pool.middlemanPricePerKg;
  const extraIncomeGain = netFarmerEarnings - middlemanNetEarnings;

  const handleInitiateMpesa = (e) => {
    e.preventDefault();
    if (numericWeight <= 0) return;

    setPendingBooking({
      uid: userProfile?.uid || null,
      farmerName,
      village,
      phone,
      weightKg: numericWeight,
      amount: Math.max(farmerFreightShare, 50),
      channel: 'Web App (M-Pesa Escrow)',
    });
    setStkOpen(true);
  };

  const handleMpesaConfirmed = async ({ mpesaReceipt, amountPaid, escrowStatus }) => {
    await onBook(pool.id, {
      ...pendingBooking,
      mpesaReceipt,
      amountPaid,
      escrowStatus,
    });
    setLastReceipt({
      code: mpesaReceipt,
      amount: amountPaid,
      weight: pendingBooking.weightKg,
    });
    const nextRemaining = Math.max(remainingKg - pendingBooking.weightKg, 0);
    setWeightKg(nextRemaining > 0 ? Math.min(100, nextRemaining) : 0);
  };

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Direct Pool Booking
            </span>
            <h3 className="text-base font-extrabold tracking-tight mt-0.5">
              Reserve Cargo Space
            </h3>
            <p className="text-xs text-slate-300">{pool.corridor}</p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              M-Pesa Escrow Protected
            </span>
            <span className="text-[11px] text-slate-400">
              <strong className="text-white">{remainingKg.toLocaleString()} kg</strong> open space
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Confirmed Booking Toast */}
          {lastReceipt && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold">
                    Slot Reserved ({lastReceipt.weight.toLocaleString()} kg)
                  </div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    Ref: <span className="font-mono font-bold">{lastReceipt.code}</span> • Paid{' '}
                    <strong>KSh {lastReceipt.amount.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLastReceipt(null)}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition"
              >
                Dismiss
              </button>
            </div>
          )}

          {remainingKg <= 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-extrabold text-slate-900">
                Truck Pool 100% Full ({pool.maxCapacityKg.toLocaleString()} kg)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                This corridor truck has reached maximum capacity and is closed for new bookings. Select another open truck on the left or wait for the next scheduled departure.
              </p>
            </div>
          ) : (
            <>
              <datalist id="farmer-pickups">
                {KENYA_LOCATIONS.filter((l) => l.type !== 'processor').map((loc) => (
                  <option key={loc.name} value={loc.name} />
                ))}
              </datalist>

              <form onSubmit={handleInitiateMpesa} className="space-y-5">
                {/* Step 1: Shipper & Pickup */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center">
                      1
                    </span>
                    Shipper & Pickup Point
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Farmer / Shipper Name
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="Full name"
                          value={farmerName}
                          onChange={(e) => setFarmerName(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 pl-8 pr-3 py-2.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        M-Pesa Phone Number
                      </label>
                      <div className="relative">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          placeholder="07XX XXX XXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 pl-8 pr-3 py-2.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Collection Point / Market Stop
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        list="farmer-pickups"
                        required
                        placeholder="e.g., Masii Market, Kathonzweni, Tala"
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 pl-8 pr-3 py-2.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 2: Cargo Weight & Quick Chips */}
                <div className="space-y-3 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center">
                        2
                      </span>
                      Cargo Weight (kg)
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      Est. Rate: KSh {pooledCostPerKg.toFixed(2)}/kg
                    </span>
                  </div>

                  <div className="relative">
                    <Scale className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="10"
                      max={remainingKg}
                      required
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-200 pl-10 pr-14 py-2.5 text-sm font-extrabold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600 transition"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      KG
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_WEIGHTS.filter((w) => w <= remainingKg).map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setWeightKg(w)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                          Number(weightKg) === w
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {w} kg
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setWeightKg(remainingKg)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                        Number(weightKg) === remainingKg
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Fill Max ({remainingKg} kg)
                    </button>
                  </div>
                </div>

                {/* Step 3: Financial Breakdown Card */}
                <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white p-4 space-y-3 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-emerald-400" />
                      Pooled Freight Total
                    </span>
                    <span className="text-lg font-extrabold text-amber-300">
                      KSh {farmerFreightShare.toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                    <div className="bg-white/5 rounded-xl p-2.5">
                      <div className="text-[10px] text-slate-400">Solo Charter Savings</div>
                      <div className="font-extrabold text-emerald-400 mt-0.5">
                        KSh {soloCharterSavings.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-2.5">
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        Net Gate Payout
                      </div>
                      <div className="font-extrabold text-white mt-0.5">
                        KSh {netFarmerEarnings.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {extraIncomeGain > 0 && (
                    <div className="flex items-center justify-between text-[11px] bg-emerald-500/15 border border-emerald-500/25 rounded-xl px-3 py-1.5 text-emerald-300 font-semibold">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Extra gain vs. middleman gate price
                      </span>
                      <span className="font-extrabold">+KSh {extraIncomeGain.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={numericWeight <= 0}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  {`Lock Slot & Verify M-Pesa • KSh ${Math.max(farmerFreightShare, 50).toLocaleString()}`}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <MpesaStkModal
        isOpen={stkOpen}
        paymentDetails={pendingBooking}
        onClose={() => setStkOpen(false)}
        onPaymentSuccess={handleMpesaConfirmed}
      />
    </>
  );
}