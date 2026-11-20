import React from 'react';
import { Truck, Radio } from 'lucide-react';
import { isFirebaseConfigured } from '../config/firebase';

export default function Navbar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'farmer', label: 'Farmer Pool & Booking' },
    { id: 'hub', label: 'Hub-and-Spoke Routing' },
    { id: 'processor', label: 'Processor Off-Taker Feed' },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-green-600 p-2 rounded-lg">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-xl tracking-tight">MzigoShare</span>
            <span className="hidden sm:inline-block ml-2 text-xs bg-green-900/80 text-green-300 px-2 py-0.5 rounded-full border border-green-700">
              Machakos ➔ Nairobi Pilot
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-xs">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-slate-300">
            {isFirebaseConfigured ? 'Firestore Live' : 'Real-Time Local Sync'}
          </span>
        </div>
      </div>
    </header>
  );
}
