import React from 'react';

interface CijelLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const CijelLogo: React.FC<CijelLogoProps> = ({
  className = '',
  size = 40,
  showText = true,
}) => {
  const numericSize = typeof size === 'number' ? size : undefined;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 🌌 CIJEL 2026 VECTOR LOGO */}
      <svg
        width={numericSize ? Math.round(numericSize * 2.4) : undefined}
        height={numericSize}
        style={typeof size === 'string' ? { width: size, height: 'auto' } : { height: `${numericSize}px`, width: 'auto' }}
        viewBox="0 0 240 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-[0_4px_20px_rgba(26,160,230,0.6)] max-w-full"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="cijelTextGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1AA0E6" />
            <stop offset="40%" stopColor="#3B82F6" />
            <stop offset="70%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          <linearGradient id="yearTextGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>

          <linearGradient id="slashGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="50%" stopColor="#E11D48" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          {/* Star Field Pattern */}
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Cosmic Star Sparks */}
        <circle cx="15" cy="20" r="1.5" fill="#FFFFFF" opacity="0.8" />
        <circle cx="220" cy="18" r="1.2" fill="#38BDF8" opacity="0.9" />
        <circle cx="180" cy="85" r="1.5" fill="#F43F5E" opacity="0.7" />
        <circle cx="30" cy="75" r="1" fill="#FACC15" opacity="0.8" />
        <path d="M110 8 L112 12 L116 14 L112 16 L110 20 L108 16 L104 14 L108 12 Z" fill="#FFFFFF" opacity="0.8" />

        {/* 🧗 LOW-POLY GEOMETRIC CLIMBER (Cyan, Blue, Magenta, Pink, Orange, Yellow Facets) */}
        <g id="climber-facets">
          {/* Head & Upper Reach */}
          <polygon points="62,6 70,12 65,22 55,16" fill="#06B6D4" />
          <polygon points="70,12 78,8 74,20 65,22" fill="#3B82F6" />
          
          {/* Upper Arms & Back */}
          <polygon points="78,8 86,2 82,14" fill="#E11D48" />
          <polygon points="86,2 92,10 82,14" fill="#F59E0B" />
          <polygon points="55,16 65,22 58,34 48,26" fill="#0284C7" />
          <polygon points="65,22 74,20 70,36 58,34" fill="#8B5CF6" />
          <polygon points="74,20 84,26 70,36" fill="#EC4899" />
          
          {/* Torso & Core */}
          <polygon points="48,26 58,34 50,48 40,38" fill="#0284C7" />
          <polygon points="58,34 70,36 64,52 50,48" fill="#D946EF" />
          <polygon points="70,36 82,42 76,56 64,52" fill="#F43F5E" />
          <polygon points="82,42 90,32 86,48 76,56" fill="#F97316" />

          {/* Lower Body & Hips */}
          <polygon points="40,38 50,48 42,62 32,50" fill="#0369A1" />
          <polygon points="50,48 64,52 56,68 42,62" fill="#C026D3" />
          <polygon points="64,52 76,56 70,72 56,68" fill="#E11D48" />
          
          {/* Legs & Dynamic Extension */}
          <polygon points="32,50 42,62 30,76 20,62" fill="#0284C7" />
          <polygon points="42,62 56,68 46,84 30,76" fill="#9333EA" />
          <polygon points="56,68 70,72 60,88 46,84" fill="#F43F5E" />
          <polygon points="70,72 82,78 74,92 60,88" fill="#F59E0B" />
          
          {/* Dynamic Speed Trails / Sparks */}
          <polygon points="20,62 30,76 12,82" fill="#06B6D4" opacity="0.9" />
          <polygon points="12,82 30,76 22,94" fill="#38BDF8" opacity="0.8" />
          <polygon points="74,92 82,78 92,90" fill="#FACC15" />
        </g>

        {/* ⚡ SPEED SLASH / BASE MOTION BANNER */}
        <polygon points="45,86 235,52 230,62 30,92" fill="url(#slashGrad)" />
        <polygon points="70,82 238,48 234,54 55,88" fill="#FACC15" opacity="0.9" />

        {/* 🔤 "CIJEL" FUTURISTIC BOLD LOGO TEXT */}
        <g id="cijel-text">
          {/* 3D Drop Shadow */}
          <text
            x="86"
            y="52"
            fill="#000000"
            fontSize="46"
            fontWeight="900"
            fontFamily="sans-serif"
            fontStyle="italic"
            letterSpacing="1"
            opacity="0.8"
          >
            CIJEL
          </text>
          
          {/* Gradient Text Fill */}
          <text
            x="84"
            y="50"
            fill="url(#cijelTextGrad)"
            stroke="#000000"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fontSize="46"
            fontWeight="900"
            fontFamily="sans-serif"
            fontStyle="italic"
            letterSpacing="1"
          >
            CIJEL
          </text>
        </g>

        {/* 🔢 "2026" YEAR TEXT */}
        <text
          x="125"
          y="76"
          fill="url(#yearTextGrad)"
          stroke="#000000"
          strokeWidth="2"
          fontSize="26"
          fontWeight="900"
          fontFamily="sans-serif"
          fontStyle="italic"
          letterSpacing="3"
        >
          2026
        </text>

        {/* 🏷️ BLACK SUBTITLE BANNER */}
        <rect
          x="75"
          y="80"
          width="160"
          height="16"
          rx="3"
          fill="#000000"
          stroke="url(#slashGrad)"
          strokeWidth="1"
        />
        <text
          x="80"
          y="92"
          fill="#FFFFFF"
          fontSize="6.8"
          fontWeight="900"
          fontFamily="sans-serif"
          letterSpacing="0.4"
        >
          CAMPEONATO INFANTO JUVENIL ESCALADA LITORAL
        </text>
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-black text-xl md:text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#1AA0E6] via-[#EC4899] to-[#F59E0B] uppercase font-sans">
            CIJEL 2026
          </span>
          <span className="text-[9px] md:text-[10px] font-black tracking-[0.18em] text-[#38BDF8] uppercase">
            CAMPEONATO ESCALADA LITORAL
          </span>
        </div>
      )}
    </div>
  );
};
