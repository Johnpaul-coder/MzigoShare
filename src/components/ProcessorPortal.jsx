import React from 'react';
import { Factory, CheckCircle2, PackageCheck } from 'lucide-react';

export default function ProcessorPortal({ pools }) {
  const allManifests = pools.flatMap((pool) =>
    (pool.bookings || []).map((b) => ({
      ...b,
      corridor: pool.corridor,
      produceType: pool.produceType,
      destination: pool.destination,
      processorPricePerKg: pool.processorPricePerKg,
      departureWindow: pool.departureWindow,
    }))
  );

  const totalIncomingKg = allManifests.reduce((sum, item) => sum + (Number(item.weightKg) || 0), 0);
  const totalGateValue = allManifests.reduce(
    (sum, item) => sum + (Number(item.weightKg) || 0) * (Number(item.processorPricePerKg) || 0),
    0
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Factory className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Agro-Processor Off-Taker Gate Manifest
            </h2>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Live incoming consolidated truckloads verified at origin hubs for direct gate payout.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-right">
            <div className="text-[11px] uppercase font-bold text-slate-500">Total Incoming Load</div>
            <div className="text-base font-bold text-slate-900">
              {totalIncomingKg.toLocaleString()} kg
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-right">
            <div className="text-[11px] uppercase font-bold text-emerald-700">Direct Payout Value</div>
            <div className="text-base font-bold text-emerald-900">
              KSh {totalGateValue.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {allManifests.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
          <PackageCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          No incoming farmer consignments recorded yet. Book a load on the Farmer tab to populate
          the processor manifest.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 bg-slate-50">
                <th className="py-3 px-4">Farmer & Origin</th>
                <th className="py-3 px-4">Corridor / Destination</th>
                <th className="py-3 px-4">Commodity</th>
                <th className="py-3 px-4">Net Weight</th>
                <th className="py-3 px-4">Gate Payout</th>
                <th className="py-3 px-4">Channel & Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allManifests.map((item) => {
                const payout = (Number(item.weightKg) || 0) * (Number(item.processorPricePerKg) || 0);
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.farmerName}</div>
                      <div className="text-xs text-slate-500">{item.village}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700">{item.corridor}</td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-800">{item.produceType}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.weightKg} kg</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      KSh {payout.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> {item.channel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}