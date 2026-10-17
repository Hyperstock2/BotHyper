const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Credenciales de login (configura en variables de entorno de Railway)
const WEB_USER = process.env.WEB_USER || 'admin';
const WEB_PASS = process.env.WEB_PASS || '12';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'hyperstock_secret_key_2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 8 } // 8 horas
}));

// Middleware de autenticación
function requireAuth(req, res, next) {
  if (req.session && req.session.loggedIn) return next();
  res.redirect('/login');
}

// ─── RUTAS ────────────────────────────────────────────────────────────────────

// Login GET
app.get('/login', (req, res) => {
  if (req.session.loggedIn) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Login POST
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === WEB_USER && password === WEB_PASS) {
    req.session.loggedIn = true;
    req.session.user = username;
    res.redirect('/');
  } else {
    res.redirect('/login?error=1');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Panel principal (protegido)
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// API: enviar embed a un canal via bot
app.post('/api/send-embed', requireAuth, async (req, res) => {
  try {
    const { channelId, embedType } = req.body;
    // El cliente de discord se inyecta desde index.js
    const client = app.get('discordClient');
    if (!client) return res.status(500).json({ error: 'Bot no conectado' });

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel) return res.status(404).json({ error: 'Canal no encontrado' });

    const { buildEmbed } = require('../src/embeds/embedBuilder');
    const { embed, components } = buildEmbed(embedType);

    await channel.send({ embeds: [embed], components: components || [] });
    res.json({ success: true, message: `Embed "${embedType}" enviado correctamente` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// API: obtener canales del servidor
app.get('/api/channels', requireAuth, async (req, res) => {
  try {
    const client = app.get('discordClient');
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    const channels = guild.channels.cache
      .filter(c => c.type === 0) // solo text channels
      .map(c => ({ id: c.id, name: c.name }));
    res.json(channels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function startWeb(discordClient) {
  app.set('discordClient', discordClient);
  app.listen(PORT, () => {
    console.log(`🌐 Web panel corriendo en puerto ${PORT}`);
  });
}

module.exports = { startWeb };
