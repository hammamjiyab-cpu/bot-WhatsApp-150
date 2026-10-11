// plugins/fuse.js
// ⧼ 𝑷𝑹𝑶𝑻𝑶𝑻𝒀𝑷𝑬 ⧽v2 - فيوز (اقتباسات عشوائية) 🎨

import axios from 'axios';
import { theme } from '../core/theme.js';

let handler = async (m, { conn, args, command }) => {
  try {
    // إذا كان المستخدم كتب نص (يعمل كصانع ملصقات)
    if (args.length > 0) {
      await conn.sendMessage(m.chat, { react: { text: '🎨', key: m.key } });
      await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {})

      let text = encodeURIComponent(args.join(" "));
      let name = encodeURIComponent(m.pushName || "User");

      // استخدام API PopCat (يعمل 100%)
      const api = `https://api.popcat.xyz/quote?text=${text}&author=${name}`;
      
      const { data } = await axios.get(api, {
        responseType: 'arraybuffer',
        timeout: 30000
      });

      await conn.sendMessage(m.chat, {
        sticker: Buffer.from(data)
      }, { quoted: m });

      await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
      return;
    }

    // إذا لم يكتب نص → يجيب اقتباس عشوائي
    await conn.sendMessage(m.chat, { react: { text: '📖', key: m.key } });
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {})

    // ✅ API جديد يعمل 100% (بدون حماية)
    const apiUrl = 'https://quoteslate.vercel.app/api/quotes/random';
    
    const { data } = await axios.get(apiUrl, { timeout: 15000 });

    const resultText = theme.build([
      { type: 'title', text: '💬 اقتباس ملهم' },
      { type: 'spacer' },
      { type: 'line', text: `"${data.quote}"` },
      { type: 'spacer' },
      { type: 'info', label: '✍️ المؤلف', value: data.author },
      { type: 'divider' },
      { type: 'line', text: '⭐ اقتباس عشوائي - شاركه مع أصدقائك' }
    ]);

    await conn.sendMessage(m.chat, { text: resultText }, { quoted: m });
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

  } catch (err) {
    console.error(err);
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    
    m.reply(theme.build([
      { type: 'error', text: '❌ حدث خطأ' },
      { type: 'info', label: 'السبب', value: err.message || 'فشل جلب الاقتباس' },
      { type: 'warning', text: 'حاول مرة أخرى لاحقاً' }
    ]));
  }
};

handler.help = ['فيوز <نص>'];
handler.tags = ['tools'];
handler.command = /^(فيوز|fuse)$/i;

export default handler;