import React from 'react';
import logoCijel from '../assets/logo_cijel.png';

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
      {/* 🌌 CIJEL 2026 TRANSPARENT PNG LOGO */}
      <img
        src={logoCijel}
        alt="CIJEL 2026"
        style={typeof size === 'string' ? { width: size, height: 'auto' } : { height: `${numericSize}px`, width: 'auto' }}
        className="shrink-0 drop-shadow-[0_4px_16px_rgba(26,160,230,0.3)] max-w-full object-contain"
      />
    </div>
  );
};
