import React from 'react';
import { LogOut, ShieldCheck, Truck, Package } from 'lucide-react';
import { isFirebaseConfigured } from '../config/firebase';
import Logo from './Logo';

const ROLE_CONFIG = {
  farmer: {
    label: 'Shipper Portal',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Icon: Package,
  },
  driver: {
    label: 'Driver Portal',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    Icon: Truck,
  },
  admin: {
    label: 'Admin Dispatch',
    badgeClass: 'bg-slate-900 text-white border-slate-800',
    Icon: ShieldCheck,
  },
};

export default function Navbar({
  activeTab,
  setActiveTab,
  userProfile,
  onLogout,
}) {
  const isAdmin = userProfile?.role === 'admin';
  const roleInfo = ROLE_CONFIG[userProfile?.role] || ROLE_CONFIG.farmer;
  const RoleIcon = roleInfo.Icon;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span
            className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold border px-2.5 py-0.5 rounded-full ${roleInfo.badgeClass}`}
          >
            <RoleIcon className="w-3 h-3" />
            {roleInfo.label}
          </span>
          {!isFirebaseConfigured && (
            <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
              Offline Mode
            </span>
          )}
        </div>

        {isAdmin && (
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('user')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'user'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shipper View
            </button>
            <button
              onClick={() => setActiveTab('driver')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'driver'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Driver View
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fleet & Dispatch
            </button>
          </nav>
        )}

        {userProfile && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900">
                {userProfile.fullName}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {userProfile.phone || userProfile.email}
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