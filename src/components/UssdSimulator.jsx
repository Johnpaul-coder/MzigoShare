import React, { useState } from 'react';
import { PhoneCall, RotateCcw } from 'lucide-react';
import { calculatePoolEconomics } from '../utils/costCalculator';

export default function UssdSimulator({ pools, onBook }) {
  const [step, setStep] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [selectedPoolIndex, setSelectedPoolIndex] = useState(0);
  const [farmerName, setFarmerName] = useState('');
  const [village, setVillage] = useState('');
  const [weightKg, setWeightKg] = useState(0);

  const activePool = pools[selectedPoolIndex] || null;
  const economics = activePool ? calculatePoolEconomics(activePool, weightKg || 1) : null;

  const resetUssd = () => {
    setStep(0);
    setInputVal('');
    setFarmerName('');
    setVillage('');
    setWeightKg(0);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (step === 0) {
      if (!pools.length) return;
      setStep(1);
      setInputVal('');
    } else if (step === 1) {
      const idx = Math.max(0, Math.min((parseInt(inputVal, 10) || 1) - 1, pools.length - 1));
      setSelectedPoolIndex(idx);
      setStep(2);
      setInputVal('');
    } else if (step === 2) {
      if (!inputVal.trim()) return;
      setFarmerName(inputVal.trim());
      setStep(3);
      setInputVal('');
    } else if (step === 3) {
      if (!inputVal.trim()) return;
      setVillage(inputVal.trim());
      setStep(4);
      setInputVal('');
    } else if (step === 4) {
      const kg = parseInt(inputVal, 10);
      if (!kg || kg <= 0) return;
      setWeightKg(kg);
      setStep(5);
      setInputVal('');
    } else if (step === 5) {
      if (inputVal === '1' && activePool) {
        await onBook(activePool.id, {
          farmerName,
          village,
          weightKg,
          channel: 'USSD *384*55#',
        });
        setStep(6);
      } else {
        resetUssd();
      }
      setInputVal('');
    } else {
      resetUssd();
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 border-4 border-slate-700 shadow-xl max-w-xs mx-auto">
      <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
          <PhoneCall className="w-3 h-3" /> Feature Phone USSD
        </span>
        <button
          onClick={resetUssd}
          className="text-slate-400 hover:text-white flex items-center gap-1"
          title="Reset USSD"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      <div className="bg-emerald-950/90 border border-emerald-800/70 rounded-lg p-3.5 my-3 font-mono text-xs min-h-[175px] flex flex-col justify-between text-emerald-100">
        {step === 0 && (
          <div>
            <p className="text-emerald-400 font-bold mb-1">Dial *384*55#</p>
            <p>Offline farmer access without smartphones or mobile data.</p>
            <p className="mt-3 text-emerald-300">
              {pools.length
                ? 'Press Dial to view live truck pools.'
                : 'No active pools in Firestore yet. Create a pool first.'}
            </p>
          </div>
        )}

        {step === 1 && (
          <div>
            <p className="font-bold mb-1">MzigoShare Active Routes:</p>
            {pools.map((p, idx) => (
              <p key={p.id} className="mt-1">
                {idx + 1}. {p.corridor} ({p.produceType})
              </p>
            ))}
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="font-bold mb-1">{activePool?.corridor}</p>
            <p>Enter Farmer Full Name:</p>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="font-bold mb-1">Pickup Point</p>
            <p>Enter Village / Ward Name:</p>
          </div>
        )}

        {step === 4 && (
          <div>
            <p className="font-bold mb-1">Harvest Quantity</p>
            <p>
              Enter weight in KG (Available:{' '}
              {Math.max((activePool?.maxCapacityKg || 0) - (activePool?.currentWeightKg || 0), 0)}{' '}
              kg):
            </p>
          </div>
        )}

        {step === 5 && (
          <div>
            <p className="font-bold mb-1">Confirm Pool Slot:</p>
            <p>Farmer: {farmerName}</p>
            <p>Load: {weightKg} kg ({village})</p>
            <p>
              Share: KSh {economics?.sharedFarmerCost.toLocaleString()} (Save{' '}
              {economics?.savingsPercent}%)
            </p>
            <p className="mt-1 text-amber-300">1. Confirm & M-Pesa STK</p>
            <p>2. Cancel</p>
          </div>
        )}

        {step === 6 && (
          <div>
            <p className="font-bold text-emerald-300 mb-1">Booking Confirmed!</p>
            <p>
              {weightKg} kg added to {activePool?.corridor}. Truck capacity updated in Firestore.
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        {step > 0 && step < 6 && (
          <input
            type="text"
            required
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={
              step === 1
                ? '1'
                : step === 2
                ? 'Full Name'
                : step === 3
                ? 'Village'
                : step === 4
                ? '200'
                : '1'
            }
            className="flex-1 bg-slate-800 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
          />
        )}
        <button
          type="submit"
          disabled={!pools.length && step === 0}
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-semibold py-1.5 px-3 rounded text-xs transition"
        >
          {step === 0 ? 'Dial *384*55#' : step === 6 ? 'Done' : 'Send'}
        </button>
      </form>
    </div>
  );
}