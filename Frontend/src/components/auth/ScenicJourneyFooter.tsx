import React from 'react';

export const ScenicJourneyFooter: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`w-full relative overflow-hidden select-none pointer-events-none ${className}`}>
      {/* Calligraphy Script Tagline */}
      <div className="text-center sm:text-right sm:pr-12 pb-1 relative z-10">
        <span
          className="font-heading italic font-bold text-xl sm:text-2xl text-emerald-800/90 tracking-wide drop-shadow-xs"
          style={{ fontFamily: '"Plus Jakarta Sans", "Georgia", cursive' }}
        >
          Back to your journey!
        </span>
      </div>

      <svg
        viewBox="0 0 1000 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-24 sm:h-32 object-cover object-bottom"
        preserveAspectRatio="none"
      >
        {/* Sky / Distant soft haze */}
        <path
          d="M0 180 L0 100 Q250 80 500 110 T1000 90 L1000 180 Z"
          fill="#E2F5ED"
          fillOpacity="0.5"
        />

        {/* Birds flying */}
        <path
          d="M680 50 Q690 42 700 48 Q710 42 720 50"
          stroke="#0F9058"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity="0.6"
          fill="none"
        />
        <path
          d="M730 40 Q738 34 746 39 Q754 34 762 40"
          stroke="#0F9058"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeOpacity="0.5"
          fill="none"
        />
        <path
          d="M650 62 Q657 56 664 61 Q671 56 678 62"
          stroke="#0F9058"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeOpacity="0.45"
          fill="none"
        />

        {/* Distant Mountain Range */}
        <path
          d="M0 180 L0 120 Q120 70 280 110 T650 95 Q820 60 1000 110 L1000 180 Z"
          fill="#B6E5D1"
          fillOpacity="0.5"
        />

        {/* Midground Hills */}
        <path
          d="M0 180 L0 135 Q180 100 380 130 T800 120 Q920 105 1000 130 L1000 180 Z"
          fill="#7ED4AE"
          fillOpacity="0.45"
        />

        {/* Foreground Lake / Water Line */}
        <path
          d="M0 180 L0 155 Q250 145 550 155 T1000 150 L1000 180 Z"
          fill="#A7F3D0"
          fillOpacity="0.6"
        />

        {/* Left Shore with Palms */}
        <path
          d="M-20 180 Q60 150 120 180 Z"
          fill="#10B981"
          fillOpacity="0.55"
        />
        {/* Palm tree on left */}
        <path
          d="M35 180 Q45 155 42 140"
          stroke="#065F46"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />
        <path
          d="M42 140 Q30 130 18 135 Q32 138 42 140"
          fill="#059669"
          fillOpacity="0.75"
        />
        <path
          d="M42 140 Q40 122 32 118 Q42 128 42 140"
          fill="#047857"
          fillOpacity="0.8"
        />
        <path
          d="M42 140 Q55 125 65 130 Q52 135 42 140"
          fill="#059669"
          fillOpacity="0.7"
        />

        {/* Right Tropical Shore with Palms */}
        <path
          d="M860 180 Q920 152 1020 175 L1020 180 Z"
          fill="#10B981"
          fillOpacity="0.55"
        />
        {/* Palm tree 1 on right */}
        <path
          d="M930 180 Q922 150 918 128"
          stroke="#065F46"
          strokeWidth="3"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />
        <path
          d="M918 128 Q900 115 880 122 Q902 126 918 128"
          fill="#059669"
          fillOpacity="0.8"
        />
        <path
          d="M918 128 Q915 106 905 100 Q918 114 918 128"
          fill="#047857"
          fillOpacity="0.85"
        />
        <path
          d="M918 128 Q932 108 945 114 Q930 122 918 128"
          fill="#059669"
          fillOpacity="0.8"
        />
        <path
          d="M918 128 Q938 124 955 135 Q935 134 918 128"
          fill="#10B981"
          fillOpacity="0.8"
        />

        {/* Palm tree 2 on right (taller) */}
        <path
          d="M960 180 Q955 145 950 118"
          stroke="#065F46"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />
        <path
          d="M950 118 Q935 105 920 110 Q938 115 950 118"
          fill="#059669"
          fillOpacity="0.8"
        />
        <path
          d="M950 118 Q955 98 948 92 Q954 105 950 118"
          fill="#047857"
          fillOpacity="0.85"
        />
        <path
          d="M950 118 Q965 100 978 106 Q965 112 950 118"
          fill="#10B981"
          fillOpacity="0.8"
        />
      </svg>
    </div>
  );
};

