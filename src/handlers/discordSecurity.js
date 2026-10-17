const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { log } = require('./auditLogger');

const CONFIG_PATH = path.join(__dirname, '..', 'data', 'securityConfig.json');

function getConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')); }
  catch { return {}; }
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

// Mapa anti-spam: userId -> [timestamps]
const spamMap = new Map();
// Mapa anti-raid: [timestamps de joins]
const raidJoins = [];

// ── ANTI-SPAM ─────────────────────────────────────────────────────
async function handleAntiSpam(message) {
  const cfg = getConfig();
  if (!cfg.antiSpam?.enabled) return;
  if (message.author.bot) return;
  if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return;

  const now = Date.now();
  const userId = message.author.id;

  if (!spamMap.has(userId)) spamMap.set(userId, []);
  const timestamps = spamMap.get(userId).filter(t => now - t < cfg.antiSpam.timeWindow);
  timestamps.push(now);
  spamMap.set(userId, timestamps);

  if (timestamps.length >= cfg.antiSpam.maxMessages) {
    spamMap.delete(userId);
    log('spam_detected', `Spam detectado: ${message.author.tag} (${timestamps.length} msgs)`, {
      userId, username: message.author.tag, channel: message.channel.name,
    });

    try {
      // Eliminar mensajes recientes del usuario
      const msgs = await message.channel.messages.fetch({ limit: 20 });
      const userMsgs = msgs.filter(m => m.author.id === userId);
      await message.channel.bulkDelete(userMsgs, true).catch(() => {});

      if (cfg.antiSpam.action === 'mute' && message.member) {
        const muteDuration = 5 * 60 * 1000; // 5 minutos
        await message.member.timeout(muteDuration, 'Auto-mute: spam detectado').catch(() => {});
        await message.channel.send({
          embeds: [new EmbedBuilder()
            .setDescription(`🚫 ${message.author} ha sido silenciado por spam durante 5 minutos.`)
            .setColor(0xED4245)]
        }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
      } else if (cfg.antiSpam.action === 'kick' && message.member) {
        await message.member.kick('Auto-kick: spam detectado').catch(() => {});
      } else if (cfg.antiSpam.action === 'ban' && message.member) {
        await message.member.ban({ reason: 'Auto-ban: spam detectado' }).catch(() => {});
      }
    } catch (err) {
      console.error('[Security/AntiSpam]', err.message);
    }
  }
}

// ── ANTI-RAID ─────────────────────────────────────────────────────
async function handleAntiRaid(member) {
  const cfg = getConfig();
  if (!cfg.antiRaid?.enabled) return;

  const now = Date.now();
  raidJoins.push(now);
  const recent = raidJoins.filter(t => now - t < cfg.antiRaid.timeWindow);
  raidJoins.length = 0;
  raidJoins.push(...recent);

  if (recent.length >= cfg.antiRaid.maxJoins) {
    log('raid_detected', `Posible raid: ${recent.length} joins en ${cfg.antiRaid.timeWindow / 1000}s`, {
      guildId: member.guild.id,
    });

    if (cfg.antiRaid.action === 'kick') {
      await member.kick('Anti-raid: demasiados joins simultáneos').catch(() => {});
    } else if (cfg.antiRaid.action === 'ban') {
      await member.ban({ reason: 'Anti-raid: demasiados joins simultáneos' }).catch(() => {});
    }
  }
}

// ── FILTRO DE PALABRAS ────────────────────────────────────────────
async function handleWordFilter(message) {
  const cfg = getConfig();
  if (!cfg.bannedWords?.length) return;
  if (message.author.bot) return;
  if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return;

  const content = message.content.toLowerCase();
  const found = cfg.bannedWords.find(w => content.includes(w.toLowerCase()));

  if (found) {
    log('word_filter', `Palabra filtrada: "${found}" — ${message.author.tag}`, {
      userId: message.author.id, username: message.author.tag,
    });
    await message.delete().catch(() => {});
    const warn = await message.channel.send({
      embeds: [new EmbedBuilder()
        .setDescription(`⚠️ ${message.author}, tu mensaje fue eliminado por contener lenguaje no permitido.`)
        .setColor(0xFEE75C)]
    });
    setTimeout(() => warn.delete().catch(() => {}), 4000);
  }
}

module.exports = { handleAntiSpam, handleAntiRaid, handleWordFilter, getConfig, saveConfig };
