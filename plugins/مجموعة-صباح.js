/*
⌁ Hammam Bot ⌁
Developer: Hammam Jiyab
*/

import fs from 'fs';
import path from 'path';

let handler = async (m, { conn }) => {
    m.react('☀️');

    const messages = [
        "🌞 صباح الخير! أتمنى أن يكون يومك مليئًا بالفرح والفرص الجميلة.",
        "🔆 صباح الخير! أتمنى أن يحمل لك هذا اليوم ابتسامات ولحظات لا تُنسى.",
        "🌤️ صباح الخير! أتمنى أن تجد الجمال في كل التفاصيل الصغيرة اليوم.",
        "✨ صباح الخير! أتمنى أن يكون يومك مليئًا بالإلهام وأن تقرّبك كل خطوة من أحلامك.",
        "🌅 صباح الخير! أتمنى أن يكون يومك مليئًا بالنور والطاقة الإيجابية.",
        "🌄 صباح الخير! أتمنى أن يحمل لك هذا اليوم الكثير من الفرح والفرص الجميلة."
    ];

    let randomMessage = messages[Math.floor(Math.random() * messages.length)];

    if (m.isGroup) {
        let videos = [
            'https://qu.ax/ZVcM.mp4',
            'https://qu.ax/tCblW.mp4',
            'https://qu.ax/kGzZr.mp4',
            'https://qu.ax/iioMV.mp4',
            'https://qu.ax/JgSvx.mp4',
            'https://qu.ax/dvrKi.mp4',
            'https://qu.ax/TZuhK.mp4'
        ];

        const video = videos[Math.floor(Math.random() * videos.length)];

        const caption = `╭━━━〔 ☀️ Hammam 〕━━━╮
│
│ ${randomMessage}
│
│ 🌻 نتمنى لك يومًا جميلًا ومليئًا
│    بالطاقة والنجاح ✨
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

handler.help = ['صباح'];
handler.tags = ['مجموعة'];
handler.command = ['صباح', 'صباحالخير', 'صباحكم'];
handler.group = true;

export default handler;