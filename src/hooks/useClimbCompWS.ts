import { useState, useEffect, useRef, useCallback } from 'react';
import { Competitor, Problem, TimerPhase, TimerConfig } from '../types';

export interface TimerState {
  running: boolean;
  phase: TimerPhase;
  remaining: number;
  elapsed: number;
  activeCompetitorIndex: number;
  activeProblemIndex: number;
}

export interface CompetitionState {
  competition: {
    id: string;
    name: string;
    date: string;
    location: string;
    status: string;
    rules: {
      scoringType: 'ifsc' | 'custom';
      rotationFormat: 'circuit' | 'open';
      language: 'es' | 'en';
    };
    timerConfig: {
      prepTime: number;
      climbTime: number;
      pauseTime: number;
      preEndWarning: number;
      preStartWarning: number;
    };
    customScoringConfig?: {
      pointsTop: number;
      pointsZone: number;
      pointsPenalty: number;
    };
    bgTheme?: 'pachamama' | 'cijel';
    bgOpacity?: number;
  };
  categories: { id: string; name: string; sortOrder: number }[];
  competitors: Competitor[];
  problems: Problem[];
  scores: Record<string, {
    competitorId: string;
    problemId: string;
    attempts: number;
    gotTop: boolean;
    gotZone: boolean;
    topAttempt?: number;
    zoneAttempt?: number;
    timestamp: string;
  }>;
  timerState: TimerState;
}

const DEFAULT_STATE: CompetitionState = {
  competition: {
    id: "comp-default",
    name: "Cargando Competencia...",
    date: "",
    location: "",
    status: "draft",
    rules: { scoringType: "ifsc", rotationFormat: "circuit", language: "es" },
    timerConfig: { prepTime: 10, climbTime: 40, pauseTime: 10, preEndWarning: 5, preStartWarning: 3 }
  },
  categories: [],
  competitors: [],
  problems: [],
  scores: {},
  timerState: { running: false, phase: "idle", remaining: 0, elapsed: 0, activeCompetitorIndex: 0, activeProblemIndex: 0 }
};

export function useClimbCompWS() {
  const [state, setState] = useState<CompetitionState>(DEFAULT_STATE);
  const [connected, setConnected] = useState<boolean>(false);
  const [localIp, setLocalIp] = useState<string>('localhost');
  const [serverPort, setServerPort] = useState<number>(3000);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const loc = window.location;
    const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    // Si estamos en desarrollo en puerto 5173, intentamos conectar al backend en puerto 3000
    const host = loc.port === '5173' ? `${loc.hostname}:3000` : loc.host;
    const url = `${protocol}//${host}`;

    console.log(`[WS] Intentando conectar a ${url}...`);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Conectado exitosamente.');
      setConnected(true);
      if (reconnectTimerRef.current) {
        clearInterval(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      
      // Flush de la cola offline si hubiera
      flushOfflineQueue();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'init':
            setState(message.state);
            if (message.localIp) setLocalIp(message.localIp);
            if (message.port) setServerPort(message.port);
            break;
            
          case 'config_updated':
            setState(message.state);
            break;
            
          case 'timer_tick':
          case 'timer_started':
          case 'timer_paused':
          case 'timer_reset':
          case 'timer_finished':
            setState(prev => ({
              ...prev,
              timerState: message.timerState
            }));
            break;
            
          case 'competitor_advanced':
            setState(prev => ({
              ...prev,
              timerState: {
                ...prev.timerState,
                activeCompetitorIndex: message.activeCompetitorIndex
              }
            }));
            break;
            
          case 'scores_updated':
            setState(prev => ({
              ...prev,
              scores: message.scores
            }));
            break;

          case 'sound_trigger':
            // Emitir evento DOM para alertar a componentes (como el reproductor de sonido local)
            const soundEvent = new CustomEvent('sound_trigger', { detail: message.sound });
            window.dispatchEvent(soundEvent);
            break;
        }
      } catch (err) {
        console.error('[WS] Error procesando mensaje entrante:', err);
      }
    };

    ws.onclose = () => {
      console.warn('[WS] Conexión cerrada. Agendando reconexión...');
      setConnected(false);
      scheduleReconnect();
    };

    ws.onerror = (err) => {
      console.error('[WS] Error detectado:', err);
      ws.close();
    };
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) return;
    reconnectTimerRef.current = setInterval(() => {
      console.log('[WS] Reintentando conectar...');
      connect();
    }, 3000);
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimerRef.current) clearInterval(reconnectTimerRef.current);
    };
  }, [connect]);

  const send = useCallback((type: string, data: any = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
      return true;
    } else {
      console.warn('[WS] No conectado. Guardando acción offline.');
      saveOfflineAction(type, data);
      return false;
    }
  }, []);

  // Caché y cola offline
  const saveOfflineAction = (type: string, data: any) => {
    let queue = [];
    try {
      queue = JSON.parse(localStorage.getItem('climbcomp_offline_queue') || '[]');
    } catch (e) {
      queue = [];
    }
    queue.push({ type, data, timestamp: Date.now() });
    localStorage.setItem('climbcomp_offline_queue', JSON.stringify(queue));

    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  const flushOfflineQueue = () => {
    let queue = [];
    try {
      queue = JSON.parse(localStorage.getItem('climbcomp_offline_queue') || '[]');
    } catch (e) {
      queue = [];
    }
    if (queue.length === 0) return;
    console.log(`[WS] Despachando ${queue.length} acciones guardadas offline...`);
    
    while (queue.length > 0) {
      const action = queue.shift();
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: action.type, data: action.data }));
      }
    }
    localStorage.setItem('climbcomp_offline_queue', JSON.stringify([]));
  };

  // Métodos expuestos para manejar la competencia
  const startTimer = () => send('timer_start');
  const pauseTimer = () => send('timer_pause');
  const resetTimer = () => send('timer_reset');
  const nextPhase = () => send('timer_next_phase');
  
  const submitScore = (competitorId: string, problemId: string, action: 'top' | 'zone' | 'fall') => {
    send('submit_score', { competitorId, problemId, action });
  };
  
  const undoScore = () => send('undo_score');
  
  const selectActiveProblem = (index: number) => send('select_active_problem', { index });
  const selectActiveCompetitor = (index: number) => send('select_active_competitor', { index });
  
  const updateConfig = (configData: Partial<CompetitionState>) => {
    send('update_config', configData);
  };

  const resetAllData = () => send('reset_all_data');

  return {
    state,
    connected,
    localIp,
    serverPort,
    startTimer,
    pauseTimer,
    resetTimer,
    nextPhase,
    submitScore,
    undoScore,
    selectActiveProblem,
    selectActiveCompetitor,
    updateConfig,
    resetAllData
  };
}
