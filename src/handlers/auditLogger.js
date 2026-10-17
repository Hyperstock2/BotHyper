const fs = require('fs');
const path = require('path');

const LOGS_PATH = path.join(__dirname, '..', 'data', 'auditLogs.json');
const MAX_LOGS = 500;

const LOG_ICONS = {
  message_delete: '🗑️',
  message_edit:   '✏️',
  member_join:    '📥',
  member_leave:   '📤',
  member_ban:     '🔨',
  member_kick:    '👢',
  member_unban:   '🔓',
  role_create:    '🎭',
  role_delete:    '🗑️',
  channel_create: '📢',
  channel_delete: '🗑️',
  spam_detected:  '🚫',
  raid_detected:  '⚠️',
  word_filter:    '🤬',
  embed_sent:     '📨',
  ticket_open:    '🎫',
  ticket_close:   '🔒',
  web_login:      '🔐',
  security:       '🛡️',
};

function readLogs() {
  try { return JSON.parse(fs.readFileSync(LOGS_PATH, 'utf-8')); }
  catch { return []; }
}

function writeLogs(logs) {
  fs.writeFileSync(LOGS_PATH, JSON.stringify(logs, null, 2));
}

function log(type, description, meta = {}) {
  const logs = readLogs();
  const entry = {
    id: Date.now(),
    type,
    icon: LOG_ICONS[type] || '📋',
    description,
    meta,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(entry); // más reciente primero
  if (logs.length > MAX_LOGS) logs.splice(MAX_LOGS);
  writeLogs(logs);
  return entry;
}

function getLogs(limit = 100, type = null) {
  let logs = readLogs();
  if (type) logs = logs.filter(l => l.type === type);
  return logs.slice(0, limit);
}

function clearLogs() {
  writeLogs([]);
}

module.exports = { log, getLogs, clearLogs, LOG_ICONS };
