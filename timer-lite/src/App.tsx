import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX, Tv, Settings2, Sliders, Palette, Maximize2, Minimize2 } from 'lucide-react';
import { useTimerWS } from './hooks/useTimerWS';
import { soundEngine } from './utils/audio';
import { TimerConfigPanel } from './components/TimerConfigPanel';
import { SkinsConfigPanel } from './components/SkinsConfigPanel';
import { CompetitionLogoBanner } from './components/CompetitionLogoBanner';
import bgCijel from './assets/bg_cijel.jpg';
import type { TimerPhase, CompetitionLogoConfig } from './types';

export default function App() {
  const ws = useTimerWS();
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'timer' | 'skins'>('timer');
  const [showConfig, setShowConfig] = useState(false);

  const { timerState, timerConfig, bgTheme = 'pachamama', bgOpacity = 30, competitionLogo } = ws.state;

  const defaultLogo: CompetitionLogoConfig = { type: 'pachamama', featherEdges: true, featherIntensity: 'medium', maxHeightPx: 80, headerMaxHeightPx: 60 };
  const currentLogo = competitionLogo || defaultLogo;

  // Sound triggers
  useEffect(() => {
    const handler = (e: any) => {
      if (isMuted || !timerConfig.audio) return;
      const sound = e.detail;
      const audioConf = timerConfig.audio;

      // Map triggers to the corresponding config keys
      let customUrl, defaultType;
      
      switch (sound) {
        case 'start_climbing':
          customUrl = audioConf.climbStartAudio;
          defaultType = 'horn';
          break;
        case 'end_climbing':
          customUrl = audioConf.climbEndAudio;
          defaultType = 'horn';
          break;
        case 'start_prep':
          customUrl = audioConf.prepStartAudio;
          defaultType = 'prep';
          break;
        case 'pre_start': // end_prep
          customUrl = audioConf.prepEndAudio;
          defaultType = 'horn';
          break;
        case 'start_pause':
          customUrl = audioConf.pauseStartAudio;
          defaultType = 'prep';
          break;
        case 'end_pause':
          customUrl = audioConf.pauseEndAudio;
          defaultType = 'prep';
          break;
        case 'pre_end':
          if (audioConf.preEndWarningAudio === 'none') return; // Skipped
          if (audioConf.preEndWarningAudio) {
            soundEngine.playEventAudio(audioConf.preEndWarningAudio, 'chime');
          } else {
            soundEngine.playWarningBeep();
          }
          return; 
        case 'custom_1':
          if (audioConf.customAlert1Audio === 'none') return;
          if (audioConf.customAlert1Audio) soundEngine.playEventAudio(audioConf.customAlert1Audio, 'chime');
          else soundEngine.playWarningBeep();
          return;
        case 'custom_2':
          if (audioConf.customAlert2Audio === 'none') return;
          if (audioConf.customAlert2Audio) soundEngine.playEventAudio(audioConf.customAlert2Audio, 'chime');
          else soundEngine.playWarningBeep();
          return;
        case 'custom_3':
          if (audioConf.customAlert3Audio === 'none') return;
          if (audioConf.customAlert3Audio) soundEngine.playEventAudio(audioConf.customAlert3Audio, 'chime');
          else soundEngine.playWarningBeep();
          return;
        case 'countdown_tick':
          if (audioConf.countdownTickAudio === 'none') return;
          if (audioConf.countdownTickAudio) soundEngine.playEventAudio(audioConf.countdownTickAudio, 'tick');
          else soundEngine.playTick(); // Tick fallback
          return;
      }

      if (customUrl === 'none') return; // Skipped
      soundEngine.playEventAudio(customUrl, defaultType as any);
    };
    
    window.addEventListener('sound_trigger', handler);
    return () => window.removeEventListener('sound_trigger', handler);
  }, [isMuted, timerConfig.audio]);

  // Routing
  const path = window.location.pathname;
  if (path === '/public') {
    return (
      <PublicTimerView
        timerState={timerState}
        timerConfig={timerConfig}
        bgTheme={bgTheme}
        bgOpacity={bgOpacity}
        logoConfig={currentLogo}
      />
    );
  }

  const minutes = Math.floor(Math.max(0, timerState.remaining) / 60);
  const seconds = Math.floor(Math.max(0, timerState.remaining) % 60);
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const phaseInfo = getPhaseInfo(timerState.phase, timerState.remaining, bgTheme, timerConfig);

  const pushConfig = (partial: Partial<typeof timerConfig>) => {
    ws.updateConfig({ timerConfig: { ...timerConfig, ...partial } });
  };

  const openPublicView = () => {
    window.open('/public', '_blank', 'width=1280,height=720');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0f0f14' }}>
      {/* HEADER */}
      <header className="glass-card" style={{ margin: '16px 16px 0', padding: '12px 20px', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyItems: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          <CompetitionLogoBanner config={{ ...currentLogo, maxHeightPx: currentLogo.headerMaxHeightPx }} />
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 16 }}>
            <h1 style={{ fontSize: 16, fontWeight: 900, letterSpacing: '0.05em', color: '#fff', textTransform: 'uppercase', margin: 0 }}>ClimbComp Timer</h1>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#71717a' }}>Lite Edition</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-cyan" onClick={openPublicView}>
            <Tv size={16} /> Abrir Vista Pública
          </button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ws.connected ? '#22c55e' : '#ef4444', animation: 'pulse-warning 2s infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#71717a' }}>{ws.connected ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main style={{ flex: 1, display: 'flex', padding: 16, gap: 16, alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN: TIMER DISPLAY */}
        <div className="glass-card" style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', borderRadius: '1.5rem', minHeight: '600px' }}>
          <div className="phase-badge" style={{ ...phaseInfo.badgeStyle, marginBottom: 40 }}>{phaseInfo.label}</div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, userSelect: 'none', marginBottom: 60 }}>
            <span style={{ fontSize: 'clamp(8rem, 15vw, 12rem)', fontWeight: 900, fontFamily: 'var(--font-mono)', lineHeight: 1, letterSpacing: '-0.04em', color: '#ffffff', textShadow: `0 0 40px ${phaseInfo.color}, 0 0 80px ${phaseInfo.color}` }}>
              {mm}
            </span>
            <span style={{ fontSize: 'clamp(4rem, 8vw, 8rem)', fontWeight: 900, color: '#ffffff', textShadow: `0 0 40px ${phaseInfo.color}`, opacity: timerState.running ? undefined : 0.6, animation: timerState.running ? 'pulse-warning 1s infinite' : 'none' }}>
              :
            </span>
            <span style={{ fontSize: 'clamp(8rem, 15vw, 12rem)', fontWeight: 900, fontFamily: 'var(--font-mono)', lineHeight: 1, letterSpacing: '-0.04em', color: '#ffffff', textShadow: `0 0 40px ${phaseInfo.color}, 0 0 80px ${phaseInfo.color}` }}>
              {ss}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {!timerState.running ? (
              <button className="btn btn-primary" style={{ padding: '12px 24px', fontSize: 14 }} onClick={ws.startTimer}><Play size={20} /> Iniciar</button>
            ) : (
              <button className="btn btn-danger" style={{ padding: '12px 24px', fontSize: 14 }} onClick={ws.pauseTimer}><Pause size={20} /> Pausar</button>
            )}
            <button className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: 14 }} onClick={ws.resetTimer}><RotateCcw size={18} /> Reset</button>
            <button className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: 14 }} onClick={ws.nextPhase}><SkipForward size={18} /> Fase →</button>
            <button className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: 14 }} onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />} {isMuted ? 'Mute' : 'Audio'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: SETTINGS */}
        <div className="glass-card" style={{ flex: '1 1 50%', borderRadius: '1.5rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '600px' }}>
          
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setActiveTab('timer')} style={{ flex: 1, padding: 16, background: activeTab === 'timer' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', borderBottom: activeTab === 'timer' ? '2px solid #38bdf8' : '2px solid transparent', color: activeTab === 'timer' ? '#fff' : '#a1a1aa', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
              <Sliders size={16} color={activeTab === 'timer' ? '#38bdf8' : '#a1a1aa'} /> Tiempos y Audios
            </button>
            <button onClick={() => setActiveTab('skins')} style={{ flex: 1, padding: 16, background: activeTab === 'skins' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', borderBottom: activeTab === 'skins' ? '2px solid #ec4899' : '2px solid transparent', color: activeTab === 'skins' ? '#fff' : '#a1a1aa', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
              <Palette size={16} color={activeTab === 'skins' ? '#ec4899' : '#a1a1aa'} /> Temas y Skins
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 24, paddingRight: 16 }} className="scrollbar-thin">
            {activeTab === 'timer' && (
              <TimerConfigPanel timerConfig={timerConfig} pushConfig={pushConfig} />
            )}
            {activeTab === 'skins' && (
              <SkinsConfigPanel 
                bgTheme={bgTheme} 
                setBgTheme={t => ws.updateConfig({ bgTheme: t })} 
                bgOpacity={bgOpacity} 
                setBgOpacity={o => ws.updateConfig({ bgOpacity: o })} 
                logoConfig={currentLogo} 
                setLogoConfig={c => ws.updateConfig({ competitionLogo: c })} 
              />
            )}
          </div>
        </div>

      </main>
    </div>
  );
}


// --- PUBLIC TIMER VIEW (NO TAILWIND) ---
function PublicTimerView({ timerState, timerConfig, bgTheme, bgOpacity, logoConfig }: {
  timerState: typeof import('./types').TimerState,
  timerConfig: typeof import('./types').TimerConfig,
  bgTheme: string,
  bgOpacity: number,
  logoConfig: CompetitionLogoConfig
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  const minutes = Math.floor(Math.max(0, timerState.remaining) / 60);
  const seconds = Math.floor(Math.max(0, timerState.remaining) % 60);
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const phaseInfo = getPhaseInfo(timerState.phase, timerState.remaining, bgTheme, timerConfig);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#0a0a0f' }}>

      {/* Background */}
      {bgTheme === 'cijel' ? (
        <div style={{ position: 'absolute', inset: 0 }}>
          <img src={bgCijel} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: bgOpacity / 100, filter: 'brightness(0.6)' }} />
        </div>
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: bgOpacity / 100 }}>
           {/* Fallback to simple solid background color if we want to mimic Pachamama without loading big SVG inside public view behind things, but let's just use CSS gradient */}
           <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle at center, #1a2322 0%, #0a0a0f 100%)' }} />
        </div>
      )}

      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: `rgba(10,10,15,${Math.max(0, 1 - bgOpacity / 100)})` }} />

      {/* Fullscreen Button (Hidden when mouse is still for a while ideally, but for now just top right) */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 30, opacity: 0.2, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '1'} onMouseLeave={e => e.currentTarget.style.opacity = '0.2'}>
        <button className="btn btn-secondary" style={{ padding: 12, background: 'rgba(0,0,0,0.5)' }} onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
        </button>
      </div>

      {/* Logo Banner */}
      <div style={{ position: 'relative', zIndex: 10, marginBottom: 40 }}>
        <CompetitionLogoBanner config={logoConfig} />
      </div>

      {/* Phase Badge */}
      <div className="phase-badge" style={{ ...phaseInfo.badgeStyle, fontSize: 24, padding: '12px 32px', marginBottom: 24, position: 'relative', zIndex: 10 }}>
        {phaseInfo.label}
      </div>

      {/* Giant Timer */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'baseline', gap: 16, userSelect: 'none' }}>
        <span style={{ fontSize: 'clamp(10rem, 30vw, 28rem)', fontWeight: 900, fontFamily: 'var(--font-mono)', lineHeight: 1, letterSpacing: '-0.04em', color: '#ffffff', textShadow: `0 0 40px ${phaseInfo.color}, 0 0 80px ${phaseInfo.color}` }}>
          {mm}
        </span>
        <span style={{ fontSize: 'clamp(5rem, 12vw, 12rem)', fontWeight: 900, color: '#ffffff', textShadow: `0 0 40px ${phaseInfo.color}` }}>:</span>
        <span style={{ fontSize: 'clamp(10rem, 30vw, 28rem)', fontWeight: 900, fontFamily: 'var(--font-mono)', lineHeight: 1, letterSpacing: '-0.04em', color: '#ffffff', textShadow: `0 0 40px ${phaseInfo.color}, 0 0 80px ${phaseInfo.color}` }}>
          {ss}
        </span>
      </div>
    </div>
  );
}

function getPhaseInfo(phase: TimerPhase, remaining: number, theme: string, timerConfig?: import('./types').TimerConfig) {
  switch (phase) {
    case 'prep': return { label: '🔵 PREPARACIÓN', color: '#1AA0E6', badgeStyle: { background: '#1AA0E6', color: '#fff', boxShadow: '0 0 16px rgba(26,160,230,0.5)' } };
    case 'climb':
      if (timerConfig?.enablePreEnd !== false && remaining <= (timerConfig?.preEndWarning || 10)) {
        const c = theme === 'cijel' ? '#EC4899' : '#DE7B7B';
        return { label: '🔴 ¡ÚLTIMOS SEGUNDOS!', color: c, badgeStyle: { background: c, color: '#fff', boxShadow: `0 0 20px ${c}aa`, animation: 'pulse-warning 0.8s infinite' } };
      }
      return { label: '🟢 ESCALANDO', color: '#13A25A', badgeStyle: { background: '#13A25A', color: '#fff', boxShadow: '0 0 16px rgba(19,162,90,0.5)' } };
    case 'pause': return { label: '🟡 PAUSA / TRANSICIÓN', color: '#E8A843', badgeStyle: { background: '#E8A843', color: '#000', boxShadow: '0 0 16px rgba(232,168,67,0.5)' } };
    default: return { label: '⏸️ INACTIVO', color: '#71717a', badgeStyle: { background: '#3f3f46', color: '#a1a1aa' } };
  }
}
