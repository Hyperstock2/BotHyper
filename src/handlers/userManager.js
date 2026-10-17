const fs   = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, '..', 'data', 'users.json');

function readUsers() {
  return JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
}
function writeUsers(users) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

// ── PERMISOS POR ROL ──────────────────────────────────────────────
// developer — acceso total absoluto (dueño del bot)
// owner     — todo excepto logs de auditoría
// staff     — enviar embeds, gestionar tickets, ver inicio
// viewer    — solo lectura
const PERMISSIONS = {
  developer: [
    'view_home', 'view_dashboard',
    'send_embeds', 'manage_tickets',
    'manage_users', 'view_logs', 'manage_security',
    'voice_control', 'server_backup',
    'manage_settings',
  ],
  admin: [
    'view_home', 'view_dashboard',
    'send_embeds', 'manage_tickets',
    'manage_users', 'view_logs', 'manage_security',
    'voice_control', 'server_backup',
    'manage_settings',
  ],
  owner: [
    'view_home', 'view_dashboard',
    'send_embeds', 'manage_tickets',
    'manage_users', 'manage_security',
    'server_backup', 'manage_settings',
  ],
  staff: [
    'view_home', 'view_dashboard',
    'send_embeds', 'manage_tickets',
  ],
  viewer: [
    'view_dashboard',
  ],
};

function hasPermission(role, permission) {
  return (PERMISSIONS[role] || []).includes(permission);
}

// ── CRUD ──────────────────────────────────────────────────────────
function getAll()               { return readUsers(); }
function findByUsername(u)      { return readUsers().find(x => x.username === u); }
function findById(id)           { return readUsers().find(x => x.id === id); }

function create({ username, password, role }) {
  const users = readUsers();
  if (users.find(u => u.username === username)) throw new Error('El usuario ya existe');
  const newUser = {
    id: Date.now(), username, password,
    role: role || 'staff',
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  writeUsers(users);
  return newUser;
}

function update(id, data) {
  const users = readUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('Usuario no encontrado');
  users[idx] = { ...users[idx], ...data };
  writeUsers(users);
  return users[idx];
}

function remove(id) {
  const users = readUsers();
  const filtered = users.filter(u => u.id !== id);
  if (filtered.length === users.length) throw new Error('Usuario no encontrado');
  writeUsers(filtered);
}

module.exports = { getAll, findByUsername, findById, create, update, remove, hasPermission, PERMISSIONS };
