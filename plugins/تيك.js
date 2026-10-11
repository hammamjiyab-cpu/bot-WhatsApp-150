// plugins/tiktok.js
// Hammam Bot- تحميل فيديوهات تيك توك 🎬

import axios from "axios";

let handler = async (m, { conn, args, usedPrefix, command }) => {
  const react = async (emoji) => {
    try { await conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } }) } catch {}
  }

  if (!args[0]) {
    await react('❌')
    return m.reply(`🎬 *Hammam Bot - تيك توك*\n⚔️ ${usedPrefix}${command} <رابط>`)
  }

  let url = args[0];
  
  if (!/tiktok|douyin|vm\.tiktok|vt\.tiktok/i.test(url)) {
    await react('❌')
    return m.reply('❌ *"رابط تيك توك غير صالح"*')
  }

  await react('⏳')
  await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {})

  try {
    let result = await Tiktok(url);
    if (!result || result.code !== 0) throw new Error("لم يتم العثور على فيديو");

    let { play, hdplay, music, title } = result.data;
    let videoUrl = hdplay || play;


    // إرسال الفيديو
    await conn.sendMessage(m.chat, {
      video: { url: videoUrl },
      caption: `🎬 ${title || 'فيديو تيك توك'}\n⚡ *Hammam Bot*`
    }, { quoted: m })

    // إرسال الصوت
    if (music) {
      await conn.sendMessage(m.chat, {
        audio: { url: music },
        mimetype: 'audio/mpeg'
      }, { quoted: m })
    }

    await react('✅')

  } catch (error) {
    console.error("[TikTok]", error);
    await react('❌')
    m.reply('❌ *"فشل التحميل"*')
  }
};

const Tiktok = async (url) => {
  let params = new URLSearchParams();
  params.append("url", url);

  let { data } = await axios.post("https://tikwm.com/api/", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Cookie: "current_language=en",
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36"
    },
  });

  return data;
};

handler.help = ["تيك <رابط>"];
handler.tags = ["downloader"];
handler.command = /^(تيك|tik|تيكتوك|tiktok)$/i;

export default handler;