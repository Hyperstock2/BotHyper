const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { buildEmbed } = require('../embeds/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Envía un embed de HyperStock al canal indicado')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(opt =>
      opt.setName('tipo')
        .setDescription('Tipo de embed a enviar')
        .setRequired(true)
        .addChoices(
          { name: '🎫 Sistema de Tickets',   value: 'tickets' },
          { name: '💳 Métodos de Pago',      value: 'metodos' },
          { name: '💎 Venta de Diamantes',   value: 'diamantes' },
          { name: '🎨 Decoraciones Discord', value: 'decoraciones' },
          { name: '⚡ Discord Boosts',       value: 'boosts' },
        )
    )
    .addChannelOption(opt =>
      opt.setName('canal')
        .setDescription('Canal donde enviar el embed (por defecto: canal actual)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const tipo = interaction.options.getString('tipo');
    const targetChannel = interaction.options.getChannel('canal') || interaction.channel;

    try {
      const { embed, components } = buildEmbed(tipo);
      await targetChannel.send({ embeds: [embed], components: components || [] });
      await interaction.editReply({ content: `✅ Embed **${tipo}** enviado en ${targetChannel}` });
    } catch (err) {
      console.error('[cmd/embed]', err);
      await interaction.editReply({ content: `❌ Error: ${err.message}` });
    }
  },
};
