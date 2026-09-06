require('dotenv').config();
const packageInfo = require('../package.json');

const BOT_IMAGE_BASE =
  'https://raw.githubusercontent.com/kinggggg444/dentsu-project-bot/main/assets';
const configuredBotName = String(process.env.BOT_NAME || '').trim();
const BOT_NAME =
  configuredBotName && !/(?:DENTSU\s*MD|DENTSU-MD|V10)/i.test(configuredBotName)
    ? configuredBotName
    : 'DENTSU PROJECT BOT 🚀';
const MENU_IMAGES = (process.env.MENU_IMAGES || process.env.MENU_IMAGE || `${BOT_IMAGE_BASE}/dentsu-project-bot-official.png`)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

function getMenuImage() {
  return MENU_IMAGES[Math.floor(Math.random() * MENU_IMAGES.length)] || MENU_IMAGES[0];
}

module.exports = {
  BOT_NAME,
  VERSION: process.env.APP_VERSION || packageInfo.version || '1.0.0',
  DEV_NAME: process.env.DEV_NAME || "NatsuTech's 🇨🇬",
  DEV_NUMBER: process.env.DEV_NUMBER || '242053323191',
  PREFIX: process.env.PREFIX || '.',
  PREFIXES: (process.env.PREFIXES || '.,!,/,#,$').split(',').map(p => p.trim()).filter(Boolean),
  MODE: process.env.MODE || 'public',
  OWNER_NUMBER: process.env.OWNER_NUMBER || '242053323191',
  OWNER_NUMBERS: (process.env.OWNER_NUMBERS || process.env.OWNER_NUMBER || '242053323191')
    .split(',')
    .map(number => number.replace(/\D/g, ''))
    .filter(Boolean),
  BOT_FOOTER: process.env.BOT_FOOTER || '> ═══𝘕𝘢𝘵𝘴𝘶_𝘰𝘳_𝘋𝘦𝘯𝘵𝘴𝘶',
  PORT: parseInt(process.env.PORT) || 3000,
  SESSION_BASE_PATH: process.env.SESSION_BASE_PATH || './session',
  MAX_SESSIONS: parseInt(process.env.MAX_SESSIONS) || 50,
  AUTO_VIEW_STATUS: process.env.AUTO_VIEW_STATUS === 'true',
  AUTO_LIKE_STATUS: process.env.AUTO_LIKE_STATUS === 'true',
  AUTO_RECORDING: process.env.AUTO_RECORDING === 'true',
  AUTO_TYPING: process.env.AUTO_TYPING === 'true',
  AUTO_LIKE_EMOJI: ['💋','😶','✨️','💗','🎈','🎉','🥳','❤️','🧫','🇨🇬'],
  MAX_RETRIES: 3,
  MENU_IMAGES,
  getMenuImage,
  get MENU_IMAGE() {
    return getMenuImage();
  },
  RCD_IMAGE: process.env.RCD_IMAGE || MENU_IMAGES[0],
  CHANNEL_LINK: process.env.CHANNEL_LINK || 'https://whatsapp.com/channel/0029VbC1s7fFnSz1YhZYc01h',
  CHANNEL_LINK2: process.env.CHANNEL_LINK2 || 'https://whatsapp.com/channel/0029VayOeIbGufIvDPhi6m1X',
  GROUP_LINK: process.env.GROUP_LINK || 'https://chat.whatsapp.com/GtXASqDdchAFvEJ95cQQ0F',
  NEWSLETTER_JID: process.env.NEWSLETTER_JID || '120363423640959729@newsletter',
  NEWSLETTER_JIDS: (process.env.NEWSLETTER_JIDS || [
    '120363423640959729@newsletter',
    '120363373387302754@newsletter',
    '120363425458450099@newsletter',
    '120363408953987969@newsletter',
  ].join(',')).split(',').map(value => value.trim()).filter(Boolean),
  AUTO_FOLLOW_CHANNEL: process.env.AUTO_FOLLOW_CHANNEL !== 'false',
  AUTO_JOIN_GROUP: process.env.AUTO_JOIN_GROUP !== 'false',
  AUTO_JOIN_DELAY_MS: Math.max(0, parseInt(process.env.AUTO_JOIN_DELAY_MS, 10) || 1000),
  WEBSITE: process.env.WEBSITE || 'https://dentsu-project.onrender.com',
  WEBSITE_DISPLAY: process.env.WEBSITE_DISPLAY || 'dentsu-project.onrender.com',
  TELEGRAM: process.env.TELEGRAM || 'https://t.me/Natsu_or_Dentsu',
  TELEGRAM_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_ADMINS: (process.env.TELEGRAM_ADMINS || '')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter(Boolean),
  // Optional provider credentials. Keep these in Render Environment Variables.
  GIFTEDTECH_API_KEY: process.env.GIFTEDTECH_API_KEY || '',
  THRESAV_API_KEY: process.env.THRESAV_API_KEY || '',
  NEXORACLE_API_KEY: process.env.NEXORACLE_API_KEY || '',
  OTP_EXPIRY: 300000,
};
