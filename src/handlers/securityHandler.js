/**
 * Sistema de seguridad anti-crash para el bot.
 * Captura errores no manejados a nivel de proceso para evitar caídas inesperadas.
 */

const RECONNECT_DELAY = 5000; // ms entre reconexiones
let reconnectAttempts = 0;
const MAX_RECONNECT = 10;

function setupSecurity(client) {

  // ── 1. Errores no capturados del proceso ─────────────────────
  process.on('uncaughtException', (err) => {
    console.error('[SECURITY] uncaughtException capturado — bot protegido:', err?.message || err);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[SECURITY] unhandledRejection capturado — bot protegido:', reason?.message || reason);
  });

  // ── 2. Reconexión automática del bot ─────────────────────────
  client.on('error', (err) => {
    console.error('[SECURITY] Discord client error:', err?.message || err);
    attemptReconnect(client);
  });

  client.on('shardDisconnect', (event, shardId) => {
    console.warn(`[SECURITY] Shard ${shardId} desconectado (code ${event.code}). Reconectando...`);
    attemptReconnect(client);
  });

  client.on('shardReconnecting', (shardId) => {
    console.log(`[SECURITY] Shard ${shardId} reconectando...`);
  });

  client.on('shardResume', (shardId, replayedEvents) => {
    console.log(`[SECURITY] Shard ${shardId} reconectado. Eventos reproducidos: ${replayedEvents}`);
    reconnectAttempts = 0;
  });

  // ── 3. Rate limit logging ─────────────────────────────────────
  client.rest.on('rateLimited', (info) => {
    console.warn(`[SECURITY] Rate limit hit — ruta: ${info.route} — espera: ${info.timeToReset}ms`);
  });

  // ── 4. Heartbeat monitor: reinicia si el bot queda zombie ─────
  setInterval(() => {
    if (client.ws.status !== 0) { // 0 = READY
      console.warn(`[SECURITY] Heartbeat check: estado WS = ${client.ws.status}. Intentando reconectar...`);
      attemptReconnect(client);
    }
  }, 30_000); // cada 30 segundos

  console.log('🛡️  Sistema de seguridad activo.');
}

function attemptReconnect(client) {
  if (reconnectAttempts >= MAX_RECONNECT) {
    console.error(`[SECURITY] Máximo de reconexiones (${MAX_RECONNECT}) alcanzado. Revisar manualmente.`);
    return;
  }
  reconnectAttempts++;
  const delay = RECONNECT_DELAY * reconnectAttempts;
  console.log(`[SECURITY] Intento de reconexión #${reconnectAttempts} en ${delay / 1000}s...`);
  setTimeout(() => {
    client.login(process.env.TOKEN).catch(err => {
      console.error('[SECURITY] Fallo en reconexión:', err?.message);
    });
  }, delay);
}

module.exports = { setupSecurity };
