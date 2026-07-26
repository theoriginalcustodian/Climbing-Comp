/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Trophy,
  Users,
  Timer as TimerIcon,
  Volume2,
  Tv,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  Settings,
  Flame,
  Award,
  Layers,
  Sparkles,
  FileText,
  FileSpreadsheet,
  Target,
  Scale,
  Palette,
} from 'lucide-react';

import { Sliders } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Competitor, Problem, TimerPhase, TimerConfig, ScoringConfig } from './types';
import { soundEngine } from './utils/audio';
import { PublicView } from './components/PublicViewModal';
import { PachamamaLogo } from './components/PachamamaLogo';
import { CijelLogo } from './components/CijelLogo';
import { GoogleFormsManager } from './components/GoogleFormsManager';
import { TimerConfigPanel } from './components/TimerConfigPanel';
import { CompetitorManager } from './components/CompetitorManager';
import { ProblemManager } from './components/ProblemManager';
import { CompetitionLogoBanner, CompetitionLogoConfig } from './components/CompetitionLogoBanner';
import { useClimbCompWS } from './hooks/useClimbCompWS';
import { JudgeTerminal } from './components/JudgeTerminal';
import bgCijel from './assets/bg_cijel.jpg';

// Mock Data for Pachamama Boulder Championship
const INITIAL_COMPETITORS: Competitor[] = [
  { id: '1', dorsal: '14', name: 'María García', category: 'Senior Femenino', club: 'Pachamama Team', status: 'climbing', startOrder: 1 },
  { id: '2', dorsal: '07', name: 'Pedro López', category: 'Senior Masculino', club: 'Boulder Club Norte', status: 'waiting', startOrder: 2 },
  { id: '3', dorsal: '22', name: 'Ana Rodríguez', category: 'Senior Femenino', club: 'Vertical Limit', status: 'waiting', startOrder: 3 },
  { id: '4', dorsal: '03', name: 'Luis Martínez', category: 'Senior Masculino', club: 'Klimbing Madrid', status: 'waiting', startOrder: 4 },
  { id: '5', dorsal: '18', name: 'Sofia Fernández', category: 'Senior Femenino', club: 'Rock & Wall', status: 'registered', startOrder: 5 },
];

const INITIAL_PROBLEMS: Problem[] = [
  { id: 'p1', number: 1, name: 'Bloque #1 — Sloper Central', grade: 'V3', holdColor: 'Amarillo', hasZone: true },
  { id: 'p2', number: 2, name: 'Bloque #2 — Placa Técnica', grade: 'V5', holdColor: 'Azul', hasZone: true },
  { id: 'p3', number: 3, name: 'Bloque #3 — "La Techo"', grade: 'V6', holdColor: 'Terracota/Verde', hasZone: true },
  { id: 'p4', number: 4, name: 'Bloque #4 — Dinámico Final', grade: 'V7', holdColor: 'Rojo', hasZone: true },
];

export default function App() {
  const ws = useClimbCompWS();

  // Enrutar si el path es /judge
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/judge')) {
    return <JudgeTerminal ws={ws} />;
  }
  // Navigation & View mode
  const [activeTab, setActiveTab] = useState<'timer' | 'public' | 'results' | 'competitors' | 'settings' | 'forms'>('timer');
  const [settingsSubTab, setSettingsSubTab] = useState<'timer' | 'problems' | 'info' | 'rules' | 'skins'>('timer');
  const [showCompetitorInTimer, setShowCompetitorInTimer] = useState(true);
  const [bgTheme, setBgTheme] = useState<'pachamama' | 'cijel'>('pachamama');
  const [bgOpacity, setBgOpacity] = useState<number>(30);

  // Configurable Competition Logo State
  const [competitionLogo, setCompetitionLogo] = useState<CompetitionLogoConfig>({
    type: 'pachamama',
    featherEdges: true,
    featherIntensity: 'medium',
    maxHeightPx: 80,
    headerMaxHeightPx: 60,
  });

  // Competition Details State
  const [competitionInfo, setCompetitionInfo] = useState({
    name: 'CAMPEONATO INFANTO JUVENIL ESCALADA LITORAL 2026',
    location: 'Muro Pachamama Escalada',
    category: 'Senior Femenino & Juvenil A',
    round: 'Finales (1/3)',
    organizer: 'Pachamama Escalada',
  });

  // Competitor & Problem State
  const [competitors, setCompetitors] = useState<Competitor[]>(INITIAL_COMPETITORS);
  const [currentCompetitorIndex, setCurrentCompetitorIndex] = useState(0);
  const [problems, setProblems] = useState<Problem[]>(INITIAL_PROBLEMS);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(2); // Default Bloque #3

  // Current Attempt Scores
  const [attemptCount, setAttemptCount] = useState(3);
  const [gotTop, setGotTop] = useState(false);
  const [gotZone, setGotZone] = useState(true);

  // Inline Timer Config Panel Modal State
  const [isTimerConfigOpen, setIsTimerConfigOpen] = useState(false);

  // Scoring Rules Configuration State
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig>({
    system: 'ifsc',
    pointsPerTop: 1000,
    pointsPerZone: 500,
    penaltyPerTopAttempt: 10,
    penaltyPerZoneAttempt: 5,
    maxAttempts: 5,
    tieBreaker: 'tops_zones_attempts',
  });

  // Timer Configuration & State
  const [timerConfig, setTimerConfig] = useState<TimerConfig>({
    prepTime: 60,
    climbTime: 240,
    pauseTime: 120,
    preEndWarning: 30,
    preStartWarning: 10,
    mode: 'auto',
    soundEnabled: true,
    volume: 80,
    audio: {},
  });

  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [timeRemaining, setTimeRemaining] = useState<number>(204.7); // 3:24.7
  const [isMuted, setIsMuted] = useState(false);

  // References for precision animation loop
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const currentCompetitor = competitors[currentCompetitorIndex] || competitors[0];
  const currentProblem = problems[currentProblemIndex] || problems[0];

  // Sincronización del estado del WebSocket con la UI de React
  useEffect(() => {
    if (!ws.state || ws.state.competition.name === "Cargando Competencia...") return;

    if (ws.state.competitors && ws.state.competitors.length > 0) {
      setCompetitors(ws.state.competitors);
    }
    if (ws.state.problems && ws.state.problems.length > 0) {
      setProblems(ws.state.problems);
    }

    const comp = ws.state.competition;
    setCompetitionInfo({
      name: comp.name,
      location: comp.location,
      category: comp.rules.scoringType === 'ifsc' ? 'IFSC Estándar' : 'Puntuación Personalizada',
      round: comp.rules.rotationFormat === 'circuit' ? 'Rotación (Circuito)' : 'Bloques Abiertos',
      organizer: 'Muro Pachamama / CIJEL',
    });

    setTimerConfig({
      prepTime: comp.timerConfig.prepTime,
      climbTime: comp.timerConfig.climbTime,
      pauseTime: comp.timerConfig.pauseTime,
      preEndWarning: comp.timerConfig.preEndWarning,
      preStartWarning: comp.timerConfig.preStartWarning,
      mode: comp.rules.rotationFormat === 'circuit' ? 'auto' : 'manual',
      soundEnabled: true,
      volume: 80,
    });

    setPhase(ws.state.timerState.phase);
    setTimeRemaining(ws.state.timerState.remaining);
    setCurrentCompetitorIndex(ws.state.timerState.activeCompetitorIndex);
    setCurrentProblemIndex(ws.state.timerState.activeProblemIndex);

    if (comp.bgTheme) {
      setBgTheme(comp.bgTheme);
    }
    if (comp.bgOpacity !== undefined) {
      setBgOpacity(comp.bgOpacity);
    } else {
      setBgOpacity(comp.bgTheme === 'cijel' ? 40 : 15);
    }
  }, [ws.state]);

  // Listener para alertas de sonido centralizadas en el PC servidor
  useEffect(() => {
    const handleSoundTrigger = (e: any) => {
      const sound = e.detail;
      console.log("[Audio] Sonido disparado por WebSocket:", sound);
      if (sound === 'pre_start') soundEngine.playWarningBeep();
      else if (sound === 'pre_end') soundEngine.playWarningBeep();
      else if (sound === 'start_climbing') soundEngine.playHorn(0.8, 220);
      else if (sound === 'end_climbing') soundEngine.playHorn(0.8, 220);
      else if (sound === 'start_prep') soundEngine.playWarningBeep();
      else if (sound === 'top_success') soundEngine.playTopChime();
      else if (sound === 'zone_success') soundEngine.playZoneChime();
    };
    window.addEventListener('sound_trigger', handleSoundTrigger);
    return () => window.removeEventListener('sound_trigger', handleSoundTrigger);
  }, []);

  // Precision Timer Engine
  const animateTimer = (time: number) => {
    // Si el servidor local WebSocket maneja el tiempo, no animar localmente
    if (ws.connected) return;
    
    if (lastTimeRef.current !== null && phase === 'climb') {
      const deltaTime = (time - lastTimeRef.current) / 1000;
      setTimeRemaining((prev) => {
        const nextTime = Math.max(0, prev - deltaTime);
        if (nextTime <= 0) {
          setPhase('pause');
          if (!isMuted) {
            soundEngine.playEventAudio(timerConfig.audio?.climbEndAudio, 'horn');
            setTimeout(() => {
              soundEngine.playEventAudio(timerConfig.audio?.pauseStartAudio, 'prep');
            }, 400);
          }
          return timerConfig.pauseTime;
        }
        return nextTime;
      });
    }
    lastTimeRef.current = time;
    if (phase === 'climb') {
      requestRef.current = requestAnimationFrame(animateTimer);
    }
  };

  useEffect(() => {
    if (ws.connected) return; // Saltar control local si está sincronizado por WebSocket
    if (phase === 'climb') {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animateTimer);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = null;
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [phase, ws.connected]);

  // Keyboard Shortcuts Controller
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          handleToggleTimer();
          break;
        case 'p':
          e.preventDefault();
          handlePauseTimer();
          break;
        case 'escape':
          e.preventDefault();
          handleResetTimer();
          break;
        case 't':
          e.preventDefault();
          handleRegisterTop();
          break;
        case 'z':
          e.preventDefault();
          handleRegisterZone();
          break;
        case 'm':
          e.preventDefault();
          setIsMuted((prev) => !prev);
          break;
        case 'arrowright':
          e.preventDefault();
          handleNextPhase();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isMuted, gotTop, gotZone]);

  // Timer Control Handlers
  const handleToggleTimer = () => {
    if (ws.connected) {
      ws.startTimer();
    } else {
      if (phase === 'idle' || phase === 'stopped' || phase === 'pause') {
        setPhase('climb');
        if (!isMuted) soundEngine.playEventAudio(timerConfig.audio?.climbStartAudio, 'horn');
      } else if (phase === 'climb') {
        setPhase('stopped');
      }
    }
  };

  const handlePauseTimer = () => {
    if (ws.connected) {
      ws.pauseTimer();
    } else {
      setPhase('stopped');
    }
  };

  const handleResetTimer = () => {
    if (ws.connected) {
      ws.resetTimer();
    } else {
      setPhase('idle');
      setTimeRemaining(timerConfig.climbTime);
    }
  };

  const handleNextPhase = () => {
    if (ws.connected) {
      ws.nextPhase();
    } else {
      if (phase === 'prep') {
        setPhase('climb');
        setTimeRemaining(timerConfig.climbTime);
        if (!isMuted) soundEngine.playEventAudio(timerConfig.audio?.climbStartAudio, 'horn');
      } else if (phase === 'climb') {
        setPhase('pause');
        setTimeRemaining(timerConfig.pauseTime);
        if (!isMuted) soundEngine.playEventAudio(timerConfig.audio?.pauseStartAudio, 'prep');
      } else {
        setPhase('climb');
        setTimeRemaining(timerConfig.climbTime);
        if (!isMuted) soundEngine.playEventAudio(timerConfig.audio?.climbStartAudio, 'horn');
        if (currentCompetitorIndex < competitors.length - 1) {
          setCurrentCompetitorIndex((prev) => prev + 1);
          setAttemptCount(1);
          setGotTop(false);
          setGotZone(false);
        }
      }
    }
  };

  const handleExportResultsExcel = () => {
    const defaultData = [
      {
        'Posición': '🥇 1º',
        'Dorsal': '22',
        'Competidor': 'Ana Rodríguez',
        'Categoría': 'Senior Femenino',
        'Club': 'Vertical Limit',
        'Bloque 1': 'T1 z1',
        'Bloque 2': 'T2 z1',
        'Bloque 3': 'T3 z2',
        'Total Tops': 3,
        'Total Zonas': 4,
        'Intentos a Top': 6,
        'Intentos a Zona': 8,
      },
      {
        'Posición': '🥈 2º',
        'Dorsal': '14',
        'Competidor': 'María García',
        'Categoría': 'Senior Femenino',
        'Club': 'Pachamama Team',
        'Bloque 1': 'T1 z1',
        'Bloque 2': 'T3 z1',
        'Bloque 3': 'z1',
        'Total Tops': 2,
        'Total Zonas': 3,
        'Intentos a Top': 4,
        'Intentos a Zona': 5,
      },
      {
        'Posición': '🥉 3º',
        'Dorsal': '07',
        'Competidor': 'Pedro López',
        'Categoría': 'Senior Masculino',
        'Club': 'Boulder Club Norte',
        'Bloque 1': 'T2 z2',
        'Bloque 2': 'z1',
        'Bloque 3': '-',
        'Total Tops': 1,
        'Total Zonas': 2,
        'Intentos a Top': 2,
        'Intentos a Zona': 3,
      },
    ];

    const dataToExport = competitors.length > 0
      ? competitors.map((c, idx) => ({
          'Posición': `${idx + 1}º`,
          'Dorsal': c.dorsal,
          'Nombre Completo': c.name,
          'Categoría': c.category,
          'Club': c.club || 'Independiente',
          'Orden de Salida': c.startOrder || (idx + 1),
          'Estado': c.status === 'completed' ? 'Finalizado' : c.status === 'climbing' ? 'Escalando' : 'Registrado'
        }))
      : defaultData;

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet['!cols'] = [
      { wch: 10 },
      { wch: 10 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Resultados');
    XLSX.writeFile(workbook, 'resultados_campeonato_pachamama.xlsx');
  };

  const handleRegisterTop = () => {
    if (ws.connected && currentCompetitor && currentProblem) {
      ws.submitScore(currentCompetitor.id, currentProblem.id, 'top');
    } else {
      setGotTop((prev) => {
        const nextVal = !prev;
        if (nextVal) {
          setGotZone(true);
          if (!isMuted) soundEngine.playTopChime();
        }
        return nextVal;
      });
    }
  };

  const handleRegisterZone = () => {
    if (ws.connected && currentCompetitor && currentProblem) {
      ws.submitScore(currentCompetitor.id, currentProblem.id, 'zone');
    } else {
      setGotZone((prev) => {
        const nextVal = !prev;
        if (nextVal && !isMuted) soundEngine.playZoneChime();
        return nextVal;
      });
    }
  };

  const minutes = Math.floor(Math.max(0, timeRemaining) / 60);
  const seconds = Math.floor(Math.max(0, timeRemaining) % 60);
  const tenths = Math.floor((Math.max(0, timeRemaining) % 1) * 10);

  // Helper para clasificar y ordenar competidores dinámicamente
  const getSortedCompetitors = () => {
    if (!ws.connected || !ws.state) {
      return competitors.map((c) => ({
        competitor: c,
        totalTops: c.status === 'completed' ? 2 : 1,
        totalZones: c.status === 'completed' ? 3 : 2,
        topAttempts: c.status === 'completed' ? 4 : 2,
        zoneAttempts: c.status === 'completed' ? 5 : 3,
        customScore: c.status === 'completed' ? 49.8 : 24.9
      })).sort((a, b) => b.totalTops - a.totalTops);
    }

    const scoringSystem = ws.state.competition.rules.scoringType;
    const customConfig = ws.state.competition.customScoringConfig || { pointsTop: 25, pointsZone: 10, pointsPenalty: 0.1 };

    const stats = competitors.map(comp => {
      let totalTops = 0;
      let totalZones = 0;
      let topAttempts = 0;
      let zoneAttempts = 0;
      let customScore = 0;

      problems.forEach(prob => {
        const key = `${comp.id}_${prob.id}`;
        const score = ws.state.scores[key];
        if (score) {
          if (score.gotTop) {
            totalTops++;
            topAttempts += score.topAttempt || score.attempts;
          }
          if (score.gotZone) {
            totalZones++;
            zoneAttempts += score.zoneAttempt || score.attempts;
          }

          const basePoints = score.gotTop ? customConfig.pointsTop : (score.gotZone ? customConfig.pointsZone : 0);
          customScore += basePoints - (score.attempts * customConfig.pointsPenalty);
        }
      });

      return {
        competitor: comp,
        totalTops,
        totalZones,
        topAttempts,
        zoneAttempts,
        customScore
      };
    });

    if (scoringSystem === 'custom') {
      return stats.sort((a, b) => {
        if (b.customScore !== a.customScore) {
          return b.customScore - a.customScore;
        }
        return a.competitor.startOrder - b.competitor.startOrder;
      });
    } else {
      return stats.sort((a, b) => {
        if (b.totalTops !== a.totalTops) return b.totalTops - a.totalTops;
        if (b.totalZones !== a.totalZones) return b.totalZones - a.totalZones;
        if (a.topAttempts !== b.topAttempts) return a.topAttempts - b.topAttempts;
        if (a.zoneAttempts !== b.zoneAttempts) return a.zoneAttempts - b.zoneAttempts;
        return a.competitor.startOrder - b.competitor.startOrder;
      });
    }
  };

  // Obtener estado real de intentos del WebSocket si está conectado
  const scoreKey = currentCompetitor && currentProblem ? `${currentCompetitor.id}_${currentProblem.id}` : '';
  const wsScore = ws.connected && scoreKey ? ws.state.scores[scoreKey] : null;
  const currentAttempts = wsScore ? wsScore.attempts : attemptCount;
  const currentGotTop = wsScore ? wsScore.gotTop : gotTop;
  const currentGotZone = wsScore ? wsScore.gotZone : gotZone;

  return (
    <div className={`min-h-screen bg-[#0d0e12] text-white font-sans selection:bg-[#1AA0E6] selection:text-white flex flex-col relative overflow-x-hidden ${bgTheme === 'cijel' ? 'theme-cijel' : ''}`}>
      
      {/* 🌌 GIANT DYNAMIC BACKGROUND LOGO / COSMIC WALLPAPER (CIJEL or Pachamama based on active skin) */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
        {bgTheme === 'cijel' ? (
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-500" 
            style={{ 
              backgroundImage: `url(${bgCijel})`, 
              opacity: bgOpacity / 100 
            }} 
          />
        ) : (
          <div 
            className="w-[100vw] sm:w-[96vw] max-w-[1280px] aspect-square flex items-center justify-center transition-all duration-500"
            style={{ opacity: bgOpacity / 100 }}
          >
            <PachamamaLogo size="100%" showText={false} className="w-full h-full animate-pulse" />
          </div>
        )}
      </div>

      {/* 🧭 HEADER BAR WITH LOGO & NAVIGATION */}
      <header className="border-b border-white/10 bg-[#121319]/70 backdrop-blur-md px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40 shadow-[0_8px_24px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-3">
          {competitionLogo.type === 'cijel' || (competitionLogo.type === 'none' && bgTheme === 'cijel') ? (
            <CijelLogo size={competitionLogo.headerMaxHeightPx || 42} showText={true} />
          ) : competitionLogo.type === 'pachamama' || (competitionLogo.type === 'none' && bgTheme === 'pachamama') ? (
            <PachamamaLogo size={competitionLogo.headerMaxHeightPx || 42} showText={true} />
          ) : competitionLogo.type === 'custom' && competitionLogo.customUrl ? (
            <img src={competitionLogo.customUrl} alt="Logo" style={{ height: `${competitionLogo.headerMaxHeightPx || 40}px` }} className="max-w-[160px] object-contain" />
          ) : bgTheme === 'cijel' ? (
            <CijelLogo size={competitionLogo.headerMaxHeightPx || 42} showText={true} />
          ) : (
            <PachamamaLogo size={competitionLogo.headerMaxHeightPx || 42} showText={true} />
          )}
        </div>

        {/* Minimalist Navigation Tabs with Depth */}
        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-inner overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('timer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'timer'
                ? 'bg-[#13A25A] text-white shadow-[0_0_16px_rgba(19,162,90,0.5)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <TimerIcon className="w-4 h-4" /> Temporizador
          </button>

          <button
            onClick={() => setActiveTab('public')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'public'
                ? 'bg-[#DE7B7B] text-white shadow-[0_0_16px_rgba(222,123,123,0.5)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Tv className="w-4 h-4" /> Vista Pública
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'results'
                ? 'bg-[#E8A843] text-black shadow-[0_0_16px_rgba(232,168,67,0.5)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Trophy className="w-4 h-4" /> Resultados
          </button>

          <button
            onClick={() => setActiveTab('competitors')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'competitors'
                ? 'bg-[#E8A843] text-black shadow-[0_0_16px_rgba(232,168,67,0.5)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" /> Competidores
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-[#E8A843] text-black shadow-[0_0_16px_rgba(232,168,67,0.5)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Settings className="w-4 h-4" /> Configuración
          </button>

          <button
            onClick={() => setActiveTab('forms')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'forms'
                ? 'bg-[#1AA0E6] text-white shadow-[0_0_16px_rgba(26,160,230,0.5)]'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-[#22C55E]" /> Importar Excel / Sheet
          </button>
        </div>
      </header>

      {/* 🏆 COMPETITION INFORMATION FULL-WIDTH SUB-BAR */}
      <div className="border-b border-white/10 bg-[#121319]/80 backdrop-blur-md px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-30 shadow-md">
        <div className="flex flex-wrap items-center gap-3 md:gap-6">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${bgTheme === 'cijel' ? 'bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]' : 'bg-[#13A25A] shadow-[0_0_8px_#13A25A]'}`} />
            <span className="font-black text-white tracking-wide uppercase">
              {competitionInfo.name}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-zinc-300 font-mono">
            <span className="text-zinc-500">|</span>
            <span className="text-[#E8A843] font-bold">📍 Sede:</span>
            <span>{competitionInfo.location}</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-zinc-300 font-mono">
            <span className="text-zinc-500">|</span>
            <span className={`font-bold ${bgTheme === 'cijel' ? 'text-[#EC4899]' : 'text-[#DE7B7B]'}`}>🧗 Categoría:</span>
            <span>{competitionInfo.category}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
          <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 flex items-center gap-1.5">
            <span className="text-[#FACC15] font-bold">🏆 Ronda:</span>
            <span className="font-bold text-white">{competitionInfo.round}</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 flex items-center gap-1.5">
            <span className="text-[#38BDF8] font-bold">👥 Competidores:</span>
            <span className="font-bold text-white">{competitors.length} Escaladores</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA WITH FROSTED GLASSMORTISM CARDS */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6 relative z-10">

        {/* TAB 1: JUDGE TIMER CONTROL DASHBOARD */}
        {activeTab === 'timer' && (
          <div className="flex flex-col gap-6">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT 8 COLS: ACTIVE CLIMBER & GIANT TIMER */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Active Climber Banner / General Round Banner */}
              {showCompetitorInTimer ? (
                <div className="pachamama-card rounded-3xl p-5 md:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative overflow-hidden">
                  <div className="flex items-center gap-5 shrink-0">
                    <div className={`font-black text-3xl md:text-4xl px-5 py-2.5 rounded-2xl border-2 border-white shrink-0 shadow-xl ${
                      bgTheme === 'cijel'
                        ? 'bg-gradient-to-r from-[#1AA0E6] via-[#EC4899] to-[#F59E0B] text-white shadow-[0_0_22px_rgba(26,160,230,0.6)]'
                        : 'bg-[#E8A843] text-black shadow-[0_0_22px_rgba(232,168,67,0.5)]'
                    }`}>
                      #{currentCompetitor.dorsal}
                    </div>
                    <div>
                      <span className={`text-xs font-black uppercase tracking-widest block mb-0.5 ${
                        bgTheme === 'cijel' ? 'text-[#EC4899]' : 'text-[#DE7B7B]'
                      }`}>
                        {currentCompetitor.category}
                      </span>
                      <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-none">
                        {currentCompetitor.name}
                      </h1>
                      <p className="text-zinc-300 text-xs md:text-sm font-bold mt-1">
                        {currentCompetitor.club}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 border border-white/15 text-xs font-mono font-black uppercase tracking-wider text-white shadow-sm">
                          {(competitionInfo?.round || 'Finales (1/3)').replace(/^ronda:?\s*/i, '')}
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowCompetitorInTimer(false)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 hover:bg-black/60 border border-white/20 text-xs font-mono font-bold text-zinc-300 hover:text-white cursor-pointer transition"
                          title="Cambiar a modo Ronda General para mostrar solo el reloj gigante en la vista pública"
                        >
                          <TimerIcon className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>Desvincular (Ronda General)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Problem Selection Inset */}
                  <div className="pachamama-inset p-3.5 md:p-4 rounded-2xl flex items-center gap-3 w-full lg:w-auto shrink-0 border border-white/10">
                    <span className={`w-3.5 h-3.5 rounded-full border border-black shrink-0 ${
                      bgTheme === 'cijel'
                        ? 'bg-[#38BDF8] shadow-[0_0_10px_rgba(56,189,248,0.8)]'
                        : 'bg-[#E8A843] shadow-[0_0_8px_rgba(232,168,67,0.6)]'
                    }`} />
                    <div>
                      <span className="text-zinc-400 text-[10px] uppercase font-black tracking-wider block mb-0.5">
                        Bloque Asignado
                      </span>
                      <select
                        value={currentProblemIndex}
                        onChange={(e) => setCurrentProblemIndex(Number(e.target.value))}
                        className="bg-transparent text-white font-black text-sm md:text-base outline-none cursor-pointer"
                      >
                        {problems.map((p, idx) => (
                          <option key={p.id} value={idx} className="bg-[#1a1b20] text-white">
                            {p.name} ({p.grade})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                /* ⏱️ GENERAL ROUND BANNER (UNLINKED COMPETITOR) */
                <div className="pachamama-card rounded-3xl p-5 md:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative overflow-hidden bg-gradient-to-r from-[#181922] via-[#1f212c] to-[#181922] border-2 border-[#38BDF8]/40 shadow-[0_0_25px_rgba(56,189,248,0.2)]">
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="p-3.5 bg-[#38BDF8]/20 border border-[#38BDF8]/50 rounded-2xl text-[#38BDF8] shrink-0 shadow-lg">
                      <TimerIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest block mb-0.5 text-[#38BDF8]">
                        ⏱️ RONDA GENERAL DE ESCALADA
                      </span>
                      <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none">
                        Temporizador Libre (Sin Competidor Individual)
                      </h1>
                      <p className="text-zinc-300 text-xs md:text-sm font-bold mt-1">
                        La Vista Pública muestra el cronómetro en pantalla gigante sin tarjeta de competidor.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowCompetitorInTimer(true)}
                      className="pachamama-btn-blue font-black px-4 py-2.5 rounded-xl text-xs uppercase flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <Users className="w-4 h-4" /> Vincular Escalador
                    </button>

                    {/* Problem Selection Inset */}
                    <div className="pachamama-inset p-3 md:p-3.5 rounded-2xl flex items-center gap-3 border border-white/10">
                      <div>
                        <span className="text-zinc-400 text-[10px] uppercase font-black tracking-wider block">
                          Bloque
                        </span>
                        <select
                          value={currentProblemIndex}
                          onChange={(e) => setCurrentProblemIndex(Number(e.target.value))}
                          className="bg-transparent text-white font-black text-xs md:text-sm outline-none cursor-pointer"
                        >
                          {problems.map((p, idx) => (
                            <option key={p.id} value={idx} className="bg-[#1a1b20] text-white">
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ⏱️ GIANT TIMER SCREEN WITH CUTOUT INSET */}
              <div className="pachamama-card rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
                
                {/* Phase Indicator Badge */}
                <div className="flex items-center gap-2 mb-6">
                  <span
                    className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border ${
                      phase === 'climb'
                        ? bgTheme === 'cijel'
                          ? 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8] shadow-[0_0_20px_rgba(56,189,248,0.4)]'
                          : 'bg-[#13A25A]/20 text-[#13A25A] border-[#13A25A] shadow-[0_0_20px_rgba(19,162,90,0.4)]'
                        : phase === 'prep'
                        ? 'bg-[#1AA0E6]/20 text-[#1AA0E6] border-[#1AA0E6] shadow-[0_0_20px_rgba(26,160,230,0.4)]'
                        : phase === 'pause'
                        ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    {phase === 'climb'
                      ? '🟢 ESCALANDO BLOQUE EN CURSO'
                      : phase === 'prep'
                      ? '🔵 OBSERVACIÓN / PREPARACIÓN'
                      : phase === 'pause'
                      ? '⚫ PAUSA DE TRANSICIÓN'
                      : '⏹ TEMPORIZADOR DETENIDO'}
                  </span>
                </div>

                {/* RECESSED GIANT SCREEN */}
                <div className="pachamama-inset w-full py-8 md:py-10 px-6 rounded-3xl border border-[#2e313c] my-2">
                  <div className={`font-mono text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter ${
                    bgTheme === 'cijel'
                      ? 'text-[#38BDF8] drop-shadow-[0_0_35px_rgba(56,189,248,0.5)]'
                      : 'text-[#E8A843] drop-shadow-[0_0_35px_rgba(232,168,67,0.45)]'
                  }`}>
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    <span className={`text-3xl sm:text-4xl font-bold ml-1 ${
                      bgTheme === 'cijel' ? 'text-[#EC4899]' : 'text-[#E8A843]/80'
                    }`}>.{tenths}</span>
                  </div>
                </div>

                {/* 🏆 COMPETITION LOGO BELOW TIMER (Clean image placeholder) */}
                {competitionLogo.type !== 'none' ? (
                  <div className="mt-5 mb-1 flex flex-col items-center justify-center animate-fade-in w-full">
                    <CompetitionLogoBanner config={competitionLogo} />
                  </div>
                ) : (
                  <p className="text-zinc-500 text-[11px] uppercase font-mono tracking-widest mt-3">
                    {bgTheme === 'cijel' ? 'CIJEL 2026 Precision Engine • Millisecond Sync' : 'Pachamama Escalada Precision Engine • Millisecond Sync'}
                  </p>
                )}

                {/* 🔴 HIGH CONTRAST NEON GLOW BUTTONS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl mt-8">
                  {/* ▶ INICIAR / REANUDAR (EMERALD GREEN #13A25A) */}
                  <button
                    onClick={handleToggleTimer}
                    className="pachamama-btn-green font-black py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-base uppercase tracking-wider">
                      <Play className="w-5 h-5 fill-white" />
                      <span>{phase === 'climb' ? 'REANUDAR' : 'INICIAR'}</span>
                    </div>
                    <span className="text-[10px] bg-black/20 text-white font-extrabold px-2.5 py-0.5 rounded-full">
                      [Espacio]
                    </span>
                  </button>

                  {/* ⏸ PAUSAR (GOLD #E8A843) */}
                  <button
                    onClick={handlePauseTimer}
                    className="pachamama-btn-ochre font-black py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-base uppercase tracking-wider">
                      <Pause className="w-5 h-5 fill-black" />
                      <span>PAUSAR</span>
                    </div>
                    <span className="text-[10px] bg-black/20 text-black font-extrabold px-2.5 py-0.5 rounded-full">
                      [P]
                    </span>
                  </button>

                  {/* ⏹ REINICIAR (TERRACOTTA RED #DE7B7B - LOGO RED) */}
                  <button
                    onClick={handleResetTimer}
                    className="pachamama-btn-terracotta font-black py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-base uppercase tracking-wider">
                      <RotateCcw className="w-5 h-5" />
                      <span>RESET</span>
                    </div>
                    <span className="text-[10px] bg-black/30 text-white font-extrabold px-2.5 py-0.5 rounded-full">
                      [Esc]
                    </span>
                  </button>

                  {/* ⏭ SALTAR FASE (SKY BLUE #1AA0E6) */}
                  <button
                    onClick={handleNextPhase}
                    className="pachamama-btn-blue font-black py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-base uppercase tracking-wider">
                      <SkipForward className="w-5 h-5" />
                      <span>SALTAR</span>
                    </div>
                    <span className="text-[10px] bg-black/30 text-white font-extrabold px-2.5 py-0.5 rounded-full">
                      [→]
                    </span>
                  </button>
                </div>
              </div>

              {/* 🎯 SCORE RECORDING CARD WITH HIGH CONTRAST BEVELED BUTTONS */}
              <div className="pachamama-card rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                
                {/* Attempt Counter Inset */}
                <div className="pachamama-inset p-3.5 rounded-2xl border border-[#2e313c] flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                  <span className="text-zinc-400 text-xs font-black uppercase tracking-wider">
                    Intento #:
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (ws.connected && currentCompetitor && currentProblem) {
                          ws.undoScore();
                        } else {
                          setAttemptCount((prev) => Math.max(1, prev - 1));
                        }
                      }}
                      className="pachamama-btn-dark w-9 h-9 rounded-xl font-black text-lg flex items-center justify-center transition cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-3xl font-black text-white w-8 text-center">
                      {currentAttempts}
                    </span>
                    <button
                      onClick={() => {
                        if (ws.connected && currentCompetitor && currentProblem) {
                          ws.submitScore(currentCompetitor.id, currentProblem.id, 'fall');
                        } else {
                          setAttemptCount((prev) => prev + 1);
                        }
                      }}
                      className="pachamama-btn-dark w-9 h-9 rounded-xl font-black text-lg flex items-center justify-center transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* HUGE PACHAMAMA SCORE BUTTONS */}
                <div className="grid grid-cols-2 gap-4 w-full md:flex-1">
                  
                  {/* 🟡 ZONA BUTTON (GOLD #E8A843) */}
                  <button
                    onClick={handleRegisterZone}
                    className={`py-5 px-6 rounded-2xl font-black text-xl md:text-2xl transition flex items-center justify-center gap-3 cursor-pointer ${
                      currentGotZone
                        ? 'pachamama-btn-ochre ring-4 ring-[#E8A843]/60'
                        : 'pachamama-btn-dark'
                    }`}
                  >
                    <span>🟡 ZONA</span>
                    <span className="text-xs bg-black/20 px-2 py-1 rounded-lg uppercase">
                      [Z] {currentGotZone ? '✓' : ''}
                    </span>
                  </button>

                  {/* 🔴 TOP BUTTON (TERRACOTTA RED #DE7B7B) */}
                  <button
                    onClick={handleRegisterTop}
                    className={`py-5 px-6 rounded-2xl font-black text-xl md:text-2xl transition flex items-center justify-center gap-3 cursor-pointer ${
                      currentGotTop
                        ? 'pachamama-btn-terracotta ring-4 ring-[#DE7B7B]/60'
                        : 'pachamama-btn-dark'
                    }`}
                  >
                    <span>🔴 TOP</span>
                    <span className="text-xs bg-black/20 px-2 py-1 rounded-lg uppercase">
                      [T] {currentGotTop ? '✓' : ''}
                    </span>
                  </button>
                </div>
              </div>

            </div>

            {/* RIGHT 4 COLS: LIVE RANKINGS & AUDIO ENGINE */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* LIVE LEADERBOARD WITH PACHAMAMA RELIEF */}
              <div className="pachamama-card rounded-3xl p-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#2d303a] mb-4">
                  <div className="flex items-center gap-2 font-black text-base text-white uppercase tracking-wider">
                    <Trophy className="w-5 h-5 text-[#E2A838]" /> Ranking En Vivo
                  </div>
                  <span className="text-[10px] bg-[#121316] text-[#E2A838] px-2.5 py-1 rounded-full font-mono border border-[#2d303a]">
                    IFSC Pachamama
                  </span>
                </div>

                <div className="space-y-3">
                  {getSortedCompetitors().slice(0, 3).map((item, idx) => {
                    const isFirst = idx === 0;
                    const isCustom = ws.state?.competition?.rules?.scoringType === 'custom';
                    
                    return (
                      <div 
                        key={item.competitor.id}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                          isFirst 
                            ? 'bg-[#E2A838]/10 border-[#E2A838]/30 shadow-md' 
                            : 'bg-[#1d1e25] border-[#2d303a]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center ${
                            idx === 0 ? 'bg-[#E2A838] text-black' : idx === 1 ? 'bg-zinc-700 text-white' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {idx + 1}º
                          </span>
                          <div>
                            <p className="font-bold text-sm text-white">{item.competitor.name}</p>
                            <p className="text-[10px] text-zinc-400">{item.competitor.club || 'Independiente'}</p>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          {isCustom ? (
                            <>
                              <span className={`text-xs font-black ${isFirst ? 'text-[#EC4899]' : 'text-[#E2A838]'}`}>
                                {item.customScore.toFixed(1)} pts
                              </span>
                            </>
                          ) : (
                            <>
                              <span className={`text-xs font-black ${isFirst ? 'text-[#E06A6A]' : 'text-[#E2A838]'}`}>
                                {item.totalTops}T {item.totalZones}z
                              </span>
                              <p className="text-[10px] text-zinc-500">
                                {item.topAttempts}iT {item.zoneAttempts}iz
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setActiveTab('results')}
                  className="w-full mt-5 py-3 pachamama-btn-dark font-black text-xs rounded-xl transition text-center block cursor-pointer"
                >
                  Ver Ranking Completo →
                </button>
              </div>

              {/* WEB AUDIO ENGINE WITH TEST BUTTONS */}
              <div className="pachamama-card rounded-3xl p-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#2d303a] mb-4">
                  <span className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#1E88E5]" /> Pruebas de Audio Web
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">Sintetizador API</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                  <button
                    onClick={() => soundEngine.playHorn(0.8, 220)}
                    className="p-3 pachamama-btn-dark text-zinc-200 rounded-xl text-left transition cursor-pointer flex items-center gap-2"
                  >
                    📢 Bocina Inicio
                  </button>
                  <button
                    onClick={() => soundEngine.playWarningBeep()}
                    className="p-3 pachamama-btn-dark text-zinc-200 rounded-xl text-left transition cursor-pointer flex items-center gap-2"
                  >
                    ⚠️ Advertencia
                  </button>
                  <button
                    onClick={() => soundEngine.playTopChime()}
                    className="p-3 pachamama-btn-dark text-[#DE7B7B] rounded-xl text-left transition cursor-pointer flex items-center gap-2"
                  >
                    🔔 Campana TOP
                  </button>
                  <button
                    onClick={() => soundEngine.playZoneChime()}
                    className="p-3 pachamama-btn-dark text-[#E8A843] rounded-xl text-left transition cursor-pointer flex items-center gap-2"
                  >
                    🎵 Chime ZONA
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* 🏔️ FULL WIDTH CLIMBER ROTATION STRIP (Extends 100% to right edge of Pruebas de Audio) */}
          <div className="pachamama-card rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-5 w-full shadow-2xl mt-6">
            <div className={`flex items-center gap-2 text-xs md:text-sm font-black uppercase tracking-wider shrink-0 ${
              bgTheme === 'cijel' ? 'text-[#38BDF8]' : 'text-[#E8A843]'
            }`}>
              <Users className={`w-5 h-5 ${bgTheme === 'cijel' ? 'text-[#38BDF8]' : 'text-[#E8A843]'}`} /> Rotación de Competidores:
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto w-full py-2.5 px-1">
              {competitors.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => {
                    if (ws.connected) {
                      ws.selectActiveCompetitor(idx);
                    } else {
                      setCurrentCompetitorIndex(idx);
                      setAttemptCount(1);
                      setGotTop(false);
                      setGotZone(false);
                    }
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black transition whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 ${
                    idx === currentCompetitorIndex
                      ? 'pachamama-btn-ochre text-white shadow-[0_4px_16px_rgba(232,168,67,0.4)]'
                      : 'pachamama-btn-dark text-zinc-300'
                  }`}
                >
                  <span className="font-mono opacity-80">#{c.dorsal}</span>
                  <span className="font-bold">{c.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  if (ws.connected) {
                    ws.selectActiveCompetitor(Math.max(0, currentCompetitorIndex - 1));
                  } else {
                    setCurrentCompetitorIndex((prev) => Math.max(0, prev - 1));
                  }
                }}
                disabled={currentCompetitorIndex === 0}
                className="p-2.5 rounded-xl pachamama-btn-dark text-zinc-200 disabled:opacity-30 cursor-pointer"
                title="Competidor Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (ws.connected) {
                    ws.selectActiveCompetitor(Math.min(competitors.length - 1, currentCompetitorIndex + 1));
                  } else {
                    setCurrentCompetitorIndex((prev) => Math.min(competitors.length - 1, prev + 1));
                  }
                }}
                disabled={currentCompetitorIndex === competitors.length - 1}
                className="p-2.5 rounded-xl pachamama-btn-dark text-zinc-200 disabled:opacity-30 cursor-pointer"
                title="Siguiente Competidor"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        )}

        {/* TAB: PUBLIC VIEW (PROYECTOR / TV) */}
        {activeTab === 'public' && (
          <PublicView
            timeRemainingSeconds={timeRemaining}
            phase={phase}
            currentCompetitor={currentCompetitor}
            currentProblem={currentProblem}
            attemptsCount={currentAttempts}
            gotTop={currentGotTop}
            gotZone={currentGotZone}
            showCompetitor={showCompetitorInTimer}
            bgTheme={bgTheme}
            bgOpacity={bgOpacity}
            competitionLogo={competitionLogo}
            competitionInfo={competitionInfo}
          />
        )}

        {/* TAB 2: FULL RESULTS TABLE & PODIUM */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            
            {/* Top Podium Showcase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {/* 🥈 2º PUESTO */}
              {(() => {
                const sorted = getSortedCompetitors();
                const first = sorted[0];
                const second = sorted[1];
                const third = sorted[2];
                const isCustom = ws.state?.competition?.rules?.scoringType === 'custom';

                return (
                  <>
                    {/* 🥈 2º PUESTO */}
                    <div className="order-2 md:order-1 pachamama-card rounded-3xl p-5 border border-slate-300/50 bg-gradient-to-b from-slate-900/80 to-[#121319]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="bg-slate-300 text-black font-black text-xs px-3 py-1 rounded-full uppercase">
                          🥈 2º PLATA
                        </span>
                        <span className="font-mono text-slate-300 font-bold">
                          {second ? `#${second.competitor.dorsal}` : '-'}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-white">
                        {second ? second.competitor.name : 'Pendiente'}
                      </h3>
                      <p className="text-zinc-400 text-xs">
                        {second ? (second.competitor.club || 'Independiente') : '-'}
                      </p>
                      <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs font-bold">
                        {second ? (
                          isCustom ? (
                            <span className="text-[#EC4899] font-black">{second.customScore.toFixed(1)} pts</span>
                          ) : (
                            <>
                              <span>{second.totalTops} Tops ({second.topAttempts} int)</span>
                              <span className="text-[#FACC15]">{second.totalZones} Zonas ({second.zoneAttempts} int)</span>
                            </>
                          )
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </div>

                    {/* 🥇 1º PUESTO */}
                    <div className="order-1 md:order-2 pachamama-card rounded-3xl p-6 border-2 border-[#FACC15] bg-gradient-to-b from-[#2a220c] to-[#121319] shadow-[0_0_30px_rgba(250,204,21,0.3)] -translate-y-2">
                      <div className="flex items-center justify-between mb-3">
                        <span className="bg-gradient-to-r from-[#FACC15] to-[#E8A843] text-black font-black text-xs px-3.5 py-1 rounded-full uppercase flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 fill-black" /> 1º ORO
                        </span>
                        <span className="font-mono text-[#FACC15] text-xl font-black">
                          {first ? `#${first.competitor.dorsal}` : '-'}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-white">
                        {first ? first.competitor.name : 'Pendiente'}
                      </h3>
                      <p className="text-[#FACC15] text-xs font-bold">
                        {first ? (first.competitor.club || 'Independiente') : '-'}
                      </p>
                      <div className="mt-4 pt-3 border-t border-[#FACC15]/30 flex justify-between text-sm font-black text-white">
                        {first ? (
                          isCustom ? (
                            <span className="text-[#EC4899] font-black">{first.customScore.toFixed(1)} pts</span>
                          ) : (
                            <>
                              <span>{first.totalTops} Tops ({first.topAttempts} int)</span>
                              <span className="text-[#FACC15]">{first.totalZones} Zonas ({first.zoneAttempts} int)</span>
                            </>
                          )
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </div>

                    {/* 🥉 3º PUESTO */}
                    <div className="order-3 pachamama-card rounded-3xl p-5 border border-amber-600/50 bg-gradient-to-b from-amber-950/40 to-[#121319]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="bg-amber-600 text-white font-black text-xs px-3 py-1 rounded-full uppercase">
                          🥉 3º BRONCE
                        </span>
                        <span className="font-mono text-amber-500 font-bold">
                          {third ? `#${third.competitor.dorsal}` : '-'}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-white">
                        {third ? third.competitor.name : 'Pendiente'}
                      </h3>
                      <p className="text-zinc-400 text-xs">
                        {third ? (third.competitor.club || 'Independiente') : '-'}
                      </p>
                      <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs font-bold">
                        {third ? (
                          isCustom ? (
                            <span className="text-[#EC4899] font-black">{third.customScore.toFixed(1)} pts</span>
                          ) : (
                            <>
                              <span>{third.totalTops} Tops ({third.topAttempts} int)</span>
                              <span className="text-[#FACC15]">{third.totalZones} Zonas ({third.zoneAttempts} int)</span>
                            </>
                          )
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Results Table Card */}
            <div className="pachamama-card rounded-3xl p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#2d303a]">
                <div>
                  <h2 className="text-2xl font-black text-white">Tabla General de Resultados</h2>
                  <p className="text-zinc-400 text-xs">Sistema IFSC (Tops &gt; Zonas &gt; Intentos a Top &gt; Intentos a Zona)</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab('public')}
                    className="pachamama-btn-blue font-black px-4 py-2 rounded-xl text-xs uppercase flex items-center gap-2 cursor-pointer"
                  >
                    <Tv className="w-4 h-4" /> Mostrar en Proyector
                  </button>
                  <button 
                    onClick={handleExportResultsExcel}
                    className="pachamama-btn-dark font-black px-4 py-2 rounded-xl text-xs cursor-pointer flex items-center gap-2 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Exportar Excel (.xlsx)
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-300">
                  <thead className="pachamama-inset text-zinc-400 font-mono text-xs uppercase border-b border-[#2d303a]">
                    <tr>
                      <th className="p-3">Pos</th>
                      <th className="p-3">Dorsal</th>
                      <th className="p-3">Competidor</th>
                      <th className="p-3">Categoría</th>
                      {problems.map((p) => (
                        <th key={p.id} className="p-3 text-center">B{p.number}</th>
                      ))}
                      {ws.state?.competition?.rules?.scoringType === 'custom' ? (
                        <th className="p-3 text-center text-[#EC4899]">Puntaje</th>
                      ) : (
                        <>
                          <th className="p-3 text-center text-[#EC4899]">Tops</th>
                          <th className="p-3 text-center text-[#FACC15]">Zonas</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#282a35] font-mono">
                    {getSortedCompetitors().map((item, idx) => {
                      const isFirst = idx === 0;
                      const isSecond = idx === 1;
                      const isThird = idx === 2;
                      const isCustom = ws.state?.competition?.rules?.scoringType === 'custom';

                      const rowBg = isFirst 
                        ? 'bg-[#FACC15]/10 border-l-4 border-l-[#FACC15] font-bold' 
                        : isSecond 
                          ? 'bg-slate-300/10 border-l-4 border-l-slate-300 font-bold'
                          : isThird 
                            ? 'bg-amber-600/10 border-l-4 border-l-amber-600 font-bold'
                            : 'hover:bg-[#20222b]';

                      const posText = isFirst 
                        ? '🥇 1º' 
                        : isSecond 
                          ? '🥈 2º' 
                          : isThird 
                            ? '🥉 3º' 
                            : `${idx + 1}º`;

                      return (
                        <tr key={item.competitor.id} className={`${rowBg}`}>
                          <td className={`p-3 font-black ${isFirst ? 'text-[#FACC15]' : isSecond ? 'text-slate-300' : isThird ? 'text-amber-500' : 'text-zinc-500'}`}>
                            {posText}
                          </td>
                          <td className="p-3 font-black text-white">#{item.competitor.dorsal}</td>
                          <td className="p-3 font-bold text-white">{item.competitor.name}</td>
                          <td className="p-3 text-zinc-300">{item.competitor.category}</td>
                          
                          {/* Celdas de Bloques */}
                          {problems.map((prob) => {
                            const scoreKey = `${item.competitor.id}_${prob.id}`;
                            const score = ws.state?.scores[scoreKey];
                            
                            let cellText = '-';
                            let cellColorClass = 'text-zinc-600';

                            if (score) {
                              if (score.gotTop) {
                                cellText = `T${score.topAttempt || score.attempts}`;
                                if (score.gotZone) {
                                  cellText += ` z${score.zoneAttempt || score.attempts}`;
                                }
                                cellColorClass = 'text-[#EC4899] font-black';
                              } else if (score.gotZone) {
                                cellText = `z${score.zoneAttempt || score.attempts}`;
                                cellColorClass = 'text-[#FACC15] font-bold';
                              } else if (score.attempts > 0) {
                                cellText = `A${score.attempts}`;
                                cellColorClass = 'text-zinc-400';
                              }
                            }

                            return (
                              <td key={prob.id} className={`p-3 text-center ${cellColorClass}`}>
                                {cellText}
                              </td>
                            );
                          })}

                          {/* Totales */}
                          {isCustom ? (
                            <td className="p-3 text-center font-black text-[#EC4899] text-base">
                              {item.customScore.toFixed(1)}
                            </td>
                          ) : (
                            <>
                              <td className="p-3 text-center font-black text-[#EC4899] text-base">
                                {item.totalTops}
                              </td>
                              <td className="p-3 text-center font-black text-[#FACC15] text-base">
                                {item.totalZones}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COMPETITORS MANAGEMENT */}
        {activeTab === 'competitors' && (
          <CompetitorManager
            competitors={competitors}
            setCompetitors={setCompetitors}
            onImportFormsClick={() => setActiveTab('forms')}
          />
        )}

        {/* TAB 4: CONFIG & RULES & SKINS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* SUB-NAVIGATION HEADER WITH ICON BUTTONS FOR SETTINGS */}
            <div className="pachamama-card rounded-3xl p-5 bg-[#15161d] border border-white/10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-4">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-wide">
                    <Settings className="w-5 h-5 text-[#38BDF8]" /> Configuración General y Ajustes
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    Selecciona el módulo de configuración que deseas personalizar
                  </p>
                </div>
              </div>

              {/* SUB-TAB ICON BUTTONS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <button
                  onClick={() => setSettingsSubTab('timer')}
                  className={`p-3.5 rounded-2xl border font-black text-xs flex items-center justify-center gap-2.5 transition cursor-pointer ${
                    settingsSubTab === 'timer'
                      ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-white shadow-[0_0_20px_rgba(56,189,248,0.3)] ring-1 ring-[#38BDF8]'
                      : 'bg-[#1b1c26] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <Sliders className="w-5 h-5 text-[#38BDF8]" />
                  <span className="truncate">1. Tiempos y Audios</span>
                </button>

                <button
                  onClick={() => setSettingsSubTab('problems')}
                  className={`p-3.5 rounded-2xl border font-black text-xs flex items-center justify-center gap-2.5 transition cursor-pointer ${
                    settingsSubTab === 'problems'
                      ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-white shadow-[0_0_20px_rgba(56,189,248,0.3)] ring-1 ring-[#38BDF8]'
                      : 'bg-[#1b1c26] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <Target className="w-5 h-5 text-[#F59E0B]" />
                  <span className="truncate">2. Gestión de Bloques</span>
                </button>

                <button
                  onClick={() => setSettingsSubTab('info')}
                  className={`p-3.5 rounded-2xl border font-black text-xs flex items-center justify-center gap-2.5 transition cursor-pointer ${
                    settingsSubTab === 'info'
                      ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-white shadow-[0_0_20px_rgba(56,189,248,0.3)] ring-1 ring-[#38BDF8]'
                      : 'bg-[#1b1c26] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <Trophy className="w-5 h-5 text-[#FACC15]" />
                  <span className="truncate">3. Info Competencia</span>
                </button>

                <button
                  onClick={() => setSettingsSubTab('rules')}
                  className={`p-3.5 rounded-2xl border font-black text-xs flex items-center justify-center gap-2.5 transition cursor-pointer ${
                    settingsSubTab === 'rules'
                      ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-white shadow-[0_0_20px_rgba(56,189,248,0.3)] ring-1 ring-[#38BDF8]'
                      : 'bg-[#1b1c26] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <Scale className="w-5 h-5 text-[#22C55E]" />
                  <span className="truncate">4. Reglas y Puntuación</span>
                </button>

                <button
                  onClick={() => setSettingsSubTab('skins')}
                  className={`p-3.5 rounded-2xl border font-black text-xs flex items-center justify-center gap-2.5 transition cursor-pointer ${
                    settingsSubTab === 'skins'
                      ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-white shadow-[0_0_20px_rgba(56,189,248,0.3)] ring-1 ring-[#38BDF8]'
                      : 'bg-[#1b1c26] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <Palette className="w-5 h-5 text-[#EC4899]" />
                  <span className="truncate">5. Temas y Skins</span>
                </button>
              </div>
            </div>

            {/* SUB-TAB 1: TIEMPOS Y AUDIOS DEL TEMPORIZADOR */}
            {settingsSubTab === 'timer' && (
              <div className="pachamama-card rounded-3xl p-6 bg-[#181920] border border-white/10 space-y-6">
                <div>
                  <h2 className="text-xl font-black text-white mb-2 pb-3 border-b border-[#2d303a] flex items-center gap-2">
                    <Sliders className="w-6 h-6 text-[#38BDF8]" /> Ajustes de Tiempo y Audios del Temporizador
                  </h2>
                  <p className="text-xs text-zinc-400 mb-6">
                    Personaliza las duraciones oficiales de cada fase de escalada, intervalos de descanso, avisos sonoros y efectos de audio.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="pachamama-inset p-4 rounded-2xl border border-white/10">
                      <label className="text-xs font-black text-zinc-300 uppercase block mb-1">
                        ⏱️ Tiempo Escalada (seg)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="600"
                        value={timerConfig.climbTime}
                        onChange={(e) => setTimerConfig(prev => ({ ...prev, climbTime: Math.max(1, Number(e.target.value)) }))}
                        className="w-full bg-[#121319] border border-white/10 rounded-xl px-3 py-2 text-white font-bold font-mono text-lg outline-none focus:border-[#38BDF8]"
                      />
                    </div>

                    <div className="pachamama-inset p-4 rounded-2xl border border-white/10">
                      <label className="text-xs font-black text-zinc-300 uppercase block mb-1">
                        ⏸️ Tiempo Pausa/Rest (seg)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="600"
                        value={timerConfig.pauseTime}
                        onChange={(e) => setTimerConfig(prev => ({ ...prev, pauseTime: Math.max(0, Number(e.target.value)) }))}
                        className="w-full bg-[#121319] border border-white/10 rounded-xl px-3 py-2 text-white font-bold font-mono text-lg outline-none focus:border-[#38BDF8]"
                      />
                    </div>

                    <div className="pachamama-inset p-4 rounded-2xl border border-white/10">
                      <label className="text-xs font-black text-zinc-300 uppercase block mb-1">
                        🔍 Observación/Prep (seg)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="300"
                        value={timerConfig.prepTime}
                        onChange={(e) => setTimerConfig(prev => ({ ...prev, prepTime: Math.max(0, Number(e.target.value)) }))}
                        className="w-full bg-[#121319] border border-white/10 rounded-xl px-3 py-2 text-white font-bold font-mono text-lg outline-none focus:border-[#38BDF8]"
                      />
                    </div>

                    <div className="pachamama-inset p-4 rounded-2xl border border-white/10">
                      <label className="text-xs font-black text-zinc-300 uppercase block mb-1">
                        🚨 Alerta Final (seg)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={timerConfig.preEndWarning}
                        onChange={(e) => setTimerConfig(prev => ({ ...prev, preEndWarning: Math.max(1, Number(e.target.value)) }))}
                        className="w-full bg-[#121319] border border-white/10 rounded-xl px-3 py-2 text-white font-bold font-mono text-lg outline-none focus:border-[#38BDF8]"
                      />
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#121319] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        🔊 Panel Avanzado de Sonidos y Efectos de Audio
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">
                        Configura bocinas de inicio/fin, pitidos de cuenta regresiva y archivos MP3 personalizados.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsTimerConfigOpen(true)}
                      className="pachamama-btn-blue font-black px-5 py-3 rounded-xl text-xs uppercase flex items-center gap-2 cursor-pointer shrink-0 shadow-lg"
                    >
                      <Settings className="w-4 h-4" /> Configurar Audios y Bocinas
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 1: GESTIÓN DE BLOQUES */}
            {settingsSubTab === 'problems' && (
              <ProblemManager problems={problems} setProblems={setProblems} />
            )}

            {/* SUB-TAB 2: INFORMACIÓN DE LA COMPETENCIA */}
            {settingsSubTab === 'info' && (
              <div className="pachamama-card rounded-3xl p-6 bg-[#181920] border border-white/10 space-y-6">
                <div>
                  <h2 className="text-xl font-black text-white mb-2 pb-3 border-b border-[#2d303a] flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-[#FACC15]" /> Información General de la Competencia
                  </h2>
                  <p className="text-xs text-zinc-400 mb-6">
                    Define el nombre, sede y detalles que se mostrarán en el encabezado principal, sub-barra de estado y la pantalla del proyector.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-black text-zinc-300 uppercase block mb-1">
                        Nombre Oficial de la Competencia *
                      </label>
                      <input
                        type="text"
                        value={competitionInfo.name}
                        onChange={(e) => setCompetitionInfo({ ...competitionInfo, name: e.target.value })}
                        className="pachamama-inset p-3 rounded-xl text-white font-bold w-full outline-none border border-white/10 focus:border-[#38BDF8]"
                        placeholder="Ej: CAMPEONATO DE ESCALADA BOULDER 2026"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-zinc-300 uppercase block mb-1">
                          Sede / Lugar
                        </label>
                        <input
                          type="text"
                          value={competitionInfo.location}
                          onChange={(e) => setCompetitionInfo({ ...competitionInfo, location: e.target.value })}
                          className="pachamama-inset p-3 rounded-xl text-white font-bold w-full outline-none border border-white/10 focus:border-[#38BDF8]"
                          placeholder="Ej: Muro Pachamama Escalada"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-black text-zinc-300 uppercase block mb-1">
                          Categorías en Curso
                        </label>
                        <input
                          type="text"
                          value={competitionInfo.category}
                          onChange={(e) => setCompetitionInfo({ ...competitionInfo, category: e.target.value })}
                          className="pachamama-inset p-3 rounded-xl text-white font-bold w-full outline-none border border-white/10 focus:border-[#38BDF8]"
                          placeholder="Ej: Senior Femenino & Juvenil A"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-zinc-300 uppercase block mb-1">
                          Etapa / Ronda Activa
                        </label>
                        <input
                          type="text"
                          value={competitionInfo.round}
                          onChange={(e) => setCompetitionInfo({ ...competitionInfo, round: e.target.value })}
                          className="pachamama-inset p-3 rounded-xl text-white font-bold w-full outline-none border border-white/10 focus:border-[#38BDF8]"
                          placeholder="Ej: Finales (1/3)"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-black text-zinc-300 uppercase block mb-1">
                          Club / Organizador
                        </label>
                        <input
                          type="text"
                          value={competitionInfo.organizer}
                          onChange={(e) => setCompetitionInfo({ ...competitionInfo, organizer: e.target.value })}
                          className="pachamama-inset p-3 rounded-xl text-white font-bold w-full outline-none border border-white/10 focus:border-[#38BDF8]"
                          placeholder="Ej: Pachamama Escalada"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: REGLAS Y SETEO DE PUNTUACIÓN */}
            {settingsSubTab === 'rules' && (
              <div className="pachamama-card rounded-3xl p-6 bg-[#181920] border border-white/10 space-y-6">
                <div>
                  <h3 className="text-xl font-black text-white mb-2 pb-3 border-b border-[#2d303a] flex items-center gap-2">
                    <Scale className="w-6 h-6 text-[#22C55E]" /> Reglas y Seteo de Puntuación
                  </h3>
                  <p className="text-xs text-zinc-400 mb-6">
                    Elige el modelo de puntuación y personaliza valores para Tops, Zonas, penalizaciones por intentos y límites.
                  </p>

                  <div className="space-y-5 bg-black/40 p-5 rounded-2xl border border-white/10">
                    {/* Selector de Sistema */}
                    <div>
                      <label className="text-xs font-black text-zinc-300 uppercase block mb-2">
                        Sistema de Puntuación Principal
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setScoringConfig({ ...scoringConfig, system: 'ifsc' })}
                          className={`p-4 rounded-xl border text-left font-bold text-xs transition cursor-pointer flex flex-col gap-1.5 ${
                            scoringConfig.system === 'ifsc'
                              ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-white shadow-[0_0_15px_rgba(56,189,248,0.3)] ring-1 ring-[#38BDF8]'
                              : 'bg-[#15161d] border-white/10 text-zinc-400 hover:border-white/20'
                          }`}
                        >
                          <span className="text-sm font-black text-white flex items-center gap-1.5">
                            🏆 IFSC Estándar
                          </span>
                          <span className="text-[11px] text-zinc-400 leading-relaxed">
                            Jerarquía oficial: Tops &gt; Zonas &gt; Intentos a Top &gt; Intentos a Zona
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setScoringConfig({ ...scoringConfig, system: 'points' })}
                          className={`p-4 rounded-xl border text-left font-bold text-xs transition cursor-pointer flex flex-col gap-1.5 ${
                            scoringConfig.system === 'points'
                              ? 'bg-[#EC4899]/20 border-[#EC4899] text-white shadow-[0_0_15px_rgba(236,72,153,0.3)] ring-1 ring-[#EC4899]'
                              : 'bg-[#15161d] border-white/10 text-zinc-400 hover:border-white/20'
                          }`}
                        >
                          <span className="text-sm font-black text-white flex items-center gap-1.5">
                            🔢 Puntuación por Puntos
                          </span>
                          <span className="text-[11px] text-zinc-400 leading-relaxed">
                            Otorga puntos numéricos por Top/Zona y aplica descuentos por intento fallido
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Seteo de Puntos y Penalizaciones */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                      <div>
                        <label className="text-xs font-bold text-zinc-300 block mb-1">
                          Puntos otorgados por TOP
                        </label>
                        <input
                          type="number"
                          value={scoringConfig.pointsPerTop}
                          onChange={(e) => setScoringConfig({ ...scoringConfig, pointsPerTop: Number(e.target.value) })}
                          className="pachamama-inset p-3 rounded-xl text-white font-bold w-full outline-none text-sm border border-white/10"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-300 block mb-1">
                          Puntos otorgados por ZONA
                        </label>
                        <input
                          type="number"
                          value={scoringConfig.pointsPerZone}
                          onChange={(e) => setScoringConfig({ ...scoringConfig, pointsPerZone: Number(e.target.value) })}
                          className="pachamama-inset p-3 rounded-xl text-white font-bold w-full outline-none text-sm border border-white/10"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-300 block mb-1">
                          Penalización por Intento Fallido (Puntos)
                        </label>
                        <input
                          type="number"
                          value={scoringConfig.penaltyPerTopAttempt}
                          onChange={(e) => setScoringConfig({ ...scoringConfig, penaltyPerTopAttempt: Number(e.target.value) })}
                          className="pachamama-inset p-3 rounded-xl text-white font-bold w-full outline-none text-sm border border-white/10"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-300 block mb-1">
                          Límite de Intentos por Bloque
                        </label>
                        <input
                          type="number"
                          value={scoringConfig.maxAttempts}
                          onChange={(e) => setScoringConfig({ ...scoringConfig, maxAttempts: Number(e.target.value) })}
                          className="pachamama-inset p-3 rounded-xl text-white font-bold w-full outline-none text-sm border border-white/10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 4: APARIENCIA Y SKINS */}
            {settingsSubTab === 'skins' && (
              <div className="pachamama-card rounded-3xl p-6 bg-[#181920] border border-white/10 space-y-6">
                <div>
                  <h3 className="text-xl font-black text-white mb-2 pb-3 border-b border-[#2d303a] flex items-center gap-2">
                    <Palette className="w-6 h-6 text-[#EC4899]" /> Apariencia y Temas Visuales (Skins)
                  </h3>
                  <p className="text-xs text-zinc-400 mb-6">
                    Selecciona la paleta de colores y el estilo temático para la aplicación y la vista del proyector.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setBgTheme('pachamama');
                        setCompetitionLogo((prev) => ({ ...prev, type: 'pachamama' }));
                        if (ws.connected && ws.state) {
                          ws.updateConfig({
                            competition: {
                              ...ws.state.competition,
                              bgTheme: 'pachamama'
                            }
                          });
                        }
                      }}
                      className={`p-5 rounded-2xl border transition text-left cursor-pointer flex flex-col justify-between gap-4 ${
                        bgTheme === 'pachamama'
                          ? 'bg-[#1d1f28] border-[#E8A843] shadow-[0_0_25px_rgba(232,168,67,0.3)] ring-1 ring-[#E8A843]'
                          : 'bg-[#15161d] border-white/10 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-black text-white text-base">🏔️ Skin Pachamama</span>
                          {bgTheme === 'pachamama' && (
                            <span className="text-[10px] font-black bg-[#E8A843] text-black px-2.5 py-0.5 rounded-md">
                              ACTIVO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Paleta clásica de la casa (Verde Esmeralda, Ocre Dorado, Terracota).
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                        <span className="w-5 h-5 rounded-full bg-[#13A25A] shadow-sm" title="Verde Pachamama" />
                        <span className="w-5 h-5 rounded-full bg-[#E8A843] shadow-sm" title="Ocre Pachamama" />
                        <span className="w-5 h-5 rounded-full bg-[#DE7B7B] shadow-sm" title="Terracota Pachamama" />
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBgTheme('cijel');
                        setCompetitionLogo((prev) => ({ ...prev, type: 'cijel' }));
                        if (ws.connected && ws.state) {
                          ws.updateConfig({
                            competition: {
                              ...ws.state.competition,
                              bgTheme: 'cijel'
                            }
                          });
                        }
                      }}
                      className={`p-5 rounded-2xl border transition text-left cursor-pointer flex flex-col justify-between gap-4 ${
                        bgTheme === 'cijel'
                          ? 'bg-[#1d1f28] border-[#38BDF8] shadow-[0_0_25px_rgba(56,189,248,0.3)] ring-1 ring-[#38BDF8]'
                          : 'bg-[#15161d] border-white/10 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-black text-white text-base">🌌 Skin CIJEL 2026</span>
                          {bgTheme === 'cijel' && (
                            <span className="text-[10px] font-black bg-[#38BDF8] text-black px-2.5 py-0.5 rounded-md">
                              ACTIVO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Paleta cósmica oficial (Cian Eléctrico, Rosa Neón, Amarillo Galáctico).
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                        <span className="w-5 h-5 rounded-full bg-[#38BDF8] shadow-sm" title="Cian CIJEL" />
                        <span className="w-5 h-5 rounded-full bg-[#EC4899] shadow-sm" title="Rosa CIJEL" />
                        <span className="w-5 h-5 rounded-full bg-[#FACC15] shadow-sm" title="Amarillo CIJEL" />
                      </div>
                    </button>
                  </div>

                  {/* OPACIDAD DEL FONDO DE PANTALLA */}
                  <div className="mt-6 pt-6 border-t border-[#2d303a] space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-zinc-300 block">
                          Opacidad del Fondo de Pantalla ({bgTheme === 'cijel' ? 'Wallpaper Estelar' : 'Logo Gigante'})
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          Ajusta la intensidad de la imagen de fondo para que no interfiera con los textos. Se sincroniza en vivo en el proyector.
                        </span>
                      </div>
                      <span className="px-3 py-1 bg-[#EC4899]/20 border border-[#EC4899] text-[#EC4899] rounded-xl text-xs font-mono font-black shrink-0">
                        {bgOpacity}%
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={bgOpacity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setBgOpacity(val);
                          if (ws.connected && ws.state) {
                            ws.updateConfig({
                              competition: {
                                ...ws.state.competition,
                                bgOpacity: val
                              }
                            });
                          }
                        }}
                        className="w-full accent-[#EC4899] cursor-pointer h-2 bg-zinc-800 rounded-lg appearance-none"
                      />

                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {[5, 10, 20, 30, 45, 60, 80, 100].map((opacityVal) => (
                          <button
                            key={opacityVal}
                            type="button"
                            onClick={() => {
                              setBgOpacity(opacityVal);
                              if (ws.connected && ws.state) {
                                ws.updateConfig({
                                  competition: {
                                    ...ws.state.competition,
                                    bgOpacity: opacityVal
                                  }
                                });
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                              bgOpacity === opacityVal
                                ? 'bg-[#EC4899] text-white shadow-md'
                                : 'bg-white/5 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {opacityVal}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* LOGOTIPO PERSONALIZADO DE LA COMPETENCIA */}
                  <div className="mt-8 pt-6 border-t border-[#2d303a] space-y-6">
                    <div>
                      <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#38BDF8]" /> Logotipo Personalizado de la Competencia
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Configura la imagen del campeonato que aparecerá en la Card Principal del Temporizador (con difuminado suave en los bordes para adaptarse al fondo).
                      </p>
                    </div>

                    {/* SELECTOR DE LOGO PRESET O PERSONALIZADO */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <button
                        type="button"
                        onClick={() => setCompetitionLogo({ ...competitionLogo, type: 'cijel' })}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                          competitionLogo.type === 'cijel'
                            ? 'bg-[#1AA0E6]/20 border-[#38BDF8] text-white ring-1 ring-[#38BDF8]'
                            : 'bg-[#15161d] border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <span className="text-xs font-black uppercase text-white mb-2">1. Logo CIJEL 2026</span>
                        <div className="bg-black/60 p-2 rounded-xl border border-white/10 flex items-center justify-center">
                          <CijelLogo size={40} showText={false} />
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCompetitionLogo({ ...competitionLogo, type: 'pachamama' })}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                          competitionLogo.type === 'pachamama'
                            ? 'bg-[#E8A843]/20 border-[#E8A843] text-white ring-1 ring-[#E8A843]'
                            : 'bg-[#15161d] border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <span className="text-xs font-black uppercase text-white mb-2">2. Logo Pachamama</span>
                        <div className="bg-black/60 p-2 rounded-xl border border-white/10 flex items-center justify-center">
                          <PachamamaLogo size={36} />
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCompetitionLogo({ ...competitionLogo, type: 'custom' })}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                          competitionLogo.type === 'custom'
                            ? 'bg-[#EC4899]/20 border-[#EC4899] text-white ring-1 ring-[#EC4899]'
                            : 'bg-[#15161d] border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <span className="text-xs font-black uppercase text-white mb-2">3. Subir Imagen / URL</span>
                        <div className="bg-black/60 p-2 rounded-xl border border-white/10 flex items-center justify-center text-[10px] font-bold text-[#EC4899]">
                          📁 Imagen Propia
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCompetitionLogo({ ...competitionLogo, type: 'none' })}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                          competitionLogo.type === 'none'
                            ? 'bg-red-500/20 border-red-500 text-white ring-1 ring-red-500'
                            : 'bg-[#15161d] border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <span className="text-xs font-black uppercase text-white mb-2">4. Desactivado</span>
                        <div className="bg-black/60 p-2 rounded-xl border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                          🚫 Sin Logo
                        </div>
                      </button>
                    </div>

                    {/* CUSTOM LOGO FILE UPLOAD & URL CONTROLS */}
                    {competitionLogo.type === 'custom' && (
                      <div className="p-4 bg-black/40 rounded-2xl border border-white/10 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-zinc-300 block mb-1">
                              Subir Archivo de Imagen (.png, .jpg, .webp, .svg)
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (evt) => {
                                    setCompetitionLogo({
                                      ...competitionLogo,
                                      type: 'custom',
                                      customUrl: evt.target?.result as string,
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="w-full bg-[#15161d] border border-white/15 rounded-xl p-2 text-xs text-zinc-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#38BDF8] file:text-black cursor-pointer"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-zinc-300 block mb-1">
                              O Pegar URL de Imagen
                            </label>
                            <input
                              type="text"
                              value={competitionLogo.customUrl || ''}
                              onChange={(e) =>
                                setCompetitionLogo({
                                  ...competitionLogo,
                                  type: 'custom',
                                  customUrl: e.target.value,
                                })
                              }
                              placeholder="https://ejemplo.com/mi-logo-competencia.png"
                              className="w-full bg-[#15161d] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#38BDF8]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* FEATHERING & SIZE CONTROLS */}
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/10 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
                        <div>
                          <span className="text-xs font-black text-white uppercase block">
                            ✨ Difuminar Bordes (Transparencia Suave Corta)
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            Aplica una transparencia en degradado circular hacia las esquinas del logotipo para integrarlo a la card.
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={competitionLogo.featherEdges}
                            onChange={(e) =>
                              setCompetitionLogo({ ...competitionLogo, featherEdges: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22C55E]"></div>
                        </label>
                      </div>

                      {competitionLogo.featherEdges && (
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs font-bold text-zinc-300">Intensidad del Difuminado:</span>
                          <div className="flex items-center gap-2">
                            {(['soft', 'medium', 'strong'] as const).map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => setCompetitionLogo({ ...competitionLogo, featherIntensity: lvl })}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                                  competitionLogo.featherIntensity === lvl
                                    ? 'bg-[#22C55E] text-black shadow-md'
                                    : 'bg-white/5 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {lvl === 'soft' ? 'Suave (Corto)' : lvl === 'medium' ? 'Medio (Recomendado)' : 'Intenso'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* HEIGHT / ADAPT SIZE TO CARD (WITH RANGE SLIDER & INSTANT REAL-TIME UPDATE) */}
                      <div className="space-y-3 pt-3 border-t border-white/10">
                        {/* CONTROL 1: Altura en Card Principal */}
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <span className="text-xs font-bold text-zinc-300 block">
                              Tamaño de la Imagen en Banner (Altura)
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              Cambio automático en tiempo real en la pantalla y la vista pública.
                            </span>
                          </div>
                          <span className="px-3 py-1 bg-[#38BDF8]/20 border border-[#38BDF8] text-[#38BDF8] rounded-xl text-xs font-mono font-black shrink-0">
                            {competitionLogo.maxHeightPx || 80} px
                          </span>
                        </div>

                        {/* SLIDER & PRESETS BANNER */}
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <input
                            type="range"
                            min="30"
                            max="250"
                            step="5"
                            value={competitionLogo.maxHeightPx || 80}
                            onChange={(e) =>
                              setCompetitionLogo({ ...competitionLogo, maxHeightPx: Number(e.target.value) })
                            }
                            className="w-full accent-[#38BDF8] cursor-pointer h-2 bg-zinc-800 rounded-lg appearance-none"
                          />

                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                            {[40, 60, 80, 100, 130, 160, 200].map((h) => (
                              <button
                                key={h}
                                type="button"
                                onClick={() => setCompetitionLogo({ ...competitionLogo, maxHeightPx: h })}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                  (competitionLogo.maxHeightPx || 80) === h
                                    ? 'bg-[#38BDF8] text-black shadow-md'
                                    : 'bg-white/5 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {h}px
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-white/10">
                        {/* CONTROL 2: Altura en Barra Superior (Header) */}
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <span className="text-xs font-bold text-zinc-300 block">
                              Tamaño del Logo en la Barra Superior (Header)
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              Cambio automático en la cabecera del panel de control de la app.
                            </span>
                          </div>
                          <span className="px-3 py-1 bg-[#1AA0E6]/20 border border-[#1AA0E6] text-[#1AA0E6] rounded-xl text-xs font-mono font-black shrink-0">
                            {competitionLogo.headerMaxHeightPx || 60} px
                          </span>
                        </div>

                        {/* SLIDER & PRESETS HEADER */}
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <input
                            type="range"
                            min="24"
                            max="120"
                            step="2"
                            value={competitionLogo.headerMaxHeightPx || 60}
                            onChange={(e) =>
                              setCompetitionLogo({ ...competitionLogo, headerMaxHeightPx: Number(e.target.value) })
                            }
                            className="w-full accent-[#1AA0E6] cursor-pointer h-2 bg-zinc-800 rounded-lg appearance-none"
                          />

                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                            {[24, 32, 42, 60, 80, 100].map((h) => (
                              <button
                                key={h}
                                type="button"
                                onClick={() => setCompetitionLogo({ ...competitionLogo, headerMaxHeightPx: h })}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                  (competitionLogo.headerMaxHeightPx || 60) === h
                                    ? 'bg-[#1AA0E6] text-white shadow-md'
                                    : 'bg-white/5 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {h}px
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* LIVE PREVIEW OF LOGO IN CARD */}
                    {competitionLogo.type !== 'none' && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                          Previsualización en Card del Temporizador:
                        </span>
                        <div className="pachamama-card rounded-2xl p-4 flex items-center justify-between gap-4 bg-[#14151c] border border-white/10">
                          <div className="text-xs font-bold text-zinc-400">#14 María García</div>
                          <CompetitionLogoBanner config={competitionLogo} />
                          <div className="text-xs font-bold text-zinc-500">Bloque #3</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: GOOGLE FORMS INTEGRATION */}
        {activeTab === 'forms' && (
          <GoogleFormsManager
            onImportCompetitors={(newComps) => {
              setCompetitors((prev) => [...prev, ...newComps]);
            }}
            existingCompetitorsCount={competitors.length}
          />
        )}

      </main>

      {/* Inline Timer Configuration & Audio Upload Panel */}
      <TimerConfigPanel
        timerConfig={timerConfig}
        setTimerConfig={setTimerConfig}
        isOpen={isTimerConfigOpen}
        onClose={() => setIsTimerConfigOpen(false)}
      />
    </div>
  );
}
