import React, { useState, useEffect } from 'react';
import { Smartphone, Lock, CheckCircle2, ShieldCheck, X, Loader2 } from 'lucide-react';

function generateMpesaReceipt() {
  const prefix = 'SL';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let body = '';
  for (let i = 0; i < 8; i++) {
    body += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${body}`;
}

export default function MpesaStkModal({ isOpen, paymentDetails, onClose, onPaymentSuccess }) {
  const [step, setStep] = useState('pushing'); // 'pushing' | 'pin' | 'verifying' | 'confirmed'
  const [pin, setPin] = useState('');
  const [receiptCode, setReceiptCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !paymentDetails) return;
    setStep('pushing');
    setPin('');
    setError('');
    setReceiptCode('');

    const timer = setTimeout(() => {
      setStep('pin');
    }, 1200);

    return () => clearTimeout(timer);
  }, [isOpen, paymentDetails]);

  if (!isOpen || !paymentDetails) return null;

  const handleConfirmPin = async (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      setError('Enter your 4-digit M-Pesa PIN.');
      return;
    }

    setError('');
    setStep('verifying');
    const generatedCode = generateMpesaReceipt();

    try {
      await new Promise((res) => setTimeout(res, 1100));
      await onPaymentSuccess({
        mpesaReceipt: generatedCode,
        amountPaid: paymentDetails.amount,
        escrowStatus: 'Held in Escrow',
      });
      setReceiptCode(generatedCode);
      setStep('confirmed');
    } catch (err) {
      setError(err.message || 'Transaction failed. Please try again.');
      setStep('pin');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full overflow-hidden shadow-2xl">
        {/* Safaricom M-Pesa Branded Header */}
        <div className="bg-gradient-to-r from-[#2E8B57] to-[#1F6E43] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-wide">M-PESA EXPRESS</div>
              <div className="text-[11px] text-emerald-100">Daraja STK Push • Till 849210</div>
            </div>
          </div>
          {step !== 'verifying' && (
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6">
          {step === 'pushing' && (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-[#2E8B57] animate-spin mx-auto" />
              <div className="text-sm font-bold text-slate-900">
                Sending STK Prompt to {paymentDetails.phone}...
              </div>
              <p className="text-xs text-slate-500">
                Connecting to Safaricom Daraja Sandbox Gateway
              </p>
            </div>
          )}

          {(step === 'pin' || step === 'verifying') && (
            <form onSubmit={handleConfirmPin} className="space-y-4">
              {/* Simulated Phone Pop-up Dialog */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-700 shadow-inner space-y-2">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
                  <span>Safaricom SIM Toolkit</span>
                  <span>{paymentDetails.phone}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-100">
                  Do you want to pay{' '}
                  <strong className="text-amber-300">
                    KSh {Number(paymentDetails.amount).toLocaleString()}
                  </strong>{' '}
                  to <strong>MZIGOSHARE ESCROW (849210)</strong> for{' '}
                  <span className="text-emerald-300">{paymentDetails.weightKg} kg</span> cargo
                  slot?
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Enter 4-Digit M-Pesa PIN
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    autoFocus
                    disabled={step === 'verifying'}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-center tracking-[0.6em] font-extrabold text-lg bg-slate-50 focus:bg-white focus:outline-none focus:border-[#2E8B57]"
                  />
                </div>
                {error && <p className="text-xs text-red-600 font-semibold mt-1.5">{error}</p>}
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={step === 'verifying'}
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={step === 'verifying' || pin.length < 4}
                  className="flex-1 py-2.5 rounded-xl bg-[#2E8B57] hover:bg-[#236B43] disabled:bg-slate-300 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md"
                >
                  {step === 'verifying' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    'Send & Lock Slot'
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'confirmed' && (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <div className="text-base font-extrabold text-slate-900">
                  M-Pesa Escrow Confirmed!
                </div>
                <div className="inline-block mt-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono font-extrabold text-emerald-800">
                  Receipt: {receiptCode}
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3.5 text-left text-xs text-slate-600 border border-slate-200 space-y-1">
                <div>
                  <strong className="text-slate-900">{receiptCode}</strong> Confirmed.{' '}
                  <strong className="text-slate-900">
                    KSh {Number(paymentDetails.amount).toLocaleString()}
                  </strong>{' '}
                  sent to <strong>MZIGOSHARE ESCROW</strong> for {paymentDetails.farmerName} (
                  {paymentDetails.weightKg} kg).
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold pt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Funds held safely in escrow until processor gate delivery
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
              >
                Done & View Live Pool
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}