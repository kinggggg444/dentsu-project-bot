require('dotenv').config();
const { startWebServer } = require('./src/web');
const { startTelegram } = require('./src/telegram');

console.log(`
╔═══════════════════════════════════════╗
║          Dentsu-project              ║
║ WhatsApp × Telegram by NatsuTech's 🇨🇬 ║
╚═══════════════════════════════════════╝
`);

// Démarrer le serveur web (site de couplage)
startWebServer();
startTelegram();

// Restaurer les sessions existantes après un redémarrage du service.
// Le serveur web reste disponible même si une session doit se reconnecter.
try {
  const { startBot } = require('./src/bot');
  startBot();
} catch (error) {
  console.error('[BOT] WhatsApp client failed to load; Telegram and web services remain available:', error.message);
}
