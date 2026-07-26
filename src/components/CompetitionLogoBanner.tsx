import React from 'react';
import { CijelLogo } from './CijelLogo';
import { PachamamaLogo } from './PachamamaLogo';

export interface CompetitionLogoConfig {
  type: 'cijel' | 'pachamama' | 'custom' | 'none';
  customUrl?: string;
  featherEdges: boolean;
  featherIntensity: 'soft' | 'medium' | 'strong';
  maxHeightPx?: number;
}

interface CompetitionLogoBannerProps {
  config: CompetitionLogoConfig;
  className?: string;
}

export const CompetitionLogoBanner: React.FC<CompetitionLogoBannerProps> = ({
  config,
  className = '',
}) => {
  if (config.type === 'none') return null;

  // Compute mask gradient for edge feathering / difuminado corto en los bordes
  let maskStyle: React.CSSProperties = {};
  if (config.featherEdges) {
    let stopPercentage = '82%';
    if (config.featherIntensity === 'soft') stopPercentage = '90%';
    if (config.featherIntensity === 'medium') stopPercentage = '80%';
    if (config.featherIntensity === 'strong') stopPercentage = '68%';

    // Radial gradient centered mask for soft edge vignette / feather
    const maskValue = `radial-gradient(ellipse at center, rgba(0,0,0,1) ${stopPercentage}, rgba(0,0,0,0) 100%)`;
    maskStyle = {
      maskImage: maskValue,
      WebkitMaskImage: maskValue,
    };
  }

  const targetHeight = config.maxHeightPx || 80;

  return (
    <div
      className={`inline-flex items-center justify-center relative overflow-hidden transition-all duration-200 ${className}`}
      style={{
        ...maskStyle,
        height: `${targetHeight}px`,
        maxHeight: `${targetHeight}px`,
      }}
    >
      {config.type === 'cijel' && (
        <div className={`flex items-center justify-center h-full transition ${
          config.featherEdges
            ? 'bg-transparent'
            : 'bg-black/40 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md px-3'
        }`}>
          <CijelLogo size={targetHeight} showText={false} />
        </div>
      )}

      {config.type === 'pachamama' && (
        <div className={`flex items-center justify-center h-full transition ${
          config.featherEdges
            ? 'bg-transparent'
            : 'bg-black/40 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md px-3'
        }`}>
          <PachamamaLogo size={targetHeight} showText={false} />
        </div>
      )}

      {config.type === 'custom' && config.customUrl && (
        <div className={`flex items-center justify-center h-full transition max-w-full ${
          config.featherEdges
            ? 'bg-transparent'
            : 'bg-black/40 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md px-3'
        }`}>
          <img
            src={config.customUrl}
            alt="Logotipo Oficial de la Competencia"
            className="object-contain w-auto h-full max-w-full transition-all drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
            style={{ height: `${targetHeight}px`, maxHeight: `${targetHeight}px` }}
          />
        </div>
      )}

      {config.type === 'custom' && !config.customUrl && (
        <div className="text-xs text-amber-400 font-mono p-2 bg-black/60 rounded-xl border border-amber-500/30 shadow-md">
          ⚠️ Sube un logotipo en Ajustes &gt; Skins
        </div>
      )}
    </div>
  );
};
