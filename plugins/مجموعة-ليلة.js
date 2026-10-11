/*
⌁ Hammam Bot ⌁
Developer: Hammam Jiyab
*/

import fs from 'fs';
import path from 'path';

let handler = async (m, { conn }) => {
    m.react('🌕');

    const messages = [
        "🌙 تصبح على خير! أتمنى لك راحة هادئة ونومًا مريحًا وأحلامًا جميلة.",
        "✨ تصبح على خير! أتمنى أن يحيط بك هدوء الليل وتستعد ليوم جديد.",
        "🌌 تصبح على خير! تذكر أن كل نجمة في السماء تحمل حلمًا ينتظر أن يتحقق.",
        "🌙 تصبح على خير! اترك هموم اليوم خلفك واستمتع بسلام الليل.",
        "🌠 تصبح على خير! أتمنى أن تكون أحلامك مشرقة كالنجوم التي تضيء السماء.",
        "💤 تصبح على خير! أتمنى أن تجد السكينة في هدوء الليل وتستيقظ بنشاط."
    ];

    let randomMessage = messages[Math.floor(Math.random() * messages.length)];

    if (m.isGroup) {
        const videos = [
            'https://files.catbox.moe/0n2bf5.mp4',
            'https://files.catbox.moe/zua131.mp4',
            'https://files.catbox.moe/0im4vk.mp4',
            'https://files.catbox.moe/9cm0x9.mp4',
            'https://files.catbox.moe/7kxjhv.mp4',
            'https://files.catbox.moe/id09sr.mp4',
            'https://files.catbox.moe/3kyhf0.mp4',
            'https://files.catbox.moe/4qokmi.mp4'
        ];

        const video = videos[Math.floor(Math.random() * videos.length)];

        const caption = `╭━━━〔 🌙 Hammam 〕━━━╮
│
│ ${randomMessage}
│
│ 🌌 ليلة هادئة وأحلام جميلة
│
╰━━━━━━━━━━━━━━━━━━╯`;

        conn.sendMessage(
            m.chat,
            {
                video: { url: video },
                gifPlayback: true,
                caption
            },
            { quoted: m }
        );
    }
};

handler.help = ['ليلة'];
handler.tags = ['مجموعة'];
handler.command = ['ليلة', 'ليله', 'تصبحون'];
handler.group = true;

export default handler;