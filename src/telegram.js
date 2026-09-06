const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const store = require('./lib/store');

const startTime = Date.now();
const pendingPairs = new Set();
let startSession;

function getStartSession() {
  if (!startSession) ({ startSession } = require('./bot'));
  return startSession;
}

function uptime(seconds) {
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return [hours ? `${hours}h` : '', minutes ? `${minutes}m` : '', `${secs}s`]
    .filter(Boolean)
    .join(' ');
}

function telegramMenu() {
  return [
    `╔══════════════════════════════════════╗`,
    `║     DENTSU PROJECT BOT 🚀            ║`,
    `╠══════════════════════════════════════╣`,
    `║ by NatsuTech's 🇨🇬 · Congo-Brazzaville ║`,
    `║ JS · Node.js · Baileys · FR/EN/ES/PT  ║`,
    `╚══════════════════════════════════════╝`,
    '',
    '⚡ Fast WhatsApp pairing',
    '🛡️ Persistent multi-session support',
    '🌐 Pair from Telegram or the web',
    '',
    'Commands:',
    '/pair 242XXXXXXXXX — connect WhatsApp',
    '/status — service and session status',
    '/howtouse — pairing instructions',
    '/getmyid — show your Telegram ID',
    '/ping — check response time',
    '/menu — show this menu',
  ].join('\n');
}

function imageForTelegram() {
  return config.getMenuImage();
}

async function sendMenu(bot, chatId) {
  const keyboard = {
    inline_keyboard: [
      [{ text: '🌐 Open Pairing Website', url: config.WEBSITE }],
      [{ text: '📢 WhatsApp Channel', url: config.CHANNEL_LINK }],
      [{ text: '✈️ Developer Contact', url: config.TELEGRAM }],
    ],
  };
  try {
    await bot.sendPhoto(chatId, imageForTelegram(), {
      caption: telegramMenu(),
      reply_markup: keyboard,
    });
  } catch (error) {
    await bot.sendMessage(chatId, telegramMenu(), { reply_markup: keyboard });
  }
}

function normalizeNumber(value) {
  return String(value || '').replace(/\D/g, '');
}

function startTelegram() {
  if (!config.TELEGRAM_TOKEN) {
    console.warn('[TELEGRAM] TELEGRAM_BOT_TOKEN is not configured; Telegram bridge disabled.');
    return null;
  }

  const bot = new TelegramBot(config.TELEGRAM_TOKEN, {
    polling: false,
  });

  bot.onText(/^\/(?:start|menu|help)$/, (msg) => sendMenu(bot, msg.chat.id));

  bot.onText(/^\/ping$/, async (msg) => {
    const started = Date.now();
    const sent = await bot.sendMessage(msg.chat.id, '🏓 Pong!');
    await bot.editMessageText(`🏓 Pong! ${Date.now() - started} ms`, {
      chat_id: msg.chat.id,
      message_id: sent.message_id,
    });
  });

  bot.onText(/^\/getmyid$/, (msg) =>
    bot.sendMessage(msg.chat.id, `🆔 Your Telegram ID: ${msg.from.id}`),
  );

  bot.onText(/^\/runtime$/, (msg) =>
    bot.sendMessage(msg.chat.id, `⏱ Uptime: ${uptime((Date.now() - startTime) / 1000)}`),
  );

  bot.onText(/^\/status$/, (msg) => {
    bot.sendMessage(
      msg.chat.id,
      [
        `✅ ${config.BOT_NAME} is online`,
        `📱 WhatsApp sessions: ${store.sessionCount()} / ${config.MAX_SESSIONS}`,
        `⏱ Uptime: ${uptime((Date.now() - startTime) / 1000)}`,
      ].join('\n'),
    );
  });

  bot.onText(/^\/howtouse$/, (msg) =>
    bot.sendMessage(msg.chat.id, [
      `How to connect ${config.BOT_NAME}:`,
      '',
      '1. Send /pair followed by your WhatsApp number with country code.',
      '2. Copy the pairing code sent here.',
      '3. WhatsApp → Linked Devices → Link with phone number.',
      '4. Enter the code before it expires.',
      '',
      `You can also use the pairing website: ${config.WEBSITE}`,
    ].join('\n')),
  );

  bot.onText(/^\/pair(?:\s+(.+))?$/, async (msg, match) => {
    const number = normalizeNumber(match?.[1]);
    if (number.length < 7 || number.length > 15) {
      await bot.sendMessage(msg.chat.id, '❌ Send a valid number: /pair 242XXXXXXXXX');
      return;
    }
    if (store.getSession(number)) {
      await bot.sendMessage(msg.chat.id, 'ℹ️ This number is already connected.');
      return;
    }
    if (pendingPairs.has(number)) {
      await bot.sendMessage(msg.chat.id, '⏳ A pairing request is already running for this number.');
      return;
    }
    if (store.sessionCount() >= config.MAX_SESSIONS) {
      await bot.sendMessage(msg.chat.id, `❌ The ${config.MAX_SESSIONS}-session limit has been reached.`);
      return;
    }

    pendingPairs.add(number);
    try {
      await bot.sendMessage(msg.chat.id, '⚡ Generating your WhatsApp pairing code…');
      const { code } = await getStartSession()(number);
      if (!code) {
        await bot.sendMessage(msg.chat.id, '✅ This number is already connected.');
        return;
      }
      await bot.sendPhoto(msg.chat.id, imageForTelegram(), {
        caption: [
          `🔑 ${config.BOT_NAME} pairing code`,
          '',
          `Your code: ${code}`,
          '',
          'WhatsApp → Linked Devices → Link with phone number',
          'Enter the code above within 60 seconds.',
          '',
          `By ${config.DEV_NAME}`,
        ].join('\n'),
      });
    } catch (error) {
      await bot.sendMessage(msg.chat.id, `❌ Pairing failed: ${error.message}`);
    } finally {
      setTimeout(() => pendingPairs.delete(number), 60_000);
    }
  });

  bot.on('polling_error', (error) => {
    console.error('[TELEGRAM] Polling error:', error.message);
  });
  bot.deleteWebHook({ drop_pending_updates: false })
    .catch((error) => {
      console.warn('[TELEGRAM] Could not clear an existing webhook:', error.message);
    })
    .then(() => bot.startPolling({ params: { timeout: 30 } }))
    .then(() => console.log('[TELEGRAM] Pairing bridge started.'))
    .catch((error) => console.error('[TELEGRAM] Polling could not start:', error.message));
  return bot;
}

module.exports = { startTelegram, telegramMenu };