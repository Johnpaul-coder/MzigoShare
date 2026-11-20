import React from 'react';
import { LogOut, Database } from 'lucide-react';
import { isFirebaseConfigured } from '../config/firebase';
import Logo from './Logo';

const ROLE_LABELS = {
  farmer: 'Farmer',
  hub_agent: 'Hub Agent',
  processor: 'Processor',
};

export default function Navbar({
  activeTab,
  setActiveTab,
  userProfile,
  onLogout,
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Custom MzigoShare Brand Logo */}
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {isFirebaseConfigured ? 'Firestore Live' : 'Offline'}
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('farmer')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'farmer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Pools & Booking
          </button>
          <button
            onClick={() => setActiveTab('hub')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'hub' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Hub-and-Spoke
          </button>
          <button
            onClick={() => setActiveTab('processor')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'processor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Processor Gate
          </button>
        </nav>

        {/* Signed-In User Badge & Sign Out */}
        {userProfile && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900">{userProfile.fullName}</div>
              <div className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                <Database className="w-3 h-3" />
                {ROLE_LABELS[userProfile.role] || 'Farmer'}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}