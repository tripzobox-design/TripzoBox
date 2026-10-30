import React from 'react';

export const BotanicalLeavesAccent: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none absolute bottom-0 right-0 overflow-hidden ${className}`}
    >
      <svg
        width="220"
        height="190"
        viewBox="0 0 220 190"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-36 h-32 sm:w-52 sm:h-44 text-primary/30"
      >
        {/* Main stem */}
        <path
          d="M230 195 C180 170 140 120 120 60 C110 35 105 10 102 0"
          stroke="#0F9058"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />
        {/* Secondary stem */}
        <path
          d="M170 180 C150 145 130 105 105 80 C80 55 60 40 40 30"
          stroke="#0F9058"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.35"
        />
        {/* Leaf 1 */}
        <path
          d="M102 0 C95 20 85 30 75 32 C90 35 105 25 102 0 Z"
          fill="#10B981"
          fillOpacity="0.38"
        />
        {/* Leaf 2 */}
        <path
          d="M110 25 C128 20 145 28 152 40 C140 45 125 40 110 25 Z"
          fill="#059669"
          fillOpacity="0.45"
        />
        {/* Leaf 3 */}
        <path
          d="M120 55 C100 58 88 72 85 88 C100 82 115 72 120 55 Z"
          fill="#34D399"
          fillOpacity="0.4"
        />
        {/* Leaf 4 */}
        <path
          d="M130 65 C152 65 170 80 174 95 C158 98 142 90 130 65 Z"
          fill="#059669"
          fillOpacity="0.5"
        />
        {/* Leaf 5 */}
        <path
          d="M142 100 C125 110 118 128 120 145 C132 135 142 120 142 100 Z"
          fill="#10B981"
          fillOpacity="0.42"
        />
        {/* Leaf 6 */}
        <path
          d="M155 115 C178 120 195 138 198 155 C182 155 168 145 155 115 Z"
          fill="#047857"
          fillOpacity="0.48"
        />
        {/* Leaf 7 */}
        <path
          d="M175 148 C160 162 158 178 162 192 C172 182 180 168 175 148 Z"
          fill="#34D399"
          fillOpacity="0.4"
        />
        {/* Leaf 8 */}
        <path
          d="M40 30 C30 45 25 60 28 72 C38 65 42 50 40 30 Z"
          fill="#10B981"
          fillOpacity="0.35"
        />
        {/* Leaf 9 */}
        <path
          d="M60 40 C75 35 90 45 92 58 C80 62 70 55 60 40 Z"
          fill="#059669"
          fillOpacity="0.4"
        />
        {/* Leaf 10 */}
        <path
          d="M80 58 C68 70 65 88 70 100 C80 90 85 75 80 58 Z"
          fill="#34D399"
          fillOpacity="0.38"
        />
        {/* Leaf 11 */}
        <path
          d="M105 80 C122 80 135 92 138 105 C125 108 112 100 105 80 Z"
          fill="#047857"
          fillOpacity="0.45"
        />
      </svg>
    </div>
  );
};

