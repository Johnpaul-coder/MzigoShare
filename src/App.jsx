import React, { useEffect, useState } from 'react';
import { Truck, ShieldCheck, PhoneCall } from 'lucide-react';
import Navbar from './components/Navbar';
import PoolCard from './components/PoolCard';
import BookingForm from './components/BookingForm';
import UssdSimulator from './components/UssdSimulator';
import CreatePoolModal from './components/CreatePoolModal';
import LandingAuthView from './components/LandingAuthView';
import AdminPortal from './components/AdminPortal';
import DriverPortal from './components/DriverPortal';
import UserShipmentTracker from './components/UserShipmentTracker';
import {
  subscribeToPools,
  subscribeToDrivers,
  createTruckPool,
  joinTruckPool,
} from './services/poolService';
import { subscribeToAuth, logoutUser } from './services/authService';

export default function App() {
  const [pools, setPools] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedPoolId, setSelectedPoolId] = useState(null);
  const [adminViewTab, setAdminViewTab] = useState('admin');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [userProfile, setUserProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubAuth = subscribeToAuth((profile) => {
      setUserProfile(profile);
      if (profile?.role === 'admin') {
        setAdminViewTab('admin');
      }
      setAuthReady(true);
    });

    const unsubPools = subscribeToPools((updatedPools) => {
      setPools(updatedPools);
      setSelectedPoolId((prev) => {
        if (prev && updatedPools.some((p) => p.id === prev)) return prev;
        return updatedPools[0]?.id || null;
      });
    });

    return () => {
      unsubAuth();
      unsubPools();
    };
  }, []);

  // Only load the full fleet driver registry when signed in as Admin
  useEffect(() => {
    if (userProfile?.role !== 'admin') {
      setDrivers([]);
      return;
    }
    const unsubDrivers = subscribeToDrivers((updatedDrivers) => {
      setDrivers(updatedDrivers);
    });
    return () => unsubDrivers();
  }, [userProfile?.role]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm font-semibold text-slate-600">
        Loading MzigoShare...
      </div>
    );
  }

  if (!userProfile) {
    return <LandingAuthView pools={pools} />;
  }

  const isAdmin = userProfile.role === 'admin';
  const effectiveView = isAdmin
    ? adminViewTab
    : userProfile.role === 'driver'
    ? 'driver'
    : 'user';

  const selectedPool = pools.find((p) => p.id === selectedPoolId) || pools[0] || null;

  const handleCreatePool = async (poolData) => {
    const newId = await createTruckPool({
      ...poolData,
      createdBy: userProfile.uid,
    });
    setSelectedPoolId(newId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        activeTab={effectiveView}
        setActiveTab={isAdmin ? setAdminViewTab : () => {}}
        userProfile={userProfile}
        onLogout={logoutUser}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {effectiveView === 'user' && (
          <div className="space-y-8">
            <UserShipmentTracker pools={pools} userProfile={userProfile} />

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    Active Routes & Shared Trucks
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Select a scheduled corridor to compare net earnings, reserve truck weight capacity, and pay via M-Pesa escrow.
                  </p>
                </div>

                {pools.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3 shadow-sm">
                    <Truck className="w-10 h-10 text-emerald-600 mx-auto" />
                    <h3 className="text-base font-bold text-slate-800">
                      No Scheduled Departures Right Now
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      New Machakos–Nairobi truck pools are dispatched daily. Check back shortly or contact dispatch support for urgent bulk consignments.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pools.map((pool) => (
                      <PoolCard
                        key={pool.id}
                        pool={pool}
                        isSelected={selectedPool?.id === pool.id}
                        onSelect={setSelectedPoolId}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 space-y-6">
                {selectedPool && (
                  <BookingForm
                    pool={selectedPool}
                    userProfile={userProfile}
                    onBook={joinTruckPool}
                  />
                )}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center mb-2">
                    Offline Feature-Phone Booking (*384*55#)
                  </h4>
                  <UssdSimulator pools={pools} onBook={joinTruckPool} />
                </div>
              </div>
            </div>
          </div>
        )}

        {effectiveView === 'driver' && (
          <DriverPortal pools={pools} userProfile={userProfile} />
        )}

        {effectiveView === 'admin' && isAdmin && (
          <AdminPortal
            pools={pools}
            drivers={drivers}
            onOpenCreatePool={() => setIsCreateOpen(true)}
          />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>MzigoShare Logistics Kenya • M-Pesa Escrow Protected Cargo</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="tel:+254702710163"
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-emerald-700 font-semibold"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
              Dispatch Support: 0702 710 163
            </a>
            <span>© {new Date().getFullYear()} MzigoShare</span>
          </div>
        </div>
      </footer>

      {isAdmin && (
        <CreatePoolModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreate={handleCreatePool}
        />
      )}
    </div>
  );
}