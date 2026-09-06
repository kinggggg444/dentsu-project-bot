require('dotenv').config();
const { startBot } = require('./src/bot');
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
startBot();
