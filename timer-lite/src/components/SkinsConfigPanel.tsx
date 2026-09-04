import React from 'react';
import { Palette, Sparkles } from 'lucide-react';
import { CijelLogo } from './CijelLogo';
import { PachamamaLogo } from './PachamamaLogo';
import { CompetitionLogoBanner } from './CompetitionLogoBanner';
import type { CompetitionLogoConfig } from '../types';

interface SkinsConfigPanelProps {
  bgTheme: 'pachamama' | 'cijel';
  setBgTheme: (theme: 'pachamama' | 'cijel') => void;
  bgOpacity: number;
  setBgOpacity: (opacity: number) => void;
  logoConfig: CompetitionLogoConfig;
  setLogoConfig: (config: CompetitionLogoConfig) => void;
}

export const SkinsConfigPanel: React.FC<SkinsConfigPanelProps> = ({
  bgTheme, setBgTheme, bgOpacity, setBgOpacity, logoConfig, setLogoConfig
}) => {

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setLogoConfig({ ...logoConfig, type: 'custom', customUrl: evt.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* THEMES */}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', color: '#fff', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 0 }}>
          <Palette size={16} color="#ec4899" /> Apariencia y Temas Visuales
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <button onClick={() => { setBgTheme('pachamama'); setLogoConfig({ ...logoConfig, type: 'pachamama' }); }}
            style={{ padding: 20, borderRadius: 16, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 16,
              background: bgTheme === 'pachamama' ? '#1d1f28' : '#15161d',
              border: `1px solid ${bgTheme === 'pachamama' ? '#e8a843' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: bgTheme === 'pachamama' ? '0 0 25px rgba(232,168,67,0.3)' : 'none'
            }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>🏔️ Skin Pachamama</span>
                {bgTheme === 'pachamama' && <span style={{ fontSize: 10, fontWeight: 900, background: '#e8a843', color: '#000', padding: '2px 8px', borderRadius: 6 }}>ACTIVO</span>}
              </div>
              <p style={{ fontSize: 11, color: '#a1a1aa', margin: 0 }}>Paleta clásica de la casa (Verde, Ocre, Terracota).</p>
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#13A25A' }} />
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#E8A843' }} />
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#DE7B7B' }} />
            </div>
          </button>

          <button onClick={() => { setBgTheme('cijel'); setLogoConfig({ ...logoConfig, type: 'cijel' }); }}
            style={{ padding: 20, borderRadius: 16, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 16,
              background: bgTheme === 'cijel' ? '#1d1f28' : '#15161d',
              border: `1px solid ${bgTheme === 'cijel' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: bgTheme === 'cijel' ? '0 0 25px rgba(56,189,248,0.3)' : 'none'
            }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>🌌 Skin CIJEL 2026</span>
                {bgTheme === 'cijel' && <span style={{ fontSize: 10, fontWeight: 900, background: '#38bdf8', color: '#000', padding: '2px 8px', borderRadius: 6 }}>ACTIVO</span>}
              </div>
              <p style={{ fontSize: 11, color: '#a1a1aa', margin: 0 }}>Paleta cósmica oficial (Cian, Rosa, Amarillo).</p>
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#38BDF8' }} />
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#EC4899' }} />
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#FACC15' }} />
            </div>
          </button>
        </div>
      </div>

      {/* OPACITY */}
      <div style={{ paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#d4d4d8', display: 'block' }}>Opacidad del Fondo de Pantalla</span>
            <span style={{ fontSize: 11, color: '#a1a1aa' }}>Ajusta la intensidad de la imagen de fondo.</span>
          </div>
          <span style={{ padding: '4px 12px', background: 'rgba(236,72,153,0.2)', border: '1px solid #ec4899', color: '#ec4899', borderRadius: 12, fontSize: 12, fontWeight: 900, fontFamily: 'monospace' }}>
            {bgOpacity}%
          </span>
        </div>
        <input type="range" min="0" max="100" step="5" value={bgOpacity} onChange={e => setBgOpacity(Number(e.target.value))} style={{ width: '100%', marginBottom: 16 }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
          {[5, 10, 20, 30, 45, 60, 80, 100].map(v => (
            <button key={v} onClick={() => setBgOpacity(v)}
              style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                background: bgOpacity === v ? '#ec4899' : 'rgba(255,255,255,0.05)', color: bgOpacity === v ? '#fff' : '#a1a1aa'
              }}>{v}%</button>
          ))}
        </div>
      </div>

      {/* LOGO CONFIGURATION */}
      <div style={{ paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <h4 style={{ fontSize: 14, fontWeight: 900, color: '#fff', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 4px 0' }}>
          <Sparkles size={16} color="#38bdf8" /> Logotipo Personalizado
        </h4>
        <p style={{ fontSize: 11, color: '#a1a1aa', margin: '0 0 16px 0' }}>Configura la imagen del campeonato que aparecerá en el temporizador.</p>

        {/* LOGO TYPE SELECTOR */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
          <button onClick={() => setLogoConfig({ ...logoConfig, type: 'cijel' })}
            style={{ padding: 12, borderRadius: 16, border: `1px solid ${logoConfig.type === 'cijel' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`, background: logoConfig.type === 'cijel' ? 'rgba(26,160,230,0.2)' : '#15161d', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>1. CIJEL 2026</span>
            <div style={{ background: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center' }}><CijelLogo size={40} showText={false} /></div>
          </button>
          <button onClick={() => setLogoConfig({ ...logoConfig, type: 'pachamama' })}
            style={{ padding: 12, borderRadius: 16, border: `1px solid ${logoConfig.type === 'pachamama' ? '#e8a843' : 'rgba(255,255,255,0.1)'}`, background: logoConfig.type === 'pachamama' ? 'rgba(232,168,67,0.2)' : '#15161d', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>2. Pachamama</span>
            <div style={{ background: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center' }}><PachamamaLogo size={36} showText={false} /></div>
          </button>
          <button onClick={() => setLogoConfig({ ...logoConfig, type: 'custom' })}
            style={{ padding: 12, borderRadius: 16, border: `1px solid ${logoConfig.type === 'custom' ? '#ec4899' : 'rgba(255,255,255,0.1)'}`, background: logoConfig.type === 'custom' ? 'rgba(236,72,153,0.2)' : '#15161d', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>3. Subir Imagen</span>
            <div style={{ background: 'rgba(0,0,0,0.6)', padding: '16px 8px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#ec4899' }}>📁 Imagen Propia</div>
          </button>
          <button onClick={() => setLogoConfig({ ...logoConfig, type: 'none' })}
            style={{ padding: 12, borderRadius: 16, border: `1px solid ${logoConfig.type === 'none' ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, background: logoConfig.type === 'none' ? 'rgba(239,68,68,0.2)' : '#15161d', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>4. Desactivado</span>
            <div style={{ background: 'rgba(0,0,0,0.6)', padding: '16px 8px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#71717a' }}>🚫 Sin Logo</div>
          </button>
        </div>

        {/* CUSTOM URL/UPLOAD */}
        {logoConfig.type === 'custom' && (
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#d4d4d8', display: 'block', marginBottom: 4 }}>Subir Archivo de Imagen</label>
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ width: '100%', padding: 8, background: '#15161d', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontSize: 12, color: '#d4d4d8' }} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#d4d4d8', display: 'block', marginBottom: 4 }}>O Pegar URL de Imagen</label>
              <input type="text" placeholder="https://..." value={logoConfig.customUrl || ''} onChange={e => setLogoConfig({ ...logoConfig, customUrl: e.target.value })} style={{ width: '100%', padding: '9px 12px', background: '#15161d', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, fontSize: 12, color: '#fff', boxSizing: 'border-box' }} />
            </div>
          </div>
        )}

        {/* FEATHERING */}
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#fff', textTransform: 'uppercase', display: 'block' }}>✨ Difuminar Bordes</span>
              <span style={{ fontSize: 11, color: '#a1a1aa' }}>Aplica transparencia en degradado circular hacia las esquinas.</span>
            </div>
            <input type="checkbox" checked={logoConfig.featherEdges} onChange={e => setLogoConfig({ ...logoConfig, featherEdges: e.target.checked })} style={{ width: 20, height: 20 }} />
          </div>
          {logoConfig.featherEdges && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#d4d4d8' }}>Intensidad del Difuminado:</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['soft', 'medium', 'strong'] as const).map(lvl => (
                  <button key={lvl} onClick={() => setLogoConfig({ ...logoConfig, featherIntensity: lvl })}
                    style={{ padding: '6px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                      background: logoConfig.featherIntensity === lvl ? '#22c55e' : 'rgba(255,255,255,0.05)',
                      color: logoConfig.featherIntensity === lvl ? '#000' : '#a1a1aa'
                    }}>
                    {lvl === 'soft' ? 'Suave' : lvl === 'medium' ? 'Medio' : 'Intenso'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SIZES */}
          <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 16 }}>
            {/* Banner Size */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#d4d4d8', display: 'block' }}>Tamaño en Banner (Altura)</span>
                  <span style={{ fontSize: 10, color: '#a1a1aa' }}>Afecta la vista pública.</span>
                </div>
                <span style={{ padding: '2px 8px', background: 'rgba(56,189,248,0.2)', border: '1px solid #38bdf8', color: '#38bdf8', borderRadius: 8, fontSize: 11, fontWeight: 900, fontFamily: 'monospace' }}>{logoConfig.maxHeightPx || 80}px</span>
              </div>
              <input type="range" min="30" max="250" step="5" value={logoConfig.maxHeightPx || 80} onChange={e => setLogoConfig({ ...logoConfig, maxHeightPx: Number(e.target.value) })} style={{ width: '100%', marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {[40, 60, 80, 100, 130, 160, 200].map(h => (
                  <button key={h} onClick={() => setLogoConfig({ ...logoConfig, maxHeightPx: h })}
                    style={{ padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: 'none',
                      background: (logoConfig.maxHeightPx || 80) === h ? '#38bdf8' : 'rgba(255,255,255,0.05)', color: (logoConfig.maxHeightPx || 80) === h ? '#000' : '#a1a1aa'
                    }}>{h}px</button>
                ))}
              </div>
            </div>

            {/* Header Size */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#d4d4d8', display: 'block' }}>Tamaño en Barra Superior (Header)</span>
                  <span style={{ fontSize: 10, color: '#a1a1aa' }}>Afecta al panel de control.</span>
                </div>
                <span style={{ padding: '2px 8px', background: 'rgba(26,160,230,0.2)', border: '1px solid #1aa0e6', color: '#1aa0e6', borderRadius: 8, fontSize: 11, fontWeight: 900, fontFamily: 'monospace' }}>{logoConfig.headerMaxHeightPx || 60}px</span>
              </div>
              <input type="range" min="24" max="120" step="2" value={logoConfig.headerMaxHeightPx || 60} onChange={e => setLogoConfig({ ...logoConfig, headerMaxHeightPx: Number(e.target.value) })} style={{ width: '100%', marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {[24, 32, 42, 60, 80, 100].map(h => (
                  <button key={h} onClick={() => setLogoConfig({ ...logoConfig, headerMaxHeightPx: h })}
                    style={{ padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: 'none',
                      background: (logoConfig.headerMaxHeightPx || 60) === h ? '#1aa0e6' : 'rgba(255,255,255,0.05)', color: (logoConfig.headerMaxHeightPx || 60) === h ? '#fff' : '#a1a1aa'
                    }}>{h}px</button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* LIVE PREVIEW */}
        {logoConfig.type !== 'none' && (
          <div>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#a1a1aa', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Previsualización del logo:</span>
            <div style={{ padding: 16, background: '#14151c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CompetitionLogoBanner config={logoConfig} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
