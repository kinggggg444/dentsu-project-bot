const express = require('express');
const path = require('path');
const store = require('./lib/store');
const config = require('./config');
const { askDentsuAI } = require('./lib/ai');
const { youtubeAudio } = require('./lib/external-apis');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../website/views'));
app.use(express.static(path.join(__dirname, '../website/public')));
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: true }));

// Garder les requêtes de pairing en cours (éviter les doublons)
const pendingPairs = new Set();
let startSession;

function getStartSession() {
  if (!startSession) ({ startSession } = require('./bot'));
  return startSession;
}

// ── Page principale ────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.render('index', {
    botName: config.BOT_NAME,
    devName: config.DEV_NAME,
    devNumber: config.DEV_NUMBER,
    menuImage: config.getMenuImage(),
    menuImages: config.MENU_IMAGES,
    channelLink: config.CHANNEL_LINK,
    channelLink2: config.CHANNEL_LINK2,
    groupLink: config.GROUP_LINK,
    telegram: config.TELEGRAM,
    supportEmail: config.SUPPORT_EMAIL,
    website: config.WEBSITE,
    sessions: store.sessionCount(),
    maxSessions: config.MAX_SESSIONS,
    uptime: Math.floor(process.uptime()),
  });
});

// ── Assistant IA du site ────────────────────────────────────────────
app.post('/api/ai', async (req, res) => {
  const prompt = String(req.body?.prompt || '').trim();
  if (!prompt) return res.status(400).json({ success: false, error: 'Write a question first.' });
  if (prompt.length > 2000) return res.status(400).json({ success: false, error: 'Your question is too long.' });

  try {
    const answer = await askDentsuAI(prompt);
    return res.json({ success: true, answer });
  } catch (error) {
    console.error('[WEB] AI error:', error.message);
    return res.status(502).json({ success: false, error: 'The assistant is temporarily unavailable. Try again shortly.' });
  }
});

// ── Téléchargement audio ────────────────────────────────────────────
app.post('/api/download/song', async (req, res) => {
  const query = String(req.body?.query || '').trim();
  if (!query) return res.status(400).json({ success: false, error: 'Enter a song title or a supported link.' });
  if (query.length > 300) return res.status(400).json({ success: false, error: 'The search is too long.' });

  try {
    const result = await youtubeAudio(query);
    return res.json({
      success: true,
      title: result.title,
      thumbnail: result.thumbnail || null,
      url: result.url,
      note: 'Use downloads only for content you are allowed to save.',
    });
  } catch (error) {
    console.error('[WEB] Audio download error:', error.message);
    return res.status(502).json({ success: false, error: 'No audio result was found. Try a title or direct video link.' });
  }
});

// ── Diagnostic sans payload ni envoi automatique ────────────────────
app.post('/api/safe-diagnostics', (req, res) => {
  const number = String(req.body?.number || '').replace(/\D/g, '');
  const issue = String(req.body?.issue || '').trim().slice(0, 120);
  if (number.length < 7 || number.length > 15) {
    return res.status(400).json({ success: false, error: 'Enter a valid WhatsApp number with country code.' });
  }
  if (!issue) return res.status(400).json({ success: false, error: 'Describe the issue to prepare a support report.' });

  const reference = `DNT-${Date.now().toString(36).toUpperCase()}`;
  return res.json({
    success: true,
    reference,
    message: 'A safe support report is ready. No message or payload was sent to the number.',
    checklist: [
      'Update WhatsApp from the official app store.',
      'Check Linked Devices and remove unknown sessions.',
      'Use the official WhatsApp support form if the account is restricted.',
    ],
  });
});

// ── Demander un code de jumelage ───────────────────────────────────
app.post('/pair', async (req, res) => {
  let { number } = req.body;
  if (!number) return res.json({ success: false, error: 'A WhatsApp number is required.' });

  const sanitized = number.replace(/[^0-9]/g, '');

  if (sanitized.length < 7 || sanitized.length > 15) {
    return res.json({ success: false, error: 'Invalid number. Example: 242xxx' });
  }

  if (store.sessionCount() >= config.MAX_SESSIONS) {
    return res.json({ success: false, error: `The ${config.MAX_SESSIONS}-session limit has been reached.` });
  }

  const existing = store.getSession(sanitized);
  if (existing) {
    return res.json({ success: false, error: 'This number is already connected to the bot.' });
  }

  if (pendingPairs.has(sanitized)) {
    return res.json({ success: false, error: 'A request is already running for this number. Wait 30 seconds.' });
  }

  pendingPairs.add(sanitized);

  try {
    const { code } = await getStartSession()(sanitized);

    if (code) {
      setTimeout(() => pendingPairs.delete(sanitized), 60000);
      return res.json({
        success: true,
        code,
        message: `No automatic WhatsApp message is sent before connection.\nEnter this code manually in WhatsApp:\nSettings → Linked Devices → Link a device → Link with phone number`,
      });
    }

    pendingPairs.delete(sanitized);
    return res.json({ success: true, code: null, message: 'This number is already connected.' });

  } catch (err) {
    pendingPairs.delete(sanitized);
    const raw = err.message || String(err);
    console.error(`[WEB] Pair error ${sanitized}:`, raw);

    // Traduction des erreurs connues en messages clairs
    let errorMsg = raw;

    if (raw.includes('timed out') || raw.includes('timeout')) {
      errorMsg = 'Request timed out. Check your internet connection and try again.';
    } else if (raw.includes('rate-limit') || raw.includes('429') || raw.includes('rate limit')) {
      errorMsg = 'Too many requests. Wait 2 minutes and try again.';
    } else if (raw.includes('not registered') || raw.includes('404') || raw.includes('not-registered')) {
      errorMsg = 'This number is not registered on WhatsApp.';
    } else if (raw.includes('Connection Closed') || raw.includes('connection closed')) {
      errorMsg = 'Connection lost. Restart the bot and try again.';
    } else if (raw.includes('Unauthorized') || raw.includes('401')) {
      errorMsg = 'Authorization error. Remove the session folder and restart.';
    } else if (raw.includes('Stream Errored') || raw.includes('stream')) {
      errorMsg = 'WhatsApp stream error. Wait 30 seconds and try again.';
    }

    return res.json({ success: false, error: errorMsg });
  }
});

// ── Status ─────────────────────────────────────────────────────────
app.get('/status', (req, res) => {
  const sessions = store.getAllSessions().map(([num]) => ({
    number: num.slice(0, 3) + '***' + num.slice(-3),
    connected: true,
  }));
  res.json({
    available: true,
    status: 'online',
    bot: config.BOT_NAME,
    sessions,
    count: sessions.length,
    max: config.MAX_SESSIONS,
    uptime: Math.floor(process.uptime()),
  });
});

// ── Healthcheck Render ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    bot: config.BOT_NAME,
    version: config.VERSION,
    telegramConfigured: Boolean(config.TELEGRAM_TOKEN),
    sessions: store.sessionCount(),
    uptime: Math.floor(process.uptime()),
  });
});

function startWebServer() {
  const PORT = process.env.PORT || config.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🌐 Pairing website started on port ${PORT}`);
    console.log(`📱 Open the website and enter your WhatsApp number to receive a code\n`);
  });
}

module.exports = { startWebServer };
