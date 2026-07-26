import React from 'react';

interface PachamamaLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const PachamamaLogo: React.FC<PachamamaLogoProps> = ({
  className = '',
  size = 40,
  showText = true,
}) => {
  const numericSize = typeof size === 'number' ? size : undefined;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Pachamama Octagon Prism Vector Logo */}
      <svg
        width={numericSize}
        height={numericSize}
        style={typeof size === 'string' ? { width: size, height: 'auto' } : undefined}
        viewBox="-6 -6 112 112"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
      >
        {/* Far Left Diamond (Yellow / Gold) */}
        <polygon
          points="15,15 0,50 15,85 32,50"
          fill="#E8A843"
          stroke="#000000"
          strokeWidth="4.5"
          strokeLinejoin="miter"
        />
        {/* Far Right Diamond (Emerald Green) */}
        <polygon
          points="85,15 100,50 85,85 68,50"
          fill="#13A25A"
          stroke="#000000"
          strokeWidth="4.5"
          strokeLinejoin="miter"
        />
        {/* Upper Left Sky Blue Facet */}
        <polygon
          points="50,0 15,15 32,50"
          fill="#1AA0E6"
          stroke="#000000"
          strokeWidth="4.5"
          strokeLinejoin="miter"
        />
        {/* Upper Right Sky Blue Facet */}
        <polygon
          points="50,0 85,15 68,50"
          fill="#1AA0E6"
          stroke="#000000"
          strokeWidth="4.5"
          strokeLinejoin="miter"
        />
        {/* Lower Left Sky Blue Facet */}
        <polygon
          points="50,100 15,85 32,50"
          fill="#1AA0E6"
          stroke="#000000"
          strokeWidth="4.5"
          strokeLinejoin="miter"
        />
        {/* Lower Right Sky Blue Facet */}
        <polygon
          points="50,100 85,85 68,50"
          fill="#1AA0E6"
          stroke="#000000"
          strokeWidth="4.5"
          strokeLinejoin="miter"
        />
        {/* Center Diamond (Pink / Terracotta) */}
        <polygon
          points="50,0 68,50 50,100 32,50"
          fill="#DE7B7B"
          stroke="#000000"
          strokeWidth="4.5"
          strokeLinejoin="miter"
        />

        {/* Outer Heavy Octagon Border */}
        <polygon
          points="50,0 85,15 100,50 85,85 50,100 15,85 0,50 15,15"
          fill="none"
          stroke="#000000"
          strokeWidth="6"
          strokeLinejoin="miter"
        />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-black text-xl md:text-2xl tracking-wider text-white uppercase font-sans">
            PACHAMAMA
          </span>
          <span className="text-[10px] md:text-xs font-black tracking-[0.25em] text-[#E8A843] uppercase flex items-center gap-1">
            ESCALADA
          </span>
        </div>
      )}
    </div>
  );
};
