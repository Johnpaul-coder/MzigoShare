import React, { useState, useEffect } from 'react';
import { UserCheck, X, Lock, Mail, User, Phone, MapPin, RefreshCw } from 'lucide-react';
import { signInUser, signUpUser, resendVerificationEmail } from '../services/authService';

export default function AuthModal({ isOpen, onClose, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup'
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [village, setVillage] = useState('');
  const [role, setRole] = useState('farmer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setSuccessMsg('');
    setNeedsVerification(false);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setNeedsVerification(false);
  };

  const handleResend = async () => {
    if (!email || !password) {
      setError('Enter your email and password above, then click Resend.');
      return;
    }
    setResending(true);
    setError('');
    try {
      await resendVerificationEmail(email, password);
      setSuccessMsg(`Verification email resent to ${email}. Check your Inbox or Spam folder.`);
      setNeedsVerification(false);
    } catch (err) {
      setError('Could not resend email. Verify your password is correct and wait 60 seconds.');
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
        await signUpUser({ fullName, phone, village, role, email, password });
        setFullName('');
        setPhone('');
        setVillage('');
        setPassword('');
        setMode('signin');
        setSuccessMsg(
          `Verification link sent to ${email}! Open your email (check Spam if needed), click the link, then sign in.`
        );
      } else {
        await signInUser(email, password);
        setEmail('');
        setPassword('');
        onClose();
      }
    } catch (err) {
      if (err.message === 'UNVERIFIED_EMAIL') {
        setNeedsVerification(true);
        setError('Your email is not verified yet. Please click the verification link sent to your inbox.');
      } else {
        const msg = err.message
          .replace('Firebase: ', '')
          .replace(/\(auth\/.*\)\.?/, '')
          .trim();
        setError(msg || 'Authentication failed. Check your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-bold text-slate-900">
              {mode === 'signin' ? 'Sign In to MzigoShare' : 'Create MzigoShare Account'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-lg mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className={`py-2 rounded-md transition ${
              mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`py-2 rounded-md transition ${
              mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2.5 mb-3 space-y-2">
            <div>{error}</div>
            {needsVerification && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-1.5 font-semibold text-red-800 underline hover:text-red-950"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                {resending ? 'Sending link...' : 'Resend Verification Email'}
              </button>
            )}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg px-3 py-2.5 mb-3 font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Account Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-green-600"
                >
                  <option value="farmer">Smallholder Farmer (Book Cargo Slots)</option>
                  <option value="hub_agent">Hub Agent / Transporter (Launch Pools)</option>
                  <option value="processor">Agro-Processor Off-Taker (Gate Manifests)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g., Johnpaul Ekisa"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 focus:outline-none focus:border-green-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    M-Pesa Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      placeholder="07XX XXX XXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 focus:outline-none focus:border-green-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Ward / Hub Location
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g., Machakos"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 focus:outline-none focus:border-green-600"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 focus:outline-none focus:border-green-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 focus:outline-none focus:border-green-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition mt-2"
          >
            {loading
              ? 'Please wait...'
              : mode === 'signin'
              ? 'Sign In'
              : 'Create Account & Send Verification'}
          </button>
        </form>
      </div>
    </div>
  );
}