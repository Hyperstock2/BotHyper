require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

const { loadCommands }   = require('./src/handlers/commandHandler');
const { setupSecurity }  = require('./src/handlers/securityHandler');
const { startWeb }       = require('./web/server');
const interactionCreate  = require('./src/events/interactionCreate');

// ── CLIENTE DE DISCORD ────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// ── CARGAR COMANDOS ───────────────────────────────────────────────
loadCommands(client);

// ── EVENTOS ───────────────────────────────────────────────────────
client.once('ready', () => {
  console.log(`✅ Bot online como: ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: 'HyperStock', type: ActivityType.Watching }],
    status: 'online',
  });

  // Inicia el servidor web una vez el bot está listo
  startWeb(client);
});

// Registrar evento interactionCreate
client.on(interactionCreate.name, (interaction) =>
  interactionCreate.execute(interaction, client)
);

// ── SEGURIDAD ANTI-CRASH ──────────────────────────────────────────
setupSecurity(client);

// ── LOGIN ─────────────────────────────────────────────────────────
client.login(process.env.TOKEN);
