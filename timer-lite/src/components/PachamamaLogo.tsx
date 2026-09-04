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
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className={className}>
      <svg
        width={numericSize}
        height={numericSize}
        style={typeof size === 'string' ? { width: size, height: 'auto' } : { flexShrink: 0, filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.6))' }}
        viewBox="-6 -6 112 112"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon points="15,15 0,50 15,85 32,50" fill="#E8A843" stroke="#000" strokeWidth="4.5" strokeLinejoin="miter" />
        <polygon points="85,15 100,50 85,85 68,50" fill="#13A25A" stroke="#000" strokeWidth="4.5" strokeLinejoin="miter" />
        <polygon points="50,0 15,15 32,50" fill="#1AA0E6" stroke="#000" strokeWidth="4.5" strokeLinejoin="miter" />
        <polygon points="50,0 85,15 68,50" fill="#1AA0E6" stroke="#000" strokeWidth="4.5" strokeLinejoin="miter" />
        <polygon points="50,100 15,85 32,50" fill="#1AA0E6" stroke="#000" strokeWidth="4.5" strokeLinejoin="miter" />
        <polygon points="50,100 85,85 68,50" fill="#1AA0E6" stroke="#000" strokeWidth="4.5" strokeLinejoin="miter" />
        <polygon points="50,0 68,50 50,100 32,50" fill="#DE7B7B" stroke="#000" strokeWidth="4.5" strokeLinejoin="miter" />
        <polygon points="50,0 85,15 100,50 85,85 50,100 15,85 0,50 15,15" fill="none" stroke="#000" strokeWidth="6" strokeLinejoin="miter" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontWeight: 900, fontSize: '1.25rem', letterSpacing: '0.05em', color: '#fff', textTransform: 'uppercase' }}>
            PACHAMAMA
          </span>
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.25em', color: '#E8A843', textTransform: 'uppercase' }}>
            ESCALADA
          </span>
        </div>
      )}
    </div>
  );
};
