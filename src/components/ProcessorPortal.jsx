import React from 'react';
import { Factory, CheckCircle, TrendingUp } from 'lucide-react';

export default function ProcessorPortal({ pools }) {
  const totalAggregatedKg = pools.reduce((sum, p) => sum + p.currentWeightKg, 0);
  const totalFarmers = pools.reduce((sum, p) => sum + p.bookings.length, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-xs uppercase tracking-wider">
            <Factory className="w-4 h-4" /> B2B Off-Taker & Factory View
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Inbound Aggregated Supply Manifest
          </h2>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 block">Verified Inbound Volume</span>
            <span className="text-lg font-bold text-slate-900">
              {totalAggregatedKg.toLocaleString()} kg
            </span>
          </div>
          <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
            <span className="text-xs text-green-700 block">Smallholders Connected</span>
            <span className="text-lg font-bold text-green-800">{totalFarmers} Farmers</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="py-3 px-3">Corridor</th>
              <th className="py-3 px-3">Commodity</th>
              <th className="py-3 px-3">Pooled Volume</th>
              <th className="py-3 px-3">Factory Gate Price</th>
              <th className="py-3 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pools.map((p) => (
              <tr key={p.id}>
                <td className="py-3 px-3 font-medium text-slate-900">{p.corridor}</td>
                <td className="py-3 px-3 text-slate-700">{p.produceType}</td>
                <td className="py-3 px-3 font-semibold text-green-700">
                  {p.currentWeightKg} / {p.maxCapacityKg} kg
                </td>
                <td className="py-3 px-3 text-slate-700">KSh {p.processorPricePerKg}/kg</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Quality Graded at Hub
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 text-xs text-amber-900">
        <TrendingUp className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Revenue Stream Active:</strong> Processors pay a monthly SaaS subscription + 7.5%
          logistics facilitation fee for guaranteed, pre-graded full-truck deliveries directly to
          factory receiving bays.
        </div>
      </div>
    </div>
  );
}
