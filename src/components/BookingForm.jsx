import React, { useEffect, useState } from 'react';
import { Smartphone, TrendingUp, Truck, ShieldCheck } from 'lucide-react';
import { KENYA_LOCATIONS } from '../utils/kenyaLocations';
import MpesaStkModal from './MpesaStkModal';

export default function BookingForm({ pool, userProfile, onBook }) {
  const remainingKg = Math.max(pool.maxCapacityKg - pool.currentWeightKg, 0);
  const [farmerName, setFarmerName] = useState(userProfile?.fullName || '');
  const [village, setVillage] = useState(userProfile?.village || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [weightKg, setWeightKg] = useState(Math.min(150, remainingKg || 150));
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
    setWeightKg(Math.min(150, remainingKg || 150));
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
      channel: 'Web App (M-Pesa STK)',
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
    setWeightKg(Math.min(100, Math.max(remainingKg - pendingBooking.weightKg, 0)));
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Reserve Cargo Space</h3>
            <p className="text-xs text-slate-500 mt-0.5">{pool.corridor}</p>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            Escrow Protected
          </span>
        </div>

        {lastReceipt && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-center justify-between">
            <div>
              <div className="font-bold">Last Slot Locked ({lastReceipt.weight} kg)</div>
              <div className="text-[11px] text-emerald-700">
                M-Pesa Receipt: <strong className="font-mono">{lastReceipt.code}</strong> • KSh{' '}
                {lastReceipt.amount.toLocaleString()}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLastReceipt(null)}
              className="text-[11px] font-bold underline text-emerald-800"
            >
              Dismiss
            </button>
          </div>
        )}

        <datalist id="farmer-pickups">
          {KENYA_LOCATIONS.filter((l) => l.type !== 'processor').map((loc) => (
            <option key={loc.name} value={loc.name} />
          ))}
        </datalist>

        <form onSubmit={handleInitiateMpesa} className="space-y-3.5 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Farmer Name</label>
              <input
                type="text"
                required
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                required
                placeholder="07XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Listed Pickup Stop
              </label>
              <input
                type="text"
                list="farmer-pickups"
                required
                placeholder="e.g., Masii Market"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Harvest Weight (Max {remainingKg} kg)
              </label>
              <input
                type="number"
                min="10"
                max={remainingKg}
                required
                disabled={remainingKg <= 0}
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Real-Time Cost & Net Income Breakdown */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                Pooled Freight Share ({pooledCostPerKg.toFixed(2)}/kg)
              </span>
              <span className="font-extrabold text-amber-300 text-sm">
                KSh {farmerFreightShare.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span>Solo Truck Charter Savings</span>
              <span className="font-bold text-emerald-400">
                Save KSh {soloCharterSavings.toLocaleString()}
              </span>
            </div>

            <div className="border-t border-slate-700 pt-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Net Processor Gate Payout
              </span>
              <span className="font-extrabold text-white text-sm">
                KSh {netFarmerEarnings.toLocaleString()}{' '}
                <span className="text-[11px] text-emerald-400">
                  (+KSh {extraIncomeGain.toLocaleString()} vs broker)
                </span>
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={remainingKg <= 0 || numericWeight <= 0}
            className="w-full py-3 px-4 rounded-xl bg-[#2E8B57] hover:bg-[#236B43] disabled:bg-slate-300 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition"
          >
            <Smartphone className="w-4 h-4" />
            {remainingKg <= 0
              ? 'Truck Pool Full (100%)'
              : `Pay KSh ${Math.max(farmerFreightShare, 50).toLocaleString()} via M-Pesa STK Push`}
          </button>
        </form>
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