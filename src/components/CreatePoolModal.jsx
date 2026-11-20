import React, { useEffect, useState } from 'react';
import { PlusCircle, X, Route, Calculator } from 'lucide-react';
import {
  KENYA_LOCATIONS,
  findLocationCoords,
  fetchDrivingRoute,
  calculateDistanceCharterCost,
} from '../utils/kenyaLocations';

export default function CreatePoolModal({ isOpen, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    origin: 'Machakos Hub (Town Center)',
    destination: 'Nairobi Industrial Area',
    produceType: '',
    vehicleType: '1-Ton Pickup (Canter Mini)',
    maxCapacityKg: 1000,
    baseTruckCost: 3500,
    distanceKm: 64,
    middlemanPricePerKg: 20,
    processorPricePerKg: 45,
    departureWindow: '',
  });
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    async function updateRouteDistance() {
      const originPt = findLocationCoords(formData.origin);
      const destPt = findLocationCoords(formData.destination);
      if (!originPt || !destPt) return;

      setCalculatingRoute(true);
      const route = await fetchDrivingRoute([originPt, destPt]);
      if (active && route.distanceKm > 0) {
        const autoCost = calculateDistanceCharterCost(
          route.distanceKm,
          Number(formData.maxCapacityKg) || 1000
        );
        setFormData((prev) => ({
          ...prev,
          distanceKm: route.distanceKm,
          baseTruckCost: autoCost,
        }));
      }
      if (active) setCalculatingRoute(false);
    }

    updateRouteDistance();
    return () => {
      active = false;
    };
  }, [formData.origin, formData.destination, formData.maxCapacityKg, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onCreate(formData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Launch New Truck Pool</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <datalist id="kenya-hubs-list">
          {KENYA_LOCATIONS.map((loc) => (
            <option key={loc.name} value={loc.name} />
          ))}
        </datalist>

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Origin Hub</label>
              <input
                type="text"
                list="kenya-hubs-list"
                name="origin"
                required
                value={formData.origin}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Destination Processor
              </label>
              <input
                type="text"
                list="kenya-hubs-list"
                name="destination"
                required
                value={formData.destination}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Live Road Distance & Auto-Pricing Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-900">
              <Route className="w-4 h-4 text-emerald-600" />
              {calculatingRoute
                ? 'Calculating highway distance...'
                : `Road Distance: ${formData.distanceKm} km`}
            </span>
            <span className="flex items-center gap-1 font-bold text-emerald-700">
              <Calculator className="w-3.5 h-3.5" />
              Est. Charter: KSh {Number(formData.baseTruckCost).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Produce Commodity
              </label>
              <input
                type="text"
                name="produceType"
                required
                placeholder="e.g., Tomatoes (Grade A)"
                value={formData.produceType}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Departure Schedule
              </label>
              <input
                type="text"
                name="departureWindow"
                required
                placeholder="e.g., Tomorrow, 6:00 AM"
                value={formData.departureWindow}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Capacity (kg)</label>
              <input
                type="number"
                name="maxCapacityKg"
                min="200"
                step="100"
                required
                value={formData.maxCapacityKg}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Truck Charter (KSh)
              </label>
              <input
                type="number"
                name="baseTruckCost"
                min="500"
                step="50"
                required
                value={formData.baseTruckCost}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Type</label>
              <input
                type="text"
                name="vehicleType"
                required
                value={formData.vehicleType}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Farmgate Middleman (KSh/kg)
              </label>
              <input
                type="number"
                name="middlemanPricePerKg"
                min="1"
                required
                value={formData.middlemanPricePerKg}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Processor Gate (KSh/kg)
              </label>
              <input
                type="number"
                name="processorPricePerKg"
                min="1"
                required
                value={formData.processorPricePerKg}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {saving ? 'Publishing...' : 'Publish Live Pool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}