/* ═══════════════════════════════════════════════════════════════
   HYPERSTOCK PANEL — DASHBOARD JS
   ═══════════════════════════════════════════════════════════════ */

// ── ESTADO GLOBAL ─────────────────────────────────────────────────
let currentPage = 'home';
let sessionData = {};
let editorColor = '#5865f2';
let editorEmoji = 'none';
let allChannels = [];

const EMBED_TEMPLATES = {
  tickets: {
    authorEmoji: '🏪', authorName: 'Hyper Stock',
    title: 'Bienvenido al sistema de tickets de Hyper Stock',
    description:
      'Abre un ticket para comprar productos, recibir soporte o resolver dudas.\n\n' +
      '**Antes de abrir un ticket:**\n• Selecciona la categoría adecuada.\n' +
      '• Explica tu solicitud con claridad.\n• Espera a que un miembro del staff te atienda.\n\n' +
      '**Importante:** Hyper Stock no se hace responsable de problemas o acuerdos realizados fuera de nuestro equipo oficial.',
    image: '', color: '#5865f2', footer: '» Tickets', tagEmoji: 'none', tag: '',
  },
  metodos: {
    authorEmoji: '🏪', authorName: 'HyperStock Metodos',
    title: 'MÉTODOS DE PAGO',
    description:
      'Binance 🪙 • PayPal 💙\nYape 🇵🇪\nMercado Pago 🛒\n🇲🇽 🇦🇷 🇨🇱 🇨🇴\nNequi 🇨🇴\nLitecoin 💚',
    image: '', color: '#5865f2', footer: '» Metodos', tagEmoji: '💳', tag: 'Metodos',
  },
  diamantes: {
    authorEmoji: '🏪', authorName: 'Hyper Stock',
    title: 'Venta De Diamantes',
    description:
      '🎁 **Diamantes Sin Previa Verificacion De ID**\n\n' +
      '🎁 No necesitamos tu cuenta, solamente tu ID\n🎁 Recargas disponibles a precios económicos\n🎁 Entrega rápida y segura\n\n' +
      '💎 **Precios**\n💎 100 + 10 Diamantes = S/.4.5\n💎 310 + 31 Diamantes = S/.13\n' +
      '💎 520 + 52 Diamantes = S/.18.5\n💎 1060 + 106 Diamantes = S/.32\n' +
      '💎 2180 + 218 Diamantes = S/.53\n💎 5600 + 560 Diamantes = S/.125',
    image: '', color: '#5865f2', footer: '» Adquirir', tagEmoji: '💎', tag: 'Adquirir',
  },
  decoraciones: {
    authorEmoji: '🏪', authorName: 'Hyper Stock',
    title: 'Método de Decoraciones al 60% de Descuento 🎁',
    description:
      '¿Te preguntas cómo funciona?\n\n' +
      '» El método consiste en adquirir decoraciones de Discord mediante regalos, pagando un 60% menos de su precio habitual.\n\n' +
      '**¿Qué incluye?**\n» El método completo para que puedas realizar el proceso por tu cuenta.\n\n' +
      '» **Precio del método completo: $20 USD**\n\n' +
      '¿Qué esperas para conseguir tus decoraciones a un precio más económico?\n\n' +
      '✅ **Adquiere el método completo y descubre cómo funciona.**',
    image: '', color: '#8b5cf6', footer: '» Decoraciones', tagEmoji: '🎨', tag: 'Decoraciones',
  },
  boosts: {
    authorEmoji: '🏪', authorName: 'Hyper Stock',
    title: '',
    description:
      '¿Cansado de pagar precios exagerados por los boosts de Discord? 🔨\n\n' +
      '¡Tengo la solución! 🎁\n\nVendo mi **método para conseguir boosts de Discord a precios económicos.**\n\n' +
      '» **Precio del método: $20 💚**\n» **Precios Vendemos:**\n\n' +
      '⚡ **Discord Boosts**\n· 14 Boosts — 1 mes\n· Precio: **$1.75**\n\n' +
      '» **¿Quieres comprar boosts directamente?**\n\n' +
      'Abre un ticket indicando la cantidad de boosts que necesitas y la duración. Nuestro staff te informará del precio.\n\n' +
      '🔥 **¡Aprovecha estos precios!**',
    image: '', color: '#5865f2', footer: '» Boost', tagEmoji: '⚡', tag: 'Boost',
  },
};

const EMBED_LIST = [
  { type: 'tickets',      label: '🎫 Sistema de Tickets' },
  { type: 'metodos',      label: '💳 Métodos de Pago' },
  { type: 'diamantes',    label: '💎 Venta de Diamantes' },
  { type: 'decoraciones', label: '🎨 Decoraciones Discord' },
  { type: 'boosts',       label: '⚡ Discord Boosts' },
];

// ── INIT ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadSession();
  await loadChannels();
  loadHome();
  renderEmbedCards();
  if (currentPage === 'home') loadHome();
});

// ── SESSION ───────────────────────────────────────────────────────
async function loadSession() {
  const data = await api('/api/me');
  if (!data) return;
  sessionData = data;
  document.getElementById('user-name').textContent   = data.username;
  document.getElementById('user-role').textContent   = data.role;
  document.getElementById('user-avatar').textContent = data.username[0].toUpperCase();

  if (data.role === 'admin') {
    document.getElementById('admin-label').style.display = '';
    document.getElementById('nav-users').style.display    = '';
    document.getElementById('nav-security').style.display = '';
    document.getElementById('nav-logs').style.display     = '';
  } else if (data.permissions?.includes('view_logs')) {
    document.getElementById('nav-logs').style.display = '';
  }
}

// ── NAVIGATION ────────────────────────────────────────────────────
const PAGE_TITLES = {
  home:     '🏠 Inicio',
  embeds:   '📨 Enviar Embeds',
  editor:   '✏️ Editor de Embeds',
  tickets:  '🎫 Tickets',
  users:    '👥 Usuarios',
  security: '🛡️ Seguridad',
  logs:     '📋 Logs de Auditoría',
};

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name)?.classList.add('active');
  document.getElementById('nav-'  + name)?.classList.add('active');
  document.getElementById('page-title').textContent = PAGE_TITLES[name] || name;
  currentPage = name;

  // Cargar datos según la página
  if (name === 'home')     loadHome();
  if (name === 'users')    loadUsers();
  if (name === 'logs')     loadLogs();
  if (name === 'security') loadSecurity();
  if (name === 'editor')   populateEditorChannels();
  if (name === 'tickets')  populateTicketChannel();
}

// ── HOME ──────────────────────────────────────────────────────────
async function loadHome() {
  const guild = await api('/api/guild');
  if (!guild) return;

  document.getElementById('guild-name').textContent = guild.name;
  document.getElementById('guild-desc').textContent =
    `${guild.memberCount} miembros · Tier ${guild.boostTier} · Creado ${new Date(guild.createdAt).toLocaleDateString('es')}`;

  document.getElementById('stat-members').textContent  = guild.memberCount;
  document.getElementById('stat-channels').textContent = guild.channelCount;
  document.getElementById('stat-roles').textContent    = guild.roleCount;
  document.getElementById('stat-uptime').textContent   = guild.uptime;
  document.getElementById('stat-boosts').textContent   = guild.boostCount;
  document.getElementById('stat-ping').textContent     = guild.ping;

  document.getElementById('guild-info-list').innerHTML = `
    <div>🆔 <strong>ID:</strong> ${process?.env?.GUILD_ID || '—'}</div>
    <div>👑 <strong>Owner ID:</strong> ${guild.ownerId}</div>
    <div>💬 <strong>Canales:</strong> ${guild.channelCount}</div>
    <div>🎭 <strong>Roles:</strong> ${guild.roleCount}</div>
    <div>🚀 <strong>Boost Tier:</strong> ${guild.boostTier}</div>
    <div>⚡ <strong>Ping API:</strong> ${guild.ping}</div>
  `;

  // últimos logs
  const logs = await api('/api/logs?limit=5');
  const container = document.getElementById('home-logs');
  if (!logs?.length) return;
  container.innerHTML = logs.map(renderLogItem).join('');
}

// ── CHANNELS ──────────────────────────────────────────────────────
async function loadChannels() {
  const channels = await api('/api/channels');
  if (!channels) return;
  allChannels = channels;

  const selectors = ['channelSelect', 'editor-channel', 'ticket-channel', 'log-channel-select'];
  selectors.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const placeholder = el.querySelector('option[value=""]');
    el.innerHTML = '';
    if (placeholder) el.appendChild(placeholder);
    channels.forEach(ch => {
      const opt = document.createElement('option');
      opt.value = ch.id; opt.textContent = '# ' + ch.name;
      el.appendChild(opt);
    });
  });
}

function populateEditorChannels() { /* ya cargados en loadChannels */ }
function populateTicketChannel()  { /* ya cargados en loadChannels */ }

// ── EMBEDS GRID ───────────────────────────────────────────────────
function renderEmbedCards() {
  const grid = document.getElementById('embeds-grid');
  grid.innerHTML = EMBED_LIST.map(e => `
    <div class="embed-card">
      <div class="embed-preview">
        <div class="embed-inner">
          <div class="embed-stripe" style="background:${EMBED_TEMPLATES[e.type]?.color || '#5865f2'}"></div>
          <div class="embed-body">
            <div class="embed-author-row">
              <span class="embed-author-icon">${EMBED_TEMPLATES[e.type]?.authorEmoji || '🏪'}</span>
              <span class="embed-author-name">${EMBED_TEMPLATES[e.type]?.authorName || 'Hyper Stock'}</span>
            </div>
            ${EMBED_TEMPLATES[e.type]?.title ? `<div class="embed-title-text">${EMBED_TEMPLATES[e.type].title}</div>` : ''}
            <div class="embed-desc-text">${(EMBED_TEMPLATES[e.type]?.description || '').replace(/\n/g,'<br>').slice(0,200)}${EMBED_TEMPLATES[e.type]?.description?.length > 200 ? '...' : ''}</div>
            ${EMBED_TEMPLATES[e.type]?.footer ? `<div class="embed-tag">${EMBED_TEMPLATES[e.type].footer}</div>` : ''}
          </div>
        </div>
      </div>
      <div class="embed-actions">
        <span class="embed-name">${e.label}</span>
        <button class="btn btn-accent btn-sm" onclick="sendEmbed('${e.type}', this)">📨 Enviar</button>
      </div>
    </div>
  `).join('');
}

async function sendEmbed(type, btn) {
  const channelId = document.getElementById('channelSelect').value;
  if (!channelId) { toast('⚠️ Selecciona un canal primero', 'error'); return; }
  btn.disabled = true; btn.textContent = 'Enviando...';
  const data = await api('/api/send-embed', 'POST', { channelId, embedType: type });
  btn.disabled = false; btn.textContent = '📨 Enviar';
  if (data?.success) toast('✅ ' + data.message, 'success');
  else toast('❌ ' + (data?.error || 'Error'), 'error');
}

// ── TICKET EMBED ──────────────────────────────────────────────────
async function deployTicketEmbed() {
  const channelId = document.getElementById('ticket-channel').value;
  if (!channelId) { toast('⚠️ Selecciona un canal', 'error'); return; }
  const data = await api('/api/send-embed', 'POST', { channelId, embedType: 'tickets' });
  if (data?.success) toast('✅ Sistema de tickets desplegado', 'success');
  else toast('❌ ' + (data?.error || 'Error'), 'error');
}

// ── EDITOR DE EMBEDS ──────────────────────────────────────────────
function loadTemplate() {
  const type = document.getElementById('editor-template').value;
  if (!type) { clearEditor(); return; }
  const t = EMBED_TEMPLATES[type];
  if (!t) return;

  document.getElementById('editor-author-emoji').value = t.authorEmoji || '';
  document.getElementById('editor-author-name').value  = t.authorName  || '';
  document.getElementById('editor-title').value        = t.title        || '';
  document.getElementById('editor-desc').value         = t.description  || '';
  document.getElementById('editor-image').value        = t.image        || '';
  document.getElementById('editor-footer').value       = t.footer       || '';
  document.getElementById('editor-tag').value          = t.tag          || '';

  pickColorRaw(t.color || '#5865f2');

  document.querySelectorAll('.emoji-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.emoji === (t.tagEmoji || 'none'));
  });
  editorEmoji = t.tagEmoji || 'none';

  updatePreview();
}

function clearEditor() {
  ['editor-author-emoji','editor-author-name','editor-title','editor-desc',
   'editor-image','editor-thumb','editor-footer','editor-footer-icon','editor-tag']
    .forEach(id => { document.getElementById(id).value = ''; });
  pickColorRaw('#5865f2');
  updatePreview();
}

function pickColor(el) {
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  editorColor = el.dataset.color;
  document.getElementById('editor-color-picker').value = editorColor;
  updatePreview();
}

function pickColorRaw(val) {
  editorColor = val;
  document.getElementById('editor-color-picker').value = val;
  document.querySelectorAll('.swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color === val);
  });
  updatePreview();
}

function pickEmoji(el) {
  document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  editorEmoji = el.dataset.emoji;
  updatePreview();
}

function updatePreview() {
  const authorEmoji = document.getElementById('editor-author-emoji').value || '🏪';
  const authorName  = document.getElementById('editor-author-name').value  || 'Hyper Stock';
  const title       = document.getElementById('editor-title').value;
  const desc        = document.getElementById('editor-desc').value || 'El contenido del embed aparecerá aquí...';
  const image       = document.getElementById('editor-image').value;
  const footerText  = document.getElementById('editor-footer').value;
  const footerIcon  = document.getElementById('editor-footer-icon')?.value || '';
  const tag         = document.getElementById('editor-tag').value;

  document.getElementById('prev-stripe').style.background    = editorColor;
  document.getElementById('prev-author-emoji').textContent   = authorEmoji;
  document.getElementById('prev-author-name').textContent    = authorName;

  const titleEl = document.getElementById('prev-title');
  titleEl.textContent = title; titleEl.style.display = title ? '' : 'none';

  document.getElementById('prev-desc').innerHTML = desc.replace(/\n/g,'<br>');

  const imgWrap = document.getElementById('prev-image-wrap');
  const imgEl   = document.getElementById('prev-image');
  if (image) { imgEl.src = image; imgWrap.style.display = ''; }
  else        { imgWrap.style.display = 'none'; }

  const footerRow = document.getElementById('prev-footer-row');
  if (footerText) {
    document.getElementById('prev-footer-icon').textContent = footerIcon ? '' : '';
    document.getElementById('prev-footer-text').textContent = footerText;
    footerRow.style.display = '';
  } else { footerRow.style.display = 'none'; }

  const tagEl = document.getElementById('prev-tag');
  if (tag) { tagEl.textContent = (editorEmoji !== 'none' ? editorEmoji + ' ' : '') + tag; tagEl.style.display = ''; }
  else      { tagEl.style.display = 'none'; }
}

async function sendCustomEmbed() {
  const channelId = document.getElementById('editor-channel').value;
  if (!channelId) { toast('⚠️ Selecciona un canal', 'error'); return; }

  const embedData = {
    authorEmoji: document.getElementById('editor-author-emoji').value,
    authorName:  document.getElementById('editor-author-name').value,
    title:       document.getElementById('editor-title').value,
    description: document.getElementById('editor-desc').value,
    image:       document.getElementById('editor-image').value,
    thumbnail:   document.getElementById('editor-thumb')?.value || '',
    footer:      document.getElementById('editor-footer').value,
    footerIcon:  document.getElementById('editor-footer-icon')?.value || '',
    tag:         document.getElementById('editor-tag').value,
    tagEmoji:    editorEmoji,
    color:       editorColor,
  };

  const data = await api('/api/send-custom-embed', 'POST', { channelId, embedData });
  if (data?.success) toast('✅ ' + data.message, 'success');
  else toast('❌ ' + (data?.error || 'Error'), 'error');
}

// ── USERS ─────────────────────────────────────────────────────────
async function loadUsers() {
  const users = await api('/api/users');
  if (!users) return;
  const tbody = document.getElementById('users-table-body');
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-3)">Sin usuarios</td></tr>';
    return;
  }
  tbody.innerHTML = users.map(u => `
    <tr>
      <td><strong>${u.username}</strong></td>
      <td><span class="badge badge-${u.role}">${u.role}</span></td>
      <td class="text-sm text-muted">${(u.role === 'admin' ? ['Todo'] : (u.role === 'staff' ? ['Embeds','Tickets','Logs'] : ['Vista'])).join(', ')}</td>
      <td class="text-sm text-muted">${new Date(u.createdAt).toLocaleDateString('es')}</td>
      <td>
        <button class="btn btn-danger btn-sm btn-icon" onclick="deleteUser(${u.id},'${u.username}')" title="Eliminar">🗑️</button>
      </td>
    </tr>
  `).join('');
}

async function createUser() {
  const username = document.getElementById('new-username').value.trim();
  const password = document.getElementById('new-password').value;
  const role     = document.getElementById('new-role').value;
  if (!username || !password) { toast('⚠️ Completa todos los campos', 'error'); return; }

  const data = await api('/api/users', 'POST', { username, password, role });
  if (data?.success) {
    toast(`✅ Usuario "${username}" creado`, 'success');
    closeModal('modal-user');
    document.getElementById('new-username').value = '';
    document.getElementById('new-password').value = '';
    loadUsers();
  } else toast('❌ ' + (data?.error || 'Error'), 'error');
}

async function deleteUser(id, name) {
  if (!confirm(`¿Eliminar el usuario "${name}"?`)) return;
  const data = await api(`/api/users/${id}`, 'DELETE');
  if (data?.success) { toast(`🗑️ Usuario eliminado`, 'info'); loadUsers(); }
  else toast('❌ ' + (data?.error || 'Error'), 'error');
}

// ── SECURITY ──────────────────────────────────────────────────────
async function loadSecurity() {
  const cfg = await api('/api/security');
  if (!cfg) return;

  document.getElementById('spam-enabled').checked = cfg.antiSpam?.enabled || false;
  document.getElementById('spam-max').value        = cfg.antiSpam?.maxMessages || 5;
  document.getElementById('spam-window').value     = cfg.antiSpam?.timeWindow  || 5000;
  document.getElementById('spam-action').value     = cfg.antiSpam?.action      || 'mute';

  document.getElementById('raid-enabled').checked = cfg.antiRaid?.enabled || false;
  document.getElementById('raid-max').value        = cfg.antiRaid?.maxJoins   || 10;
  document.getElementById('raid-window').value     = cfg.antiRaid?.timeWindow || 10000;
  document.getElementById('raid-action').value     = cfg.antiRaid?.action     || 'kick';

  renderWordTags(cfg.bannedWords || []);

  if (cfg.logChannelId) {
    document.getElementById('log-channel-select').value = cfg.logChannelId;
  }
}

function renderWordTags(words) {
  const container = document.getElementById('word-tags');
  if (!words.length) {
    container.innerHTML = '<span class="text-muted text-sm">Sin palabras configuradas</span>';
    return;
  }
  container.innerHTML = words.map(w => `
    <span class="word-tag">${w}<button onclick="removeBannedWord('${w}')">✕</button></span>
  `).join('');
}

async function addBannedWord() {
  const word = document.getElementById('new-word-input').value.trim().toLowerCase();
  if (!word) return;
  const cfg = await api('/api/security');
  const words = cfg.bannedWords || [];
  if (!words.includes(word)) words.push(word);
  cfg.bannedWords = words;
  await api('/api/security', 'POST', cfg);
  document.getElementById('new-word-input').value = '';
  renderWordTags(words);
  toast(`✅ Palabra "${word}" añadida al filtro`, 'success');
}

async function removeBannedWord(word) {
  const cfg = await api('/api/security');
  cfg.bannedWords = (cfg.bannedWords || []).filter(w => w !== word);
  await api('/api/security', 'POST', cfg);
  renderWordTags(cfg.bannedWords);
  toast(`🗑️ Palabra "${word}" eliminada`, 'info');
}

async function saveSecurityConfig() {
  const cfg = {
    antiSpam: {
      enabled:     document.getElementById('spam-enabled').checked,
      maxMessages: parseInt(document.getElementById('spam-max').value),
      timeWindow:  parseInt(document.getElementById('spam-window').value),
      action:      document.getElementById('spam-action').value,
    },
    antiRaid: {
      enabled:    document.getElementById('raid-enabled').checked,
      maxJoins:   parseInt(document.getElementById('raid-max').value),
      timeWindow: parseInt(document.getElementById('raid-window').value),
      action:     document.getElementById('raid-action').value,
    },
    bannedWords:     (await api('/api/security'))?.bannedWords || [],
    bannedWordAction:'delete',
    logChannelId:    document.getElementById('log-channel-select').value,
  };
  const data = await api('/api/security', 'POST', cfg);
  if (data?.success) toast('✅ Configuración guardada', 'success');
}

// ── LOGS ──────────────────────────────────────────────────────────
async function loadLogs() {
  const type = document.getElementById('log-filter')?.value || '';
  const url  = `/api/logs?limit=100${type ? '&type=' + type : ''}`;
  const logs = await api(url);
  const container = document.getElementById('logs-container');

  if (!logs?.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>Sin logs registrados</p></div>';
    return;
  }
  container.innerHTML = '<div class="log-list">' + logs.map(renderLogItem).join('') + '</div>';
}

function renderLogItem(log) {
  const time = new Date(log.timestamp).toLocaleString('es', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
  return `
    <div class="log-item">
      <span class="log-icon">${log.icon || '📋'}</span>
      <div class="log-body">
        <div class="log-desc">${log.description}</div>
        <div class="log-time">${time}</div>
      </div>
      <span class="log-type-badge">${log.type.replace(/_/g,' ')}</span>
    </div>
  `;
}

async function clearLogsAction() {
  if (!confirm('¿Limpiar todos los logs?')) return;
  const data = await api('/api/logs', 'DELETE');
  if (data?.success) { toast('🗑️ Logs limpiados', 'info'); loadLogs(); }
}

// ── MODAL ─────────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

// ── TOAST ─────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(100%)'; el.style.transition = '.3s'; }, 3200);
  setTimeout(() => el.remove(), 3600);
}

// ── API HELPER ────────────────────────────────────────────────────
async function api(url, method = 'GET', body = null) {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res  = await fetch(url, opts);
    return await res.json();
  } catch (e) {
    console.error('API error:', e);
    return null;
  }
}
