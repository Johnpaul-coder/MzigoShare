import React, { useState } from 'react';
import {
  Truck,
  Sprout,
  Warehouse,
  Factory,
  ArrowRight,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import Logo from './Logo';
import { signInUser, signUpUser, resendVerificationEmail } from '../services/authService';
import { isFirebaseConfigured } from '../config/firebase';

export default function LandingAuthView({ pools }) {
  const [mode, setMode] = useState('signin');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setNeedsVerification(false);
  };

  const handleResend = async () => {
    if (!email || !password) {
      setError('Enter your email and password first, then click Resend.');
      return;
    }
    setResending(true);
    setError('');
    try {
      await resendVerificationEmail(email, password);
      setSuccessMsg(`Verification link resent to ${email}. Check Inbox or Spam.`);
      setNeedsVerification(false);
    } catch {
      setError('Could not resend email. Check your password and wait 60 seconds.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setNeedsVerification(false);
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUpUser({ fullName, phone, village, role: 'farmer', email, password });
        setFullName('');
        setPhone('');
        setVillage('');
        setPassword('');
        setMode('signin');
        setSuccessMsg(
          `Verification link sent to ${email}! Open your email, click the link, then sign in below.`
        );
      } else {
        await signInUser(email, password);
      }
    } catch (err) {
      if (err.message === 'UNVERIFIED_EMAIL') {
        setNeedsVerification(true);
        setError('Your email is not verified yet. Please click the link sent to your inbox.');
      } else {
        const msg = err.message
          .replace('Firebase: ', '')
          .replace(/\(auth\/.*\)\.?/, '')
          .trim();
        setError(msg || 'Authentication failed. Check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {isFirebaseConfigured ? 'Live Dispatch Network' : 'Offline Mode'}
            </span>
            <button
              onClick={() => switchMode('signin')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                mode === 'signin'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => switchMode('signup')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                mode === 'signup'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Shipper Sign Up
            </button>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold px-3.5 py-1.5 rounded-full">
              <Sprout className="w-4 h-4" />
              Shared Agricultural Freight Across Kenya
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Share the truck. <br />
              <span className="text-emerald-400">Keep the harvest profit.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
              Pool your produce crates with neighboring farmers along the same highway corridor.
              Cut freight costs by up to <strong className="text-white">62%</strong> and track every
              tagged load from farm pickup to verified market drop-off.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <TrendingUp className="w-5 h-5 text-amber-400 mb-2" />
                <div className="text-xl font-extrabold text-white">Up to 62%</div>
                <div className="text-xs text-slate-300 mt-0.5">Lower transport cost per kg</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
                <div className="text-xl font-extrabold text-white">M-Pesa Escrow</div>
                <div className="text-xs text-slate-300 mt-0.5">Protected slot & gate payouts</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <Truck className="w-5 h-5 text-sky-400 mb-2" />
                <div className="text-xl font-extrabold text-white">
                  {pools.length} Live {pools.length === 1 ? 'Route' : 'Routes'}
                </div>
                <div className="text-xs text-slate-300 mt-0.5">Active corridors available today</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
              <div className="mb-5">
                <h2 className="text-2xl font-extrabold text-slate-900">
                  {mode === 'signin' ? 'Welcome back' : 'Create Shipper Account'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {mode === 'signin'
                    ? 'Farmers, vetted fleet drivers, and dispatch admins sign in below.'
                    : 'Register as a farmer or produce shipper. Fleet drivers are onboarded by Dispatch.'}
                </p>
              </div>

              <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl mb-5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className={`py-2.5 rounded-lg transition ${
                    mode === 'signin'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={`py-2.5 rounded-lg transition ${
                    mode === 'signup'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Shipper Sign Up
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3.5 py-2.5 mb-4 space-y-2">
                  <div>{error}</div>
                  {needsVerification && (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="inline-flex items-center gap-1.5 font-bold text-red-800 underline"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                      {resending ? 'Sending link...' : 'Resend Verification Email'}
                    </button>
                  )}
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl px-3.5 py-2.5 mb-4 font-medium">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 text-sm">
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          required
                          placeholder="Enter your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          M-Pesa Phone
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type="tel"
                            required
                            placeholder="07XX XXX XXX"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ward / Market Hub
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type="text"
                            required
                            placeholder="e.g., Masii / Machakos"
                            value={village}
                            onChange={(e) => setVillage(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition mt-2"
                >
                  {loading
                    ? 'Please wait...'
                    : mode === 'signin'
                    ? 'Sign In'
                    : 'Create Shipper Account'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl font-extrabold text-slate-900">
            How Shared Farm-to-Market Logistics Works
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Vetted fleet trucks, tagged produce custody, and escrow-protected market deliveries.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Sprout className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">1. List Produce & Reserve Space</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Pick an active route, pay only for your exact kilograms via M-Pesa escrow, and get
              an instant tracking tag.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <Warehouse className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">2. Tagged Pickup & Live Map</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Company-vetted drivers follow the live route map, verify your crate tag at pickup, and
              consolidate loads along the highway.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
              <Factory className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">3. Photo Proof & Escrow Release</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Upon arrival at the destination gate, the driver uploads a photo confirmation to
              verify delivery and release M-Pesa escrow payouts.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}