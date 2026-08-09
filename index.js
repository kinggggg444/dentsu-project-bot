require('dotenv').config();
const { startBot } = require('./src/bot');
const { startWebServer } = require('./src/web');

console.log(`
╔═══════════════════════════════════════╗
║          DENTSU MD V10                ║
║   Multi-Session WhatsApp Bot v10.0    ║
╚═══════════════════════════════════════╝
`);

// Démarrer le serveur web (site de couplage)
startWebServer();

// Restaurer les sessions existantes après un redémarrage du service.
// Le serveur web reste disponible même si une session doit se reconnecter.
startBot();
