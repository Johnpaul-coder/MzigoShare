import React, { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('user');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [userProfile, setUserProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubAuth = subscribeToAuth((profile) => {
      setUserProfile(profile);
      if (profile?.role === 'admin') setActiveTab('admin');
      else if (profile?.role === 'driver') setActiveTab('driver');
      else setActiveTab('user');
      setAuthReady(true);
    });

    const unsubPools = subscribeToPools((updatedPools) => {
      setPools(updatedPools);
      setSelectedPoolId((prev) => {
        if (prev && updatedPools.some((p) => p.id === prev)) return prev;
        return updatedPools[0]?.id || null;
      });
    });

    const unsubDrivers = subscribeToDrivers((updatedDrivers) => {
      setDrivers(updatedDrivers);
    });

    return () => {
      unsubAuth();
      unsubPools();
      unsubDrivers();
    };
  }, []);

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

  const selectedPool = pools.find((p) => p.id === selectedPoolId) || pools[0] || null;

  const handleCreatePool = async (poolData) => {
    const newId = await createTruckPool({
      ...poolData,
      createdBy: userProfile?.uid || null,
    });
    setSelectedPoolId(newId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        onLogout={logoutUser}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'user' && (
          <div className="space-y-8">
            <UserShipmentTracker pools={pools} userProfile={userProfile} />

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    Available Routes & Shared Trucks
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Select an active corridor to view distance rates, list your product, and pay your pooled freight share.
                  </p>
                </div>

                {pools.length === 0 ? (
                  <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center space-y-3">
                    <Truck className="w-10 h-10 text-slate-400 mx-auto" />
                    <h3 className="text-base font-bold text-slate-800">
                      No Active Routes Available Yet
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Switch to the <strong>Admin (Fleet & DB)</strong> tab to register a driver and publish a route.
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
                    Offline Feature-Phone USSD Access (*384*55#)
                  </h4>
                  <UssdSimulator pools={pools} onBook={joinTruckPool} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'driver' && <DriverPortal pools={pools} userProfile={userProfile} />}

        {activeTab === 'admin' && (
          <AdminPortal
            pools={pools}
            drivers={drivers}
            onOpenCreatePool={() => setIsCreateOpen(true)}
          />
        )}
      </main>

      <CreatePoolModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreatePool}
      />
    </div>
  );
}