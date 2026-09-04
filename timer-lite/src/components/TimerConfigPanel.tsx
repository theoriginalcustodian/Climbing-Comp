import React from 'react';
import { Upload, Play, Settings, Clock, Music, AlertCircle } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import type { TimerConfig, TimerAudioConfig } from '../types';

interface TimerConfigPanelProps {
  timerConfig: TimerConfig;
  pushConfig: (partial: Partial<TimerConfig>) => void;
}

export const TimerConfigPanel: React.FC<TimerConfigPanelProps> = ({ timerConfig, pushConfig }) => {
  const audioConfig = timerConfig.audio || {};

  const handleAudioUpload = (
    key: keyof TimerAudioConfig,
    nameKey: keyof TimerAudioConfig,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      pushConfig({
        audio: {
          ...audioConfig,
          [key]: url,
          [nameKey]: file.name,
        }
      });
    }
  };

  const handleSetAudioMode = (
    key: keyof TimerAudioConfig,
    nameKey: keyof TimerAudioConfig,
    value: 'default' | 'none'
  ) => {
    pushConfig({
      audio: {
        ...audioConfig,
        [key]: value === 'none' ? 'none' : undefined,
        [nameKey]: value === 'none' ? 'Sin Sonido' : undefined,
      }
    });
  };

  const testAudio = (audioUrl?: string, defaultType: 'horn' | 'prep' | 'chime' = 'horn') => {
    soundEngine.playEventAudio(audioUrl, defaultType);
  };

  const audioEvents = [
    { id: 'climbStart', title: '🏃 Inicio de Escalada', desc: 'Suena cuando inicia el tiempo de escalada.', key: 'climbStartAudio', nameKey: 'climbStartAudioName', defaultType: 'horn' },
    { id: 'climbEnd', title: '🚨 Fin de Escalada', desc: 'Suena cuando culmina el tiempo de escalada.', key: 'climbEndAudio', nameKey: 'climbEndAudioName', defaultType: 'horn' },
    { id: 'pauseStart', title: '⏸ Inicio de Pausa', desc: 'Suena al comenzar el descanso.', key: 'pauseStartAudio', nameKey: 'pauseStartAudioName', defaultType: 'prep' },
    { id: 'pauseEnd', title: '🏁 Fin de Pausa', desc: 'Suena al finalizar el descanso.', key: 'pauseEndAudio', nameKey: 'pauseEndAudioName', defaultType: 'prep' },
    { id: 'prepStart', title: '🔵 Inicio de Preparación', desc: 'Suena cuando comienza la preparación.', key: 'prepStartAudio', nameKey: 'prepStartAudioName', defaultType: 'prep' },
    { id: 'prepEnd', title: '🟡 Fin de Preparación', desc: 'Suena cuando finaliza la preparación.', key: 'prepEndAudio', nameKey: 'prepEndAudioName', defaultType: 'horn' },
    { id: 'preEnd', title: '🔴 Alerta Últimos Segundos', desc: 'Suena en los últimos segundos de escalada.', key: 'preEndWarningAudio', nameKey: 'preEndWarningAudioName', defaultType: 'chime' },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* SECTION 1: TIMES */}
      <div style={{ padding: 20, background: 'rgba(0,0,0,0.4)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 0 }}>
          <Clock size={16} /> Duración de Fases (Segundos)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          <TimeField label="Tiempo de Escalada" value={timerConfig.climbTime} onChange={v => pushConfig({ climbTime: v })} />
          <TimeField label="Tiempo de Pausa" value={timerConfig.pauseTime} onChange={v => pushConfig({ pauseTime: v })} />
          <TimeField label="Tiempo de Preparación" value={timerConfig.prepTime} onChange={v => pushConfig({ prepTime: v })} />
          <TimeField label="Alerta Pre-Fin" value={timerConfig.preEndWarning} onChange={v => pushConfig({ preEndWarning: v })} />
          <TimeField label="Alerta Pre-Inicio" value={timerConfig.preStartWarning} onChange={v => pushConfig({ preStartWarning: v })} />
        </div>
        
        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#d4d4d8', cursor: 'pointer' }}>
            <input type="checkbox" checked={timerConfig.loop ?? false} onChange={e => pushConfig({ loop: e.target.checked })} />
            Bucle Automático (Loop)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#d4d4d8', cursor: 'pointer' }}>
            <input type="checkbox" checked={timerConfig.enablePause ?? true} onChange={e => pushConfig({ enablePause: e.target.checked })} />
            Habilitar Pausa
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#d4d4d8', cursor: 'pointer' }}>
            <input type="checkbox" checked={timerConfig.enablePrep ?? true} onChange={e => pushConfig({ enablePrep: e.target.checked })} />
            Habilitar Preparación
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#d4d4d8', cursor: 'pointer' }}>
            <input type="checkbox" checked={timerConfig.enablePreStart ?? true} onChange={e => pushConfig({ enablePreStart: e.target.checked })} />
            Habilitar Alerta Pre-Inicio
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#d4d4d8', cursor: 'pointer' }}>
            <input type="checkbox" checked={timerConfig.enablePreEnd ?? true} onChange={e => pushConfig({ enablePreEnd: e.target.checked })} />
            Habilitar Alerta Últimos Segundos
          </label>
        </div>
      </div>

      {/* SECTION 2: AUDIO */}
      <div style={{ padding: 20, background: 'rgba(0,0,0,0.4)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', color: '#FACC15', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <Music size={16} /> Audios Personalizados
          </h3>
          <span style={{ fontSize: 11, color: '#a1a1aa', fontFamily: 'monospace' }}>MP3, WAV, OGG</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {audioEvents.map(evt => {
            const currentUrl = audioConfig[evt.key];
            const currentName = audioConfig[evt.nameKey];
            const isNone = currentUrl === 'none';
            const hasCustom = Boolean(currentUrl && currentUrl !== 'none');

            return (
              <div key={evt.id} style={{ padding: 16, borderRadius: 16, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>{evt.title}</h4>
                    <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase',
                      background: isNone ? '#27272a' : hasCustom ? 'rgba(236,72,153,0.2)' : 'rgba(56,189,248,0.2)',
                      color: isNone ? '#71717a' : hasCustom ? '#ec4899' : '#38bdf8',
                      border: `1px solid ${isNone ? '#3f3f46' : hasCustom ? 'rgba(236,72,153,0.4)' : 'rgba(56,189,248,0.4)'}`
                    }}>
                      {isNone ? 'Silenciado' : hasCustom ? 'Custom' : 'Defecto'}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: '#a1a1aa', margin: '0 0 8px 0' }}>{evt.desc}</p>
                  {hasCustom && (
                    <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#facc15', background: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      📄 {currentName || 'Audio Personalizado'}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <label className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 11, cursor: 'pointer', margin: 0 }}>
                    <Upload size={14} /> Subir
                    <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => handleAudioUpload(evt.key, evt.nameKey, e)} />
                  </label>
                  
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 11, opacity: isNone ? 0.4 : 1, margin: 0 }} disabled={isNone} onClick={() => testAudio(currentUrl, evt.defaultType)}>
                    <Play size={14} /> Probar
                  </button>

                  <button style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer', background: (!hasCustom && !isNone) ? 'rgba(255,255,255,0.2)' : 'transparent', color: (!hasCustom && !isNone) ? '#fff' : '#a1a1aa' }} onClick={() => handleSetAudioMode(evt.key, evt.nameKey, 'default')}>
                    Defecto
                  </button>

                  <button style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, borderRadius: 12, border: isNone ? '1px solid rgba(239,68,68,0.4)' : 'none', cursor: 'pointer', background: isNone ? 'rgba(239,68,68,0.2)' : 'transparent', color: isNone ? '#ef4444' : '#a1a1aa' }} onClick={() => handleSetAudioMode(evt.key, evt.nameKey, 'none')}>
                    Saltear
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#d4d4d8', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <AlertCircle size={16} color="#38bdf8" />
        <span>Si un evento está configurado como <strong>Saltear</strong>, el temporizador avanzará en silencio.</span>
      </div>
    </div>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label style={{ fontSize: 10, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input type="number" className="input-number" style={{ flex: 1 }} value={value} min={0} max={9999}
          onChange={e => onChange(Math.max(0, Number(e.target.value)))} />
        <span style={{ fontSize: 10, color: '#52525b' }}>seg</span>
      </div>
    </div>
  );
}
