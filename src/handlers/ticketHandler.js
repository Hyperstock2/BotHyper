const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

// Mapa de categorías con su nombre y emoji
const TICKET_CATEGORIES = {
  ticket_diamantes:    { name: 'diamantes',    label: '💎 Diamantes',            topic: 'Compra de diamantes Free Fire' },
  ticket_boosts:       { name: 'boosts',        label: '⚡ Boosts',               topic: 'Compra de Discord Boosts' },
  ticket_decoraciones: { name: 'decoraciones',  label: '🎨 Decoraciones',         topic: 'Método de Decoraciones Discord' },
  ticket_metodos:      { name: 'metodos',        label: '💳 Métodos',              topic: 'Consulta de métodos de pago' },
  ticket_soporte:      { name: 'soporte',        label: '🛠️ Soporte',             topic: 'Soporte general' },
};

// Maneja el select menu de tickets
async function handleTicketSelect(interaction) {
  const value = interaction.values[0];
  const category = TICKET_CATEGORIES[value];
  if (!category) return;

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  const member = interaction.member;

  // Verificar si ya tiene un ticket abierto
  const existing = guild.channels.cache.find(
    c => c.name === `ticket-${category.name}-${member.user.id}` && c.type === ChannelType.GuildText
  );

  if (existing) {
    return interaction.editReply({
      content: `⚠️ Ya tienes un ticket abierto: ${existing}`,
    });
  }

  // Crear el canal de ticket
  try {
    const ticketChannel = await guild.channels.create({
      name: `ticket-${category.name}-${member.user.id}`,
      type: ChannelType.GuildText,
      topic: category.topic,
      permissionOverwrites: [
        {
          id: guild.id, // @everyone
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: interaction.client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels,
          ],
        },
      ],
    });

    // Embed de bienvenida dentro del ticket
    const welcomeEmbed = new EmbedBuilder()
      .setAuthor({ name: 'Hyper Stock', iconURL: interaction.client.user.displayAvatarURL() })
      .setTitle(`${category.label} — Ticket #${member.user.username}`)
      .setDescription(
        `Hola ${member}, bienvenido a tu ticket de **${category.label}**.\n\n` +
        `Un miembro del staff te atenderá en breve. Mientras tanto, describe tu solicitud con detalle.\n\n` +
        `> **Categoría:** ${category.topic}`
      )
      .setColor(0x5865F2)
      .setTimestamp()
      .setFooter({ text: 'Hyper Stock • Sistema de Tickets' });

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`close_ticket_${ticketChannel.id}`)
        .setLabel('Cerrar Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒')
    );

    await ticketChannel.send({ embeds: [welcomeEmbed], components: [closeRow] });

    await interaction.editReply({
      content: `✅ Ticket creado: ${ticketChannel}`,
    });
  } catch (err) {
    console.error('[TicketHandler] Error creando ticket:', err);
    await interaction.editReply({ content: '❌ Error al crear el ticket. Contacta a un administrador.' });
  }
}

// Maneja el botón de cerrar ticket
async function handleCloseTicket(interaction) {
  if (!interaction.customId.startsWith('close_ticket_')) return;

  await interaction.deferReply({ ephemeral: true });

  const channel = interaction.channel;

  const confirmEmbed = new EmbedBuilder()
    .setTitle('🔒 Cerrando ticket...')
    .setDescription('Este ticket será eliminado en **5 segundos**.')
    .setColor(0xED4245);

  await channel.send({ embeds: [confirmEmbed] });
  await interaction.editReply({ content: '✅ Ticket cerrado.' });

  setTimeout(async () => {
    await channel.delete('Ticket cerrado por staff').catch(() => {});
  }, 5000);
}

// Maneja clicks de botones que abren tickets directamente (desde embeds de productos)
async function handleTicketButton(interaction) {
  const value = interaction.customId; // ej: ticket_diamantes
  const category = TICKET_CATEGORIES[value];
  if (!category) return;

  // Reutiliza la misma lógica del select
  interaction.values = [value];
  await handleTicketSelect(interaction);
}

module.exports = { handleTicketSelect, handleCloseTicket, handleTicketButton };
