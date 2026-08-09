const config = require('../config');
const path = require('path');
const { getContentType } = require('baileys');
const { getTime, getDate, getRam, getUptime } = require('../lib/utils');
const { isOwner } = require('../lib/utils');
const { handleCommand } = require('../commands');

const NO_PREFIX_CMDS = new Set(['menu','help','bug','bugmenu','bot','allmenu']);

async function messageHandler(sock, { messages, type }) {
  if (type !== 'notify') return;
  const msg = messages[0];
  if (!msg?.message) return;
  if (!sock.user) return;

  const from = msg.key.remoteJid;
  if (!from) return;
  if (from === 'status@broadcast') return;

  const isGroup   = from.endsWith('@g.us');
  const botNumber = sock.user.id.split(':')[0];
  const botFullJid = botNumber + '@s.whatsapp.net';

  const sender = isGroup
    ? (msg.key.fromMe ? botFullJid : (msg.key.participant || from))
    : (msg.key.fromMe ? botFullJid : from);
  const senderNumber = sender?.split('@')[0];

  const rawMsg = msg.message?.ephemeralMessage?.message
    || msg.message?.viewOnceMessage?.message
    || msg.message?.viewOnceMessageV2?.message?.message
    || msg.message?.documentWithCaptionMessage?.message
    || msg.message;

  const mtype = getContentType(rawMsg);
  const body =
    mtype === 'conversation'                 ? rawMsg.conversation
    : mtype === 'imageMessage'               ? rawMsg.imageMessage?.caption || ''
    : mtype === 'videoMessage'               ? rawMsg.videoMessage?.caption || ''
    : mtype === 'extendedTextMessage'        ? rawMsg.extendedTextMessage?.text || ''
    : mtype === 'buttonsResponseMessage'     ? rawMsg.buttonsResponseMessage?.selectedButtonId || ''
    : mtype === 'listResponseMessage'        ? rawMsg.listResponseMessage?.singleSelectReply?.selectedRowId || ''
    : mtype === 'templateButtonReplyMessage' ? rawMsg.templateButtonReplyMessage?.selectedId || ''
    : mtype === 'interactiveResponseMessage'
        ? (() => { try { return JSON.parse(rawMsg.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson || '{}').id || ''; } catch { return ''; } })()
        : '';

  if (!body) return;

  // ── Auto audio when bot is mentioned ──────────────────────────
  const mentionedJids = rawMsg?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  const isMentioned = mentionedJids.some(j =>
    j === botFullJid || j === botNumber + ':0@s.whatsapp.net' || j.startsWith(botNumber + ':')
  );
  if (isMentioned) {
    try {
      await sock.sendMessage(from, {
        audio: { url: 'https://files.catbox.moe/nacq93.mp3' },
        mimetype: 'audio/mpeg',
        ptt: false,
      }, { quoted: msg });
    } catch (_) {}
    return; // stop processing further if only a mention
  }

  const PREFIXES = config.PREFIXES || ['.', '!', '/', '#', '$'];
  let usedPrefix = '', command = '', args = [];
  for (const p of PREFIXES) {
    if (body.startsWith(p)) {
      usedPrefix = p;
      const parts = body.slice(p.length).trim().split(/\s+/);
      command = (parts.shift() || '').toLowerCase();
      args = parts;
      break;
    }
  }
  if (!command) {
    const lw = body.trim().toLowerCase();
    if (NO_PREFIX_CMDS.has(lw)) { command = lw; usedPrefix = ''; args = []; }
  }
  if (!command) return;

  const text = args.join(' ');

  if (config.AUTO_TYPING) {
    try { sock.sendPresenceUpdate('composing', from); } catch (_) {}
  }

  const reply = async (content) => {
    if (typeof content === 'string') return sock.sendMessage(from, { text: content }, { quoted: msg });
    return sock.sendMessage(from, content, { quoted: msg });
  };
  const sendImage = async (url, caption = '') =>
    sock.sendMessage(from, { image: { url }, caption }, { quoted: msg });

  const ctx = {
    sock, msg, from, sender, senderNumber, isGroup,
    args, text, reply, sendImage,
    command, prefix: usedPrefix || config.PREFIX, botNumber,
    isOwner: isOwner(sender),
  };

  try {
    if (NO_PREFIX_CMDS.has(command)) {
      return await sendMainMenu(ctx);
    }
    const handled = await handleCommand(ctx);
    if (handled === false) {
      await reply(`❌ Unknown command *${command}*.\nType *.menu* to see all commands.`);
    }
  } catch (err) {
    console.error(`[CMD:${command}]`, err.message);
    try { await reply(`⚠️ Error in *${command}*: ${err.message}`); } catch (_) {}
  } finally {
    if (config.AUTO_TYPING) {
      try { sock.sendPresenceUpdate('paused', from); } catch (_) {}
    }
  }
}

async function sendMainMenu(ctx) {
  const { sock, from, msg, sender, senderNumber } = ctx;

  // 🤖 Reaction
  try { await sock.sendMessage(from, { react: { text: '🤖', key: msg.key } }); } catch (_) {}

  const P = config.PREFIX;
  const caption =
`╭──────────────────────╮
   ༒ DENTSU MD/CRASHED ༒
╰──────────────────────╯
╭──────────────────────╮
│ *𝘋𝘦𝘷:* ═══𝘕𝘢𝘵𝘴𝘶_𝘰𝘳_𝘋𝘦𝘯𝘵𝘴𝘶
│ *𝘉𝘰𝘵:* DENTSU MD
│ *𝘝𝘦𝘳𝘴𝘪𝘰𝘯:* V10
│ *𝘋𝘢𝘵𝘦:* ${getDate()}
│ *𝘛𝘪𝘮𝘦:* ${getTime()}
│ *𝘜𝘴𝘦𝘳:* @${senderNumber}
│ *𝘔𝘰𝘥𝘦:* ${(config.MODE || 'public').toUpperCase()}
│ *𝘙𝘢𝘮:* ${getRam()}
│ *𝘏𝘰𝘴𝘵:* 
│ *𝘋𝘢𝘺:* 
│ *𝘓𝘪𝘯𝘬𝘦𝘥:* ẉ.dev/NatsuorDentsu
╰──────────────────────╯

╭──[ ✧ 𝐎𝐖𝐍𝐄𝐑 𝐂𝐌𝐃 ✧ ]──╮
│
│ ⬢ ${P}setpp
│ ⬢ ${P}setname
│ ⬢ ${P}setbio
│ ⬢ ${P}getpp
│ ⬢ ${P}block
│ ⬢ ${P}unblock
│ ⬢ ${P}ban
│ ⬢ ${P}unban
│ ⬢ ${P}delete
│ ⬢ ${P}vv
│ ⬢ ${P}vv2
│ ⬢ ${P}broadcast
│ ⬢ ${P}addsudo
│ ⬢ ${P}delsudo
│ ⬢ ${P}listsudo
│ ⬢ ${P}public
│ ⬢ ${P}self
│ ⬢ ${P}ping
│ ⬢ ${P}alive
│ ⬢ ${P}runtime
│ ⬢ ${P}jid
│ ⬢ ${P}idch
│ ⬢ ${P}cekidch
│ ⬢ ${P}pair
│ ⬢ ${P}qc
╰──────────────────────╯

╭──[ ✧ 𝐆𝐑𝐎𝐔𝐏 𝐂𝐌𝐃 ✧ ]──╮
│
│ ⬢ ${P}tagall
│ ⬢ ${P}tagadmins
│ ⬢ ${P}tag
│ ⬢ ${P}htag
│ ⬢ ${P}ht
│ ⬢ ${P}hidetag
│ ⬢ ${P}opengc
│ ⬢ ${P}closegc
│ ⬢ ${P}kickall
│ ⬢ ${P}kickall2
│ ⬢ ${P}kick
│ ⬢ ${P}add
│ ⬢ ${P}promote
│ ⬢ ${P}demote
│ ⬢ ${P}mute
│ ⬢ ${P}unmute
│ ⬢ ${P}grouplink
│ ⬢ ${P}resetlink
│ ⬢ ${P}listadmin
│ ⬢ ${P}listonline
│ ⬢ ${P}opentime
│ ⬢ ${P}closetime
│ ⬢ ${P}antilink
│ ⬢ ${P}warn
│ ⬢ ${P}warncount
│ ⬢ ${P}warnreset
│ ⬢ ${P}groupinfo
│ ⬢ ${P}desc
│ ⬢ ${P}subject
│ ⬢ ${P}join
│ ⬢ ${P}left
│ ⬢ ${P}creategroup
│ ⬢ ${P}setgpp
│ ⬢ ${P}tagadmins
│ ⬢ ${P}everyone
│ ⬢ ${P}announce
│ ⬢ ${P}hijack
╰──────────────────────╯

╭──[ ✧ 𝐁𝐔𝐆 𝐂𝐌𝐃 🩸✧ ]──╮
│
│ ⬢ ${P}dentsu-andro 242xxx
│ ⬢ ${P}gravity 242xxx
│ ⬢ ${P}natsu-ui 242xxx
│ ⬢ ${P}fc-delay 242xxx
│ ⬢ ${P}fc-close 242xxx
│ ⬢ ${P}bulldozer 242xxx
│ ⬢ ${P}invisible 242xxx
│ ⬢ ${P}freezer-ui 242xxx
│ ⬢ ${P}bug-aple 242xxx
│ ⬢ ${P}nullgc <linkgc>
│ ⬢ ${P}blankgc <linkgc>/<in gc>
│ ⬢ ${P}nowritegc <linkgc>
╰──────────────────────╯

╭──[ ✧ 𝐀𝐈 𝐂𝐌𝐃 ✧ ]──╮
│
│ ⬢ ${P}ai
│ ⬢ ${P}gpt
│ ⬢ ${P}gpt4
│ ⬢ ${P}gpt5
│ ⬢ ${P}metaai
│ ⬢ ${P}deepseek
│ ⬢ ${P}gemini
│ ⬢ ${P}qwen
│ ⬢ ${P}codeai
│ ⬢ ${P}storyai
│ ⬢ ${P}aiimg
│ ⬢ ${P}photoai
╰──────────────────────╯

╭──[ ✧ 𝐅𝐔𝐍 𝐂𝐌𝐃 ✧ ]──╮
│
│ ⬢ ${P}joke
│ ⬢ ${P}dadjoke
│ ⬢ ${P}truth
│ ⬢ ${P}dare
│ ⬢ ${P}8ball
│ ⬢ ${P}ship
│ ⬢ ${P}roast
│ ⬢ ${P}compliment
│ ⬢ ${P}advice
│ ⬢ ${P}quote
│ ⬢ ${P}funfact
│ ⬢ ${P}meme
│ ⬢ ${P}coin
│ ⬢ ${P}dice
│ ⬢ ${P}urban
│ ⬢ ${P}inspire
│ ⬢ ${P}ascii
╰──────────────────────╯

╭──[ ✧ 𝐆𝐀𝐌𝐄 𝐂𝐌𝐃 ✧ ]──╮
│
│ ⬢ ${P}rps
│ ⬢ ${P}rpsls
│ ⬢ ${P}guess
│ ⬢ ${P}numbattle
│ ⬢ ${P}trivia
│ ⬢ ${P}hangman
│ ⬢ ${P}tictactoe
╰──────────────────────╯

╭──[ ✧ 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 𝐂𝐌𝐃 ✧ ]──╮
│
│ ⬢ ${P}tt
│ ⬢ ${P}tiktok
│ ⬢ ${P}ytb
│ ⬢ ${P}youtube
│ ⬢ ${P}ytmp3
│ ⬢ ${P}play
│ ⬢ ${P}yts
│ ⬢ ${P}fb
│ ⬢ ${P}insta
│ ⬢ ${P}apk
│ ⬢ ${P}shorturl
│ ⬢ ${P}catbox
│ ⬢ ${P}tourl
│ ⬢ ${P}url
╰──────────────────────╯

╭──[ ✧ 𝐎𝐖𝐍𝐄𝐑 𝐂𝐌𝐃 ✧ ]──╮
│
│ ⬢ ${P}glitchtext
│ ⬢ ${P}writetext
│ ⬢ ${P}advancedglow
│ ⬢ ${P}typographytext
│ ⬢ ${P}pixelglitch
│ ⬢ ${P}neonglitch
│ ⬢ ${P}flagtext
│ ⬢ ${P}flag3dtext
│ ⬢ ${P}deletingtext
│ ⬢ ${P}blackpinkstyle
│ ⬢ ${P}glowingtext
│ ⬢ ${P}underwatertext
│ ⬢ ${P}logomaker
│ ⬢ ${P}cartoonstyle
│ ⬢ ${P}papercutstyle
│ ⬢ ${P}watercolortext
│ ⬢ ${P}effectclouds
│ ⬢ ${P}blackpinklogo
│ ⬢ ${P}gradienttext
│ ⬢ ${P}summerbeach
│ ⬢ ${P}luxurygold
│ ⬢ ${P}multicoloredneon
│ ⬢ ${P}sandsummer
│ ⬢ ${P}galaxywallpaper
│ ⬢ ${P}style1917
│ ⬢ ${P}makingneon
│ ⬢ ${P}royaltext
│ ⬢ ${P}freecreate
│ ⬢ ${P}galaxystyle
│ ⬢ ${P}createlogo
│ ⬢ ${P}lighteffects
╰──────────────────────╯

╭──[ ✧ 𝐋𝐎𝐆𝐎 𝐂𝐌𝐃 ✧ ]──╮
│
│ ⬢ ${P}gfx
│ ⬢ ${P}gfx2
│ ⬢ ${P}gfx3
│ ⬢ ${P}gfx4
│ ⬢ ${P}gfx5
│ ⬢ ${P}gfx6
│ ⬢ ${P}gfx7
│ ⬢ ${P}gfx8
│ ⬢ ${P}gfx9
│ ⬢ ${P}gfx10
│ ⬢ ${P}gfx11
│ ⬢ ${P}gfx12
╰──────────────────────╯

╭──[ ✧ 𝐀𝐔𝐃𝐈𝐎 𝐂𝐌𝐃 ✧ ]──╮
│
│ ⬢ ${P}bass
│ ⬢ ${P}blown
│ ⬢ ${P}deep
│ ⬢ ${P}earrape
│ ⬢ ${P}fast
│ ⬢ ${P}nightcore
│ ⬢ ${P}reverse
│ ⬢ ${P}robot
│ ⬢ ${P}slow
│ ⬢ ${P}smooth
│ ⬢ ${P}squirrel
│ ⬢ ${P}say
│ ⬢ ${P}tts
╰──────────────────────╯

╭──[ ✧ 𝐌𝐄𝐃𝐈𝐀 𝐂𝐌𝐃 ✧ ]──╮
│
│ ⬢ ${P}sticker
│ ⬢ ${P}s
│ ⬢ ${P}toimg
│ ⬢ ${P}image
│ ⬢ ${P}getpp
│ ⬢ ${P}setgpp
│ ⬢ ${P}cat
│ ⬢ ${P}dog
│ ⬢ ${P}fox
│ ⬢ ${P}bird
│ ⬢ ${P}panda
│ ⬢ ${P}waifu
│ ⬢ ${P}neko
│ ⬢ ${P}maid
│ ⬢ ${P}kitsune
│ ⬢ ${P}rwaifu
╰──────────────────────╯

🌐 𝗪𝗲𝗯𝘀𝗶𝘁𝗲:
📋 𝗣𝗿𝗲𝗳𝗶𝘅  ${P}
> _BY DENTSU MD V10_`;

  // Send with clickable URL button
  try {
    await sock.sendMessage(from, {
      image: {
        url: config.MENU_IMAGE.startsWith('/')
          ? path.join(__dirname, '../../website/public', config.MENU_IMAGE)
          : config.MENU_IMAGE,
      },
      caption,
      mentions: [sender],
    }, { quoted: msg });
  } catch (_) {
    await sock.sendMessage(from, { text: caption, mentions: [sender] }, { quoted: msg });
  }
}

module.exports = { messageHandler, sendMainMenu };
