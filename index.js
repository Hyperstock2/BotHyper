require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

const { loadCommands }       = require('./src/handlers/commandHandler');
const { setupSecurity }      = require('./src/handlers/securityHandler');
const { handleAntiSpam, handleAntiRaid, handleWordFilter } = require('./src/handlers/discordSecurity');
const { startWeb }           = require('./web/server');
const interactionCreate      = require('./src/events/interactionCreate');
const auditLogger            = require('./src/handlers/auditLogger');

// ── CLIENTE ───────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// ── COMANDOS ──────────────────────────────────────────────────────
loadCommands(client);

// ── READY ─────────────────────────────────────────────────────────
client.once('ready', () => {
  console.log(`✅ Bot online como: ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: 'HyperStock | Panel activo', type: ActivityType.Watching }],
    status: 'online',
  });
  startWeb(client);
});

// ── INTERACTIONS ──────────────────────────────────────────────────
client.on('interactionCreate', (interaction) =>
  interactionCreate.execute(interaction, client)
);

// ── MENSAJES — Seguridad ──────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  await handleAntiSpam(message);
  await handleWordFilter(message);
});

// ── GUILD MEMBER ADD — Anti-Raid + Log ───────────────────────────
client.on('guildMemberAdd', async (member) => {
  auditLogger.log('member_join', `${member.user.tag} se unió al servidor`, {
    userId: member.user.id, username: member.user.tag,
  });
  await handleAntiRaid(member);
});

// ── GUILD MEMBER REMOVE — Log ─────────────────────────────────────
client.on('guildMemberRemove', (member) => {
  auditLogger.log('member_leave', `${member.user.tag} salió del servidor`, {
    userId: member.user.id, username: member.user.tag,
  });
});

// ── BAN — Log ────────────────────────────────────────────────────
client.on('guildBanAdd', (ban) => {
  auditLogger.log('member_ban', `${ban.user.tag} fue baneado`, {
    userId: ban.user.id, username: ban.user.tag,
  });
});

client.on('guildBanRemove', (ban) => {
  auditLogger.log('member_unban', `${ban.user.tag} fue desbaneado`, {
    userId: ban.user.id, username: ban.user.tag,
  });
});

// ── MESSAGE DELETE — Log ──────────────────────────────────────────
client.on('messageDelete', (message) => {
  if (message.author?.bot) return;
  auditLogger.log('message_delete', `Mensaje eliminado de ${message.author?.tag || 'desconocido'} en #${message.channel.name}`, {
    content: message.content?.slice(0, 100),
    channelName: message.channel.name,
  });
});

// ── MESSAGE UPDATE — Log ──────────────────────────────────────────
client.on('messageUpdate', (oldMsg, newMsg) => {
  if (oldMsg.author?.bot) return;
  if (oldMsg.content === newMsg.content) return;
  auditLogger.log('message_edit', `Mensaje editado por ${oldMsg.author?.tag || '?'} en #${oldMsg.channel.name}`, {
    before: oldMsg.content?.slice(0, 80),
    after: newMsg.content?.slice(0, 80),
  });
});

// ── SEGURIDAD ANTI-CRASH ──────────────────────────────────────────
setupSecurity(client);

// ── LOGIN ─────────────────────────────────────────────────────────
client.login(process.env.TOKEN);
