// plugins/couplepp.js
// Hammam Bot— صور كابلز 💑

import fetch from "node-fetch";
import { theme } from '../core/theme.js';

let handler = async (m, { conn }) => {
  try {
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

    // جلب قاعدة بيانات الصور من GitHub
    let res = await fetch("https://raw.githubusercontent.com/KazukoGans/database/main/anime/ppcouple.json");
    let data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
      return m.reply(theme.build([{ type: 'title', text: `لا توجد بيانات` }, { type: 'divider' }, { type: 'line', text: `🔮 لم يتم العثور على صور الكابلز` }]));
    }

    // اختيار زوج عشوائي من الصور (ولد + بنت)
    let cita = data[Math.floor(Math.random() * data.length)];

    // إرسال صورة الولد
    await conn.sendMessage(m.chat, {
      image: { url: cita.cowo },
      caption: theme.build([{ type: 'title', text: `صورة الولد` }, { type: 'divider' }, { type: 'line', text: `💑 كابلز - زوج من الصور` }])
    }, { quoted: m });

    // إرسال صورة البنت
    await conn.sendMessage(m.chat, {
      image: { url: cita.cewe },
      caption: theme.build([{ type: 'title', text: `صورة البنت` }, { type: 'divider' }, { type: 'line', text: `💑 كابلز - زوج من الصور` }])
    }, { quoted: m });

    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

  } catch (err) {
    console.error('[CouplePP]', err);
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    m.reply(theme.build([{ type: 'title', text: `خطأ` }, { type: 'divider' }, { type: 'error', text: `🔮 ${err.message || 'حدث خطأ أثناء تحميل الصور'}` }]));
  }
};

handler.help = ['كابيلز'];
handler.tags = ['images'];
handler.command = /^(كابيلز|couplepp|تطقيم)$/i;

export default handler;