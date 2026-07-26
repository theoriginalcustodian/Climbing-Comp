import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RotateCcw, Play, Pause, ChevronRight, Undo } from 'lucide-react';
import { CompetitionState } from '../hooks/useClimbCompWS';
import { Problem } from '../types';

interface JudgeTerminalProps {
  ws: ReturnType<typeof import('../hooks/useClimbCompWS').useClimbCompWS>;
}

export function JudgeTerminal({ ws }: JudgeTerminalProps) {
  const { state, connected, submitScore, undoScore, startTimer, pauseTimer, resetTimer, selectActiveCompetitor } = ws;
  
  const [selectedProblemId, setSelectedProblemId] = useState<string>('');
  const [isInside, setIsInside] = useState<boolean>(false);
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>('');

  const timer = state.timerState;
  const problems = state.problems;
  const competitors = state.competitors;
  const rules = state.competition.rules;

  // Wake Lock para evitar apagado de pantalla en móvil
  useEffect(() => {
    let wakeLock: any = null;
    async function requestWakeLock() {
      if (isInside && ('wakeLock' in navigator)) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          console.warn('No se pudo activar el Wake Lock:', err);
        }
      }
    }
    requestWakeLock();
    return () => {
      if (wakeLock) {
        wakeLock.release().then(() => {
          wakeLock = null;
        });
      }
    };
  }, [isInside]);

  // Recuperar bloque previo guardado
  useEffect(() => {
    const saved = localStorage.getItem('climbcomp_react_judge_problem_id');
    if (saved && problems.some(p => p.id === saved)) {
      setSelectedProblemId(saved);
      setIsInside(true);
    }
  }, [problems]);

  // Traducción rápida
  const t = (key: string) => {
    const i18n: Record<string, Record<string, string>> = {
      es: {
        judge_title: "Terminal de Juez",
        select_problem: "Selecciona tu Bloque asignado",
        enter: "Entrar al Bloque",
        attempt: "Intento",
        top: "🟢 TOP",
        zone: "🟡 ZONA",
        fall: "❌ CAÍDA",
        undo: "Deshacer",
        next: "Siguiente Competidor",
        select_comp: "Seleccionar Competidor",
        no_comp: "Sin Competidores",
        connected: "Conectado",
        disconnected: "Desconectado"
      },
      en: {
        judge_title: "Judge Terminal",
        select_problem: "Select your assigned Problem",
        enter: "Enter Problem",
        attempt: "Attempt",
        top: "🟢 TOP",
        zone: "🟡 ZONE",
        fall: "❌ FALL",
        undo: "Undo",
        next: "Next Competitor",
        select_comp: "Select Competitor",
        no_comp: "No Competitors",
        connected: "Connected",
        disconnected: "Disconnected"
      }
    };
    return i18n[lang][key] || key;
  };

  const activeProblem = problems.find(p => p.id === selectedProblemId);

  // Determinar atleta activo actual en base al formato
  let activeCompetitor = competitors.find(c => c.id === selectedCompetitorId);
  const sortedCompetitors = [...competitors].sort((a, b) => a.startOrder - b.startOrder);

  if (rules.rotationFormat === 'circuit') {
    activeCompetitor = sortedCompetitors[timer.activeCompetitorIndex % Math.max(sortedCompetitors.length, 1)];
  }

  // Obtener estadísticas del atleta seleccionado en este bloque
  const scoreKey = activeCompetitor && activeProblem ? `${activeCompetitor.id}_${activeProblem.id}` : '';
  const score = scoreKey ? state.scores[scoreKey] : null;
  const attemptsCount = score ? score.attempts : 0;
  const hasZone = score ? score.gotZone : false;
  const hasTop = score ? score.gotTop : false;

  const handleEnterBlock = () => {
    if (selectedProblemId) {
      setIsInside(true);
      localStorage.setItem('climbcomp_react_judge_problem_id', selectedProblemId);
    }
  };

  const handleScore = (action: 'top' | 'zone' | 'fall') => {
    if (!activeCompetitor || !selectedProblemId) return;

    if ('vibrate' in navigator) {
      if (action === 'top') navigator.vibrate([100, 50, 100]);
      else if (action === 'zone') navigator.vibrate(100);
      else navigator.vibrate(50);
    }

    submitScore(activeCompetitor.id, selectedProblemId, action);
  };

  const handleNextCompetitor = () => {
    if (rules.rotationFormat === 'circuit') {
      const nextIndex = (timer.activeCompetitorIndex + 1) % sortedCompetitors.length;
      selectActiveCompetitor(nextIndex);
    } else {
      setSelectedCompetitorId('');
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = time % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!isInside) {
    return (
      <div className="min-h-screen bg-[#0d0e12] text-white flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md bg-[#121319] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 text-center">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h2 className="text-xl font-black text-[#1AA0E6] flex items-center gap-2">
              🧗 ClimbComp
            </h2>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as 'es' | 'en')}
              className="bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-xs text-zinc-400 focus:outline-none"
            >
              <option value="es">ES</option>
              <option value="en">EN</option>
            </select>
          </div>

          <h3 className="text-lg font-bold text-zinc-300">{t('select_problem')}</h3>
          
          <select
            value={selectedProblemId}
            onChange={(e) => setSelectedProblemId(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-[#1AA0E6] focus:outline-none"
          >
            <option value="">-- {t('select_problem')} --</option>
            {problems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.holdColor})
              </option>
            ))}
          </select>

          <button
            onClick={handleEnterBlock}
            disabled={!selectedProblemId}
            className="w-full py-4 rounded-2xl font-black bg-[#13A25A] hover:bg-[#13A25A]/90 transition shadow-[0_0_16px_rgba(19,162,90,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t('enter')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0d] text-white flex flex-col p-4 max-h-screen">
      {/* HEADER DE CONEXIÓN */}
      <header className="flex justify-between items-center border-b border-white/10 pb-3 mb-3">
        <div className="flex items-center gap-2">
          {connected ? (
            <Wifi className="w-5 h-5 text-[#13A25A] animate-pulse" />
          ) : (
            <WifiOff className="w-5 h-5 text-[#DE7B7B]" />
          )}
          <span className="text-xs font-bold text-zinc-400">
            {connected ? t('connected') : t('disconnected')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-zinc-300">
            {activeProblem?.name} ({activeProblem?.holdColor})
          </span>
          <button
            onClick={() => {
              setIsInside(false);
              localStorage.removeItem('climbcomp_react_judge_problem_id');
            }}
            className="text-xs text-zinc-500 hover:text-white px-2 py-1 bg-white/5 rounded-lg border border-white/10"
          >
            Salir
          </button>
        </div>
      </header>

      {/* CRONÓMETRO SIMÉTRICO */}
      <section className="bg-[#121319] border border-white/10 rounded-2xl p-4 flex justify-between items-center mb-3">
        <div className={`font-mono text-4xl font-black tracking-tight ${
          timer.running ? (timer.phase === 'prep' ? 'text-[#E8A843]' : timer.phase === 'climbing' ? 'text-[#13A25A]' : 'text-[#1AA0E6]') : 'text-zinc-500'
        }`}>
          {formatTime(timer.remaining)}
        </div>
        <div className="flex gap-2">
          <button
            onClick={startTimer}
            className="p-2.5 rounded-xl bg-[#13A25A] hover:bg-[#13A25A]/90 transition"
          >
            <Play className="w-4 h-4 fill-white" />
          </button>
          <button
            onClick={pauseTimer}
            className="p-2.5 rounded-xl bg-[#E8A843] hover:bg-[#E8A843]/90 text-black transition"
          >
            <Pause className="w-4 h-4 fill-black" />
          </button>
          <button
            onClick={() => {
              if (confirm('¿Resetear tiempo?')) resetTimer();
            }}
            className="p-2.5 rounded-xl bg-[#DE7B7B] hover:bg-[#DE7B7B]/90 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* INFORMACIÓN DEL COMPETIDOR */}
      <section className="bg-[#121319] border border-white/10 rounded-3xl p-5 flex flex-col gap-4 text-center mb-4">
        {rules.rotationFormat === 'circuit' ? (
          activeCompetitor ? (
            <div className="flex flex-col gap-2">
              <span className="bg-[#1AA0E6]/20 text-[#1AA0E6] border border-[#1AA0E6]/30 px-3 py-1 rounded-full text-xs font-black mx-auto">
                DORSAL #{activeCompetitor.dorsal}
              </span>
              <h3 className="text-2xl font-black tracking-tight text-white">
                {activeCompetitor.name}
              </h3>
              <p className="text-xs text-zinc-500 font-bold">{activeCompetitor.club}</p>
            </div>
          ) : (
            <p className="text-zinc-500 py-4 font-bold">{t('no_comp')}</p>
          )
        ) : (
          <div className="flex flex-col gap-3">
            <select
              value={selectedCompetitorId}
              onChange={(e) => setSelectedCompetitorId(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white text-center font-bold focus:outline-none"
            >
              <option value="">-- {t('select_comp')} --</option>
              {competitors.map(c => (
                <option key={c.id} value={c.id}>
                  #{c.dorsal} - {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* CONTADOR DE INTENTOS */}
        <div className="grid grid-cols-3 gap-2 bg-black/30 p-3 rounded-2xl border border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">{t('attempt')}</span>
            <strong className="text-lg font-black text-white">{attemptsCount}</strong>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">ZONA</span>
            <strong className="text-lg font-black">
              {hasZone ? '✅' : '❌'}
            </strong>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">TOP</span>
            <strong className="text-lg font-black">
              {hasTop ? '✅' : '❌'}
            </strong>
          </div>
        </div>
      </section>

      {/* BOTONES GIGANTES DE SCORE */}
      <section className="flex flex-col gap-3 flex-grow justify-center mb-4">
        <button
          onClick={() => handleScore('top')}
          disabled={!activeCompetitor}
          className="flex-grow py-5 rounded-2xl bg-[#13A25A] hover:bg-[#13A25A]/95 text-white font-black text-xl tracking-wider transition active:scale-95 disabled:opacity-30 shadow-[0_4px_16px_rgba(19,162,90,0.3)]"
        >
          {t('top')}
        </button>
        <button
          onClick={() => handleScore('zone')}
          disabled={!activeCompetitor || hasTop}
          className="flex-grow py-5 rounded-2xl bg-[#E8A843] hover:bg-[#E8A843]/95 text-black font-black text-xl tracking-wider transition active:scale-95 disabled:opacity-30 shadow-[0_4px_16px_rgba(232,168,67,0.3)]"
        >
          {t('zone')}
        </button>
        <button
          onClick={() => handleScore('fall')}
          disabled={!activeCompetitor || hasTop}
          className="flex-grow py-5 rounded-2xl bg-[#DE7B7B] hover:bg-[#DE7B7B]/95 text-white font-black text-xl tracking-wider transition active:scale-95 disabled:opacity-30 shadow-[0_4px_16px_rgba(222,123,123,0.3)]"
        >
          {t('fall')}
        </button>
      </section>

      {/* FOOTER: UNDO / NEXT */}
      <footer className="flex gap-3 border-t border-white/10 pt-4 mt-auto">
        <button
          onClick={() => {
            if (confirm('¿Deshacer última puntuación?')) undoScore();
          }}
          className="flex-1 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 font-bold text-sm text-zinc-400 flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Undo className="w-4 h-4" /> {t('undo')}
        </button>
        <button
          onClick={handleNextCompetitor}
          className="flex-1 py-3.5 rounded-xl bg-[#1AA0E6] hover:bg-[#1AA0E6]/90 font-bold text-sm text-white flex items-center justify-center gap-1 active:scale-95"
        >
          {t('next')} <ChevronRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
}
