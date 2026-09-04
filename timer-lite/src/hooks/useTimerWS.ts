import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerPhase, TimerConfig, TimerState } from '../types';

export interface ServerState {
  timerConfig: TimerConfig;
  timerState: TimerState;
  bgTheme?: 'pachamama' | 'cijel';
  bgOpacity?: number;
  competitionLogo?: import('../types').CompetitionLogoConfig;
}

const DEFAULT_STATE: ServerState = {
  timerConfig: { prepTime: 10, climbTime: 240, pauseTime: 15, preEndWarning: 10, preStartWarning: 5, loop: false, enablePause: true, enablePrep: true, enablePreStart: true, enablePreEnd: true },
  timerState: { running: false, phase: 'idle', remaining: 240, elapsed: 0 },
  bgTheme: 'pachamama',
  bgOpacity: 30,
};

export function useTimerWS() {
  const [state, setState] = useState<ServerState>(DEFAULT_STATE);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const loc = window.location;
    const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = loc.port === '5173' || loc.port === '3001' ? `${loc.hostname}:3001` : loc.host;
    const url = `${protocol}//${host}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      if (reconnectRef.current) { clearInterval(reconnectRef.current); reconnectRef.current = null; }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'init':
            setState(msg.state);
            break;
          case 'config_updated':
            setState(msg.state);
            break;
          case 'timer_tick':
          case 'timer_started':
          case 'timer_paused':
          case 'timer_reset':
          case 'timer_finished':
            setState(prev => ({ ...prev, timerState: msg.timerState }));
            break;
          case 'sound_trigger':
            window.dispatchEvent(new CustomEvent('sound_trigger', { detail: msg.sound }));
            break;
        }
      } catch (err) {
        console.error('[WS] Error:', err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (!reconnectRef.current) {
        reconnectRef.current = setInterval(() => connect(), 3000);
      }
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectRef.current) clearInterval(reconnectRef.current);
    };
  }, [connect]);

  const send = useCallback((type: string, data: any = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  return {
    state,
    connected,
    startTimer: () => send('timer_start'),
    pauseTimer: () => send('timer_pause'),
    resetTimer: () => send('timer_reset'),
    nextPhase: () => send('timer_next_phase'),
    updateConfig: (data: Partial<ServerState>) => send('update_config', data),
  };
}
