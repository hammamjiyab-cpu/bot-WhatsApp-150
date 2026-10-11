// plugins/spotify.js
// Hammam Bot- تحميل أغاني سبوتيفاي 🎵

import fetch from 'node-fetch';
import { theme } from '../core/theme.js';

let handler = async (m, { conn, text, usedPrefix }) => {
  // 1. التحقق من وجود رابط
  if (!text) {
    await conn.sendMessage(m.chat, { 
      text: theme.build([
        { type: 'title', text: '🎵 تـحـمـيـل مـن سـبـوتـيـفـاي' },
        { type: 'divider' },
        { type: 'info', label: '📌 الاستخدام', value: `${usedPrefix}سبوتيفاي <رابط الأغنية>` },
        { type: 'spacer' },
        { type: 'info', label: '📌 مثال', value: `${usedPrefix}سبوتيفاي https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT` }
      ])
    }, { quoted: m });
    return;
  }

  // 2. استخراج رابط التrack
  const spotifyRegex = /(?:https?:\/\/)?(?:open\.spotify\.com\/track\/)([a-zA-Z0-9]+)/;
  const match = text.match(spotifyRegex);
  
  if (!match) {
    await conn.sendMessage(m.chat, { 
      text: theme.build([
        { type: 'title', text: '❌ خـطـأ' },
        { type: 'divider' },
        { type: 'error', text: 'رابط سبوتيفاي غير صالح!' },
        { type: 'spacer' },
        { type: 'line', text: '⚔️ يرجى إرسال رابط صحيح من نوع track' }
      ])
    }, { quoted: m });
    return;
  }

  const spotifyUrl = match[0];

  // 3. رسالة جاري جلب المعلومات
  await conn.sendMessage(m.chat, { 
    text: theme.build([
      { type: 'title', text: '🎵 جـاري جـلـب مـعـلـومـات الأغـنـيـة' },
      { type: 'divider' },
      { type: 'line', text: '⏳ الرجاء الانتظار...' }
    ]),
    react: { text: '⏳', key: m.key }
  }, { quoted: m });

  try {
    // 4. الاتصال بالـ API
    const apiUrl = 'https://gamepvz.com/api/download/get-url';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://gamepvz.com',
        'Referer': 'https://gamepvz.com/'
      },
      body: JSON.stringify({ url: spotifyUrl })
    });
    
    const data = await response.json();
    
    if (data.code !== 200 || !data.originalVideoUrl) {
      throw new Error('فشل التحميل');
    }

    // 5. تجهيز رابط التحميل
    const downloadUrl = `https://gamepvz.com${data.originalVideoUrl}`;
    
    // 6. تحميل صورة الغلاف
    let coverBuffer = null;
    if (data.coverUrl) {
      try {
        const coverRes = await fetch(data.coverUrl);
        coverBuffer = await coverRes.buffer();
      } catch (e) {
        console.log('خطأ في تحميل الصورة');
      }
    }

    // 7. إرسال صورة + كلام في نفس الرسالة
    const caption = theme.build([
      { type: 'title', text: '📥 جـاري تـحـمـيـل الأغـنـيـة' },
      { type: 'divider' },
      { type: 'info', label: '🎤 الأغنية', value: data.title || 'غير معروف' },
      { type: 'info', label: '👤 الفنان', value: data.authorName || 'غير معروف' },
      { type: 'divider' },
      { type: 'line', text: '⏳ جاري تجهيز الملف...' }
    ]);
    
    if (coverBuffer) {
      await conn.sendMessage(m.chat, {
        image: coverBuffer,
        caption: caption
      }, { quoted: m });
    } else {
      await conn.sendMessage(m.chat, { text: caption }, { quoted: m });
    }

    // 8. إرسال الصوت
    await conn.sendMessage(m.chat, {
      audio: { url: downloadUrl },
      mimetype: 'audio/mpeg',
      fileName: `${data.title || 'song'} - ${(data.authorName || 'artist').split(',')[0]}.mp3`
    }, { quoted: m });

    // تفاعل بنجاح
    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

  } catch (error) {
    console.error('خطأ:', error);
    
    await conn.sendMessage(m.chat, { 
      text: theme.build([
        { type: 'title', text: '❌ فـشـل تـحـمـيـل الأغـنـيـة' },
        { type: 'divider' },
        { type: 'warning', text: 'قد يكون الرابط غير صالح أو الخدمة معطلة' },
        { type: 'divider' },
        { type: 'line', text: '⚔️ حاول مرة أخرى أو تأكد من الرابط' }
      ])
    }, { quoted: m });
    
    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
  }
};

// معلومات الأمر
handler.help = ['سبوتيفاي <رابط>'];
handler.tags = ['download'];
handler.command = ['سبوتيفاي', 'spotify', 'تحميل اغنية', 'اغنية'];

export default handler;