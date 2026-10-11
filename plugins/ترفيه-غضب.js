/*
⌁ Hammam Bot ⌁
Developer: Hammam Jiyab
*/

let handler = async (m, { conn }) => {

    let target;

    if (m.mentionedJid?.length) {
        target = m.mentionedJid[0];
    } else if (m.quoted) {
        target = m.quoted.sender;
    } else {
        target = m.sender;
    }

    const senderName = conn.getName(m.sender) || 'العضو';
    const targetName = conn.getName(target) || target;

    await m.react('😡');

    let text;

    if (target !== m.sender) {
        text = `╭━━━〔 😡 Hammam 𝐀𝐍𝐆𝐑𝐘 〕━━━╮
│
│ 😡 *${senderName}* غاضب من
│ 👤 *${targetName}*
│
╰━━━━━━━━━━━━━━━━━━╯`;
    } else {
        text = `╭━━━〔 😡 Hammam 𝐀𝐍𝐆𝐑𝐘 〕━━━╮
│
│ 😡 *${senderName}*
│ غاضب جدًا اليوم!
│
╰━━━━━━━━━━━━━━━━━━╯`;
    }

    const videos = [
        'https://files.catbox.moe/2aedd3.mp4',
        'https://files.catbox.moe/fqf4ey.mp4',
        'https://files.catbox.moe/v7ldgq.mp4',
        'https://files.catbox.moe/uedd7l.mp4',
        'https://files.catbox.moe/5stubg.mp4',
        'https://files.catbox.moe/phaft3.mp4'
    ];

    const video = videos[Math.floor(Math.random() * videos.length)];

    await conn.sendMessage(
        m.chat,
        {
            video: { url: video },
            gifPlayback: true,
            caption: text,
            mentions: [target]
        },
        { quoted: m }
    );
};

handler.help = ['غضب @منشن', 'غضب'];
handler.tags = ['ترفيه'];
handler.command = ['غضب', 'عصبية', 'زعلان'];
handler.group = true;

export default handler;