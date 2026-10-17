const { handleTicketSelect, handleCloseTicket, handleTicketButton } = require('../handlers/ticketHandler');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      // ── SLASH COMMANDS ─────────────────────────────────────────
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction, client);
        return;
      }

      // ── SELECT MENU (tickets) ──────────────────────────────────
      if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'ticket_select') {
          await handleTicketSelect(interaction);
        }
        return;
      }

      // ── BUTTONS ────────────────────────────────────────────────
      if (interaction.isButton()) {
        // Cerrar ticket
        if (interaction.customId.startsWith('close_ticket_')) {
          await handleCloseTicket(interaction);
          return;
        }
        // Botones de productos que abren tickets
        const ticketButtons = ['ticket_diamantes', 'ticket_boosts', 'ticket_decoraciones', 'ticket_metodos', 'ticket_soporte'];
        if (ticketButtons.includes(interaction.customId)) {
          await handleTicketButton(interaction);
          return;
        }
      }
    } catch (err) {
      console.error('[interactionCreate] Error:', err);
      const reply = { content: '❌ Ocurrió un error al procesar la acción.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    }
  },
};
