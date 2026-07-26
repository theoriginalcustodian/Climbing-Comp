import React, { useRef } from 'react';
import { Volume2, Upload, Trash2, Play, Settings2, Check, Music, Sliders, Clock, AlertCircle } from 'lucide-react';
import { TimerConfig, TimerAudioConfig } from '../types';
import { soundEngine } from '../utils/audio';

interface TimerConfigPanelProps {
  timerConfig: TimerConfig;
  setTimerConfig: React.Dispatch<React.SetStateAction<TimerConfig>>;
  isOpen: boolean;
  onClose: () => void;
}

export const TimerConfigPanel: React.FC<TimerConfigPanelProps> = ({
  timerConfig,
  setTimerConfig,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const audioConfig = timerConfig.audio || {};

  const handleAudioUpload = (
    key: keyof TimerAudioConfig,
    nameKey: keyof TimerAudioConfig,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setTimerConfig((prev) => ({
        ...prev,
        audio: {
          ...prev.audio,
          [key]: url,
          [nameKey]: file.name,
        },
      }));
    }
  };

  const handleSetAudioMode = (
    key: keyof TimerAudioConfig,
    nameKey: keyof TimerAudioConfig,
    value: 'default' | 'none'
  ) => {
    setTimerConfig((prev) => ({
      ...prev,
      audio: {
        ...prev.audio,
        [key]: value === 'none' ? 'none' : undefined,
        [nameKey]: value === 'none' ? 'Sin Sonido (Salteado)' : undefined,
      },
    }));
  };

  const testAudio = (audioUrl?: string, defaultType: 'horn' | 'prep' | 'chime' = 'horn') => {
    soundEngine.playEventAudio(audioUrl, defaultType);
  };

  const audioEvents = [
    {
      id: 'climbStart',
      title: '🏃 Inicio de Escalada',
      desc: 'Suena cuando inicia el tiempo de escalada activo.',
      key: 'climbStartAudio' as keyof TimerAudioConfig,
      nameKey: 'climbStartAudioName' as keyof TimerAudioConfig,
      defaultType: 'horn' as const,
    },
    {
      id: 'climbEnd',
      title: '🚨 Fin de Escalada',
      desc: 'Suena cuando culmina el tiempo de escalada.',
      key: 'climbEndAudio' as keyof TimerAudioConfig,
      nameKey: 'climbEndAudioName' as keyof TimerAudioConfig,
      defaultType: 'horn' as const,
    },
    {
      id: 'pauseStart',
      title: '⏸ Inicio de Pausa',
      desc: 'Suena al comenzar el descanso/pausa de transición.',
      key: 'pauseStartAudio' as keyof TimerAudioConfig,
      nameKey: 'pauseStartAudioName' as keyof TimerAudioConfig,
      defaultType: 'prep' as const,
    },
    {
      id: 'pauseEnd',
      title: '🏁 Fin de Pausa',
      desc: 'Suena al finalizar el tiempo de descanso.',
      key: 'pauseEndAudio' as keyof TimerAudioConfig,
      nameKey: 'pauseEndAudioName' as keyof TimerAudioConfig,
      defaultType: 'prep' as const,
    },
    {
      id: 'prepStart',
      title: '🔵 Inicio de Observación/Transición',
      desc: 'Suena cuando comienza el tiempo de preparación.',
      key: 'prepStartAudio' as keyof TimerAudioConfig,
      nameKey: 'prepStartAudioName' as keyof TimerAudioConfig,
      defaultType: 'prep' as const,
    },
    {
      id: 'prepEnd',
      title: '🟡 Fin de Observación/Transición',
      desc: 'Suena cuando finaliza la preparación previa a escalar.',
      key: 'prepEndAudio' as keyof TimerAudioConfig,
      nameKey: 'prepEndAudioName' as keyof TimerAudioConfig,
      defaultType: 'horn' as const,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#181920] border-2 border-[#38BDF8]/40 rounded-3xl p-5 md:p-7 max-w-4xl w-full text-white shadow-[0_0_50px_rgba(56,189,248,0.25)] max-h-[92vh] flex flex-col">
        
        {/* Header - Sticky Top */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#38BDF8]/20 border border-[#38BDF8]/40 rounded-2xl text-[#38BDF8]">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                ⚙️ Configuración de Temporizador y Audios
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Personaliza tiempos de escalada, pausas, transiciones y audios para cada evento.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="pachamama-btn-dark px-3.5 py-1.5 rounded-xl text-xs font-black uppercase cursor-pointer shrink-0"
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="overflow-y-auto pr-2 space-y-6 flex-1 scrollbar-thin">
          
          {/* Section 1: Duración de Tiempos */}
          <div className="p-5 bg-black/40 rounded-2xl border border-white/10">
            <h3 className="text-sm font-black uppercase text-[#38BDF8] tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Duración de Fases (Segundos)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                  Tiempo de Escalada (Seg)
                </label>
                <input
                  type="number"
                  min="5"
                  max="3600"
                  value={timerConfig.climbTime}
                  onChange={(e) =>
                    setTimerConfig((prev) => ({ ...prev, climbTime: Math.max(1, Number(e.target.value)) }))
                  }
                  className="pachamama-inset p-3 rounded-xl text-white font-black text-lg w-full outline-none border border-white/10 focus:border-[#38BDF8]"
                />
                <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                  {Math.floor(timerConfig.climbTime / 60)} min {timerConfig.climbTime % 60} sec
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                  Tiempo de Pausa / Descanso (Seg)
                </label>
                <input
                  type="number"
                  min="0"
                  max="3600"
                  value={timerConfig.pauseTime}
                  onChange={(e) =>
                    setTimerConfig((prev) => ({ ...prev, pauseTime: Math.max(0, Number(e.target.value)) }))
                  }
                  className="pachamama-inset p-3 rounded-xl text-white font-black text-lg w-full outline-none border border-white/10 focus:border-[#38BDF8]"
                />
                <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                  {Math.floor(timerConfig.pauseTime / 60)} min {timerConfig.pauseTime % 60} sec
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                  Tiempo de Transición / Prep (Seg)
                </label>
                <input
                  type="number"
                  min="0"
                  max="3600"
                  value={timerConfig.prepTime}
                  onChange={(e) =>
                    setTimerConfig((prev) => ({ ...prev, prepTime: Math.max(0, Number(e.target.value)) }))
                  }
                  className="pachamama-inset p-3 rounded-xl text-white font-black text-lg w-full outline-none border border-white/10 focus:border-[#38BDF8]"
                />
                <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                  {Math.floor(timerConfig.prepTime / 60)} min {timerConfig.prepTime % 60} sec
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Personalización de Audios de Inicio y Fin */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase text-[#FACC15] tracking-wider flex items-center gap-2">
                <Music className="w-4 h-4" /> Audios Personalizados por Fase
              </h3>
              <span className="text-[11px] text-zinc-400 font-mono">
                Soporta MP3, WAV, OGG, AAC, FLAC
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {audioEvents.map((evt) => {
                const currentAudioUrl = audioConfig[evt.key] as string | undefined;
                const currentAudioName = audioConfig[evt.nameKey] as string | undefined;
                const isNone = currentAudioUrl === 'none';
                const hasCustomFile = Boolean(currentAudioUrl && currentAudioUrl !== 'none');

                return (
                  <div key={evt.id} className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-sm text-white">{evt.title}</h4>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                          isNone 
                            ? 'bg-zinc-800 text-zinc-500 border border-zinc-700' 
                            : hasCustomFile 
                            ? 'bg-[#EC4899]/20 text-[#EC4899] border border-[#EC4899]/40' 
                            : 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40'
                        }`}>
                          {isNone ? '🔇 Sin Sonido' : hasCustomFile ? '🎵 Personalizado' : '🔊 Tono Defecto'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mb-2">{evt.desc}</p>
                      
                      {hasCustomFile && (
                        <p className="text-xs font-mono text-[#FACC15] truncate bg-black/50 p-1.5 rounded-lg border border-white/5 mb-2">
                          📄 {currentAudioName || 'Audio Personalizado'}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                      {/* File Upload Button */}
                      <label className="pachamama-btn-blue text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5" /> Subir Audio
                        <input
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={(e) => handleAudioUpload(evt.key, evt.nameKey, e)}
                        />
                      </label>

                      {/* Test Audio Button */}
                      <button
                        onClick={() => testAudio(currentAudioUrl, evt.defaultType)}
                        disabled={isNone}
                        className="pachamama-btn-dark text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1 disabled:opacity-40"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" /> Probar
                      </button>

                      {/* Default Synth Option */}
                      <button
                        onClick={() => handleSetAudioMode(evt.key, evt.nameKey, 'default')}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-xl cursor-pointer transition ${
                          !hasCustomFile && !isNone
                            ? 'bg-white/20 text-white'
                            : 'bg-black/30 text-zinc-400 hover:text-white'
                        }`}
                      >
                        Defecto
                      </button>

                      {/* Skip / Silence Option */}
                      <button
                        onClick={() => handleSetAudioMode(evt.key, evt.nameKey, 'none')}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-xl cursor-pointer transition ${
                          isNone
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : 'bg-black/30 text-zinc-400 hover:text-red-300'
                        }`}
                      >
                        Saltear
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer info note - Sticky Bottom */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-4 text-xs text-zinc-300 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#38BDF8] shrink-0" />
            <span>
              Si un evento está configurado como <strong>"Saltear"</strong>, el temporizador avanzará en silencio.
            </span>
          </div>
          <button
            onClick={onClose}
            className="pachamama-btn-green font-black px-6 py-2.5 rounded-xl uppercase text-xs cursor-pointer flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> Guardar y Aplicar
          </button>
        </div>

      </div>
    </div>
  );
};
