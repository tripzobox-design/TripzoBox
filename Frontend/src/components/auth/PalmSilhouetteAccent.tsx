import React from 'react';

export const PalmSilhouetteAccent: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none absolute bottom-0 right-0 overflow-hidden ${className}`}
    >
      <svg
        width="220"
        height="180"
        viewBox="0 0 220 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-36 h-28 sm:w-52 sm:h-40 text-emerald-800/25"
      >
        {/* Dune base */}
        <path
          d="M0 180 C60 175 140 160 220 170 L220 180 L0 180 Z"
          fill="#0F9058"
          fillOpacity="0.25"
        />
        {/* Palm tree 1 trunk */}
        <path
          d="M175 175 Q165 110 148 70"
          stroke="#0F9058"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeOpacity="0.55"
        />
        {/* Palm tree 1 fronds */}
        <path
          d="M148 70 Q130 50 100 58 Q130 65 148 70"
          fill="#10B981"
          fillOpacity="0.45"
        />
        <path
          d="M148 70 Q135 35 120 28 Q138 45 148 70"
          fill="#059669"
          fillOpacity="0.5"
        />
        <path
          d="M148 70 Q155 30 152 20 Q158 45 148 70"
          fill="#10B981"
          fillOpacity="0.45"
        />
        <path
          d="M148 70 Q175 40 185 35 Q172 55 148 70"
          fill="#047857"
          fillOpacity="0.55"
        />
        <path
          d="M148 70 Q185 65 200 75 Q175 80 148 70"
          fill="#059669"
          fillOpacity="0.5"
        />
        <path
          d="M148 70 Q170 85 185 105 Q165 95 148 70"
          fill="#34D399"
          fillOpacity="0.45"
        />

        {/* Smaller Palm Tree 2 */}
        <path
          d="M195 178 Q190 135 182 105"
          stroke="#0F9058"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />
        <path
          d="M182 105 Q170 90 152 95 Q170 100 182 105"
          fill="#10B981"
          fillOpacity="0.4"
        />
        <path
          d="M182 105 Q180 80 172 75 Q182 92 182 105"
          fill="#059669"
          fillOpacity="0.45"
        />
        <path
          d="M182 105 Q200 85 212 88 Q198 98 182 105"
          fill="#047857"
          fillOpacity="0.5"
        />
        <path
          d="M182 105 Q205 105 218 118 Q198 118 182 105"
          fill="#34D399"
          fillOpacity="0.4"
        />
      </svg>
    </div>
  );
};

