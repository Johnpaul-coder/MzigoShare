import React from 'react';

export default function Logo({ size = 'md', light = false }) {
  const dims = size === 'lg' ? 'w-10 h-10' : 'w-9 h-9';
  const textSize = size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <div
        className={`${dims} rounded-xl bg-gradient-to-br from-emerald-600 to-green-800 flex items-center justify-center shadow-sm border border-emerald-500/30 shrink-0`}
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
        >
          {/* Shared Route Arc */}
          <path
            d="M7 24C7 17.5 12 13 18 13C24 13 29 17.5 29 24"
            stroke="#A7F3D0"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="3 3"
          />
          {/* Produce Crate / Cargo Box */}
          <rect
            x="11"
            y="16"
            width="14"
            height="11"
            rx="2.5"
            fill="#FFFFFF"
          />
          <path
            d="M11 20H25"
            stroke="#059669"
            strokeWidth="1.8"
          />
          {/* Leaf Sprout on Top */}
          <path
            d="M18 15C18 11.5 21 9 24.5 9.5C24.5 13 22 15.5 18 15Z"
            fill="#FBBF24"
          />
          <path
            d="M18 15C18 12.2 15.5 10.2 12.5 10.7C12.5 13.5 14.8 15.5 18 15Z"
            fill="#34D399"
          />
          {/* Hub Nodes */}
          <circle cx="7" cy="24" r="2.3" fill="#FBBF24" />
          <circle cx="29" cy="24" r="2.3" fill="#34D399" />
        </svg>
      </div>

      <div className="leading-none">
        <div className={`font-extrabold tracking-tight ${textSize} ${light ? 'text-white' : 'text-slate-900'}`}>
          Mzigo<span className="text-emerald-600">Share</span>
        </div>
        <div className={`text-[10px] font-semibold tracking-widest uppercase mt-0.5 ${light ? 'text-emerald-300' : 'text-slate-500'}`}>
          Agri-Logistics Pool
        </div>
      </div>
    </div>
  );
}