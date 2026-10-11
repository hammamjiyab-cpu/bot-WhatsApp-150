// plugins/bomb-game.js
// Hammam Bot- لعبة القنبلة الجماعية 💣

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { theme } from '../core/theme.js'

const __dirname = dirname(fileURLToPath(import.meta.url));

let isListening = false;
const bombTimers = Object.create(null);

// ================== إعدادات ==================
const MIN_PLAYERS = 3;
const MAX_PLAYERS = 20;
const BOMB_TIME = 30000;

// ================== مسارات ==================
const DATA_DIR = path.join(__dirname, '..', 'data', 'bomb');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ================== ملفات ==================
const gameFile = (jid) => path.join(DATA_DIR, `${jid}.json`);

const loadGame = (jid) => {
  if (!fs.existsSync(gameFile(jid))) return null;
  return JSON.parse(fs.readFileSync(gameFile(jid), 'utf8'));
};

const saveGame = (jid, data) => {
  const safe = {
    stage: data.stage,
    players: data.players,
    holder: data.holder,
    owner: data.owner,
    endTime: data.endTime
  };
  fs.writeFileSync(gameFile(jid), JSON.stringify(safe, null, 2));
};

const deleteGame = (jid) => {
  if (fs.existsSync(gameFile(jid))) fs.unlinkSync(gameFile(jid));
  if (bombTimers[jid]) {
    clearTimeout(bombTimers[jid]);
    delete bombTimers[jid];
  }
};

// ================== إرسال ==================
const reply = (conn, jid, text, quoted = null) =>
  conn.sendMessage(jid, { text }, quoted ? { quoted } : {});

const replyMention = (conn, jid, text, mentions, quoted = null) =>
  conn.sendMessage(jid, { text, mentions }, quoted ? { quoted } : {});

// ================== أدوات ==================
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getMentioned = async (m, conn) => {
  // الطريقة 1: من contextInfo
  const ctx = m.message?.extendedTextMessage?.contextInfo;
  if (ctx?.mentionedJid?.length) {
    const fixed = [];
    for (const j of ctx.mentionedJid) {
      fixed.push(await conn.convertLidToRealJid(j, m.chat));
    }
    return fixed;
  }
  
  // الطريقة 2: من النص (منشن بـ @)
  const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
  const matches = text.match(/@(\d{5,20})/g);
  if (matches) {
    return matches.map(v => v.replace('@', '') + '@s.whatsapp.net');
  }
  
  return [];
};

// ================== الأمر ==================
let handler = async (m, { conn }) => {
  const jid = m.chat;
  const starter = m.sender;

  if (!jid.endsWith('@g.us')) {
    return m.reply(theme.build([{ type: 'title', text: `خطأ` }, { type: 'divider' }, { type: 'error', text: `🔮 اللعبة تعمل فقط في المجموعات` }]));
  }

  if (loadGame(jid)) {
    return m.reply(theme.build([{ type: 'title', text: `⚠️ تنبيه` }, { type: 'divider' }, { type: 'warning', text: `💣 هناك لعبة قنبلة شغالة بالفعل` }]));
  }

  const game = {
    stage: 'waiting',
    players: [starter],
    holder: null,
    owner: starter,
    endTime: null
  };

  saveGame(jid, game);

  await replyMention(conn, jid,
    theme.build([{ type: 'title', text: `لعبة القنبلة` }, { type: 'divider' }, { type: 'line', text: `👑 *المنظم:* @${starter.split('@')[0]}` }, { type: 'line', text: `• اكتب *شارك* للدخول` }, { type: 'line', text: `• فقط المنظم يمكنه كتابة *بدء*` }, { type: 'line', text: `📊 *العدد:* 1` }, { type: 'line', text: `📉 *الحد الأدنى:* ${MIN_PLAYERS}` }, { type: 'line', text: `📈 *الحد الأقصى:* ${MAX_PLAYERS}` }]),
    [starter],
    m
  );

  // ================== Listener ==================
  if (!isListening) {
    conn.ev.on('messages.upsert', async ({ messages }) => {
      const msg = messages?.[0];
      if (!msg || !msg.message) return;
      if (msg.key.fromMe) return;

      const jid = msg.key.remoteJid;
      if (!jid || !jid.endsWith('@g.us')) return;

      const game = loadGame(jid);
      if (!game || game.stage === 'ended') return;

      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      const sender = msg.key.participant || msg.key.remoteJid;
      if (!sender) return;

      // ===== انتظار =====
      if (game.stage === 'waiting') {
        if (text.trim() === 'شارك') {
          if (game.players.includes(sender)) {
            return reply(conn, jid, '> ❌ انت بالفعل مشارك.', msg);
          }
          if (game.players.length >= MAX_PLAYERS) {
            return reply(conn, jid, '> ❌ العدد اكتمل، لا يمكن الانضمام.', msg);
          }

          game.players.push(sender);
          saveGame(jid, game);

          await replyMention(conn, jid,
            `> ✅ انضم @${sender.split('@')[0]}\n> 📊 *العدد:* ${game.players.length}`,
            [sender],
            msg
          );

          if (game.players.length === MIN_PLAYERS) {
            return reply(conn, jid, '> ✅ *اكتمل الحد الأدنى من اللاعبين*\n> ✳️ يمكن الآن كتابة *بدء* لبدء اللعبة');
          }
        }

        if (text.trim() === 'بدء') {
          if (sender !== game.owner) {
            return reply(conn, jid, '> ❌ فقط منظم اللعبة يمكنه البدء.', msg);
          }
          if (game.players.length < MIN_PLAYERS) {
            return reply(conn, jid, `> ❌ لم يكتمل العدد (${game.players.length}/${MIN_PLAYERS})`);
          }

          game.stage = 'playing';
          game.holder = rand(game.players);
          game.endTime = Date.now() + BOMB_TIME;

          saveGame(jid, game);

          await replyMention(conn, jid,
            `> 🔥 *بدأت اللعبة!*\n> 💣 القنبلة مع @${game.holder.split('@')[0]}\n> ⏱️ *الوقت:* 30 ثانية`,
            [game.holder],
            msg
          );

          startBomb(conn, jid);
        }
      }

      // ===== اللعب =====
      else if (game.stage === 'playing') {
        // ✅ استخدام convertLidToRealJid للمنشن
        const mentioned = await getMentioned(msg, conn);
        if (mentioned.length !== 1) return;
        if (sender !== game.holder) return;

        let to = mentioned[0];
        to = await conn.convertLidToRealJid(to, jid);

        if (to === sender) {
          return reply(conn, jid, '> ❌ لا يمكنك تمرير القنبلة لنفسك.', msg);
        }
        if (to === conn.user.jid) {
          return reply(conn, jid, '> ❌ لا يمكن تمرير القنبلة للبوت.', msg);
        }
        if (!game.players.includes(to)) {
          return reply(conn, jid, '> ❌ هذا الشخص ليس ضمن اللعبة.', msg);
        }

        // تمرير القنبلة
        game.holder = to;
        saveGame(jid, game);

        await replyMention(conn, jid,
          `> 💣 *القنبلة انتقلت إلى* @${to.split('@')[0]}\n> ⏱️ *المتبقي:* ${Math.ceil((game.endTime - Date.now()) / 1000)} ثانية`,
          [to],
          msg
        );
      }
    });

    isListening = true;
  }
};

// ================== القنبلة ==================
const startBomb = (conn, jid) => {
  const game = loadGame(jid);
  if (!game || game.stage !== 'playing') return;

  const timeLeft = game.endTime - Date.now();

  bombTimers[jid] = setTimeout(async () => {
    const g = loadGame(jid);
    if (!g) return;

    const loser = g.holder;
    g.players = g.players.filter(p => p !== loser);

    await replyMention(conn, jid,
      `> 💥 *انفجرت القنبلة!*\n> ❌ خرج @${loser.split('@')[0]}`,
      [loser]
    );

    if (g.players.length === 1) {
      g.stage = 'ended';
      saveGame(jid, g);

      await replyMention(conn, jid,
        `> 🏆 *الفائز هو* @${g.players[0].split('@')[0]}\n> 🎉 مبروك!`,
        [g.players[0]]
      );

      deleteGame(jid);
      return;
    }

    g.holder = rand(g.players);
    g.endTime = Date.now() + BOMB_TIME;

    saveGame(jid, g);

    await replyMention(conn, jid,
      `> 💣 *القنبلة الآن مع* @${g.holder.split('@')[0]}\n> ⏱️ *الوقت:* 30 ثانية`,
      [g.holder]
    );

    startBomb(conn, jid);

  }, timeLeft);
};

handler.help = ['قنبله'];
handler.tags = ['game'];
handler.command = /^(قنبله|قنبلة|bomb)$/i;
handler.group = true;

export default handler;