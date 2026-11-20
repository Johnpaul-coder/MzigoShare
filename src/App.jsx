import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import PoolCard from './components/PoolCard';
import BookingForm from './components/BookingForm';
import UssdSimulator from './components/UssdSimulator';
import HubSpokeMap from './components/HubSpokeMap';
import ProcessorPortal from './components/ProcessorPortal';
import {
  subscribeToPools,
  seedInitialPoolsIfNeeded,
  joinTruckPool,
} from './services/poolService';

export default function App() {
  const [pools, setPools] = useState([]);
  const [selectedPoolId, setSelectedPoolId] = useState('pool-machakos-nairobi');
  const [activeTab, setActiveTab] = useState('farmer');

  useEffect(() => {
    seedInitialPoolsIfNeeded();
    const unsubscribe = subscribeToPools((updatedPools) => {
      setPools(updatedPools);
    });
    return () => unsubscribe();
  }, []);

  const selectedPool = pools.find((p) => p.id === selectedPoolId) || pools[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'farmer' && (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Active Shared Produce Pools
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Select a corridor below and add a farmer load via Web App or the USSD simulator to
                  watch truck capacity and cost splits update live.
                </p>
              </div>

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
            </div>

            <div className="lg:col-span-5 space-y-6">
              <BookingForm pool={selectedPool} onBook={joinTruckPool} />
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
    </div>
  );
}
