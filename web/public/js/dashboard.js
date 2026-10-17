/* ═══════════════════════════════════════════════════════════════════════
   HYPERSTOCK PANEL — DASHBOARD v3.0
   ═══════════════════════════════════════════════════════════════════════ */

'use strict';

// ─── STATE ───────────────────────────────────────────────────────────────
const state = {
  page:        'home',
  session:     {},
  channels:    [],
  serverEmojis:[],
  color:       '#6366f1',
  fields:      [],
  drafts:      JSON.parse(localStorage.getItem('hs_drafts') || '[]'),
  draftTimer:  null,
  saving:      false,
};

// ─── EMOJI DATABASE (Unicode frecuentes) ─────────────────────────────────
const UNICODE_EMOJIS = [
  {e:'😀',n:'grinning'},{e:'😂',n:'joy'},{e:'🥰',n:'smiling hearts'},
  {e:'😎',n:'cool'},{e:'🤩',n:'star struck'},{e:'🎉',n:'party'},
  {e:'🔥',n:'fire'},{e:'⚡',n:'zap'},{e:'💎',n:'gem'},
  {e:'💰',n:'money bag'},{e:'💳',n:'credit card'},{e:'🛒',n:'shopping cart'},
  {e:'🎁',n:'gift'},{e:'🎨',n:'palette'},{e:'🎫',n:'ticket'},
  {e:'✅',n:'check mark'},{e:'❌',n:'cross mark'},{e:'⚠️',n:'warning'},
  {e:'🛡️',n:'shield'},{e:'🔒',n:'locked'},{e:'🔓',n:'unlocked'},
  {e:'🚀',n:'rocket'},{e:'⭐',n:'star'},{e:'🌟',n:'glowing star'},
  {e:'💫',n:'dizzy'},{e:'🏆',n:'trophy'},{e:'🥇',n:'first medal'},
  {e:'👑',n:'crown'},{e:'💪',n:'muscle'},{e:'👍',n:'thumbs up'},
  {e:'🤝',n:'handshake'},{e:'🙏',n:'folded hands'},{e:'💯',n:'hundred'},
  {e:'📢',n:'loudspeaker'},{e:'📣',n:'megaphone'},{e:'📨',n:'inbox'},
  {e:'📩',n:'envelope'},{e:'📋',n:'clipboard'},{e:'📌',n:'pushpin'},
  {e:'🔔',n:'bell'},{e:'🔕',n:'no bell'},{e:'🛠️',n:'hammer wrench'},
  {e:'⚙️',n:'gear'},{e:'🔧',n:'wrench'},{e:'📊',n:'bar chart'},
  {e:'📈',n:'chart up'},{e:'📉',n:'chart down'},{e:'🏪',n:'store'},
  {e:'💼',n:'briefcase'},{e:'🌐',n:'globe'},{e:'💻',n:'laptop'},
  {e:'📱',n:'phone'},{e:'🖥️',n:'desktop'},{e:'⌨️',n:'keyboard'},
  {e:'🇵🇪',n:'Peru'},{e:'🇨🇴',n:'Colombia'},{e:'🇲🇽',n:'Mexico'},
  {e:'🇦🇷',n:'Argentina'},{e:'🇨🇱',n:'Chile'},{e:'🇧🇷',n:'Brazil'},
  {e:'🪙',n:'coin'},{e:'💵',n:'dollar'},{e:'💴',n:'yen'},{e:'💶',n:'euro'},
  {e:'🔨',n:'hammer'},{e:'👢',n:'boot'},{e:'🚫',n:'no entry'},
  {e:'✏️',n:'pencil'},{e:'🗑️',n:'wastebasket'},{e:'🎯',n:'target'},
  {e:'💡',n:'bulb'},{e:'🌙',n:'moon'},{e:'☀️',n:'sun'},{e:'❄️',n:'snowflake'},
];

// ─── EMBED TEMPLATES ─────────────────────────────────────────────────────
const TEMPLATES = {
  tickets: {
    authorEmoji:'🏪', authorName:'Hyper Stock', authorUrl:'', authorIcon:'',
    title:'Bienvenido al sistema de tickets de Hyper Stock', titleUrl:'',
    description:'Abre un ticket para comprar productos, recibir soporte o resolver dudas.\n\n**Antes de abrir un ticket:**\n• Selecciona la categoría adecuada.\n• Explica tu solicitud con claridad.\n• Espera a que un miembro del staff te atienda.\n\n**Importante:** Hyper Stock no se hace responsable de problemas o acuerdos realizados fuera de nuestro equipo oficial.',
    fields:[], image:'', thumb:'', footer:'» Tickets', footerIcon:'',
    color:'#6366f1', btnType:'none', btnEmoji:'', btnText:'', btnStyle:'Primary',
  },
  metodos: {
    authorEmoji:'🏪', authorName:'HyperStock Metodos', authorUrl:'', authorIcon:'',
    title:'MÉTODOS DE PAGO', titleUrl:'',
    description:'Binance 🪙 • PayPal 💙\nYape 🇵🇪\nMercado Pago 🛒\n🇲🇽 🇦🇷 🇨🇱 🇨🇴\nNequi 🇨🇴\nLitecoin 💚',
    fields:[], image:'', thumb:'', footer:'» Metodos', footerIcon:'',
    color:'#6366f1', btnType:'none', btnEmoji:'💳', btnText:'Metodos', btnStyle:'Secondary',
  },
  diamantes: {
    authorEmoji:'🏪', authorName:'Hyper Stock', authorUrl:'', authorIcon:'',
    title:'Venta De Diamantes', titleUrl:'',
    description:'🎁 **Diamantes Sin Previa Verificacion De ID**\n\n🎁 No necesitamos tu cuenta, solamente tu ID\n🎁 Recargas disponibles a precios económicos\n🎁 Entrega rápida y segura\n\n💎 **Precios**\n💎 100 + 10 Diamantes = S/.4.5\n💎 310 + 31 Diamantes = S/.13\n💎 520 + 52 Diamantes = S/.18.5\n💎 1060 + 106 Diamantes = S/.32\n💎 2180 + 218 Diamantes = S/.53\n💎 5600 + 560 Diamantes = S/.125',
    fields:[], image:'', thumb:'', footer:'» Adquirir', footerIcon:'',
    color:'#6366f1', btnType:'button', btnEmoji:'💎', btnText:'Adquirir', btnStyle:'Primary',
  },
  decoraciones: {
    authorEmoji:'🏪', authorName:'Hyper Stock', authorUrl:'', authorIcon:'',
    title:'Método de Decoraciones al 60% de Descuento 🎁', titleUrl:'',
    description:'¿Te preguntas cómo funciona?\n\n» El método consiste en adquirir decoraciones de Discord mediante regalos, pagando un 60% menos de su precio habitual.\n\n**¿Qué incluye?**\n» El método completo para que puedas realizar el proceso por tu cuenta.\n\n» **Precio del método completo: $20 USD**\n\n¿Qué esperas para conseguir tus decoraciones a un precio más económico?\n\n✅ **Adquiere el método completo y descubre cómo funciona.**',
    fields:[], image:'', thumb:'', footer:'» Decoraciones', footerIcon:'',
    color:'#7c3aed', btnType:'button', btnEmoji:'🎨', btnText:'Decoraciones', btnStyle:'Secondary',
  },
  boosts: {
    authorEmoji:'🏪', authorName:'Hyper Stock', authorUrl:'', authorIcon:'',
    title:'', titleUrl:'',
    description:'¿Cansado de pagar precios exagerados por los boosts de Discord? 🔨\n\n¡Tengo la solución! 🎁\n\nVendo mi **método para conseguir boosts de Discord a precios económicos.**\n\n» **Precio del método: $20 💚**\n» **Precios Vendemos:**\n\n⚡ **Discord Boosts**\n· 14 Boosts — 1 mes\n· Precio: **$1.75**\n\n» **¿Quieres comprar boosts directamente?**\n\nAbre un ticket indicando la cantidad de boosts que necesitas y la duración. Nuestro staff te informará del precio.\n\n🔥 **¡Aprovecha estos precios!**',
    fields:[], image:'', thumb:'', footer:'» Boost', footerIcon:'',
    color:'#6366f1', btnType:'button', btnEmoji:'⚡', btnText:'Boost', btnStyle:'Primary',
  },
};

const EMBED_LIST = [
  {type:'tickets',     label:'🎫 Sistema de Tickets'},
  {type:'metodos',     label:'💳 Métodos de Pago'},
  {type:'diamantes',   label:'💎 Venta de Diamantes'},
  {type:'decoraciones',label:'🎨 Decoraciones Discord'},
  {type:'boosts',      label:'⚡ Discord Boosts'},
];

// ─── INIT ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadSession(), loadChannels()]);
  renderEmbedCards();
  loadHome();
  initEmojiGrids();
  renderDraftBar();
  // Show btn options based on default
  document.getElementById('editor-btn-type').addEventListener('change', () => {
    const val = document.getElementById('editor-btn-type').value;
    document.getElementById('btn-options').style.display = val === 'button' ? 'block' : 'none';
    updatePreview();
  });
  // Close emoji panels on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.emoji-picker-wrap')) closeAllEmojiPanels();
  });
});

// ─── SESSION ──────────────────────────────────────────────────────────────
async function loadSession() {
  const d = await api('/api/me');
  if (!d) return;
  state.session = d;
  $('user-name').textContent  = d.username;
  $('user-role').textContent  = d.role;
  $('user-avatar').textContent = d.username[0].toUpperCase();

  if (d.role === 'admin') {
    show('admin-section'); show('nav-users'); show('nav-security'); show('nav-logs');
  } else if (d.permissions?.includes('view_logs')) {
    show('nav-logs');
  }
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────
const PAGE_TITLES = {
  home:'Inicio', embeds:'Enviar Embeds', editor:'Editor de Embeds',
  tickets:'Tickets', users:'Usuarios', security:'Seguridad', logs:'Logs',
};

function showPage(name) {
  qsa('.page').forEach(p => p.classList.remove('active'));
  qsa('.nav-btn').forEach(n => n.classList.remove('active'));
  $('page-' + name)?.classList.add('active');
  $('nav-' + name)?.classList.add('active');
  $('page-title').textContent = PAGE_TITLES[name] || name;
  state.page = name;

  if (name === 'home')     loadHome();
  if (name === 'users')    loadUsers();
  if (name === 'logs')     loadLogs();
  if (name === 'security') loadSecurity();
}

// ─── HOME ─────────────────────────────────────────────────────────────────
async function loadHome() {
  const g = await api('/api/guild');
  if (!g) return;

  $('guild-name').textContent   = g.name;
  $('meta-members').textContent = g.memberCount.toLocaleString();
  $('meta-channels').textContent= g.channelCount;
  $('meta-roles').textContent   = g.roleCount;
  $('meta-created').textContent = new Date(g.createdAt).toLocaleDateString('es');
  $('boost-badge').textContent  = `🚀 Tier ${g.boostTier} · ${g.boostCount} boosts`;

  $('stat-members').textContent  = g.memberCount.toLocaleString();
  $('stat-channels').textContent = g.channelCount;
  $('stat-roles').textContent    = g.roleCount;
  $('stat-uptime').textContent   = g.uptime;
  $('stat-boosts').textContent   = g.boostCount;
  $('stat-ping').textContent     = g.ping;

  $('guild-info').innerHTML = [
    ['👑','Owner ID', g.ownerId],
    ['📢','Canales', g.channelCount],
    ['🎭','Roles', g.roleCount],
    ['🚀','Boost Tier', g.boostTier],
    ['⚡','Ping', g.ping],
    ['📅','Creado', new Date(g.createdAt).toLocaleDateString('es')],
  ].map(([ico,k,v])=>`
    <div class="info-row">
      <span class="info-key">${ico} ${k}</span>
      <span class="info-val">${v}</span>
    </div>`).join('');

  const logs = await api('/api/logs?limit=6');
  $('home-logs').innerHTML = logs?.length
    ? logs.map(renderLogItem).join('')
    : '<div class="empty-state"><div class="empty-ico">📋</div><p>Sin actividad reciente</p></div>';
}

// ─── CHANNELS ─────────────────────────────────────────────────────────────
async function loadChannels() {
  const ch = await api('/api/channels');
  if (!ch) return;
  state.channels = ch;
  ['channelSelect','editor-channel','ticket-channel','log-channel-select'].forEach(id => {
    const el = $(id);
    if (!el) return;
    const first = el.querySelector('option[value=""]');
    el.innerHTML = '';
    if (first) el.appendChild(first);
    ch.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id; o.textContent = '# ' + c.name;
      el.appendChild(o);
    });
  });
}

// ─── EMBEDS GRID ──────────────────────────────────────────────────────────
function renderEmbedCards() {
  const grid = $('embeds-grid');
  if (!grid) return;
  grid.innerHTML = EMBED_LIST.map(e => {
    const t = TEMPLATES[e.type];
    return `
    <div class="embed-card interactive">
      <div class="embed-preview-area">
        <div class="dc-preview">
          <div class="dc-inner">
            <div class="dc-bar" style="background:${t.color}"></div>
            <div class="dc-body">
              <div class="dc-author">
                <span class="dc-author-ico">${t.authorEmoji}</span>
                <span class="dc-author-name">${t.authorName}</span>
              </div>
              ${t.title?`<div class="dc-title">${t.title}</div>`:''}
              <div class="dc-desc">${(t.description||'').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>').slice(0,220)}${(t.description||'').length>220?'…':''}</div>
              ${t.footer?`<div class="dc-tag">${t.footer}</div>`:''}
            </div>
          </div>
        </div>
      </div>
      <div class="embed-foot">
        <span class="embed-foot-name">${e.label}</span>
        <button class="btn btn-primary btn-sm" onclick="sendEmbed('${e.type}', this)">📨 Enviar</button>
      </div>
    </div>`;
  }).join('');
}

async function sendEmbed(type, btn) {
  const channelId = $('channelSelect')?.value;
  if (!channelId) { toast('⚠️ Selecciona un canal primero', 'warn'); return; }
  btn.disabled = true; btn.textContent = '⏳ Enviando...';
  const d = await api('/api/send-embed', 'POST', { channelId, embedType: type });
  btn.disabled = false; btn.textContent = '📨 Enviar';
  d?.success ? toast('✅ ' + d.message, 'success') : toast('❌ ' + (d?.error||'Error'), 'error');
}

async function deployTicketEmbed() {
  const cid = $('ticket-channel')?.value;
  if (!cid) { toast('⚠️ Selecciona un canal', 'warn'); return; }
  const d = await api('/api/send-embed', 'POST', { channelId: cid, embedType: 'tickets' });
  d?.success ? toast('✅ Sistema de tickets desplegado', 'success') : toast('❌ ' + (d?.error||'Error'), 'error');
}

// ─── EDITOR TABS ──────────────────────────────────────────────────────────
function switchEditorTab(name, btn) {
  qsa('.editor-tab').forEach(t => t.classList.remove('active'));
  qsa('.editor-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  $('epanel-' + name)?.classList.add('active');
}

// ─── TEMPLATE LOADER ──────────────────────────────────────────────────────
function loadTemplate() {
  const type = $('editor-template')?.value;
  if (!type) { clearEditor(); return; }
  const t = TEMPLATES[type];
  if (!t) return;
  setVal('editor-author-emoji', t.authorEmoji || '');
  setVal('editor-author-name',  t.authorName  || '');
  setVal('editor-author-url',   t.authorUrl   || '');
  setVal('editor-author-icon',  t.authorIcon  || '');
  setVal('editor-title',        t.title       || '');
  setVal('editor-title-url',    t.titleUrl    || '');
  setVal('editor-desc',         t.description || '');
  setVal('editor-image',        t.image       || '');
  setVal('editor-thumb',        t.thumb       || '');
  setVal('editor-footer',       t.footer      || '');
  setVal('editor-footer-icon',  t.footerIcon  || '');
  setVal('editor-btn-emoji',    t.btnEmoji    || '');
  setVal('editor-tag',          t.btnText     || '');
  setVal('editor-btn-type',     t.btnType     || 'none');
  setVal('editor-btn-style',    t.btnStyle    || 'Primary');

  $('btn-options').style.display = t.btnType === 'button' ? 'block' : 'none';

  state.fields = (t.fields || []).map((f, i) => ({...f, id: Date.now() + i}));
  renderFields();
  pickColorRaw(t.color || '#6366f1');
  updatePreview();
  toast('📋 Plantilla "' + type + '" cargada', 'info');
}

function clearEditor() {
  ['editor-author-emoji','editor-author-name','editor-author-url','editor-author-icon',
   'editor-title','editor-title-url','editor-desc','editor-image','editor-thumb',
   'editor-footer','editor-footer-icon','editor-btn-emoji','editor-tag',
  ].forEach(id => setVal(id, ''));
  setVal('editor-btn-type', 'none');
  $('btn-options').style.display = 'none';
  state.fields = [];
  renderFields();
  pickColorRaw('#6366f1');
  updatePreview();
}

// ─── COLOR ────────────────────────────────────────────────────────────────
function pickColor(el) {
  qsa('.c-swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  state.color = el.dataset.col;
  syncColorUI(state.color);
  updatePreview();
}

function pickColorRaw(val) {
  state.color = val;
  qsa('.c-swatch').forEach(s => s.classList.toggle('active', s.dataset.col === val));
  syncColorUI(val);
  updatePreview();
}

function pickColorFromHex(val) {
  if (!/^#[0-9a-fA-F]{6}$/.test(val)) return;
  pickColorRaw(val);
}

function syncColorUI(val) {
  const hex = $('editor-color-hex'); if (hex) hex.value = val;
  const pic = $('editor-color-picker'); if (pic) pic.value = val;
  const prev = $('color-preview'); if (prev) prev.style.background = val;
}

// ─── FIELDS ───────────────────────────────────────────────────────────────
function addField() {
  if (state.fields.length >= 25) { toast('⚠️ Máximo 25 campos por embed', 'warn'); return; }
  state.fields.push({ id: Date.now(), name: '', value: '', inline: false });
  renderFields();
  updatePreview();
  autoSaveDraft();
}

function removeField(id) {
  state.fields = state.fields.filter(f => f.id !== id);
  renderFields();
  updatePreview();
  autoSaveDraft();
}

function updateField(id, key, val) {
  const f = state.fields.find(f => f.id === id);
  if (f) { f[key] = val; updatePreview(); autoSaveDraft(); }
}

function renderFields() {
  const list = $('fields-list');
  if (!list) return;
  $('fields-counter').textContent = `(${state.fields.length}/25)`;
  if (!state.fields.length) {
    list.innerHTML = '<div class="empty-state" style="padding:24px"><div class="empty-ico" style="font-size:28px">📊</div><p>Sin campos. Agrega uno abajo.</p></div>';
    return;
  }
  list.innerHTML = state.fields.map((f, i) => `
    <div class="field-item" id="fi-${f.id}">
      <div class="field-item-hdr">
        <span class="field-item-num">Campo ${i+1}</span>
        <div class="field-item-actions">
          <button class="btn btn-ghost btn-xs btn-icon" onclick="duplicateField(${f.id})" title="Duplicar">⧉</button>
          <button class="btn btn-danger btn-xs btn-icon" onclick="removeField(${f.id})" title="Eliminar">✕</button>
        </div>
      </div>
      <div class="field-2">
        <div>
          <label class="label">Nombre del campo</label>
          <input class="input" value="${escHtml(f.name)}" placeholder="Nombre..." maxlength="256"
            oninput="updateField(${f.id},'name',this.value)"/>
        </div>
        <div>
          <label class="label">Valor del campo</label>
          <textarea class="textarea" style="min-height:60px" maxlength="1024"
            oninput="updateField(${f.id},'value',this.value)">${escHtml(f.value)}</textarea>
        </div>
      </div>
      <label class="field-inline-toggle">
        <input type="checkbox" ${f.inline?'checked':''} onchange="updateField(${f.id},'inline',this.checked)"/>
        Campo inline (aparece junto a otros campos inline)
      </label>
    </div>
  `).join('');
}

function duplicateField(id) {
  const f = state.fields.find(f => f.id === id);
  if (!f) return;
  state.fields.push({...f, id: Date.now()});
  renderFields(); updatePreview();
}

// ─── EMOJI SYSTEM ─────────────────────────────────────────────────────────
function initEmojiGrids() {
  // Cargar emojis del servidor
  loadServerEmojis();
  // Renderizar grids unicode por defecto
  renderEmojiGrid('author-emoji-grid', UNICODE_EMOJIS, 'author');
  renderEmojiGrid('desc-emoji-grid',   UNICODE_EMOJIS, 'desc');
  renderEmojiGrid('btn-emoji-grid',    UNICODE_EMOJIS, 'btn');
}

async function loadServerEmojis() {
  const ch = await api('/api/guild-emojis').catch(() => null);
  if (ch?.emojis) state.serverEmojis = ch.emojis;
}

function renderEmojiGrid(gridId, emojis, context) {
  const grid = $(gridId);
  if (!grid) return;
  if (!emojis?.length) {
    grid.innerHTML = '<div class="custom-emoji-empty">Sin emojis disponibles</div>';
    return;
  }
  grid.innerHTML = emojis.map(e => {
    if (e.id) {
      // Custom Discord emoji
      const url = `https://cdn.discordapp.com/emojis/${e.id}.${e.animated?'gif':'webp'}?size=32`;
      return `<div class="emoji-item custom-emoji" onclick="insertEmoji('${context}','<${e.animated?'a':''}:${e.name}:${e.id}>','${e.name}','${e.id}')" title="${e.name}">
        <img src="${url}" alt="${e.name}" onerror="this.parentElement.remove()"/>
      </div>`;
    }
    return `<div class="emoji-item" onclick="insertEmoji('${context}','${e.e}','${e.n}','')" title="${e.n}">${e.e}</div>`;
  }).join('');
}

function filterEmojis(ctx, query) {
  const q = query.toLowerCase();
  const filtered = UNICODE_EMOJIS.filter(e => e.n.includes(q) || e.e.includes(q));
  const sFiltered = state.serverEmojis.filter(e => e.name.toLowerCase().includes(q));
  const gridId = ctx === 'author' ? 'author-emoji-grid' : ctx === 'desc' ? 'desc-emoji-grid' : 'btn-emoji-grid';
  const combined = [...filtered, ...sFiltered.map(e => ({...e, e: '', n: e.name}))];
  renderEmojiGrid(gridId, combined.length ? combined : filtered, ctx);
}

function insertEmoji(context, emoji, name, id) {
  if (context === 'author') {
    setVal('editor-author-emoji', emoji);
    $('author-emoji-display').textContent = id ? '⚡' : emoji;
    $('author-emoji-prev').textContent    = id ? '⚡' : emoji;
    $('author-emoji-name').textContent    = name;
    $('author-emoji-code').textContent    = id ? `ID: ${id}` : `U+${emoji.codePointAt(0)?.toString(16).toUpperCase()}`;
    closeAllEmojiPanels();
    updatePreview();
  } else if (context === 'desc') {
    const ta = $('editor-desc');
    if (ta) {
      const s = ta.selectionStart, e = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + emoji + ta.value.slice(e);
      ta.selectionStart = ta.selectionEnd = s + emoji.length;
      $('desc-emoji-prev').textContent = id ? '⚡' : emoji;
      $('desc-emoji-name').textContent = name;
    }
    updatePreview(); autoSaveDraft();
  } else if (context === 'btn') {
    setVal('editor-btn-emoji', emoji);
    $('btn-emoji-display').textContent = id ? '⚡' : emoji;
    $('btn-emoji-prev').textContent    = id ? '⚡' : emoji;
    $('btn-emoji-name').textContent    = name;
    closeAllEmojiPanels();
    updatePreview();
  }
}

function toggleEmojiPanel(id) {
  const p = $(id);
  if (!p) return;
  const wasOpen = p.classList.contains('open');
  closeAllEmojiPanels();
  if (!wasOpen) p.classList.add('open');
}

function closeAllEmojiPanels() {
  qsa('.emoji-panel').forEach(p => p.classList.remove('open'));
}

function setEmojiTabAu(type, el) {
  el.closest('.emoji-tabs').querySelectorAll('.emoji-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderEmojiGrid('author-emoji-grid', type === 'server' ? state.serverEmojis.map(e=>({...e,e:'',n:e.name})) : UNICODE_EMOJIS, 'author');
}
function setEmojiTabDesc(type, el) {
  el.closest('.emoji-tabs').querySelectorAll('.emoji-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderEmojiGrid('desc-emoji-grid', type === 'server' ? state.serverEmojis.map(e=>({...e,e:'',n:e.name})) : UNICODE_EMOJIS, 'desc');
}
function setEmojiTabBtn(type, el) {
  el.closest('.emoji-tabs').querySelectorAll('.emoji-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderEmojiGrid('btn-emoji-grid', type === 'server' ? state.serverEmojis.map(e=>({...e,e:'',n:e.name})) : UNICODE_EMOJIS, 'btn');
}
function onAuthorEmojiInput() { updatePreview(); autoSaveDraft(); }

// ─── PREVIEW ──────────────────────────────────────────────────────────────
let previewDebounce = null;
function updatePreview() {
  clearTimeout(previewDebounce);
  previewDebounce = setTimeout(_doUpdatePreview, 60);
}

function _doUpdatePreview() {
  const v = id => ($(id)?.value || '').trim();

  const authorEmoji = v('editor-author-emoji');
  const authorName  = v('editor-author-name');
  const title       = v('editor-title');
  const desc        = v('editor-desc');
  const image       = v('editor-image');
  const thumb       = v('editor-thumb');
  const footer      = v('editor-footer');
  const footerIcon  = v('editor-footer-icon');
  const btnType     = v('editor-btn-type');
  const btnEmoji    = v('editor-btn-emoji');
  const btnText     = v('editor-tag');
  const btnStyle    = v('editor-btn-style');

  // Bar
  $('prev-bar').style.background = state.color;

  // Author
  const hasAuthor = authorEmoji || authorName;
  toggleEl('prev-author-row', hasAuthor);
  if (hasAuthor) {
    $('prev-author-icon').textContent = authorEmoji || '';
    $('prev-author-name').textContent = authorName  || '';
  }

  // Title
  toggleEl('prev-title', !!title);
  if (title) $('prev-title').textContent = title;

  // Desc
  if (desc) {
    $('prev-desc').style.fontStyle = '';
    $('prev-desc').style.color     = '';
    $('prev-desc').innerHTML = formatDiscordMarkdown(desc);
  } else {
    $('prev-desc').style.fontStyle = 'italic';
    $('prev-desc').style.color     = '#949ba4';
    $('prev-desc').textContent     = 'El contenido aparecerá aquí...';
  }

  // Fields
  const pf = $('prev-fields');
  if (pf) {
    if (state.fields.length) {
      pf.style.display = '';
      // Calcular columnas para inline
      let colTemplate = '';
      const inlineGroups = [];
      let currentGroup = [];
      state.fields.forEach(f => {
        if (f.inline) {
          currentGroup.push(f);
          if (currentGroup.length === 3) { inlineGroups.push([...currentGroup]); currentGroup = []; }
        } else {
          if (currentGroup.length) { inlineGroups.push([...currentGroup]); currentGroup = []; }
          inlineGroups.push([f]);
        }
      });
      if (currentGroup.length) inlineGroups.push(currentGroup);

      pf.innerHTML = inlineGroups.map(group => {
        const cols = group[0].inline ? group.length : 1;
        return `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px">${
          group.map(f => `<div class="embed-field">
            <div class="embed-field-name">${escHtml(f.name||'Campo')}</div>
            <div class="embed-field-value">${escHtml(f.value||'—')}</div>
          </div>`).join('')
        }</div>`;
      }).join('');
    } else {
      pf.style.display = 'none';
    }
  }

  // Image
  const pi = $('prev-img');
  if (image && pi) {
    pi.src = image; pi.style.display = '';
    // Preview in media tab
    const pw = $('image-preview-wrap'), pp = $('image-preview-img');
    if (pw && pp) { pw.style.display=''; pp.src=image; }
  } else if (pi) {
    pi.style.display = 'none';
    const pw = $('image-preview-wrap'); if (pw) pw.style.display='none';
  }

  // Thumbnail
  const pt = $('prev-thumb');
  if (thumb && pt) {
    pt.src = thumb; pt.style.display = '';
    const tw = $('thumb-preview-wrap'), ti = $('thumb-preview-img');
    if (tw && ti) { tw.style.display=''; ti.src=thumb; }
  } else if (pt) {
    pt.style.display = 'none';
    const tw = $('thumb-preview-wrap'); if (tw) tw.style.display='none';
  }

  // Footer
  const pfoot = $('prev-footer');
  if (footer && pfoot) {
    pfoot.style.display = 'flex';
    const fico = $('prev-footer-ico');
    if (footerIcon && fico) { fico.src = footerIcon; fico.style.display=''; }
    else if (fico) fico.style.display='none';
    $('prev-footer-text').textContent = footer;
  } else if (pfoot) {
    pfoot.style.display = 'none';
  }

  // Button
  const pb = $('prev-btn'), pbe = $('prev-btn-el');
  if (btnType === 'button' && btnText && pbe) {
    pb.style.display = '';
    const STYLES = {Primary:'#5865f2',Secondary:'#4f545c',Success:'#3ba55c',Danger:'#ed4245'};
    pbe.style.background = STYLES[btnStyle] || STYLES.Primary;
    pbe.style.color = '#fff';
    pbe.style.borderRadius = '4px';
    pbe.textContent = (btnEmoji && btnEmoji !== 'none' ? btnEmoji + ' ' : '') + btnText;
  } else if (pb) {
    pb.style.display = 'none';
  }

  // Char counter
  const total = [v('editor-title'),v('editor-author-name'),v('editor-desc'),v('editor-footer')].join('').length
    + state.fields.reduce((a,f)=>a+f.name.length+f.value.length,0);
  const tEl = $('embed-char-total');
  if (tEl) {
    tEl.textContent = `Caracteres totales: ${total} / 6000`;
    tEl.style.color = total > 6000 ? 'var(--rose)' : total > 5500 ? 'var(--amber)' : '';
  }

  // Validate
  runValidations(total);
  autoSaveDraft();
}

function formatDiscordMarkdown(text) {
  return escHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(255,255,255,.1);padding:1px 5px;border-radius:3px;font-size:11px">$1</code>')
    .replace(/\n/g, '<br>');
}

// ─── VALIDATIONS ──────────────────────────────────────────────────────────
function runValidations(charTotal) {
  const issues = [];
  const v = id => ($(id)?.value || '').trim();
  if (charTotal > 6000) issues.push({type:'error', msg:`Embed supera 6000 caracteres (${charTotal})`});
  if (v('editor-title').length > 256) issues.push({type:'error', msg:'Título supera 256 caracteres'});
  if (v('editor-desc').length > 4096) issues.push({type:'error', msg:'Descripción supera 4096 caracteres'});
  if (v('editor-footer').length > 2048) issues.push({type:'warn', msg:'Footer supera 2048 caracteres'});
  if (state.fields.length > 25) issues.push({type:'error', msg:'Más de 25 campos (límite Discord)'});
  state.fields.forEach((f,i)=>{
    if (f.name.length > 256) issues.push({type:'warn', msg:`Campo ${i+1}: nombre supera 256 chars`});
    if (f.value.length > 1024) issues.push({type:'warn', msg:`Campo ${i+1}: valor supera 1024 chars`});
  });

  const vc = $('validation-card'), vl = $('validation-list');
  if (vc) vc.style.display = issues.length ? '' : 'none';
  if (vl) {
    vl.innerHTML = issues.map(i=>`
      <div class="row-gap t-sm" style="color:${i.type==='error'?'#fca5a5':'var(--amber)'}">
        <span>${i.type==='error'?'❌':'⚠️'}</span> ${i.msg}
      </div>`).join('');
  }
  return issues.filter(i=>i.type==='error').length === 0;
}

// ─── SEND CUSTOM EMBED ────────────────────────────────────────────────────
async function sendCustomEmbed() {
  const channelId = $('editor-channel')?.value;
  if (!channelId) { toast('⚠️ Selecciona un canal destino', 'warn'); return; }
  if (!runValidations(0)) { toast('❌ Corrige los errores de validación primero', 'error'); return; }

  const btn = $('btn-send-custom');
  btn.disabled = true; btn.textContent = '⏳ Enviando...';

  const embedData = {
    authorEmoji: $('editor-author-emoji')?.value || '',
    authorName:  $('editor-author-name')?.value  || '',
    authorUrl:   $('editor-author-url')?.value   || '',
    authorIcon:  $('editor-author-icon')?.value  || '',
    title:       $('editor-title')?.value         || '',
    titleUrl:    $('editor-title-url')?.value     || '',
    description: $('editor-desc')?.value          || '',
    image:       $('editor-image')?.value         || '',
    thumbnail:   $('editor-thumb')?.value         || '',
    footer:      $('editor-footer')?.value        || '',
    footerIcon:  $('editor-footer-icon')?.value   || '',
    tag:         $('editor-tag')?.value           || '',
    tagEmoji:    $('editor-btn-emoji')?.value     || '',
    tagStyle:    $('editor-btn-style')?.value     || 'Primary',
    btnType:     $('editor-btn-type')?.value      || 'none',
    fields:      state.fields,
    color:       state.color,
  };

  const d = await api('/api/send-custom-embed', 'POST', { channelId, embedData });
  btn.disabled = false; btn.textContent = '📨 Enviar Embed';
  d?.success ? toast('✅ ' + d.message, 'success') : toast('❌ ' + (d?.error||'Error'), 'error');
}

// ─── DRAFTS ───────────────────────────────────────────────────────────────
let draftAutoTimer = null;
function autoSaveDraft() {
  clearTimeout(draftAutoTimer);
  const status = $('draft-status');
  if (status) { status.textContent = '⏳ Guardando...'; status.className = 'draft-status draft-saving'; }
  draftAutoTimer = setTimeout(() => {
    saveDraft(true);
    if (status) { status.textContent = '✅ Guardado automáticamente'; status.className = 'draft-status'; }
  }, 1500);
}

function saveDraft(auto = false) {
  const name = auto ? `Borrador ${new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'})}` : prompt('Nombre del borrador:') || 'Borrador';
  const draft = {
    id:    Date.now(),
    name,
    time:  new Date().toISOString(),
    data: {
      authorEmoji: $('editor-author-emoji')?.value,
      authorName:  $('editor-author-name')?.value,
      title:       $('editor-title')?.value,
      desc:        $('editor-desc')?.value,
      image:       $('editor-image')?.value,
      thumb:       $('editor-thumb')?.value,
      footer:      $('editor-footer')?.value,
      footerIcon:  $('editor-footer-icon')?.value,
      btnType:     $('editor-btn-type')?.value,
      btnEmoji:    $('editor-btn-emoji')?.value,
      btnText:     $('editor-tag')?.value,
      btnStyle:    $('editor-btn-style')?.value,
      fields:      JSON.parse(JSON.stringify(state.fields)),
      color:       state.color,
    }
  };
  // Keep only last 5 auto or 10 manual
  state.drafts = state.drafts.filter(d => auto ? !d.name.startsWith('Borrador ') : true).slice(0, 9);
  state.drafts.unshift(draft);
  localStorage.setItem('hs_drafts', JSON.stringify(state.drafts));
  renderDraftBar();
  if (!auto) toast('💾 Borrador guardado', 'success');
}

function loadDraft(id) {
  const draft = state.drafts.find(d => d.id === id);
  if (!draft) return;
  const d = draft.data;
  setVal('editor-author-emoji', d.authorEmoji || '');
  setVal('editor-author-name',  d.authorName  || '');
  setVal('editor-title',        d.title       || '');
  setVal('editor-desc',         d.desc        || '');
  setVal('editor-image',        d.image       || '');
  setVal('editor-thumb',        d.thumb       || '');
  setVal('editor-footer',       d.footer      || '');
  setVal('editor-footer-icon',  d.footerIcon  || '');
  setVal('editor-btn-type',     d.btnType     || 'none');
  setVal('editor-btn-emoji',    d.btnEmoji    || '');
  setVal('editor-tag',          d.btnText     || '');
  setVal('editor-btn-style',    d.btnStyle    || 'Primary');
  $('btn-options').style.display = d.btnType === 'button' ? 'block' : 'none';
  state.fields = d.fields || [];
  renderFields();
  pickColorRaw(d.color || '#6366f1');
  updatePreview();
  toast(`📋 Borrador "${draft.name}" cargado`, 'info');
}

function deleteDraft(id) {
  state.drafts = state.drafts.filter(d => d.id !== id);
  localStorage.setItem('hs_drafts', JSON.stringify(state.drafts));
  renderDraftBar();
}

function renderDraftBar() {
  const bar = $('drafts-bar'), list = $('draft-list');
  if (!bar || !list) return;
  if (!state.drafts.length) { bar.classList.add('hidden'); return; }
  bar.classList.remove('hidden');
  $('draft-status').textContent = `💾 ${state.drafts.length} borrador${state.drafts.length>1?'es':''}:`;
  list.innerHTML = state.drafts.slice(0,5).map(d => `
    <span class="draft-chip" onclick="loadDraft(${d.id})">
      ${d.name}
      <span class="del" onclick="event.stopPropagation();deleteDraft(${d.id})">✕</span>
    </span>`).join('');
}

// ─── CHARACTER COUNTERS ───────────────────────────────────────────────────
function countChars(inputId, countId, max) {
  const len = ($(inputId)?.value || '').length;
  const el = $(countId);
  if (!el) return;
  el.textContent = `${len}/${max}`;
  el.className = 'input-count' + (len > max ? ' over' : len > max * .85 ? ' warn' : '');
}

// ─── USERS ────────────────────────────────────────────────────────────────
async function loadUsers() {
  const users = await api('/api/users');
  if (!users) return;
  const tbody = $('users-tbody');
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--t3)">Sin usuarios</td></tr>';
    return;
  }
  tbody.innerHTML = users.map(u => `
    <tr>
      <td><strong>${escHtml(u.username)}</strong></td>
      <td><span class="badge b-${u.role}">${u.role}</span></td>
      <td class="t-sm t-muted">${u.role==='admin'?'Todo':u.role==='staff'?'Embeds, Tickets, Logs':'Vista'}</td>
      <td class="t-sm t-muted">${new Date(u.createdAt).toLocaleDateString('es')}</td>
      <td><button class="btn btn-danger btn-xs btn-icon" onclick="deleteUser(${u.id},'${escHtml(u.username)}')" title="Eliminar">🗑️</button></td>
    </tr>`).join('');
}

async function createUser() {
  const username = $('new-username')?.value.trim();
  const password = $('new-password')?.value;
  const role     = $('new-role')?.value;
  if (!username || !password) { toast('⚠️ Completa todos los campos', 'warn'); return; }
  const d = await api('/api/users', 'POST', { username, password, role });
  if (d?.success) {
    toast(`✅ Usuario "${username}" creado`, 'success');
    closeModal('modal-user');
    setVal('new-username',''); setVal('new-password','');
    loadUsers();
  } else toast('❌ ' + (d?.error||'Error'), 'error');
}

async function deleteUser(id, name) {
  if (!confirm(`¿Eliminar el usuario "${name}"?`)) return;
  const d = await api(`/api/users/${id}`, 'DELETE');
  d?.success ? (toast('🗑️ Usuario eliminado', 'info'), loadUsers()) : toast('❌ ' + (d?.error||'Error'), 'error');
}

// ─── SECURITY ─────────────────────────────────────────────────────────────
async function loadSecurity() {
  const cfg = await api('/api/security');
  if (!cfg) return;
  setChecked('spam-enabled', cfg.antiSpam?.enabled || false);
  setVal('spam-max',    cfg.antiSpam?.maxMessages || '5');
  setVal('spam-window', cfg.antiSpam?.timeWindow  || '5000');
  setVal('spam-action', cfg.antiSpam?.action      || 'mute');
  setChecked('raid-enabled', cfg.antiRaid?.enabled || false);
  setVal('raid-max',    cfg.antiRaid?.maxJoins   || '10');
  setVal('raid-window', cfg.antiRaid?.timeWindow || '10000');
  setVal('raid-action', cfg.antiRaid?.action     || 'kick');
  renderWordTags(cfg.bannedWords || []);
  if (cfg.logChannelId) setVal('log-channel-select', cfg.logChannelId);
}

function renderWordTags(words) {
  const c = $('word-tags');
  if (!c) return;
  c.innerHTML = words.length
    ? words.map(w => `<span class="word-tag">${escHtml(w)}<button class="rm" onclick="removeBannedWord('${escHtml(w)}')">✕</button></span>`).join('')
    : '<span class="t-muted t-sm">Sin palabras configuradas</span>';
}

async function addBannedWord() {
  const word = $('new-word-input')?.value.trim().toLowerCase();
  if (!word) return;
  const cfg = await api('/api/security');
  const words = cfg?.bannedWords || [];
  if (!words.includes(word)) words.push(word);
  await api('/api/security', 'POST', {...cfg, bannedWords: words});
  setVal('new-word-input','');
  renderWordTags(words);
  toast(`✅ Palabra "${word}" añadida`, 'success');
}

async function removeBannedWord(word) {
  const cfg = await api('/api/security');
  const words = (cfg?.bannedWords||[]).filter(w=>w!==word);
  await api('/api/security','POST',{...cfg,bannedWords:words});
  renderWordTags(words);
  toast(`🗑️ Palabra eliminada`, 'info');
}

async function saveSecurityConfig() {
  const cfg = {
    antiSpam: {
      enabled:     $('spam-enabled')?.checked || false,
      maxMessages: parseInt($('spam-max')?.value) || 5,
      timeWindow:  parseInt($('spam-window')?.value) || 5000,
      action:      $('spam-action')?.value || 'mute',
    },
    antiRaid: {
      enabled:    $('raid-enabled')?.checked || false,
      maxJoins:   parseInt($('raid-max')?.value) || 10,
      timeWindow: parseInt($('raid-window')?.value) || 10000,
      action:     $('raid-action')?.value || 'kick',
    },
    bannedWords:     (await api('/api/security'))?.bannedWords || [],
    bannedWordAction:'delete',
    logChannelId:    $('log-channel-select')?.value || '',
  };
  const d = await api('/api/security','POST',cfg);
  if (d?.success) toast('✅ Configuración guardada', 'success');
}

// ─── LOGS ─────────────────────────────────────────────────────────────────
async function loadLogs() {
  const type = $('log-filter')?.value || '';
  const url  = `/api/logs?limit=100${type?'&type='+type:''}`;
  const logs = await api(url);
  const c = $('logs-feed');
  if (!c) return;
  c.innerHTML = logs?.length
    ? '<div class="log-feed">' + logs.map(renderLogItem).join('') + '</div>'
    : '<div class="empty-state"><div class="empty-ico">📋</div><p>Sin logs registrados</p></div>';
}

function renderLogItem(log) {
  const t = new Date(log.timestamp).toLocaleString('es',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  return `
    <div class="log-entry">
      <span class="log-ico">${log.icon||'📋'}</span>
      <div class="log-body">
        <div class="log-text">${escHtml(log.description)}</div>
        <div class="log-time">${t}</div>
      </div>
      <span class="log-chip">${log.type.replace(/_/g,' ')}</span>
    </div>`;
}

async function clearLogsAction() {
  if (!confirm('¿Limpiar todos los logs de auditoría?')) return;
  const d = await api('/api/logs','DELETE');
  d?.success ? (toast('🗑️ Logs limpiados','info'), loadLogs()) : toast('❌ Error','error');
}

// ─── MODAL ────────────────────────────────────────────────────────────────
function openModal(id)  { $(id)?.classList.add('open'); }
function closeModal(id) { $(id)?.classList.remove('open'); }
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

// ─── TOAST ────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const c = $('toast-container');
  if (!c) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toast-slide .3s var(--e-in) reverse';
    setTimeout(() => el.remove(), 300);
  }, 3400);
}

// ─── API ──────────────────────────────────────────────────────────────────
async function api(url, method = 'GET', body = null) {
  try {
    const opts = { method, headers: {'Content-Type':'application/json'} };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(url, opts);
    return await r.json();
  } catch(e) { console.error('[API]', e); return null; }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const qsa = sel => document.querySelectorAll(sel);
const show = id => $(id)?.classList.remove('hidden');
const hide = id => $(id)?.classList.add('hidden');
const setVal = (id, v) => { const el = $(id); if (el) el.value = v; };
const setChecked = (id, v) => { const el = $(id); if (el) el.checked = v; };
const toggleEl = (id, show) => { const el = $(id); if (el) el.style.display = show ? '' : 'none'; };
const escHtml = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/* ═══════════════════════════════════════════════════════════════════════
   SISTEMA DE EMOJIS DISCORD — PARSER Y RENDERER
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Parsea un emoji Discord en cualquier formato:
 *  - Unicode: 🔥
 *  - Código texto: <:nombre:ID> o <a:nombre:ID>
 * Devuelve { type, emoji, name, id, animated, imgUrl, display }
 */
function parseDiscordEmoji(input) {
  if (!input) return null;
  const str = input.trim();

  // Formato <a:nombre:ID> (animado)
  const animMatch = str.match(/^<a:(\w+):(\d+)>$/);
  if (animMatch) {
    return {
      type: 'custom', animated: true,
      name: animMatch[1], id: animMatch[2],
      imgUrl: `https://cdn.discordapp.com/emojis/${animMatch[2]}.gif?size=32&quality=lossless`,
      display: `<img src="https://cdn.discordapp.com/emojis/${animMatch[2]}.gif?size=32" style="width:20px;height:20px;vertical-align:middle;border-radius:3px" alt="${animMatch[1]}"/>`,
    };
  }

  // Formato <:nombre:ID> (estático)
  const staticMatch = str.match(/^<:(\w+):(\d+)>$/);
  if (staticMatch) {
    return {
      type: 'custom', animated: false,
      name: staticMatch[1], id: staticMatch[2],
      imgUrl: `https://cdn.discordapp.com/emojis/${staticMatch[2]}.webp?size=32`,
      display: `<img src="https://cdn.discordapp.com/emojis/${staticMatch[2]}.webp?size=32" style="width:20px;height:20px;vertical-align:middle;border-radius:3px" alt="${staticMatch[1]}"/>`,
    };
  }

  // Solo ID numérico (el usuario copió solo el ID)
  const idOnly = str.match(/^(\d{15,20})$/);
  if (idOnly) {
    return {
      type: 'custom', animated: false,
      name: 'emoji', id: idOnly[1],
      imgUrl: `https://cdn.discordapp.com/emojis/${idOnly[1]}.webp?size=32`,
      display: `<img src="https://cdn.discordapp.com/emojis/${idOnly[1]}.webp?size=32" style="width:20px;height:20px;vertical-align:middle;border-radius:3px" alt="emoji"/>`,
    };
  }

  // Unicode normal
  if ([...str].length <= 4) {
    return { type: 'unicode', emoji: str, display: str, name: str };
  }

  // Texto plano (no parseable como emoji)
  return { type: 'text', display: str, name: str };
}

/**
 * Renderiza el emoji del autor en tiempo real en el preview.
 * Se llama desde updatePreview() y desde el input del autor.
 */
function renderAuthorEmojiPreview(inputVal) {
  const parsed = parseDiscordEmoji(inputVal);
  if (!parsed) return;
  const el = $('prev-author-icon');
  if (!el) return;

  if (parsed.type === 'custom') {
    el.innerHTML = `<img src="${parsed.imgUrl}" style="width:18px;height:18px;vertical-align:middle;border-radius:3px" alt="${parsed.name}" onerror="this.style.display='none'"/>`;
  } else {
    el.textContent = parsed.display || '';
  }
}

/**
 * Muestra un indicador visual del emoji en el trigger del selector.
 */
function refreshEmojiTrigger(triggerId, inputVal) {
  const el = $(triggerId);
  if (!el) return;
  const parsed = parseDiscordEmoji(inputVal);
  if (!parsed) return;

  if (parsed.type === 'custom') {
    el.innerHTML = `<img src="${parsed.imgUrl}" style="width:22px;height:22px;object-fit:contain;border-radius:3px" alt="${parsed.name}" onerror="this.textContent='⚡'"/>`;
  } else {
    el.textContent = parsed.display || '😀';
  }
}

// Listener para el input de emoji del autor — actualiza trigger y preview
document.addEventListener('DOMContentLoaded', () => {
  const authorInput = $('editor-author-emoji');
  if (authorInput) {
    authorInput.addEventListener('input', () => {
      refreshEmojiTrigger('author-emoji-display', authorInput.value);
      updatePreview();
    });
  }

  const btnInput = $('editor-btn-emoji');
  if (btnInput) {
    btnInput.addEventListener('input', () => {
      refreshEmojiTrigger('btn-emoji-display', btnInput.value);
      updatePreview();
    });
  }
});

// Parchamos updatePreview para usar el parser de emojis
const _origUpdatePreview = _doUpdatePreview;
window._doUpdatePreview = function() {
  _origUpdatePreview();
  // Después del update normal, renderizamos el emoji del autor correctamente
  const authorEmoji = $('editor-author-emoji')?.value || '';
  if (authorEmoji) renderAuthorEmojiPreview(authorEmoji);
};

/* ═══════════════════════════════════════════════════════════════════════
   MEJORAS SIDEBAR: logo HyperStock en el brand
   ═══════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Reemplazar el emoji ⚡ del sidebar por la imagen del logo
  const sbLogo = document.querySelector('.sb-logo');
  if (sbLogo) {
    sbLogo.innerHTML = `<img src="https://i.postimg.cc/3wbMrg35/a05e063b-f36c-4834-852f-801391431695.jpg"
      style="width:38px;height:38px;border-radius:10px;object-fit:cover;display:block"
      alt="HyperStock" draggable="false"/>`;
    sbLogo.style.background = 'none';
    sbLogo.style.boxShadow  = 'none';
    sbLogo.style.padding    = '0';
  }
});
