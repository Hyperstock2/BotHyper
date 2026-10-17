require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Evento: bot listo y online
client.once('ready', () => {
  console.log(`✅ Bot online como: ${client.user.tag}`);

  // Actividad del bot (lo que muestra bajo el nombre)
  client.user.setPresence({
    activities: [{ name: 'BotHyper', type: ActivityType.Watching }],
    status: 'online',
  });
});

// Login con el token
client.login(process.env.TOKEN);
