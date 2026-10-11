// plugins/channel-info.js
// Hammam Bot— معلومات القناة 📢

import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { theme } from '../core/theme.js';

let handler = async (m, { text, conn }) => {
  if (!text) return m.reply(theme.build([{ type: 'title', text: `وحدة معلومات القناة` }, { type: 'divider' }, { type: 'line', text: `🔮 *الاستخدام:* .قناه <رابط القناة>` }]));
  if (!text.includes('https://whatsapp.com/channel/')) return m.reply(theme.build([{ type: 'title', text: `رابط غير صالح` }, { type: 'divider' }, { type: 'error', text: `🔮 الرجاء إدخال رابط قناة صحيح.` }]));

  let result = text.split('https://whatsapp.com/channel/')[1];
  let channelId = result.split('/')[0];

  let res;
  try {
    res = await conn.newsletterMetadata('invite', channelId); 
  } catch (error) {
    console.error("[Channel] Error:", error); 
    return m.reply(theme.build([{ type: 'title', text: `خطأ` }, { type: 'divider' }, { type: 'error', text: `🔮 حدث خطأ أثناء جلب بيانات القناة. تأكد من صحة الرابط.` }]));
  }

  // 🔍 عرض الاستجابة الخام كاملة للتأكد من صحة البيانات
  let rawDump = JSON.stringify(res, null, 2);
  if (rawDump.length > 3500) rawDump = rawDump.slice(0, 3500) + '\n...(مقصوص)';
  await m.reply('🔍 *الاستجابة الخام (raw):*\n```' + rawDump + '```');

  // ✅ استخراج البيانات بشكل صحيح
  const name = res?.name || res?.title || 'غير معروف';
  const subscribers = res?.subscribers || res?.subscriberCount || 'غير معروف';
  const state = res?.state || 'غير معروف';
  const verification = res?.verification === 'VERIFIED' ? 'مُحققة' : 'غير مُحققة';
  const description = res?.description || '';

  let timestamp = new Date().getTime();
  let formattedTime = new Date(timestamp).toLocaleString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  let teks = theme.build([
    { type: 'title', text: '"تقرير القناة"' },
    { type: 'spacer' },
    { type: 'info', label: '🆔 ID', value: res.id || channelId },
    { type: 'info', label: '🧣 الاسم', value: name },
    { type: 'info', label: '🕓 وقت الجلب', value: formattedTime },
    { type: 'info', label: '👤 المشتركين', value: subscribers },
    { type: 'info', label: '🚦 الحالة', value: state },
    { type: 'info', label: '✅ التحقق', value: verification }
  ]);

  await m.reply(teks);
};

handler.help = handler.command = ['قناه'];
handler.tags = ['tools'];

export default handler;