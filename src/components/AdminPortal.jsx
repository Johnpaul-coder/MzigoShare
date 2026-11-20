import React, { useState } from 'react';
import {
  UserPlus,
  Truck,
  Package,
  Navigation,
  PlusCircle,
  Camera,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { registerDriver, assignDriverToPool } from '../services/poolService';
import HubSpokeMap from './HubSpokeMap';

export default function AdminPortal({ pools, drivers, onOpenCreatePool }) {
  const [adminTab, setAdminTab] = useState('database');
  const [driverForm, setDriverForm] = useState({
    fullName: '',
    phone: '',
    licenseNo: '',
    vehiclePlate: '',
    vehicleType: '3-Ton Isuzu Canter',
    maxCapacityKg: 3000,
  });
  const [savingDriver, setSavingDriver] = useState(false);
  const [driverMsg, setDriverMsg] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const handleRegisterDriver = async (e) => {
    e.preventDefault();
    setSavingDriver(true);
    setDriverMsg('');
    try {
      await registerDriver(driverForm);
      setDriverMsg(
        `Driver ${driverForm.fullName} (${driverForm.vehiclePlate.toUpperCase()}) registered!`
      );
      setDriverForm({
        fullName: '',
        phone: '',
        licenseNo: '',
        vehiclePlate: '',
        vehicleType: '3-Ton Isuzu Canter',
        maxCapacityKg: 3000,
      });
    } finally {
      setSavingDriver(false);
    }
  };

  const allGoods = pools.flatMap((pool) =>
    (pool.bookings || []).map((b) => ({
      ...b,
      poolId: pool.id,
      corridor: pool.corridor,
      destination: pool.destination,
      distanceKm: pool.distanceKm,
      driverName: pool.driverName || 'Unassigned',
      vehiclePlate: pool.vehiclePlate || 'Pending',
    }))
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
            Admin Fleet & Dispatch Command
          </span>
          <h1 className="text-2xl font-extrabold mt-0.5">
            Drivers, Routes & Master Goods Database
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Register drivers, assign trucks to corridors, monitor live transit, and verify drop-off photos.
          </p>
        </div>

        <button
          onClick={onOpenCreatePool}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs transition"
        >
          <PlusCircle className="w-4 h-4" />
          Create Route & Truck Pool
        </button>
      </div>

      <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 w-fit">
        <button
          onClick={() => setAdminTab('database')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
            adminTab === 'database'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          Goods Database ({allGoods.length})
        </button>
        <button
          onClick={() => setAdminTab('drivers')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
            adminTab === 'drivers'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Register & Assign Drivers ({drivers.length})
        </button>
        <button
          onClick={() => setAdminTab('tracker')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
            adminTab === 'tracker'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Navigation className="w-4 h-4" />
          Live Fleet Tracker ({pools.length})
        </button>
      </div>

      {adminTab === 'database' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-extrabold text-base text-slate-900">
              Listed Produce & Cargo Manifest Database
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              Live Firestore Sync •{' '}
              {allGoods.reduce((s, g) => s + Number(g.weightKg || 0), 0).toLocaleString()} kg Total
            </span>
          </div>

          {allGoods.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              No goods listed by users yet. Once a user lists produce, their tag, route, payment, and drop-off proof appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="px-4 py-3">Goods Tag</th>
                    <th className="px-4 py-3">User / Farmer</th>
                    <th className="px-4 py-3">Product & Weight</th>
                    <th className="px-4 py-3">Route & Pickup</th>
                    <th className="px-4 py-3">Assigned Truck</th>
                    <th className="px-4 py-3">M-Pesa Escrow</th>
                    <th className="px-4 py-3">Status & Drop-off Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allGoods.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-extrabold text-emerald-700">
                        {item.goodsTag || 'MZG-TAG'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{item.farmerName}</div>
                        <div className="text-[11px] text-slate-500">{item.phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{item.productName}</div>
                        <div className="text-[11px] text-emerald-700 font-semibold">
                          {item.weightKg} kg
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{item.corridor}</div>
                        <div className="text-[11px] text-slate-500">Pickup: {item.village}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{item.vehiclePlate}</div>
                        <div className="text-[11px] text-slate-500">{item.driverName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">
                          KSh {Number(item.amountPaid || 0).toLocaleString()}
                        </div>
                        <div className="font-mono text-[10px] text-emerald-700">
                          {item.mpesaReceipt}
                        </div>
                      </td>
                      <td className="px-4 py-3 space-y-1">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.deliveryStatus === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.deliveryStatus === 'In Transit'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.deliveryStatus || 'Listed & Paid'}
                        </span>
                        {item.dropoffPhotoUrl && (
                          <div>
                            <button
                              onClick={() => setSelectedPhoto(item)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 underline"
                            >
                              <Camera className="w-3 h-3" /> View Drop-off Photo
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {adminTab === 'drivers' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              Register New Fleet Driver
            </h2>

            {driverMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl px-3.5 py-2.5 mb-4 font-semibold">
                {driverMsg}
              </div>
            )}

            <form onSubmit={handleRegisterDriver} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Driver Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Peter Kamau"
                  value={driverForm.fullName}
                  onChange={(e) => setDriverForm({ ...driverForm, fullName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="07XX XXX XXX"
                    value={driverForm.phone}
                    onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NTSA License No.</label>
                  <input
                    type="text"
                    required
                    placeholder="DL-884920"
                    value={driverForm.licenseNo}
                    onChange={(e) => setDriverForm({ ...driverForm, licenseNo: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Number Plate</label>
                  <input
                    type="text"
                    required
                    placeholder="KDN 412T"
                    value={driverForm.vehiclePlate}
                    onChange={(e) =>
                      setDriverForm({ ...driverForm, vehiclePlate: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Load (kg)</label>
                  <input
                    type="number"
                    required
                    min="500"
                    step="500"
                    value={driverForm.maxCapacityKg}
                    onChange={(e) =>
                      setDriverForm({ ...driverForm, maxCapacityKg: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Truck Model / Type</label>
                <input
                  type="text"
                  required
                  value={driverForm.vehicleType}
                  onChange={(e) => setDriverForm({ ...driverForm, vehicleType: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                />
              </div>

              <button
                type="submit"
                disabled={savingDriver}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold transition"
              >
                {savingDriver ? 'Saving Driver...' : 'Register Driver in Database'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">
                Assign Registered Drivers to Active Routes
              </h3>

              {pools.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No routes created yet. Click <strong>Create Route & Truck Pool</strong> above first.
                </p>
              ) : (
                <div className="space-y-3">
                  {pools.map((pool) => (
                    <div
                      key={pool.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-extrabold text-slate-900">{pool.corridor}</div>
                        <div className="text-[11px] text-slate-500">
                          {pool.distanceKm} km • Current Driver:{' '}
                          <strong className="text-emerald-700">
                            {pool.driverName} ({pool.vehiclePlate})
                          </strong>
                        </div>
                      </div>

                      <select
                        value={pool.driverId || ''}
                        onChange={(e) => {
                          const chosen = drivers.find((d) => d.id === e.target.value);
                          if (chosen) assignDriverToPool(pool.id, chosen);
                        }}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800"
                      >
                        <option value="">-- Assign Driver & Truck --</option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.fullName} ({d.vehiclePlate} • {d.maxCapacityKg}kg)
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-extrabold text-sm text-slate-900 mb-3">
                Registered Drivers ({drivers.length})
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {drivers.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{d.fullName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {d.phone} • Lic: {d.licenseNo}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-bold text-[11px]">
                      {d.vehiclePlate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {adminTab === 'tracker' && (
        <div className="space-y-5">
          <HubSpokeMap pools={pools} />

          <div className="grid md:grid-cols-2 gap-5">
            {pools.map((pool) => {
              const deliveredCount = (pool.bookings || []).filter(
                (b) => b.deliveryStatus === 'Delivered'
              ).length;
              const totalBookings = (pool.bookings || []).length;

              return (
                <div
                  key={pool.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        <Truck className="w-3.5 h-3.5" /> {pool.tripStatus || 'Awaiting Cargo'}
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900 mt-2">
                        {pool.corridor}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Driver: <strong>{pool.driverName}</strong> • Plate:{' '}
                        <strong>{pool.vehiclePlate}</strong> ({pool.distanceKm} km)
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-bold text-slate-900">
                        {deliveredCount}/{totalBookings} Drop-offs
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {pool.currentWeightKg}/{pool.maxCapacityKg} kg
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold">
                    {['Awaiting Cargo', 'Loading Pickups', 'In Transit', 'Delivered'].map(
                      (stage, idx) => {
                        const stages = [
                          'Awaiting Cargo',
                          'Loading Pickups',
                          'In Transit',
                          'Delivered',
                        ];
                        const activeIdx = stages.indexOf(pool.tripStatus || 'Awaiting Cargo');
                        const isDone = idx <= activeIdx;
                        return (
                          <div
                            key={stage}
                            className={`py-2 px-1 rounded-lg border ${
                              isDone
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            {stage}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="font-extrabold text-sm text-slate-900">
                Drop-Off Proof • {selectedPhoto.goodsTag}
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>
            <img
              src={selectedPhoto.dropoffPhotoUrl}
              alt="Dropoff proof"
              className="w-full h-64 object-cover rounded-xl border border-slate-200"
            />
            <div className="text-xs text-slate-600 space-y-1">
              <div>
                <strong>Farmer:</strong> {selectedPhoto.farmerName} ({selectedPhoto.weightKg} kg{' '}
                {selectedPhoto.productName})
              </div>
              <div>
                <strong>Destination:</strong> {selectedPhoto.destination}
              </div>
              {selectedPhoto.dropoffNotes && (
                <div>
                  <strong>Driver Note:</strong> {selectedPhoto.dropoffNotes}
                </div>
              )}
              <div className="flex items-center gap-1 text-emerald-700 font-bold pt-1">
                <ShieldCheck className="w-4 h-4" /> Escrow Verified & Released
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}