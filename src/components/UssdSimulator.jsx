import React, { useState } from 'react';
import { PhoneCall, RotateCcw } from 'lucide-react';

export default function UssdSimulator({ pools, onBook }) {
  const [step, setStep] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [selectedPoolIndex, setSelectedPoolIndex] = useState(0);
  const [weightKg, setWeightKg] = useState(200);

  const activePool = pools[selectedPoolIndex] || pools[0];

  const handleSend = async (e) => {
    e.preventDefault();
    if (step === 0) {
      setStep(1);
      setInputVal('');
    } else if (step === 1) {
      const idx = inputVal === '2' ? 1 : 0;
      setSelectedPoolIndex(idx);
      setStep(2);
      setInputVal('');
    } else if (step === 2) {
      const kg = parseInt(inputVal, 10) || 200;
      setWeightKg(kg);
      setStep(3);
      setInputVal('');
    } else if (step === 3) {
      if (inputVal === '1' && activePool) {
        await onBook(activePool.id, {
          farmerName: 'J. Kioko (USSD)',
          village: 'Masii',
          weightKg,
          channel: 'USSD *384*55#',
        });
        setStep(4);
      } else {
        setStep(0);
      }
      setInputVal('');
    } else {
      setStep(0);
      setInputVal('');
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 border-4 border-slate-700 shadow-xl max-w-xs mx-auto">
      <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
          <PhoneCall className="w-3 h-3" /> Feature Phone USSD
        </span>
        <button
          onClick={() => setStep(0)}
          className="text-slate-400 hover:text-white flex items-center gap-1"
          title="Reset USSD"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      <div className="bg-emerald-950/90 border border-emerald-800/70 rounded-lg p-3.5 my-3 font-mono text-xs min-h-[165px] flex flex-col justify-between text-emerald-100">
        {step === 0 && (
          <div>
            <p className="text-emerald-400 font-bold mb-1">Dial *384*55#</p>
            <p>Offline farmer access without smartphones or mobile data.</p>
            <p className="mt-3 text-emerald-300">Press Send to dial MzigoShare USSD.</p>
          </div>
        )}

        {step === 1 && (
          <div>
            <p className="font-bold mb-1">Welcome to MzigoShare</p>
            <p>Select Destination Route:</p>
            <p className="mt-1">1. Machakos ➔ Nairobi (Tomatoes)</p>
            <p>2. Machakos ➔ Kisii (Avocados)</p>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="font-bold mb-1">{activePool?.corridor}</p>
            <p>Enter harvest weight in KG (e.g., 200):</p>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="font-bold mb-1">Confirm Pool Slot:</p>
            <p>Route: {activePool?.corridor}</p>
            <p>Load: {weightKg} kg</p>
            <p>Est. Cost: KSh 600 (Save 80%)</p>
            <p className="mt-1 text-amber-300">1. Confirm & M-Pesa Prompt</p>
            <p>2. Cancel</p>
          </div>
        )}

        {step === 4 && (
          <div>
            <p className="font-bold text-emerald-300 mb-1">Booking Confirmed!</p>
            <p>
              {weightKg}kg added to {activePool?.corridor}. Truck bar updated live!
            </p>
            <p className="mt-2 text-[11px] text-slate-300">SMS receipt sent to 0712***890.</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        {step > 0 && step < 4 && (
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={step === 2 ? '200' : '1'}
            className="w-20 bg-slate-800 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
          />
        )}
        <button
          type="submit"
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1.5 px-3 rounded text-xs transition"
        >
          {step === 0 ? 'Dial *384*55#' : step === 4 ? 'Done' : 'Send'}
        </button>
      </form>
    </div>
  );
}
