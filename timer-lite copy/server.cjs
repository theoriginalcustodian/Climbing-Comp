const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PORT = 3001;

// --- ESTADO ---
let state = {
  timerConfig: {
    prepTime: 10,
    climbTime: 240,
    pauseTime: 15,
    preEndWarning: 10,
    preStartWarning: 5,
    audio: {},
    loop: false,
    enablePause: true,
    enablePrep: true,
    enablePreStart: true,
    enablePreEnd: true,
    customAlert1Time: 60,
    customAlert2Time: 30,
    customAlert3Time: 15,
    countdownTickTime: 10,
    enableCustomAlert1: false,
    enableCustomAlert2: false,
    enableCustomAlert3: false,
    enableCountdownTick: false
  },
  timerState: {
    running: false,
    phase: "idle",
    remaining: 240,
    elapsed: 0
  },
  bgTheme: "pachamama",
  bgOpacity: 30,
  competitionLogo: {
    type: 'pachamama',
    featherEdges: true,
    featherIntensity: 'medium',
    maxHeightPx: 80,
    headerMaxHeightPx: 60
  }
};

// --- DETECTAR IP LOCAL ---
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}
const localIp = getLocalIP();

// --- EXPRESS ---
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send("<h1>Timer Lite</h1><p>Ejecuta <code>npm run build</code> primero.</p>");
  }
});

// --- MOTOR DEL TEMPORIZADOR ---
let timerInterval = null;

function broadcast(msg) {
  const data = JSON.stringify(msg);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(data);
  });
}

function startTimerEngine() {
  if (timerInterval) return;
  state.timerState.running = true;
  broadcast({ type: 'timer_started', timerState: state.timerState });

  timerInterval = setInterval(() => {
    if (state.timerState.remaining > 0) {
      state.timerState.remaining--;
      state.timerState.elapsed++;

      // Alertas de sonido
      if (state.timerState.phase === 'climb') {
        if (state.timerConfig.enablePreEnd && state.timerState.remaining === state.timerConfig.preEndWarning) {
          broadcast({ type: 'sound_trigger', sound: 'pre_end' });
        }
        if (state.timerConfig.enableCustomAlert1 && state.timerState.remaining === state.timerConfig.customAlert1Time) {
          broadcast({ type: 'sound_trigger', sound: 'custom_1' });
        }
        if (state.timerConfig.enableCustomAlert2 && state.timerState.remaining === state.timerConfig.customAlert2Time) {
          broadcast({ type: 'sound_trigger', sound: 'custom_2' });
        }
        if (state.timerConfig.enableCustomAlert3 && state.timerState.remaining === state.timerConfig.customAlert3Time) {
          broadcast({ type: 'sound_trigger', sound: 'custom_3' });
        }
        if (state.timerConfig.enableCountdownTick && state.timerState.remaining <= state.timerConfig.countdownTickTime && state.timerState.remaining > 0) {
          broadcast({ type: 'sound_trigger', sound: 'countdown_tick' });
        }
      }

      if (state.timerConfig.enablePreStart && state.timerState.remaining === state.timerConfig.preStartWarning && state.timerState.phase === 'prep') {
        broadcast({ type: 'sound_trigger', sound: 'pre_start' });
      }

      broadcast({ type: 'timer_tick', timerState: state.timerState });
    } else {
      transitionTimerPhase();
    }
  }, 1000);
}

function pauseTimerEngine() {
  if (!timerInterval) return;
  clearInterval(timerInterval);
  timerInterval = null;
  state.timerState.running = false;
  broadcast({ type: 'timer_paused', timerState: state.timerState });
}

function resetTimerEngine() {
  pauseTimerEngine();
  state.timerState.phase = 'idle';
  state.timerState.remaining = state.timerConfig.climbTime;
  state.timerState.elapsed = 0;
  broadcast({ type: 'timer_reset', timerState: state.timerState });
}

function transitionTimerPhase() {
  const cfg = state.timerConfig;

  if (state.timerState.phase === 'idle') {
    if (cfg.enablePrep) {
      state.timerState.phase = 'prep';
      state.timerState.remaining = cfg.prepTime;
      broadcast({ type: 'sound_trigger', sound: 'start_prep' });
    } else {
      state.timerState.phase = 'climb';
      state.timerState.remaining = cfg.climbTime;
      broadcast({ type: 'sound_trigger', sound: 'start_climbing' });
    }
  } else if (state.timerState.phase === 'prep') {
    state.timerState.phase = 'climb';
    state.timerState.remaining = cfg.climbTime;
    broadcast({ type: 'sound_trigger', sound: 'start_climbing' });
  } else if (state.timerState.phase === 'climb') {
    if (cfg.loop) {
      if (cfg.enablePause) {
        state.timerState.phase = 'pause';
        state.timerState.remaining = cfg.pauseTime;
        broadcast({ type: 'sound_trigger', sound: 'end_climbing' });
      } else if (cfg.enablePrep) {
        state.timerState.phase = 'prep';
        state.timerState.remaining = cfg.prepTime;
        broadcast({ type: 'sound_trigger', sound: 'start_prep' });
      } else {
        state.timerState.phase = 'climb';
        state.timerState.remaining = cfg.climbTime;
        broadcast({ type: 'sound_trigger', sound: 'start_climbing' });
      }
    } else {
      // No loop, just end and stay idle
      broadcast({ type: 'sound_trigger', sound: 'end_climbing' });
      resetTimerEngine();
      return;
    }
  } else if (state.timerState.phase === 'pause') {
    if (cfg.enablePrep) {
      state.timerState.phase = 'prep';
      state.timerState.remaining = cfg.prepTime;
      broadcast({ type: 'sound_trigger', sound: 'start_prep' });
    } else {
      state.timerState.phase = 'climb';
      state.timerState.remaining = cfg.climbTime;
      broadcast({ type: 'sound_trigger', sound: 'start_climbing' });
    }
  }

  broadcast({ type: 'timer_tick', timerState: state.timerState });
}

// --- WEBSOCKET ---
wss.on('connection', ws => {
  console.log('[WS] Dispositivo conectado.');
  ws.send(JSON.stringify({ type: 'init', state: state, localIp: localIp }));

  ws.on('message', messageStr => {
    try {
      const { type, data } = JSON.parse(messageStr);

      switch (type) {
        case 'timer_start':
          if (state.timerState.phase === 'idle') transitionTimerPhase();
          startTimerEngine();
          break;
        case 'timer_pause':
          pauseTimerEngine();
          break;
        case 'timer_reset':
          resetTimerEngine();
          break;
        case 'timer_next_phase':
          transitionTimerPhase();
          break;
        case 'update_config':
          if (data.timerConfig) state.timerConfig = { ...state.timerConfig, ...data.timerConfig };
          if (data.bgTheme !== undefined) state.bgTheme = data.bgTheme;
          if (data.bgOpacity !== undefined) state.bgOpacity = data.bgOpacity;
          if (data.competitionLogo !== undefined) state.competitionLogo = data.competitionLogo;
          broadcast({ type: 'config_updated', state: state });
          break;
      }
    } catch (e) {
      console.error('[WS] Error:', e);
    }
  });

  ws.on('close', () => console.log('[WS] Dispositivo desconectado.'));
});

// --- ARRANCAR ---
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n==========================================`);
  console.log(`⏱️  Timer Lite Arrancado!`);
  console.log(`🖥️  http://localhost:${PORT}`);
  console.log(`📡  http://${localIp}:${PORT}`);
  console.log(`==========================================\n`);
});
