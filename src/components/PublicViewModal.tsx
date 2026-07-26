import React, { useState } from 'react';
import { Competitor, Problem, TimerPhase } from '../types';
import { Tv, Flame, Trophy, Award, Timer as TimerIcon, Crown, Medal, Sparkles } from 'lucide-react';
import { PachamamaLogo } from './PachamamaLogo';
import { CijelLogo } from './CijelLogo';
import { CompetitionLogoBanner, CompetitionLogoConfig } from './CompetitionLogoBanner';
import bgCijel from '../assets/bg_cijel.jpg';

interface PublicViewProps {
  timeRemainingSeconds: number;
  phase: TimerPhase;
  currentCompetitor: Competitor;
  currentProblem: Problem;
  attemptsCount: number;
  gotTop: boolean;
  gotZone: boolean;
  showCompetitor?: boolean;
  bgTheme?: 'pachamama' | 'cijel';
  bgOpacity?: number;
  competitionLogo?: CompetitionLogoConfig;
  competitionInfo?: {
    name: string;
    location: string;
    category: string;
    round: string;
    organizer: string;
  };
  competitors?: Competitor[];
  defaultViewMode?: 'timer' | 'results';
}

// Sample enriched leaderboard data for the public results display
const DEFAULT_LEADERBOARD = [
  { rank: 1, dorsal: '22', name: 'Ana Rodríguez', club: 'Vertical Limit', category: 'Senior Femenino', tops: 3, zones: 4, topAttempts: 4, zoneAttempts: 5, status: 'Finalizado' },
  { rank: 2, dorsal: '14', name: 'María García', club: 'Pachamama Team', category: 'Senior Femenino', tops: 2, zones: 3, topAttempts: 3, zoneAttempts: 4, status: 'En Curso' },
  { rank: 3, dorsal: '07', name: 'Pedro López', club: 'Boulder Club Norte', category: 'Senior Masculino', tops: 1, zones: 2, topAttempts: 2, zoneAttempts: 3, status: 'Finalizado' },
  { rank: 4, dorsal: '03', name: 'Luis Martínez', club: 'Klimbing Madrid', category: 'Senior Masculino', tops: 0, zones: 2, topAttempts: 0, zoneAttempts: 3, status: 'Finalizado' },
  { rank: 5, dorsal: '18', name: 'Sofia Fernández', club: 'Rock & Wall', category: 'Senior Femenino', tops: 0, zones: 1, topAttempts: 0, zoneAttempts: 2, status: 'Pendiente' },
];

export const PublicView: React.FC<PublicViewProps> = ({
  timeRemainingSeconds,
  phase,
  currentCompetitor,
  currentProblem,
  attemptsCount,
  gotTop,
  gotZone,
  showCompetitor = true,
  bgTheme = 'pachamama',
  bgOpacity,
  competitionLogo,
  competitionInfo,
  defaultViewMode = 'timer',
}) => {
  const [viewMode, setViewMode] = useState<'timer' | 'results'>(defaultViewMode);

  const minutes = Math.floor(Math.max(0, timeRemainingSeconds) / 60);
  const seconds = Math.floor(Math.max(0, timeRemainingSeconds) % 60);
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  // Pachamama Palette dynamic high-contrast phase styles for projector
  const getPhaseStyles = () => {
    switch (phase) {
      case 'prep':
        return {
          bg: bgTheme === 'cijel' ? 'bg-[#1AA0E6] text-white shadow-[0_0_20px_rgba(26,160,230,0.6)]' : 'bg-[#1AA0E6] text-white shadow-[0_0_20px_rgba(26,160,230,0.5)]',
          border: 'border-[#1AA0E6]',
          label: '🔵 FASE DE PREPARACIÓN / OBSERVACIÓN',
          timeColor: 'text-[#1AA0E6] drop-shadow-[0_0_28px_rgba(26,160,230,0.5)]',
        };
      case 'climb':
        if (timeRemainingSeconds <= 30) {
          return {
            bg: bgTheme === 'cijel' ? 'bg-[#EC4899] text-white animate-pulse shadow-[0_0_24px_rgba(236,72,153,0.8)]' : 'bg-[#DE7B7B] text-white animate-pulse shadow-[0_0_24px_rgba(222,123,123,0.7)]',
            border: bgTheme === 'cijel' ? 'border-[#EC4899]' : 'border-[#DE7B7B]',
            label: '🔴 ¡ÚLTIMOS 30 SEGUNDOS!',
            timeColor: bgTheme === 'cijel' ? 'text-[#EC4899] drop-shadow-[0_0_28px_rgba(236,72,153,0.8)]' : 'text-[#DE7B7B] drop-shadow-[0_0_28px_rgba(222,123,123,0.6)]',
          };
        }
        return {
          bg: bgTheme === 'cijel' ? 'bg-[#06B6D4] text-white shadow-[0_0_20px_rgba(6,182,212,0.6)]' : 'bg-[#13A25A] text-white shadow-[0_0_20px_rgba(19,162,90,0.5)]',
          border: bgTheme === 'cijel' ? 'border-[#06B6D4]' : 'border-[#13A25A]',
          label: '🟢 ESCALANDO BLOQUE EN CURSO',
          timeColor: bgTheme === 'cijel' ? 'text-[#38BDF8] drop-shadow-[0_0_35px_rgba(56,189,248,0.55)]' : 'text-[#E8A843] drop-shadow-[0_0_35px_rgba(232,168,67,0.45)]',
        };
      case 'pause':
        return {
          bg: 'bg-zinc-800 text-zinc-200',
          border: 'border-zinc-700',
          label: '⚫ PAUSA DE TRANSICIÓN DE BLOQUE',
          timeColor: 'text-zinc-400',
        };
      case 'stopped':
      case 'idle':
      default:
        return {
          bg: 'bg-zinc-800 text-zinc-300',
          border: 'border-zinc-700',
          label: '⏸ ESPERANDO INICIO DE SECUENCIA',
          timeColor: bgTheme === 'cijel' ? 'text-[#38BDF8]' : 'text-[#E2A838]',
        };
    }
  };

  const phaseStyle = getPhaseStyles();

  // Top 3 Podium Winners
  const firstPlace = DEFAULT_LEADERBOARD[0];
  const secondPlace = DEFAULT_LEADERBOARD[1];
  const thirdPlace = DEFAULT_LEADERBOARD[2];

  return (
    <div className={`w-full flex flex-col gap-6 text-white font-sans animate-fade-in relative ${bgTheme === 'cijel' ? 'theme-cijel' : ''}`}>
      
      {/* 🌌 GIANT DYNAMIC BACKGROUND LOGO / COSMIC WALLPAPER (CIJEL or Pachamama based on active skin) */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden">
        {bgTheme === 'cijel' ? (
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-500" 
            style={{ 
              backgroundImage: `url(${bgCijel})`, 
              opacity: (bgOpacity !== undefined ? bgOpacity : 40) / 100 
            }} 
          />
        ) : (
          <div 
            className="w-[100vw] sm:w-[96vw] max-w-[1280px] aspect-square flex items-center justify-center transition-all duration-500"
            style={{ opacity: (bgOpacity !== undefined ? bgOpacity : 15) / 100 }}
          >
            <PachamamaLogo size="100%" showText={false} className="w-full h-full animate-pulse" />
          </div>
        )}
      </div>
      
      {/* 🎛️ PUBLIC VIEW CONTROL / MODE SELECTOR HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl">
        <div className="flex items-center gap-2 pl-2">
          <Tv className="w-5 h-5 text-[#38BDF8]" />
          <span className="text-xs font-black uppercase tracking-wider text-zinc-300 hidden sm:inline">
            Modo Pantalla Proyector:
          </span>
        </div>

        <div className="flex items-center gap-2 bg-black/60 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setViewMode('timer')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              viewMode === 'timer'
                ? bgTheme === 'cijel'
                  ? 'bg-[#38BDF8] text-black shadow-[0_0_15px_rgba(56,189,248,0.5)]'
                  : 'bg-[#E8A843] text-black shadow-[0_0_15px_rgba(232,168,67,0.4)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TimerIcon className="w-4 h-4" />
            <span>⏱️ Temporizador en Vivo</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('results')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              viewMode === 'results'
                ? 'bg-gradient-to-r from-[#FACC15] via-[#E8A843] to-[#F59E0B] text-black shadow-[0_0_20px_rgba(250,204,21,0.6)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>🏆 Resultados & Podio</span>
          </button>
        </div>
      </div>

      {/* ----------------- MODE 1: LIVE TIMER DISPLAY ----------------- */}
      {viewMode === 'timer' && (
        !showCompetitor ? (
          /* ⏱️ GENERAL ROUND / UNLINKED TIMER PUBLIC VIEW (GIANT TIMER ONLY) */
          <div className="flex flex-col items-center justify-center pachamama-card bg-[#0b0c10]/95 rounded-3xl p-8 md:p-14 text-center max-w-5xl mx-auto w-full relative overflow-hidden my-auto shadow-2xl">
            {/* Top Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <span className={`border font-black px-5 py-2 rounded-full text-xs md:text-sm uppercase tracking-widest flex items-center gap-2 backdrop-blur-sm shadow-md ${
                bgTheme === 'cijel'
                  ? 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/50'
                  : 'bg-[#E8A843]/20 text-[#E8A843] border-[#E8A843]/50'
              }`}>
                ⏱️ RONDA GENERAL DE ESCALADA
              </span>

              {competitionInfo?.category && (
                <span className={`border font-black px-5 py-2 rounded-full text-xs md:text-sm uppercase tracking-widest flex items-center gap-2 backdrop-blur-sm shadow-md ${
                  bgTheme === 'cijel'
                    ? 'bg-[#EC4899]/20 text-[#EC4899] border-[#EC4899]/50'
                    : 'bg-[#DE7B7B]/20 text-[#DE7B7B] border-[#DE7B7B]/50'
                }`}>
                  <Flame className="w-4 h-4" /> {competitionInfo.category}
                </span>
              )}

              <span className="bg-white/10 border border-white/20 text-white font-mono font-black text-xs md:text-sm px-5 py-2 rounded-full uppercase tracking-widest shadow-md">
                {(competitionInfo?.round || 'Finales (1/3)').replace(/^ronda:?\s*/i, '')}
              </span>
            </div>

            {/* Phase Badge */}
            <div className={`px-8 py-2.5 rounded-full font-black text-sm md:text-lg tracking-widest border uppercase mb-6 shadow-md backdrop-blur-md ${phaseStyle.bg} ${phaseStyle.border}`}>
              {phaseStyle.label}
            </div>

            {/* GIANT COUNTDOWN IN INSET SCREEN */}
            <div className="pachamama-inset w-full py-10 md:py-16 px-6 rounded-3xl border border-white/10 my-3 shadow-2xl">
              <div className={`font-mono text-8xl sm:text-9xl md:text-[11rem] font-black tracking-tighter leading-none ${phaseStyle.timeColor} drop-shadow-[0_0_45px_rgba(226,168,56,0.5)]`}>
                {formattedMinutes}:{formattedSeconds}
              </div>
            </div>

            {/* Active Problem indicator if available */}
            {currentProblem && (
              <div className="mt-4 inline-flex items-center gap-3 px-5 py-2 rounded-2xl bg-black/40 border border-white/10 text-sm md:text-base font-bold text-zinc-200">
                <span className={`w-3.5 h-3.5 rounded-full inline-block border border-black shrink-0 ${
                  bgTheme === 'cijel' ? 'bg-[#38BDF8] shadow-[0_0_8px_rgba(56,189,248,0.8)]' : 'bg-[#E8A843]'
                }`} />
                <span>Bloque: <strong className="text-white font-black">{currentProblem.name} ({currentProblem.grade})</strong></span>
              </div>
            )}

            {/* Competition Logo Banner */}
            {competitionLogo && competitionLogo.type !== 'none' ? (
              <div className="mt-8 mb-2 flex flex-col items-center justify-center animate-fade-in w-full">
                <CompetitionLogoBanner config={competitionLogo} />
              </div>
            ) : (
              <p className="text-zinc-400 text-xs md:text-sm font-mono uppercase tracking-widest mt-6">
                {competitionInfo?.name || 'Pachamama Escalada'} • {competitionInfo?.location || 'Sede Principal'}
              </p>
            )}
          </div>
        ) : (
          /* SPLIT VIEW (WITH COMPETITOR) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left Card: Climber & Problem Info */}
            <div className="lg:col-span-6 flex flex-col justify-between pachamama-card bg-[#0b0c10]/95 rounded-3xl p-6 md:p-8 relative overflow-hidden">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <span className={`border font-black px-4 py-1.5 rounded-full text-xs md:text-sm uppercase tracking-widest flex items-center gap-2 backdrop-blur-sm shadow-md ${
                      bgTheme === 'cijel'
                        ? 'bg-[#EC4899]/20 text-[#EC4899] border-[#EC4899]/50'
                        : 'bg-[#DE7B7B]/20 text-[#DE7B7B] border-[#DE7B7B]/50'
                    }`}>
                      <Flame className="w-4 h-4" /> {competitionInfo?.category || currentCompetitor.category}
                    </span>
                  </div>

                  {/* Dorsal & Name */}
                  <div className="flex items-center gap-5 mt-3 mb-2">
                    <div className={`font-black text-3xl md:text-5xl px-5 py-3 rounded-2xl border-2 border-white leading-none shrink-0 shadow-xl ${
                      bgTheme === 'cijel'
                        ? 'bg-gradient-to-r from-[#1AA0E6] via-[#EC4899] to-[#F59E0B] text-white shadow-[0_0_22px_rgba(26,160,230,0.6)]'
                        : 'bg-[#E8A843] text-black shadow-[0_0_22px_rgba(232,168,67,0.5)]'
                    }`}>
                      #{currentCompetitor.dorsal}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight truncate">
                        {currentCompetitor.name}
                      </h2>
                      <p className="text-zinc-300 text-base md:text-xl font-bold mt-1 truncate">
                        {currentCompetitor.club || 'Independiente'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 🏆 PROMINENT ROUND BANNER (PERFECTLY CENTERED IN MAIN CONTAINER SPACE) */}
                <div className="my-5 w-full flex items-center justify-center">
                  <div className={`w-full max-w-lg text-center py-3.5 px-6 rounded-2xl border backdrop-blur-md shadow-lg transition-all ${
                    bgTheme === 'cijel'
                      ? 'bg-gradient-to-r from-[#1AA0E6]/25 via-[#EC4899]/25 to-[#1AA0E6]/25 border-white/30 shadow-[0_4px_20px_rgba(26,160,230,0.3)]'
                      : 'bg-white/15 border-white/25 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                  }`}>
                    <span className="text-white text-xl md:text-3xl font-black font-mono uppercase tracking-widest block drop-shadow-md">
                      {(competitionInfo?.round || 'Finales (1/3)').replace(/^ronda:?\s*/i, '')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Problem & Attempt Indicators */}
              <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-2 gap-4">
                <div className="pachamama-inset p-4 md:p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-zinc-400 text-xs uppercase font-black tracking-wider block mb-1">
                      Bloque Asignado
                    </span>
                    <div className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
                      <span className={`w-3.5 h-3.5 rounded-full inline-block border border-black shrink-0 ${
                        bgTheme === 'cijel' ? 'bg-[#38BDF8] shadow-[0_0_8px_rgba(56,189,248,0.8)]' : 'bg-[#E8A843]'
                      }`} />
                      {currentProblem.name}
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-zinc-300 font-mono font-bold mt-2">Grado: {currentProblem.grade || 'V4'}</p>
                </div>

                <div className="pachamama-inset p-4 md:p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <span className="text-zinc-400 text-xs uppercase font-black tracking-wider block mb-1">
                      Estado de Intentos
                    </span>
                    <div className="text-xl md:text-2xl font-black text-white">
                      Intento #{attemptsCount}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${
                      gotZone
                        ? bgTheme === 'cijel'
                          ? 'bg-[#FACC15] text-black shadow-[0_0_12px_rgba(250,204,21,0.7)]'
                          : 'bg-[#E8A843] text-black shadow-[0_0_12px_rgba(232,168,67,0.6)]'
                        : 'bg-black/50 text-zinc-500 border border-white/10'
                    }`}>
                      {gotZone ? 'ZONA ✅' : 'ZONA ⚪'}
                    </span>
                    <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${
                      gotTop
                        ? bgTheme === 'cijel'
                          ? 'bg-[#EC4899] text-white shadow-[0_0_12px_rgba(236,72,153,0.7)]'
                          : 'bg-[#DE7B7B] text-white shadow-[0_0_12px_rgba(222,123,123,0.6)]'
                        : 'bg-black/50 text-zinc-500 border border-white/10'
                    }`}>
                      {gotTop ? 'TOP 🎯' : 'TOP ⚪'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Giant Timer Box */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center pachamama-card bg-[#0b0c10]/95 rounded-3xl p-8 md:p-12 text-center">
              {/* Phase Badge */}
              <div className={`px-6 py-2 rounded-full font-black text-sm md:text-base tracking-widest border uppercase mb-6 shadow-md backdrop-blur-md ${phaseStyle.bg} ${phaseStyle.border}`}>
                {phaseStyle.label}
              </div>

              {/* GIANT COUNTDOWN IN INSET SCREEN */}
              <div className="pachamama-inset w-full py-8 px-4 rounded-3xl border border-white/10 my-2">
                <div className={`font-mono text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter ${phaseStyle.timeColor} drop-shadow-[0_0_35px_rgba(226,168,56,0.4)]`}>
                  {formattedMinutes}:{formattedSeconds}
                </div>
              </div>

              {/* 🏆 COMPETITION LOGO BELOW TIMER (Clean image banner) */}
              {competitionLogo && competitionLogo.type !== 'none' ? (
                <div className="mt-5 mb-2 flex flex-col items-center justify-center animate-fade-in w-full">
                  <CompetitionLogoBanner config={competitionLogo} />
                </div>
              ) : (
                <p className="text-zinc-400 text-xs md:text-sm font-mono uppercase tracking-widest mt-3">
                  {competitionInfo?.name || 'Pachamama Escalada'} • {competitionInfo?.location || 'Sede Principal'}
                </p>
              )}
            </div>

          </div>
        )
      )}

      {/* ----------------- MODE 2: RESULTS SHOWCASE (TABLE ONLY) ----------------- */}
      {viewMode === 'results' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          
          {/* FULL RANKINGS HIGH-CONTRAST PROJECTOR TABLE */}
          <div className="pachamama-card bg-[#0b0c10]/95 rounded-3xl p-6 border border-white/10 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  🏆 {competitionInfo?.name || 'TABLA OFICIAL DE RESULTADOS'}
                </h2>
                <p className="text-xs text-zinc-400 font-mono mt-1">
                  📍 {competitionInfo?.location || 'Sede Principal'} • 🧗 Categoría: {competitionInfo?.category || 'Senior Femenino'} • Ronda {competitionInfo?.round || 'Finales'}
                </p>
              </div>
              <div className="bg-[#FACC15]/20 text-[#FACC15] border border-[#FACC15]/40 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Clasificación Final
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-200">
                <thead className="pachamama-inset text-zinc-400 font-mono text-xs uppercase border-b border-white/10">
                  <tr>
                    <th className="p-3.5">Posición</th>
                    <th className="p-3.5">Dorsal</th>
                    <th className="p-3.5">Competidor</th>
                    <th className="p-3.5">Club</th>
                    <th className="p-3.5 text-center">Tops</th>
                    <th className="p-3.5 text-center">Zonas</th>
                    <th className="p-3.5 text-center">Int. Top</th>
                    <th className="p-3.5 text-center">Int. Zona</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 font-mono">
                  {DEFAULT_LEADERBOARD.map((item) => {
                    const isFirst = item.rank === 1;
                    const isSecond = item.rank === 2;
                    const isThird = item.rank === 3;

                    return (
                      <tr 
                        key={item.dorsal} 
                        className={`transition ${
                          isFirst 
                            ? 'bg-[#FACC15]/20 text-white font-black border-l-4 border-l-[#FACC15]' 
                            : isSecond 
                            ? 'bg-slate-300/15 text-white font-bold border-l-4 border-l-slate-300' 
                            : isThird 
                            ? 'bg-amber-600/15 text-white font-bold border-l-4 border-l-amber-600' 
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <td className="p-3.5 font-black text-base">
                          {isFirst && <span className="text-[#FACC15]">🥇 1º PUESTO</span>}
                          {isSecond && <span className="text-slate-300">🥈 2º PUESTO</span>}
                          {isThird && <span className="text-amber-500">🥉 3º PUESTO</span>}
                          {!isFirst && !isSecond && !isThird && <span className="text-zinc-400">{item.rank}º</span>}
                        </td>
                        <td className="p-3.5 font-black text-white">#{item.dorsal}</td>
                        <td className="p-3.5 font-bold text-white text-base">{item.name}</td>
                        <td className="p-3.5 text-zinc-400">{item.club}</td>
                        <td className="p-3.5 text-center font-black text-[#EC4899] text-base">{item.tops}</td>
                        <td className="p-3.5 text-center font-black text-[#FACC15] text-base">{item.zones}</td>
                        <td className="p-3.5 text-center text-zinc-400">{item.topAttempts}</td>
                        <td className="p-3.5 text-center text-zinc-400">{item.zoneAttempts}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Bottom Live Leaderboard Preview */}
      <div className="border border-white/10 p-4 rounded-2xl bg-black/30 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between text-xs text-zinc-400 gap-3">
        <div className="flex items-center gap-3">
          <Award className="w-4 h-4 text-[#E2A838]" />
          <span className="font-bold text-white uppercase">Líderes {competitionInfo?.category || 'Senior Femenino'}:</span>
          <span className="text-[#FACC15] font-bold">🥇 1º Ana R. (3T / 4z)</span>
          <span className="text-zinc-600">•</span>
          <span className="text-slate-300 font-bold">🥈 2º María G. (2T / 3z)</span>
          <span className="text-zinc-600">•</span>
          <span className="text-amber-500 font-bold">🥉 3º Pedro L. (1T / 2z)</span>
        </div>
        <div className="text-zinc-400 font-mono">
          {competitionInfo?.organizer || 'Pachamama Escalada'}
        </div>
      </div>

    </div>
  );
};

export const PublicViewModal = PublicView;

