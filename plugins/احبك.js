import { theme } from '../core/theme.js'
// plugins/anime-edit.js
// Hammam Bot- أنمي إيديت 🎬

const VIDEO_URL = 'https://file.garden/aopbTIvyBCZ1OfsC/VID_20260825_032332_219.mp4';

let handler = async (m, { conn }) => {
    await conn.sendMessage(m.chat, { react: { text: '🎬', key: m.key } });

    try {
        // ✅ ptv = true يرسله كفيديو دائري (ملاحظة) مثل واتساب
        await conn.sendMessage(m.chat, {
            video: { url: VIDEO_URL },
            ptv: true
        }, { quoted: m });

        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
    } catch (e) {
        console.error('[AnimeEdit]', e.message);
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply(theme.build([{ type: 'title', text: `❌ فشل الإرسال` }, { type: 'divider' }, { type: 'error', text: `🔮 جرب مرة أخرى` }]));
    }
};

handler.help = ['احبك'];
handler.tags = ['anime'];
handler.command = /^(احبك|i|h|تست)$/i;

export default handler;