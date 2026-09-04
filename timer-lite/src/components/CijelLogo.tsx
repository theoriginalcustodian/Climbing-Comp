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
  showText = false,
}) => {
  const numericSize = typeof size === 'string' ? parseInt(size, 10) || 40 : size;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoCijel}
        alt="CIJEL 2026"
        style={{
          height: `${numericSize}px`,
          width: 'auto',
          objectFit: 'contain',
        }}
      />
    </div>
  );
};
