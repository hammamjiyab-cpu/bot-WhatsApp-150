import { theme } from '../core/theme.js'
// plugins/game-rps-simple.js
// Hammam Bot- لعبة حجر/ورق/مقص 🪨📄✂️

let cooldowns = {};

let handler = async (m, { conn, text, usedPrefix, command }) => {

  await conn.sendMessage(m.chat, { react: { text: '🎮', key: m.key } });

  if (!text) {
    return conn.reply(m.chat, theme.build([{ type: 'title', text: `لعبة حجر/ورق/مقص` }, { type: 'divider' }, { type: 'line', text: `🪨 *اختر أحد الخيارات:*` }, { type: 'line', text: `📌 ${usedPrefix}${command} حجر` }, { type: 'line', text: `📌 ${usedPrefix}${command} ورق` }, { type: 'line', text: `📌 ${usedPrefix}${command} مقص` }]), m);
  }

  if (cooldowns[m.sender] && cooldowns[m.sender] > Date.now()) {
    let remainingTime = Math.ceil((cooldowns[m.sender] - Date.now()) / 1000);
    return conn.reply(m.chat, theme.build([{ type: 'title', text: `⏰ انتظر` }, { type: 'divider' }, { type: 'line', text: `🔮 انتظر ${remainingTime} ثانية` }]), m);
  }

  let botChoice = Math.random();
  if (botChoice < 0.34) botChoice = 'حجر';
  else if (botChoice > 0.34 && botChoice < 0.67) botChoice = 'مقص';
  else botChoice = 'ورق';

  let userChoice = text.toLowerCase();
  if (!['حجر', 'ورق', 'مقص'].includes(userChoice)) {
    return conn.reply(m.chat, theme.build([{ type: 'title', text: `اختيار غير صالح` }, { type: 'divider' }, { type: 'error', text: `🔮 اختر: حجر، ورق، أو مقص` }]), m);
  }

  let result = '';
  if (userChoice === botChoice) result = 'تعادل 🤝';
  else if (
    (userChoice === 'حجر' && botChoice === 'مقص') ||
    (userChoice === 'مقص' && botChoice === 'ورق') ||
    (userChoice === 'ورق' && botChoice === 'حجر')
  ) result = 'فوز 🎉';
  else result = 'خسارة 😢';

  let title = result === 'فوز 🎉' ? '"فزت!"' : (result === 'خسارة 😢' ? '"خسرت!"' : '"تعادل!"');

  conn.reply(m.chat, `> ❄️ *${title}*\n> \n> 🪨 *أنت:* ${userChoice}\n> 🤖 ** ${botChoice}\n> \n> ${result}`, m);

  cooldowns[m.sender] = Date.now() + 5000;
};

handler.command = /^(لعبة|حجر|ورق|مقص|rps)$/i;
handler.tags = ['game'];

export default handler;