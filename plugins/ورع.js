import { theme } from '../core/theme.js'
// plugins/fun-stats.js
// Hammam Bot- أوامر التسلية 🎭

let handler = async (m, { conn, command, text, usedPrefix }) => {

  const rand = (max) => Math.floor(Math.random() * (max + 1));

  // تحديد الاسم المستهدف
  let targetName = '';
  let targetJid = '';
  
  // حالة 1: منشن
  if (m.mentionedJid && m.mentionedJid[0]) {
    targetJid = await conn.convertLidToRealJid(m.mentionedJid[0], m.chat);
    try {
      targetName = await conn.getName(targetJid);
    } catch {
      targetName = targetJid.split('@')[0];
    }
  }
  // حالة 2: رد على رسالة
  else if (m.quoted && m.quoted.sender) {
    targetJid = await conn.convertLidToRealJid(m.quoted.sender, m.chat);
    try {
      targetName = await conn.getName(targetJid);
    } catch {
      targetName = targetJid.split('@')[0];
    }
  }
  // حالة 3: كتابة اسم/رقم مباشر
  else if (text && text.trim()) {
    const input = text.trim();
    if (/^\d+$/.test(input)) {
      targetJid = input + '@s.whatsapp.net';
      try { targetName = await conn.getName(targetJid); } catch { targetName = input; }
    } else {
      targetName = input;
    }
  }
  // حالة 4: لا يوجد هدف
  else {
    return m.reply(theme.build([{ type: 'title', text: `أمر ${command}` }, { type: 'divider' }, { type: 'line', text: `🎭 قم بمنشن الشخص أو كتابة اسمه أو رد على رسالته` }, { type: 'line', text: `📌 *مثال:* ${usedPrefix + command} @user` }, { type: 'line', text: `📌 *مثال:* ${usedPrefix + command} محمد` }]));
  }

  if (!targetName) targetName = 'المستخدم';

  const displayText = targetName;
  const randomPercent = rand(100);

  let reply = '';
  let emoji = '';

  switch (command) {
    case 'ورع':
      emoji = '🧒';
      reply = theme.build([{ type: 'title', text: `نسبة الورع` }, { type: 'divider' }, { type: 'line', text: `👤 *الاسم:* ${displayText}` }, { type: 'line', text: `📊 *النسبة:* ${randomPercent}%` }, { type: 'line', text: `💬 ${randomPercent > 70 ? 'يا سلام ورع بمعنى الكلمة 😂' : 'لسه صغير واعد 🧒'}` }]);
      break;
      
    case 'اهبل':
      emoji = '🤪';
      reply = theme.build([{ type: 'title', text: `نسبة الهبل` }, { type: 'divider' }, { type: 'line', text: `👤 *الاسم:* ${displayText}` }, { type: 'line', text: `📊 *النسبة:* ${randomPercent}%` }, { type: 'line', text: `💬 ${randomPercent > 70 ? 'اهبل بطل خلي بالك منه 😂' : 'لسه شاطر وواعي 🧠'}` }]);
      break;
      
    case 'خروف':
      emoji = '🐑';
      reply = theme.build([{ type: 'title', text: `نسبة الخرفنة` }, { type: 'divider' }, { type: 'line', text: `👤 *الاسم:* ${displayText}` }, { type: 'line', text: `📊 *النسبة:* ${randomPercent}%` }, { type: 'line', text: `💬 ${randomPercent > 70 ? 'خروف والله يابو حمل 🐑' : 'لسه مش خروف كفاية 😅'}` }]);
      break;
      
    case 'جميل':
      emoji = '😍';
      reply = theme.build([{ type: 'title', text: `نسبة الجمال` }, { type: 'divider' }, { type: 'line', text: `👤 *الاسم:* ${displayText}` }, { type: 'line', text: `📊 *النسبة:* ${randomPercent}%` }, { type: 'line', text: `💬 ${randomPercent > 70 ? 'فديت القمر 🌙' : 'جمالك جايب آخره ✨'}` }]);
      break;
      
    case 'ذكاء':
      emoji = '🧠';
      reply = theme.build([{ type: 'title', text: `نسبة الذكاء` }, { type: 'divider' }, { type: 'line', text: `👤 *الاسم:* ${displayText}` }, { type: 'line', text: `📊 *النسبة:* ${randomPercent}%` }, { type: 'line', text: `💬 ${randomPercent > 70 ? 'عبقري بمعنى الكلمة 🧠' : 'ذكائك في ازدياد 📈'}` }]);
      break;
      
    case 'غباء':
      emoji = '🤦';
      reply = theme.build([{ type: 'title', text: `نسبة الغباء` }, { type: 'divider' }, { type: 'line', text: `👤 *الاسم:* ${displayText}` }, { type: 'line', text: `📊 *النسبة:* ${randomPercent}%` }, { type: 'line', text: `💬 ${randomPercent > 70 ? 'غبي بطل خلي بالك 🤦' : 'لسه فيه أمل 🤞'}` }]);
      break;
      
    default:
      reply = theme.build([{ type: 'title', text: `خطأ` }, { type: 'divider' }, { type: 'error', text: `🔮 الأمر ${command} غير معروف` }]);
  }

  await conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } });
  return m.reply(reply);
};

handler.help = ['ورع', 'اهبل', 'خروف', 'جميل', 'ذكاء', 'غباء'];
handler.tags = ['entertainment'];
handler.command = /^(ورع|اهبل|خروف|جميل|غباء)$/i;

export default handler;