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
