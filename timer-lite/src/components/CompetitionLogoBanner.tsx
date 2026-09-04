import React from 'react';
import { CijelLogo } from './CijelLogo';
import { PachamamaLogo } from './PachamamaLogo';
import type { CompetitionLogoConfig } from '../types';

interface CompetitionLogoBannerProps {
  config: CompetitionLogoConfig;
  className?: string;
  style?: React.CSSProperties;
}

export const CompetitionLogoBanner: React.FC<CompetitionLogoBannerProps> = ({
  config,
  className = '',
  style = {},
}) => {
  if (config.type === 'none') return null;

  let maskStyle: React.CSSProperties = {};
  if (config.featherEdges) {
    let stopPercentage = '82%';
    if (config.featherIntensity === 'soft') stopPercentage = '90%';
    if (config.featherIntensity === 'medium') stopPercentage = '80%';
    if (config.featherIntensity === 'strong') stopPercentage = '68%';

    const maskValue = `radial-gradient(ellipse at center, rgba(0,0,0,1) ${stopPercentage}, rgba(0,0,0,0) 100%)`;
    maskStyle = {
      maskImage: maskValue,
      WebkitMaskImage: maskValue,
    };
  }

  const targetHeight = config.maxHeightPx || 80;

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s',
        height: targetHeight,
        maxHeight: targetHeight,
        ...maskStyle,
        ...style
      }}
    >
      {config.type === 'cijel' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', transition: 'all 0.2s',
          ...(config.featherEdges ? {} : { background: 'rgba(0,0,0,0.4)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', padding: '0 12px' })
        }}>
          <CijelLogo size={targetHeight} showText={false} />
        </div>
      )}

      {config.type === 'pachamama' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', transition: 'all 0.2s',
          ...(config.featherEdges ? {} : { background: 'rgba(0,0,0,0.4)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', padding: '0 12px' })
        }}>
          <PachamamaLogo size={targetHeight} showText={false} />
        </div>
      )}

      {config.type === 'custom' && config.customUrl && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', transition: 'all 0.2s', maxWidth: '100%',
          ...(config.featherEdges ? {} : { background: 'rgba(0,0,0,0.4)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', padding: '0 12px' })
        }}>
          <img
            src={config.customUrl}
            alt="Logotipo Oficial"
            style={{ objectFit: 'contain', width: 'auto', height: '100%', maxHeight: targetHeight, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
          />
        </div>
      )}

      {config.type === 'custom' && !config.customUrl && (
        <div style={{ fontSize: 12, color: '#FBBF24', fontFamily: 'monospace', padding: '8px', background: 'rgba(0,0,0,0.6)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.3)' }}>
          ⚠️ Sin logo
        </div>
      )}
    </div>
  );
};
