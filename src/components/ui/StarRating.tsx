import React, { useState } from 'react';
import { Star } from 'lucide-react';

export interface StarRatingProps {
  value?: number;
  onChange?: (val: number) => void;
  max?: number;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({
  value = 5,
  onChange,
  max = 5,
  readOnly = false,
  size = 'md',
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const currentValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="inline-flex items-center gap-1 select-none">
      {Array.from({ length: max }).map((_, index) => {
        const starNumber = index + 1;
        const isFilled = starNumber <= currentValue;

        return (
          <button
            key={starNumber}
            type="button"
            disabled={readOnly}
            onClick={() => onChange && onChange(starNumber)}
            onMouseEnter={() => !readOnly && setHoverValue(starNumber)}
            onMouseLeave={() => !readOnly && setHoverValue(null)}
            className={`transition-transform duration-100 ${
              readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
            aria-label={`${starNumber} stars`}
          >
            <Star
              className={`${sizeClasses[size]} ${
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-gray-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};
