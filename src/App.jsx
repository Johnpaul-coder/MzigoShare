import React, { useEffect, useState } from 'react';
import { PlusCircle, Truck } from 'lucide-react';
import Navbar from './components/Navbar';
import PoolCard from './components/PoolCard';
import BookingForm from './components/BookingForm';
import UssdSimulator from './components/UssdSimulator';
import HubSpokeMap from './components/HubSpokeMap';
import ProcessorPortal from './components/ProcessorPortal';
import CreatePoolModal from './components/CreatePoolModal';
import AuthModal from './components/AuthModal';
import {
  subscribeToPools,
  createTruckPool,
  joinTruckPool,
} from './services/poolService';
import { subscribeToAuth, logoutUser } from './services/authService';

export default function App() {
  const [pools, setPools] = useState([]);
  const [selectedPoolId, setSelectedPoolId] = useState(null);
  const [activeTab, setActiveTab] = useState('farmer');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [userProfile, setUserProfile] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');

  useEffect(() => {
    const unsubAuth = subscribeToAuth((profile) => {
      setUserProfile(profile);
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

  const selectedPool = pools.find((p) => p.id === selectedPoolId) || pools[0] || null;

  const openAuth = (mode = 'signin') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenCreatePool = () => {
    if (!userProfile) {
      openAuth('signin');
      return;
    }
    setIsCreateOpen(true);
  };

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
        onOpenAuth={openAuth}
        onLogout={logoutUser}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'farmer' && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Active Shared Produce Pools
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    Select a corridor and add a harvest load via Web App or USSD to update Firestore
                    capacity live.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreatePool}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm shadow-sm transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  New Truck Pool
                </button>
              </div>

              {pools.length === 0 ? (
                <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-10 text-center space-y-3">
                  <Truck className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">
                    No Active Truck Pools in Firestore
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Sign in and click <strong>New Truck Pool</strong> to publish your first live
                    agricultural corridor and begin pooling farmer harvests.
                  </p>
                  <button
                    onClick={handleOpenCreatePool}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Launch First Truck Pool
                  </button>
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
                  onOpenAuth={openAuth}
                  onBook={joinTruckPool}
                />
              )}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center mb-2">
                  Offline Feature-Phone Access Demo
                </h4>
                <UssdSimulator pools={pools} onBook={joinTruckPool} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hub' && <HubSpokeMap pools={pools} />}

        {activeTab === 'processor' && <ProcessorPortal pools={pools} />}
      </main>

      <CreatePoolModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreatePool}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}