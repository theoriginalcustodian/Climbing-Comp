import React, { useState } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Clock, Settings2, X } from 'lucide-react';
import { TimerState, TimerPhase, TimerConfig } from '../types';
import { TimerConfigPanel } from './TimerConfigPanel';

interface MobileRemoteControlProps {
  timerState: TimerState;
  timerConfig: TimerConfig;
  pushConfig: (partial: Partial<TimerConfig>) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  nextPhase: () => void;
}

export const MobileRemoteControl: React.FC<MobileRemoteControlProps> = ({
  timerState,
  timerConfig,
  pushConfig,
  startTimer,
  pauseTimer,
  resetTimer,
  nextPhase
}) => {
  const { running, phase, remaining } = timerState;
  const [showConfig, setShowConfig] = useState(false);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getPhaseName = (p: TimerPhase) => {
    switch(p) {
      case 'idle': return 'INACTIVO';
      case 'prep': return 'PREPARACIÓN';
      case 'climb': return 'ESCALANDO';
      case 'pause': return 'PAUSA';
    }
  };

  const getPhaseColor = (p: TimerPhase) => {
    switch(p) {
      case 'idle': return '#71717a';
      case 'prep': return '#eab308';
      case 'climb': return '#22c55e';
      case 'pause': return '#ef4444';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#09090b',
      color: '#fff',
      padding: '20px',
      boxSizing: 'border-box',
      fontFamily: 'system-ui, sans-serif',
      overflowY: 'auto'
    }}>
      {showConfig ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#38bdf8', margin: 0, textTransform: 'uppercase' }}>Configuración</h1>
            <button 
              onClick={() => setShowConfig(false)}
              style={{ background: 'transparent', border: 'none', color: '#a1a1aa', padding: '8px' }}
            >
              <X size={24} />
            </button>
          </div>
          <div style={{ flex: 1 }}>
            <TimerConfigPanel timerConfig={timerConfig} pushConfig={pushConfig} />
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#38bdf8', margin: 0, textTransform: 'uppercase' }}>Timer Remote</h1>
            <button 
              onClick={() => setShowConfig(true)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px', borderRadius: '12px', display: 'flex' }}
            >
              <Settings2 size={24} />
            </button>
          </div>

          <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '20px',
        marginBottom: '30px',
        padding: '20px'
      }}>
        <div style={{ 
          background: getPhaseColor(phase) + '33', 
          color: getPhaseColor(phase), 
          padding: '8px 16px', 
          borderRadius: '99px',
          fontSize: '14px',
          fontWeight: 800,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Clock size={16} />
          {getPhaseName(phase)}
        </div>
        
        <div style={{ fontSize: '80px', fontWeight: 900, lineHeight: 1, tabularNums: 'tabular-nums' }}>
          {formatTime(remaining)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {running ? (
          <button 
            onClick={pauseTimer}
            style={{ 
              background: '#ef4444', color: '#fff', border: 'none', padding: '20px', 
              borderRadius: '16px', fontSize: '18px', fontWeight: 800, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' 
            }}>
            <Pause size={24} /> Pausar
          </button>
        ) : (
          <button 
            onClick={startTimer}
            style={{ 
              background: '#22c55e', color: '#fff', border: 'none', padding: '20px', 
              borderRadius: '16px', fontSize: '18px', fontWeight: 800, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' 
            }}>
            <Play size={24} /> Iniciar
          </button>
        )}

        <button 
          onClick={nextPhase}
          style={{ 
            background: '#3f3f46', color: '#fff', border: 'none', padding: '20px', 
            borderRadius: '16px', fontSize: '18px', fontWeight: 800, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' 
          }}>
          <SkipForward size={24} /> Siguiente
        </button>

        <button 
          onClick={resetTimer}
          style={{ 
            gridColumn: '1 / -1',
            background: 'transparent', color: '#a1a1aa', border: '2px solid #27272a', padding: '16px', 
            borderRadius: '16px', fontSize: '16px', fontWeight: 800, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            marginTop: '12px'
          }}>
          <RotateCcw size={20} /> Reiniciar Todo
        </button>
      </div>
        </>
      )}
    </div>
  );
};
