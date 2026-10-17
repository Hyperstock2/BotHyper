# BotHyper

Bot de Discord desarrollado con discord.js v14, desplegado en Railway.

## Variables de entorno

Configura estas variables en Railway (o en un archivo `.env` local):

| Variable | Descripción |
|----------|-------------|
| `TOKEN` | Token del bot (Discord Developer Portal) |
| `CLIENT_ID` | ID de la aplicación del bot |
| `GUILD_ID` | ID del servidor de Discord |

## Despliegue en Railway

1. Conecta el repo de GitHub en Railway
2. En **Variables**, agrega `TOKEN`, `CLIENT_ID` y `GUILD_ID`
3. Railway detecta el `Procfile` y arranca con `node index.js`
4. El bot aparece online en tu servidor

## Desarrollo local

```bash
npm install
# Crea un archivo .env con las variables (ver .env.example)
npm start
```
