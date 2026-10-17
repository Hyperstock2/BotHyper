require('dotenv').config();
const express      = require('express');
const session      = require('express-session');
const path         = require('path');
const userManager  = require('../src/handlers/userManager');
const auditLogger  = require('../src/handlers/auditLogger');
const { getConfig, saveConfig } = require('../src/handlers/discordSecurity');
const { buildEmbed } = require('../src/embeds/embedBuilder');

const app  = express();
const PORT = process.env.PORT || 8080;

// ── MIDDLEWARE ────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'hyperstock_secret_2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 8 },
}));

// ── AUTH MIDDLEWARE ───────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session?.loggedIn) return next();
  res.redirect('/login');
}

function requireAdmin(req, res, next) {
  if (req.session?.role === 'admin') return next();
  res.status(403).json({ error: 'Acceso denegado: se requiere rol admin' });
}

function requirePerm(perm) {
  return (req, res, next) => {
    if (userManager.hasPermission(req.session?.role, perm)) return next();
    res.status(403).json({ error: `Sin permiso: ${perm}` });
  };
}

// ── LOGIN ─────────────────────────────────────────────────────────
app.get('/login', (req, res) => {
  if (req.session.loggedIn) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = userManager.findByUsername(username);
  if (user && user.password === password) {
    req.session.loggedIn = true;
    req.session.userId   = user.id;
    req.session.username = user.username;
    req.session.role     = user.role;
    auditLogger.log('web_login', `Login exitoso: ${username}`, { username, role: user.role });
    res.redirect('/');
  } else {
    auditLogger.log('web_login', `Login fallido: ${username}`, { username });
    res.redirect('/login?error=1');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// ── DASHBOARD ─────────────────────────────────────────────────────
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// ── API: SESSION INFO ─────────────────────────────────────────────
app.get('/api/me', requireAuth, (req, res) => {
  res.json({
    username: req.session.username,
    role: req.session.role,
    permissions: userManager.PERMISSIONS[req.session.role] || [],
  });
});

// ── API: GUILD STATS ──────────────────────────────────────────────
app.get('/api/guild', requireAuth, async (req, res) => {
  try {
    const client = app.get('discordClient');
    const guild  = await client.guilds.fetch(process.env.GUILD_ID, { withCounts: true });
    const uptimeMs = process.uptime() * 1000;
    const h = Math.floor(uptimeMs / 3600000);
    const m = Math.floor((uptimeMs % 3600000) / 60000);

    res.json({
      name:         guild.name,
      memberCount:  guild.memberCount,
      channelCount: guild.channels.cache.size,
      roleCount:    guild.roles.cache.size,
      boostCount:   guild.premiumSubscriptionCount || 0,
      boostTier:    guild.premiumTier,
      ownerId:      guild.ownerId,
      createdAt:    guild.createdAt,
      icon:         guild.iconURL({ size: 128 }),
      ping:         `${client.ws.ping}ms`,
      uptime:       `${h}h ${m}m`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: CHANNELS ─────────────────────────────────────────────────
app.get('/api/channels', requireAuth, async (req, res) => {
  try {
    const client = app.get('discordClient');
    const guild  = await client.guilds.fetch(process.env.GUILD_ID);
    await guild.channels.fetch();
    const channels = guild.channels.cache
      .filter(c => c.type === 0)
      .sort((a, b) => a.position - b.position)
      .map(c => ({ id: c.id, name: c.name }));
    res.json(channels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: SEND EMBED (predefinido) ─────────────────────────────────
app.post('/api/send-embed', requireAuth, requirePerm('send_embeds'), async (req, res) => {
  try {
    const { channelId, embedType } = req.body;
    const client  = app.get('discordClient');
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return res.status(404).json({ error: 'Canal no encontrado' });

    const { embed, components } = buildEmbed(embedType);
    await channel.send({ embeds: [embed], components: components || [] });

    auditLogger.log('embed_sent', `Embed "${embedType}" enviado en #${channel.name} por ${req.session.username}`, {
      embedType, channelId, channelName: channel.name, user: req.session.username,
    });

    res.json({ success: true, message: `Embed "${embedType}" enviado en #${channel.name}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: SEND CUSTOM EMBED (editor) ──────────────────────────────
app.post('/api/send-custom-embed', requireAuth, requirePerm('send_embeds'), async (req, res) => {
  try {
    const { channelId, embedData } = req.body;
    const client  = app.get('discordClient');
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return res.status(404).json({ error: 'Canal no encontrado' });

    // Validar longitud total
    const totalChars = [
      embedData.title, embedData.authorName, embedData.description, embedData.footer
    ].join('').length + (embedData.fields||[]).reduce((a,f)=>a+(f.name||'').length+(f.value||'').length,0);
    if (totalChars > 6000) return res.status(400).json({ error: `El embed supera 6000 caracteres (${totalChars})` });

    const colorHex = (embedData.color||'#5865F2').replace('#','');
    const colorInt = parseInt(colorHex, 16) || 0x5865F2;

    const embed = new EmbedBuilder().setColor(colorInt);

    if (embedData.authorName) {
      embed.setAuthor({
        name:    `${embedData.authorEmoji||''} ${embedData.authorName}`.trim(),
        iconURL: embedData.authorIcon  || undefined,
        url:     embedData.authorUrl   || undefined,
      });
    }
    if (embedData.title) embed.setTitle(embedData.title);
    if (embedData.titleUrl && embedData.title) embed.setURL(embedData.titleUrl);
    if (embedData.description) embed.setDescription(embedData.description);
    if (embedData.image)     embed.setImage(embedData.image);
    if (embedData.thumbnail) embed.setThumbnail(embedData.thumbnail);
    if (embedData.footer) {
      embed.setFooter({
        text:    embedData.footer,
        iconURL: embedData.footerIcon || undefined,
      });
    }

    // Campos
    const fields = (embedData.fields || []).filter(f => f.name && f.value).slice(0, 25);
    if (fields.length) {
      embed.addFields(fields.map(f => ({
        name:   f.name.slice(0, 256),
        value:  f.value.slice(0, 1024),
        inline: f.inline === true,
      })));
    }

    // Componente botón
    const components = [];
    if (embedData.btnType === 'button' && embedData.tag) {
      const STYLES = {
        Primary: ButtonStyle.Primary, Secondary: ButtonStyle.Secondary,
        Success: ButtonStyle.Success, Danger: ButtonStyle.Danger,
      };
      const btnBuilder = new ButtonBuilder()
        .setCustomId('ticket_soporte')
        .setLabel(embedData.tag.slice(0, 80))
        .setStyle(STYLES[embedData.tagStyle] || ButtonStyle.Secondary);
      // Solo añadir emoji si es unicode válido (no código custom por seguridad)
      if (embedData.tagEmoji && !embedData.tagEmoji.includes(':')) {
        try { btnBuilder.setEmoji(embedData.tagEmoji); } catch(e) {}
      } else if (embedData.tagEmoji && embedData.tagEmoji.match(/^<a?:\w+:\d+>$/)) {
        try { btnBuilder.setEmoji(embedData.tagEmoji); } catch(e) {}
      }
      components.push(new ActionRowBuilder().addComponents(btnBuilder));
    }

    await channel.send({ embeds: [embed], components });

    auditLogger.log('embed_sent', `Embed personalizado enviado en #${channel.name} por ${req.session.username}`, {
      channelId, user: req.session.username, fields: fields.length,
    });

    res.json({ success: true, message: `Embed enviado en #${channel.name}` });
  } catch (err) {
    console.error('[send-custom-embed]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── API: USERS CRUD ───────────────────────────────────────────────
app.get('/api/users', requireAuth, requireAdmin, (req, res) => {
  const users = userManager.getAll().map(u => ({ ...u, password: undefined }));
  res.json(users);
});

app.post('/api/users', requireAuth, requireAdmin, (req, res) => {
  try {
    const user = userManager.create(req.body);
    auditLogger.log('web_login', `Usuario creado: ${user.username} (${user.role}) por ${req.session.username}`, {});
    res.json({ success: true, user: { ...user, password: undefined } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/users/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const user = userManager.update(parseInt(req.params.id), req.body);
    res.json({ success: true, user: { ...user, password: undefined } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/users/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    if (targetId === req.session.userId) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    userManager.remove(targetId);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── API: LOGS ─────────────────────────────────────────────────────
app.get('/api/logs', requireAuth, requirePerm('view_logs'), (req, res) => {
  const { limit = 100, type } = req.query;
  res.json(auditLogger.getLogs(parseInt(limit), type || null));
});

app.delete('/api/logs', requireAuth, requireAdmin, (req, res) => {
  auditLogger.clearLogs();
  res.json({ success: true });
});

// ── API: SECURITY CONFIG ──────────────────────────────────────────
app.get('/api/security', requireAuth, requireAdmin, (req, res) => {
  res.json(getConfig());
});

app.post('/api/security', requireAuth, requireAdmin, (req, res) => {
  try {
    saveConfig(req.body);
    auditLogger.log('security', `Config de seguridad actualizada por ${req.session.username}`, {});
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: VOICE CHANNELS ───────────────────────────────────────────
app.get('/api/voice-channels', requireAuth, async (req, res) => {
  try {
    const client = app.get('discordClient');
    const guild  = await client.guilds.fetch(process.env.GUILD_ID);
    await guild.channels.fetch();

    // Detectar dónde está el bot usando @discordjs/voice (más fiable)
    let currentChannelId = null;
    try {
      const { getVoiceConnection } = require('@discordjs/voice');
      const conn = getVoiceConnection(guild.id);
      if (conn?.joinConfig?.channelId) {
        currentChannelId = conn.joinConfig.channelId;
      }
    } catch (_) {}

    // Fallback: voice state del miembro bot
    if (!currentChannelId) {
      try {
        const me = await guild.members.fetchMe({ force: false });
        if (me?.voice?.channelId) currentChannelId = me.voice.channelId;
      } catch (_) {}
    }

    // Todos los canales de voz — SIEMPRE incluidos aunque el bot esté en uno
    const channels = guild.channels.cache
      .filter(c => c.type === 2)
      .sort((a, b) => a.position - b.position)
      .map(c => ({
        id:        c.id,
        name:      c.name,
        members:   c.members ? c.members.size : 0,
        isCurrent: c.id === currentChannelId,
      }));

    const currentChannel = currentChannelId
      ? (() => {
          const ch = guild.channels.cache.get(currentChannelId);
          return ch ? { id: ch.id, name: ch.name } : null;
        })()
      : null;

    res.json({ channels, currentChannel });
  } catch (err) {
    console.error('[voice-channels]', err.message);
    res.status(500).json({ error: err.message, channels: [], currentChannel: null });
  }
});

// ── API: MOVE BOT TO VOICE ────────────────────────────────────────
app.post('/api/voice/join', requireAuth, async (req, res) => {
  if (!userManager.hasPermission(req.session.role, 'voice_control')) {
    return res.status(403).json({ error: 'Solo el Developer puede controlar el bot en voz' });
  }
  try {
    const { channelId } = req.body;
    const { joinVoiceChannel } = require('@discordjs/voice');
    const client = app.get('discordClient');
    const guild  = await client.guilds.fetch(process.env.GUILD_ID);
    const channel = guild.channels.cache.get(channelId);
    if (!channel || channel.type !== 2) return res.status(404).json({ error: 'Canal de voz no encontrado' });
    joinVoiceChannel({
      channelId: channel.id,
      guildId:   guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: true,
    });
    auditLogger.log('security', `Bot movido al canal de voz: #${channel.name} por ${req.session.username}`, { channelId });
    res.json({ success: true, message: `Bot conectado a #${channel.name}` });
  } catch (err) {
    if (err.message?.includes('Cannot find module')) {
      return res.status(501).json({ error: 'Instala @discordjs/voice: npm install @discordjs/voice' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/voice/leave', requireAuth, async (req, res) => {
  if (!userManager.hasPermission(req.session.role, 'voice_control')) {
    return res.status(403).json({ error: 'Solo el Developer puede controlar el bot en voz' });
  }
  try {
    const { getVoiceConnection } = require('@discordjs/voice');
    const connection = getVoiceConnection(process.env.GUILD_ID);
    if (connection) { connection.destroy(); }
    auditLogger.log('security', `Bot desconectado de voz por ${req.session.username}`, {});
    res.json({ success: true, message: 'Bot desconectado del canal de voz' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: SERVER BACKUP ────────────────────────────────────────────
app.get('/api/backup/create', requireAuth, async (req, res) => {
  if (!userManager.hasPermission(req.session.role, 'server_backup')) {
    return res.status(403).json({ error: 'Sin permiso para crear backups' });
  }
  try {
    const client = app.get('discordClient');
    const guild  = await client.guilds.fetch(process.env.GUILD_ID, { withCounts: true });
    await guild.channels.fetch();
    await guild.roles.fetch();

    const backup = {
      id:        Date.now(),
      createdAt: new Date().toISOString(),
      createdBy: req.session.username,
      guild: {
        name:             guild.name,
        description:      guild.description,
        premiumTier:      guild.premiumTier,
        verificationLevel:guild.verificationLevel,
      },
      roles: guild.roles.cache
        .filter(r => !r.managed && r.id !== guild.id)
        .sort((a, b) => b.position - a.position)
        .map(r => ({
          name:        r.name,
          color:       r.hexColor,
          hoist:       r.hoist,
          mentionable: r.mentionable,
          permissions: r.permissions.bitfield.toString(),
          position:    r.position,
        })),
      channels: guild.channels.cache
        .sort((a, b) => a.position - b.position)
        .map(c => ({
          name:     c.name,
          type:     c.type,
          position: c.position,
          topic:    c.topic || null,
          nsfw:     c.nsfw || false,
          parentId: c.parentId || null,
        })),
      security: require('../src/handlers/discordSecurity').getConfig(),
      users:    require('../src/handlers/userManager').getAll().map(u => ({ ...u, password: undefined })),
    };

    // Guardar en archivo
    const fs = require('fs');
    const backupsDir = require('path').join(__dirname, '..', 'src', 'data', 'backups');
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
    const filename = `backup_${Date.now()}.json`;
    fs.writeFileSync(require('path').join(backupsDir, filename), JSON.stringify(backup, null, 2));

    auditLogger.log('security', `Backup del servidor creado por ${req.session.username}`, { filename });
    res.json({ success: true, backup: { ...backup, channels: backup.channels.length, roles: backup.roles.length }, filename });
  } catch (err) {
    console.error('[backup]', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/backup/list', requireAuth, async (req, res) => {
  if (!userManager.hasPermission(req.session.role, 'server_backup')) {
    return res.status(403).json({ error: 'Sin permiso' });
  }
  try {
    const fs = require('fs');
    const backupsDir = require('path').join(__dirname, '..', 'src', 'data', 'backups');
    if (!fs.existsSync(backupsDir)) return res.json([]);
    const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.json'));
    const list = files.map(f => {
      try {
        const data = JSON.parse(fs.readFileSync(require('path').join(backupsDir, f), 'utf-8'));
        return {
          filename:  f,
          id:        data.id,
          createdAt: data.createdAt,
          createdBy: data.createdBy,
          guildName: data.guild?.name,
          roleCount: data.roles?.length || 0,
          channelCount: data.channels?.length || 0,
        };
      } catch { return null; }
    }).filter(Boolean).sort((a,b) => b.id - a.id);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/backup/:filename', requireAuth, async (req, res) => {
  if (!userManager.hasPermission(req.session.role, 'server_backup')) {
    return res.status(403).json({ error: 'Sin permiso' });
  }
  try {
    const fs   = require('fs');
    const p    = require('path');
    const file = p.join(__dirname, '..', 'src', 'data', 'backups', req.params.filename);
    if (!file.endsWith('.json') || !fs.existsSync(file)) return res.status(404).json({ error: 'Backup no encontrado' });
    fs.unlinkSync(file);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: GUILD EMOJIS ─────────────────────────────────────────────
app.get('/api/guild-emojis', requireAuth, async (req, res) => {
  try {
    const client = app.get('discordClient');
    const guild  = await client.guilds.fetch(process.env.GUILD_ID);
    await guild.emojis.fetch();
    const emojis = guild.emojis.cache.map(e => ({
      id:       e.id,
      name:     e.name,
      animated: e.animated,
      url:      e.imageURL({ size: 64 }),
    }));
    res.json({ emojis });
  } catch (err) {
    res.status(500).json({ emojis: [], error: err.message });
  }
});

// ── START ─────────────────────────────────────────────────────────
function startWeb(discordClient) {
  app.set('discordClient', discordClient);
  app.listen(PORT, () => console.log(`🌐 Panel web en puerto ${PORT}`));
}

module.exports = { startWeb };
