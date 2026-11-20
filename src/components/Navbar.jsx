import React from 'react';
import { Truck, LogIn, UserPlus, LogOut, Database } from 'lucide-react';
import { isFirebaseConfigured } from '../config/firebase';

const ROLE_LABELS = {
  farmer: 'Farmer',
  hub_agent: 'Hub Agent',
  processor: 'Processor',
};

export default function Navbar({
  activeTab,
  setActiveTab,
  userProfile,
  onOpenAuth,
  onLogout,
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="bg-green-600 text-white p-2 rounded-lg">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">MzigoShare</span>
            <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
              {isFirebaseConfigured ? 'Firestore Live' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('farmer')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'farmer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Pools & Booking
          </button>
          <button
            onClick={() => setActiveTab('hub')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'hub' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Hub-and-Spoke
          </button>
          <button
            onClick={() => setActiveTab('processor')}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === 'processor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Processor Gate
          </button>
        </nav>

        {/* Auth Controls */}
        <div className="flex items-center gap-2">
          {userProfile ? (
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900">{userProfile.fullName}</div>
                <div className="text-[11px] text-green-700 font-medium flex items-center justify-end gap-1">
                  <Database className="w-3 h-3" />
                  {ROLE_LABELS[userProfile.role] || 'Farmer'}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => onOpenAuth('signin')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-xs font-semibold text-white transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}