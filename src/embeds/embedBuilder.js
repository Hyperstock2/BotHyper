const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

/**
 * Construye el embed y componentes según el tipo solicitado.
 * @param {string} type - tickets | metodos | diamantes | decoraciones | boosts
 * @returns {{ embed: EmbedBuilder, components: ActionRowBuilder[] }}
 */
function buildEmbed(type) {
  switch (type) {
    case 'tickets':   return buildTickets();
    case 'metodos':   return buildMetodos();
    case 'diamantes': return buildDiamantes();
    case 'decoraciones': return buildDecoraciones();
    case 'boosts':    return buildBoosts();
    default: throw new Error(`Tipo de embed desconocido: ${type}`);
  }
}

// ── TICKETS ──────────────────────────────────────────────────────
function buildTickets() {
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Hyper Stock', iconURL: 'https://i.imgur.com/4M34hi2.png' })
    .setTitle('Bienvenido al sistema de tickets de Hyper Stock')
    .setDescription(
      'Abre un ticket para comprar productos, recibir soporte o resolver dudas.\n\n' +
      '**Antes de abrir un ticket:**\n' +
      '• Selecciona la categoría adecuada.\n' +
      '• Explica tu solicitud con claridad.\n' +
      '• Espera a que un miembro del staff te atienda.\n\n' +
      '**Importante:** Hyper Stock no se hace responsable de problemas o acuerdos realizados fuera de nuestro equipo oficial.'
    )
    .setColor(0x5865F2)
    .setThumbnail('https://i.imgur.com/4M34hi2.png');

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ticket_select')
    .setPlaceholder('Selecciona una opción')
    .addOptions([
      { label: 'Comprar Diamantes',      description: 'Recarga de diamantes Free Fire', value: 'ticket_diamantes',    emoji: '💎' },
      { label: 'Comprar Boosts',         description: 'Boosts de Discord económicos',   value: 'ticket_boosts',       emoji: '⚡' },
      { label: 'Decoraciones Discord',   description: 'Método decoraciones al 60%',     value: 'ticket_decoraciones', emoji: '🎨' },
      { label: 'Métodos de Pago',        description: 'Consulta métodos disponibles',   value: 'ticket_metodos',      emoji: '💳' },
      { label: 'Soporte General',        description: 'Dudas o problemas generales',    value: 'ticket_soporte',      emoji: '🛠️' },
    ]);

  const row = new ActionRowBuilder().addComponents(selectMenu);
  return { embed, components: [row] };
}

// ── MÉTODOS DE PAGO ───────────────────────────────────────────────
function buildMetodos() {
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'HyperStock Metodos', iconURL: 'https://i.imgur.com/4M34hi2.png' })
    .setTitle('MÉTODOS DE PAGO')
    .setDescription(
      'Binance 🪙 • PayPal 💙\n' +
      'Yape 🇵🇪\n' +
      'Mercado Pago 🛒\n' +
      '🇲🇽 🇦🇷 🇨🇱 🇨🇴\n' +
      'Nequi 🇨🇴\n' +
      'Litecoin 💚'
    )
    .setImage('https://i.imgur.com/4M34hi2.png') // reemplaza con tu imagen real
    .setColor(0x5865F2)
    .setFooter({ text: '» Metodos' });

  return { embed, components: [] };
}

// ── DIAMANTES ─────────────────────────────────────────────────────
function buildDiamantes() {
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Hyper Stock', iconURL: 'https://i.imgur.com/4M34hi2.png' })
    .setTitle('Venta De Diamantes')
    .setDescription(
      '🎁 **Diamantes Sin Previa Verificacion De ID**\n\n' +
      '🎁 No necesitamos tu cuenta, solamente tu ID\n' +
      '🎁 Recargas disponibles a precios económicos\n' +
      '🎁 Entrega rápida y segura\n\n' +
      '💎 **Precios**\n' +
      '💎 100 + 10 Diamantes = S/.4.5\n' +
      '💎 310 + 31 Diamantes = S/.13\n' +
      '💎 520 + 52 Diamantes = S/.18.5\n' +
      '💎 1060 + 106 Diamantes = S/.32\n' +
      '💎 2180 + 218 Diamantes = S/.53\n' +
      '💎 5600 + 560 Diamantes = S/.125'
    )
    .setImage('https://i.imgur.com/4M34hi2.png') // reemplaza con tu imagen real
    .setColor(0x5865F2)
    .setFooter({ text: '» Adquirir' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_diamantes')
      .setLabel('Adquirir')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('💎')
  );

  return { embed, components: [row] };
}

// ── DECORACIONES ──────────────────────────────────────────────────
function buildDecoraciones() {
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Hyper Stock', iconURL: 'https://i.imgur.com/4M34hi2.png' })
    .setTitle('Método de Decoraciones al 60% de Descuento 🎁')
    .setDescription(
      '¿Te preguntas cómo funciona?\n\n' +
      '» El método consiste en adquirir decoraciones de Discord mediante regalos, pagando un 60% menos de su precio habitual.\n\n' +
      '**¿Qué incluye?**\n' +
      '» El método completo para que puedas realizar el proceso por tu cuenta.\n\n' +
      '» **Precio del método completo: $20 USD**\n\n' +
      '¿Qué esperas para conseguir tus decoraciones a un precio más económico?\n\n' +
      '✅ **Adquiere el método completo y descubre cómo funciona.**'
    )
    .setImage('https://i.imgur.com/4M34hi2.png') // reemplaza con tu imagen real
    .setColor(0x9B59B6)
    .setFooter({ text: '» Decoraciones' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_decoraciones')
      .setLabel('Decoraciones')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🎨')
  );

  return { embed, components: [row] };
}

// ── BOOSTS ────────────────────────────────────────────────────────
function buildBoosts() {
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Hyper Stock', iconURL: 'https://i.imgur.com/4M34hi2.png' })
    .setDescription(
      '¿Cansado de pagar precios exagerados por los boosts de Discord? 🔨\n\n' +
      '¡Tengo la solución! 🎁\n\n' +
      'Vendo mi **método para conseguir boosts de Discord a precios económicos.**\n\n' +
      '» **Precio del método: $20 💚**\n' +
      '» **Precios Vendemos:**\n\n' +
      '⚡ **Discord Boosts**\n' +
      '· 14 Boosts — 1 mes\n' +
      '· Precio: **$1.75**\n\n' +
      '» **¿Quieres comprar boosts directamente?**\n\n' +
      'Abre un ticket indicando la cantidad de boosts que necesitas y la duración. Nuestro staff te informará del precio.\n\n' +
      '🔥 **¡Aprovecha estos precios!**'
    )
    .setColor(0x5865F2)
    .setFooter({ text: '» Boost' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_boosts')
      .setLabel('Boost')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('⚡')
  );

  return { embed, components: [row] };
}

module.exports = { buildEmbed };
