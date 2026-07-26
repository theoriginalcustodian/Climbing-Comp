const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PORT = 3000;
const STATE_FILE = path.join(__dirname, 'data', 'state.json');

// --- ESTADO INICIAL DE LA COMPETENCIA ---
let state = {
  competition: {
    id: "comp-cijel-2026",
    name: "CIJEL 2026 - 1era Fecha Competitiva",
    date: "2026-07-26",
    location: "Muro Pachamama Escalada",
    status: "active",
    rules: {
      scoringType: "custom", // 'ifsc' o 'custom'
      rotationFormat: "circuit", // 'circuit' o 'open'
      language: "es"
    },
    timerConfig: {
      prepTime: 10,
      climbTime: 240, // 4 minutos
      pauseTime: 15,
      preEndWarning: 10,
      preStartWarning: 5
    },
    customScoringConfig: {
      pointsTop: 25.0,
      pointsZone: 10.0,
      pointsPenalty: 0.1
    }
  },
  categories: [
    { id: "cat-u13-f", name: "U13 - Femenino", sortOrder: 1 },
    { id: "cat-u13-m", name: "U13 - Masculino", sortOrder: 2 },
    { id: "cat-u15-f", name: "U15 - Femenino", sortOrder: 3 },
    { id: "cat-u15-m", name: "U15 - Masculino", sortOrder: 4 }
  ],
  competitors: [
    { id: "comp-1", name: "MARÍA GARCÍA", dorsal: "14", categoryId: "cat-u13-f", club: "Pachamama", startOrder: 1 },
    { id: "comp-2", name: "PEDRO LÓPEZ", dorsal: "07", categoryId: "cat-u13-m", club: "Sherpa Escalada", startOrder: 2 },
    { id: "comp-3", name: "ANA RODRÍGUEZ", dorsal: "22", categoryId: "cat-u13-f", club: "Espacio Crux", startOrder: 3 }
  ],
  problems: [
    { id: "prob-1", number: 1, name: "Bloque 1", holdColor: "Rojo", hasZone: true },
    { id: "prob-2", number: 2, name: "Bloque 2", holdColor: "Azul", hasZone: true },
    { id: "prob-3", number: 3, name: "Bloque 3", holdColor: "Verde", hasZone: true }
  ],
  scores: {}, // Guardado como: "competitorId_problemId" => AttemptRecord
  timerState: {
    running: false,
    phase: "idle", // 'idle', 'prep', 'climb', 'pause'
    remaining: 240,
    elapsed: 0,
    activeCompetitorIndex: 0,
    activeProblemIndex: 0
  }
};

// Cargar estado inicial si ya existe en disco
if (fs.existsSync(STATE_FILE)) {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    // Mezclar para asegurar que no falten campos estructurales
    state = { ...state, ...parsed };
    // Forzar que el timer se inicie parado
    state.timerState.running = false;
    state.timerState.phase = "idle";
    state.timerState.remaining = state.competition.timerConfig.climbTime;
    console.log("[State] Base de datos JSON cargada correctamente.");
  } catch (err) {
    console.error("[State] Error cargando el archivo state.json:", err);
  }
} else {
  // Asegurar que exista la carpeta data/
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// Historial de cambios para deshacer (Undo)
let actionHistory = [];

// Autoguardado periódico cada 5 segundos si hay cambios
let hasChanges = false;
setInterval(() => {
  if (hasChanges) {
    try {
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
      hasChanges = false;
      console.log("[State] Guardado automático de cambios en disco.");
    } catch (e) {
      console.error("[State] Fallo al autoguardar:", e);
    }
  }
}, 5000);

// --- DETECTAR IP LOCAL ---
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Filtrar IPv4 y que no sea loopback
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}
const localIp = getLocalIP();

// --- CONFIGURACIÓN DE EXPRESS ---
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Servir la carpeta dist compilada de React
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Soporte para rutas SPA (cualquier ruta no estática sirve index.html)
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send("<h1>Servidor ClimbComp corriendo.</h1><p>Por favor compila el frontend React con <code>npm run build</code> para ver el panel de administración.</p>");
  }
});

// --- MOTOR DEL TEMPORIZADOR SÍNCRONO ---
let timerInterval = null;

function broadcast(msg) {
  const data = JSON.stringify(msg);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
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
      
      // Alertas de sonido antes de finalizar
      const preEnd = state.competition.timerConfig.preEndWarning;
      if (state.timerState.remaining === preEnd && state.timerState.phase === 'climb') {
        broadcast({ type: 'sound_trigger', sound: 'pre_end' });
      }

      // Alertas de sonido antes de arrancar
      const preStart = state.competition.timerConfig.preStartWarning;
      if (state.timerState.remaining === preStart && state.timerState.phase === 'prep') {
        broadcast({ type: 'sound_trigger', sound: 'pre_start' });
      }

      broadcast({ type: 'timer_tick', timerState: state.timerState });
    } else {
      // Cambiar de fase automáticamente
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
  state.timerState.remaining = state.competition.timerConfig.climbTime;
  state.timerState.elapsed = 0;
  broadcast({ type: 'timer_reset', timerState: state.timerState });
}

function transitionTimerPhase() {
  const cfg = state.competition.timerConfig;
  
  if (state.timerState.phase === 'idle') {
    // Pasar a preparación
    state.timerState.phase = 'prep';
    state.timerState.remaining = cfg.prepTime;
    broadcast({ type: 'sound_trigger', sound: 'start_prep' });
  } else if (state.timerState.phase === 'prep') {
    // Pasar a escalada
    state.timerState.phase = 'climb';
    state.timerState.remaining = cfg.climbTime;
    broadcast({ type: 'sound_trigger', sound: 'start_climbing' });
  } else if (state.timerState.phase === 'climb') {
    // Pasar a pausa / transición
    state.timerState.phase = 'pause';
    state.timerState.remaining = cfg.pauseTime;
    broadcast({ type: 'sound_trigger', sound: 'end_climbing' });
  } else if (state.timerState.phase === 'pause') {
    // Avanzar rotación de competidor en circuito y volver a prep o climb
    if (state.competition.rules.rotationFormat === 'circuit') {
      state.timerState.activeCompetitorIndex = (state.timerState.activeCompetitorIndex + 1) % Math.max(state.competitors.length, 1);
      broadcast({ 
        type: 'competitor_advanced', 
        activeCompetitorIndex: state.timerState.activeCompetitorIndex 
      });
    }
    
    state.timerState.phase = 'prep';
    state.timerState.remaining = cfg.prepTime;
    broadcast({ type: 'sound_trigger', sound: 'start_prep' });
  }
  
  broadcast({ type: 'timer_tick', timerState: state.timerState });
}

// --- COMUNICACIÓN POR WEBSOCKET ---
wss.on('connection', ws => {
  console.log('[WebSocket] Nuevo dispositivo conectado.');
  
  // Enviar estado de inicialización con IP local
  ws.send(JSON.stringify({
    type: 'init',
    state: state,
    localIp: localIp,
    port: PORT
  }));

  ws.on('message', messageStr => {
    try {
      const message = JSON.parse(messageStr);
      const { type, data } = message;

      switch (type) {
        // --- CONTROLES DEL TIEMPO ---
        case 'timer_start':
          if (state.timerState.phase === 'idle') {
            transitionTimerPhase();
          }
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

        // --- SELECCIONAR ATLETAS / BLOQUES ACTIVOS ---
        case 'select_active_problem':
          if (typeof data.index === 'number') {
            state.timerState.activeProblemIndex = data.index;
            hasChanges = true;
            broadcast({ type: 'timer_tick', timerState: state.timerState });
          }
          break;

        case 'select_active_competitor':
          if (typeof data.index === 'number') {
            state.timerState.activeCompetitorIndex = data.index;
            hasChanges = true;
            broadcast({ type: 'timer_tick', timerState: state.timerState });
          }
          break;

        // --- SUBIR RESULTADO (JUEZ O PC) ---
        case 'submit_score':
          const { competitorId, problemId, action } = data;
          if (!competitorId || !problemId) return;

          const key = `${competitorId}_${problemId}`;
          let score = state.scores[key] || {
            competitorId,
            problemId,
            attempts: 0,
            gotTop: false,
            gotZone: false,
            topAttempt: undefined,
            zoneAttempt: undefined,
            timestamp: new Date().toISOString()
          };

          // Guardar estado previo en historial para Deshacer
          actionHistory.push({
            key: key,
            previousState: score ? JSON.parse(JSON.stringify(score)) : null
          });

          // Limitar historial a los últimos 50 elementos
          if (actionHistory.length > 50) actionHistory.shift();

          // Modificar puntuación basada en la acción
          score.attempts++;
          score.timestamp = new Date().toISOString();

          if (action === 'top') {
            score.gotTop = true;
            score.gotZone = true;
            if (!score.topAttempt) score.topAttempt = score.attempts;
            if (!score.zoneAttempt) score.zoneAttempt = score.attempts;
            
            broadcast({ type: 'sound_trigger', sound: 'top_success' });
          } else if (action === 'zone') {
            score.gotZone = true;
            if (!score.zoneAttempt) score.zoneAttempt = score.attempts;
            
            broadcast({ type: 'sound_trigger', sound: 'zone_success' });
          }

          state.scores[key] = score;
          hasChanges = true;

          // Enviar actualizaciones
          broadcast({ type: 'scores_updated', scores: state.scores });
          break;

        // --- DESHACER ÚLTIMA ACCIÓN (UNDO) ---
        case 'undo_score':
          if (actionHistory.length > 0) {
            const lastAction = actionHistory.pop();
            if (lastAction.previousState) {
              state.scores[lastAction.key] = lastAction.previousState;
            } else {
              delete state.scores[lastAction.key];
            }
            hasChanges = true;
            broadcast({ type: 'scores_updated', scores: state.scores });
            console.log(`[Scores] Deshecha última acción sobre ${lastAction.key}`);
          }
          break;

        // --- ACTUALIZAR CONFIGURACIÓN (CRUD) ---
        case 'update_config':
          if (data.categories) state.categories = data.categories;
          if (data.competitors) state.competitors = data.competitors;
          if (data.problems) state.problems = data.problems;
          if (data.competition) state.competition = { ...state.competition, ...data.competition };
          
          hasChanges = true;
          console.log('[Config] Configuración de la competencia actualizada.');
          broadcast({ type: 'config_updated', state: state });
          break;

        // --- RESTABLECER BASE DE DATOS ---
        case 'reset_all_data':
          state.scores = {};
          actionHistory = [];
          state.timerState.activeCompetitorIndex = 0;
          state.timerState.activeProblemIndex = 0;
          resetTimerEngine();
          hasChanges = true;
          broadcast({ type: 'config_updated', state: state });
          console.log('[Config] Base de datos de resultados vaciada.');
          break;
      }
    } catch (e) {
      console.error('[WebSocket] Error procesando mensaje:', e);
    }
  });

  ws.on('close', () => {
    console.log('[WebSocket] Conexión cerrada.');
  });
});

// --- ARRANCAR SERVIDOR ---
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🧗 Servidor ClimbComp Arrancado con Éxito!`);
  console.log(`💻 Panel de Administración (PC): http://localhost:${PORT}`);
  console.log(`📱 Terminal del Juez (Móvil): http://${localIp}:${PORT}/judge`);
  console.log(`======================================================\n`);
});
